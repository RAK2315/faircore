import os
import uuid
import traceback
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from typing import Optional

from bias_detector import run_bias_analysis
from debiaser import run_debiasing_pipeline
from gemini_reporter import generate_audit_report
from counterfactual import run_counterfactual_analysis
from intersectional import run_intersectional_analysis
from threshold_analysis import run_threshold_analysis
from utils import (
    load_model_from_upload,
    load_preprocessor_from_upload,
    load_dataframe_from_upload,
    infer_target_column,
    validate_model_data_compatibility,
    summarize_dataframe,
    clean_dataframe,
    model_to_base64,
    save_model_to_bytes,
    smart_preprocess,
    inspect_model,
)

app = FastAPI(title="FairCore API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_session_store: dict = {}


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.1.0"}


@app.post("/inspect")
async def inspect_endpoint(model_file: UploadFile = File(...)):
    """
    Inspect a model before running full analysis.
    Returns model type, pipeline steps, expected features, SHAP method that will be used.
    """
    try:
        model = await load_model_from_upload(model_file)
        info = inspect_model(model)
        info.pop("final_estimator", None)
        return JSONResponse(content={"status": "ok", "model_info": serial(info)})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/analyze")
async def analyze(
    model_file: UploadFile = File(...),
    data_file: UploadFile = File(...),
    preprocessor_file: Optional[UploadFile] = File(None),
    target_column: str = Form(""),
    accuracy_threshold: float = Form(0.05),
    gemini_api_key: str = Form(""),
    groq_api_key: str = Form(""),
):
    session_id = str(uuid.uuid4())

    try:
        model = await load_model_from_upload(model_file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model load failed: {str(e)}")

    try:
        df_raw = await load_dataframe_from_upload(data_file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dataset load failed: {str(e)}")

    external_preprocessor = None
    if preprocessor_file and preprocessor_file.filename:
        try:
            external_preprocessor = await load_preprocessor_from_upload(preprocessor_file)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Preprocessor load failed: {str(e)}")

    target_col = infer_target_column(df_raw, target_column if target_column else None)
    df_raw = clean_dataframe(df_raw, target_col)

    # Smart preprocessing — figures out what the model needs
    df_for_model, preprocess_report = smart_preprocess(
        model=model,
        df=df_raw,
        target_col=target_col,
        external_preprocessor=external_preprocessor,
    )

    # Validate compatibility
    compatibility = validate_model_data_compatibility(model, df_for_model, target_col)
    if not compatibility["compatible"]:
        raise HTTPException(
            status_code=422,
            detail=f"Model/data mismatch: {'; '.join(compatibility['issues'])}"
        )

    dataset_info = summarize_dataframe(df_raw, target_col)
    dataset_info["preprocessing_mode"] = preprocess_report["mode"]
    dataset_info["preprocessing_warnings"] = preprocess_report["warnings"]
    dataset_info["model_type"] = preprocess_report["model_info"]["final_estimator_type"]
    dataset_info["is_pipeline"] = preprocess_report["model_info"]["is_pipeline"]

    # Run bias analysis on model-ready data but detect protected attrs from raw data
    # This way string columns like "race", "gender" are still detectable
    try:
        before_analysis = run_bias_analysis(model, df_for_model, target_col)

        # If no protected attrs found on encoded data, try raw data
        if not before_analysis["protected_attributes_detected"] and df_for_model is not df_raw:
            before_analysis_raw = run_bias_analysis(model, df_raw, target_col)
            if before_analysis_raw["protected_attributes_detected"]:
                before_analysis = before_analysis_raw

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bias analysis failed: {str(e)}\n{traceback.format_exc()}")

    protected_attrs = before_analysis["protected_attributes_detected"]

    if not protected_attrs:
        return JSONResponse(content={
            "status": "no_protected_attributes",
            "message": "No protected attributes detected in this dataset. FairCore looks for demographic columns (gender, race, age, etc.) or statistically correlated low-cardinality columns.",
            "dataset_info": serial(dataset_info),
            "preprocessing": serial(preprocess_report),
            "before": serial({"accuracy": before_analysis["accuracy"], "overall_bias_score": before_analysis["overall_bias_score"]}),
            "session_id": session_id
        })

    try:
        after_analysis = run_debiasing_pipeline(
            model=model,
            df=df_for_model,
            target_col=target_col,
            protected_attrs=protected_attrs,
            original_bias_metrics=before_analysis["bias_metrics"],
            original_accuracy=before_analysis["accuracy"],
            accuracy_drop_threshold=accuracy_threshold
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debiasing failed: {str(e)}\n{traceback.format_exc()}")

    try:
        counterfactual = run_counterfactual_analysis(model, df_for_model, target_col, protected_attrs)
    except Exception as e:
        counterfactual = {"error": str(e)}

    try:
        intersectional = run_intersectional_analysis(model, df_for_model, target_col, protected_attrs)
    except Exception as e:
        intersectional = {"error": str(e)}

    try:
        threshold = run_threshold_analysis(model, df_for_model, target_col, protected_attrs)
    except Exception as e:
        threshold = {"error": str(e)}

    api_key = gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
    gkey = groq_api_key or os.environ.get("GROQ_API_KEY", "")
    try:
        audit_report = generate_audit_report(
            before_analysis=before_analysis,
            after_analysis=after_analysis,
            shap_importance=before_analysis["shap_importance"],
            dataset_info=dataset_info,
            api_key=api_key,
            groq_api_key=gkey,
        )
    except Exception as e:
        audit_report = f"Report generation failed: {str(e)}"

    debiased_model = after_analysis.pop("debiased_model")
    debiased_model_b64 = model_to_base64(debiased_model)

    _session_store[session_id] = {
        "debiased_model": debiased_model,
        "before": before_analysis,
        "after": after_analysis,
        "dataset_info": dataset_info,
        "audit_report": audit_report,
    }

    return JSONResponse(content={
        "status": "success",
        "session_id": session_id,
        "dataset_info": serial(dataset_info),
        "compatibility": serial(compatibility),
        "preprocessing": serial({k: v for k, v in preprocess_report.items() if k != "model_info"}),
        "before": serial(before_analysis),
        "after": serial(after_analysis),
        "counterfactual": serial(counterfactual),
        "intersectional": serial(intersectional),
        "threshold_analysis": serial(threshold),
        "audit_report": audit_report,
        "debiased_model_b64": debiased_model_b64,
    })


@app.get("/download/{session_id}")
def download_model(session_id: str):
    session = _session_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    model_bytes = save_model_to_bytes(session["debiased_model"])
    return Response(
        content=model_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename=faircore_debiased_{session_id[:8]}.pkl"}
    )


@app.get("/report/{session_id}")
def get_report(session_id: str):
    session = _session_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return JSONResponse(content={
        "audit_report": session["audit_report"],
        "before": session["before"],
        "after": session["after"],
        "dataset_info": session["dataset_info"],
    })


@app.get("/")
def root():
    return {"message": "FairCore API v2.1 — Smart Model Ingestion", "docs": "/docs"}


def serial(obj):
    if obj is None: return None
    if isinstance(obj, bool): return obj
    if isinstance(obj, (int, float, str)): return obj
    if hasattr(obj, "tolist"): return obj.tolist()
    if hasattr(obj, "item"): return obj.item()
    if isinstance(obj, dict): return {k: serial(v) for k, v in obj.items()}
    if isinstance(obj, list): return [serial(i) for i in obj]
    # Strip any sklearn estimator objects — not JSON serializable
    try:
        from sklearn.base import BaseEstimator
        if isinstance(obj, BaseEstimator): return str(type(obj).__name__)
    except Exception:
        pass
    try:
        import json
        json.dumps(obj)
        return obj
    except Exception:
        return str(obj)