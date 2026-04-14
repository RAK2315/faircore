import io
import joblib
import pickle
import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator
from sklearn.pipeline import Pipeline
from fastapi import UploadFile
from typing import Optional, Tuple
import base64


SUPPORTED_MODEL_EXTENSIONS = [".pkl", ".joblib"]
SUPPORTED_DATA_EXTENSIONS = [".csv"]


async def load_model_from_upload(file: UploadFile) -> BaseEstimator:
    content = await file.read()
    try:
        model = joblib.load(io.BytesIO(content))
    except Exception:
        model = pickle.loads(content)

    if not hasattr(model, "predict"):
        raise ValueError("Uploaded file does not appear to be a valid sklearn model (no predict method).")

    return model


async def load_preprocessor_from_upload(file: UploadFile):
    content = await file.read()
    try:
        preprocessor = joblib.load(io.BytesIO(content))
    except Exception:
        preprocessor = pickle.loads(content)
    return preprocessor


async def load_dataframe_from_upload(file: UploadFile) -> pd.DataFrame:
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise ValueError(f"Could not parse CSV file: {str(e)}")

    if df.empty:
        raise ValueError("Uploaded CSV is empty.")

    return df


def inspect_model(model) -> dict:
    """
    Deeply inspect whatever was uploaded.
    Returns metadata about model type, expected features, pipeline steps.
    """
    info = {
        "is_pipeline": False,
        "pipeline_steps": [],
        "final_estimator": model,
        "final_estimator_type": type(model).__name__,
        "n_features_in": getattr(model, "n_features_in_", None),
        "feature_names_in": None,
        "has_preprocessor": False,
        "preprocessor_types": [],
        "supports_proba": hasattr(model, "predict_proba"),
        "model_family": _get_model_family(model),
    }

    # Check feature names
    if hasattr(model, "feature_names_in_"):
        info["feature_names_in"] = model.feature_names_in_.tolist()

    # Pipeline detection
    if isinstance(model, Pipeline):
        info["is_pipeline"] = True
        steps = []
        for name, step in model.steps:
            step_info = {
                "name": name,
                "type": type(step).__name__,
                "role": _classify_step(step),
            }
            steps.append(step_info)
        info["pipeline_steps"] = steps

        # Get final estimator
        final = model.steps[-1][1]
        info["final_estimator"] = final
        info["final_estimator_type"] = type(final).__name__
        info["n_features_in"] = getattr(model, "n_features_in_", None)
        info["supports_proba"] = hasattr(final, "predict_proba")
        info["model_family"] = _get_model_family(final)

        # Check if pipeline has preprocessing steps
        non_clf_steps = [s for s in steps if s["role"] != "classifier"]
        if non_clf_steps:
            info["has_preprocessor"] = True
            info["preprocessor_types"] = [s["type"] for s in non_clf_steps]

    return info


def _classify_step(step) -> str:
    name = type(step).__name__.lower()
    if any(k in name for k in ["scaler", "normalizer", "standardscaler", "minmax", "robust"]):
        return "scaler"
    if any(k in name for k in ["encoder", "onehot", "ordinal", "label", "binarizer"]):
        return "encoder"
    if any(k in name for k in ["imputer", "simple"]):
        return "imputer"
    if any(k in name for k in ["selector", "pca", "svd", "decomposition"]):
        return "transformer"
    if any(k in name for k in ["column", "pipeline", "compose"]):
        return "meta"
    return "classifier"


def _get_model_family(model) -> str:
    name = type(model).__name__.lower()
    if any(k in name for k in ["forest", "tree", "boost", "xgb", "lgbm", "catboost", "gradient"]):
        return "tree"
    if any(k in name for k in ["logistic", "linear", "ridge", "lasso", "sgd", "svm", "svc", "svr"]):
        return "linear"
    if any(k in name for k in ["mlp", "neural", "network"]):
        return "neural"
    if any(k in name for k in ["naive", "bayes"]):
        return "bayesian"
    if any(k in name for k in ["knn", "neighbor"]):
        return "knn"
    return "unknown"


def smart_preprocess(
    model,
    df: pd.DataFrame,
    target_col: str,
    external_preprocessor=None,
) -> Tuple[pd.DataFrame, dict]:
    """
    Smartly prepares dataset to match what the model expects.
    Returns (processed_df_for_model, preprocessing_report).
    The returned df still has original string columns for bias detection —
    we keep both versions.
    """
    model_info = inspect_model(model)
    feature_cols = [c for c in df.columns if c != target_col]
    report = {
        "mode": "passthrough",
        "applied_steps": [],
        "warnings": [],
        "model_info": model_info,
    }

    n_expected = model_info["n_features_in"]
    n_actual = len(feature_cols)

    # Case 1: Full pipeline — pass raw data, pipeline handles preprocessing
    if model_info["is_pipeline"]:
        report["mode"] = "pipeline"
        report["applied_steps"].append("Pipeline detected — raw data passed through pipeline steps")
        # Validate feature count
        if n_expected and n_actual != n_expected:
            report["warnings"].append(
                f"Pipeline expects {n_expected} input features but CSV has {n_actual} feature columns. "
                f"Check your target column selection or drop unnecessary columns."
            )
        return df, report

    # Case 2: External preprocessor uploaded
    if external_preprocessor is not None:
        report["mode"] = "external_preprocessor"
        try:
            X_raw = df[feature_cols]
            X_transformed = external_preprocessor.transform(X_raw)

            if hasattr(external_preprocessor, "get_feature_names_out"):
                new_cols = external_preprocessor.get_feature_names_out().tolist()
            else:
                new_cols = [f"feature_{i}" for i in range(X_transformed.shape[1])]

            df_transformed = pd.DataFrame(X_transformed, columns=new_cols, index=df.index)
            df_transformed[target_col] = df[target_col].values
            report["applied_steps"].append(f"Applied external preprocessor: {type(external_preprocessor).__name__}")

            if n_expected and df_transformed.shape[1] - 1 != n_expected:
                report["warnings"].append(
                    f"After preprocessing, got {df_transformed.shape[1]-1} features but model expects {n_expected}."
                )
            return df_transformed, report
        except Exception as e:
            report["warnings"].append(f"External preprocessor failed: {str(e)}. Falling back to auto-encode.")

    # Case 3: Feature count matches — use as-is with auto-encoding
    if n_expected is None or n_actual == n_expected:
        report["mode"] = "auto_encode"
        report["applied_steps"].append("Auto label-encoding applied to categorical columns")
        return df, report

    # Case 4: Feature count mismatch — try one-hot encoding
    if n_actual != n_expected:
        report["warnings"].append(
            f"Feature count mismatch: model expects {n_expected}, CSV has {n_actual}. "
            f"Attempting one-hot encoding of categorical columns."
        )
        try:
            df_ohe = _try_one_hot(df, target_col, n_expected)
            if df_ohe is not None:
                report["mode"] = "one_hot_encoded"
                report["applied_steps"].append(f"One-hot encoding applied — {df_ohe.shape[1]-1} features produced")
                return df_ohe, report
        except Exception as e:
            report["warnings"].append(f"One-hot encoding failed: {str(e)}")

        report["warnings"].append(
            f"Could not automatically match feature count. "
            f"Try uploading a preprocessor.pkl, or ensure your CSV matches the model's training format. "
            f"Model expects {n_expected} features, CSV has {n_actual}."
        )

    return df, report


def _try_one_hot(df: pd.DataFrame, target_col: str, n_expected: int) -> Optional[pd.DataFrame]:
    """Attempt one-hot encoding and check if feature count matches."""
    feature_cols = [c for c in df.columns if c != target_col]
    df_work = df[feature_cols].copy()

    cat_cols = df_work.select_dtypes(include=["object", "category"]).columns.tolist()
    num_cols = df_work.select_dtypes(include=[np.number]).columns.tolist()

    df_encoded = pd.get_dummies(df_work, columns=cat_cols, drop_first=False)

    if df_encoded.shape[1] == n_expected:
        df_encoded[target_col] = df[target_col].values
        return df_encoded

    # Try drop_first=True
    df_encoded2 = pd.get_dummies(df_work, columns=cat_cols, drop_first=True)
    if df_encoded2.shape[1] == n_expected:
        df_encoded2[target_col] = df[target_col].values
        return df_encoded2

    return None


def validate_model_data_compatibility(model, df: pd.DataFrame, target_col: str) -> dict:
    model_info = inspect_model(model)
    feature_cols = [c for c in df.columns if c != target_col]
    issues = []

    n_features_data = len(feature_cols)
    n_features_model = model_info["n_features_in"]

    # For pipelines we're more lenient — pipeline handles transforms
    if not model_info["is_pipeline"]:
        if n_features_model is not None and n_features_model != n_features_data:
            issues.append(
                f"Model expects {n_features_model} features but dataset has {n_features_data} feature columns "
                f"(excluding target '{target_col}'). Upload a preprocessor.pkl or check your CSV format."
            )

    if df[target_col].nunique() > 20:
        issues.append(
            f"Target column '{target_col}' has {df[target_col].nunique()} unique values — "
            f"this may be a regression target, not classification."
        )

    return {
        "compatible": len(issues) == 0,
        "issues": issues,
        "n_features_in_data": n_features_data,
        "n_features_in_model": n_features_model,
        "target_col": target_col,
        "n_samples": len(df),
        "model_info": model_info,
        "is_pipeline": model_info["is_pipeline"],
        "preprocessing_mode": "pipeline" if model_info["is_pipeline"] else "auto",
    }


def infer_target_column(df: pd.DataFrame, hint: Optional[str] = None) -> str:
    if hint and hint in df.columns:
        return hint

    common_targets = [
        "target", "label", "outcome", "class", "y", "output",
        "prediction", "result", "decision", "churn", "fraud",
        "default", "recid", "two_year_recid", "approved", "hired"
    ]
    for col in common_targets:
        if col.lower() in [c.lower() for c in df.columns]:
            match = [c for c in df.columns if c.lower() == col.lower()][0]
            return match

    for col in reversed(df.columns.tolist()):
        if df[col].nunique() <= 10 and df[col].dtype in [np.int64, np.int32, object, bool]:
            return col

    return df.columns[-1]


def save_model_to_bytes(model) -> bytes:
    buffer = io.BytesIO()
    joblib.dump(model, buffer)
    buffer.seek(0)
    return buffer.read()


def model_to_base64(model) -> str:
    return base64.b64encode(save_model_to_bytes(model)).decode("utf-8")


def summarize_dataframe(df: pd.DataFrame, target_col: str) -> dict:
    feature_cols = [c for c in df.columns if c != target_col]
    categorical = df[feature_cols].select_dtypes(include=["object", "category"]).columns.tolist()
    numerical = df[feature_cols].select_dtypes(include=[np.number]).columns.tolist()
    missing = df.isnull().sum()
    missing_cols = missing[missing > 0].to_dict()

    return {
        "n_samples": len(df),
        "n_features": len(feature_cols),
        "target_col": target_col,
        "target_classes": df[target_col].nunique(),
        "categorical_features": categorical,
        "numerical_features": numerical,
        "missing_values": {str(k): int(v) for k, v in missing_cols.items()},
        "columns": df.columns.tolist()
    }


def clean_dataframe(df: pd.DataFrame, target_col: str) -> pd.DataFrame:
    df = df.copy()
    df = df.dropna(subset=[target_col])

    # Encode binary target if string
    if df[target_col].dtype == object:
        unique_vals = df[target_col].str.lower().unique()
        pos_vals = {"yes", "true", "1", "churn", "fraud", "default", "positive"}
        if any(v in pos_vals for v in unique_vals):
            df[target_col] = df[target_col].apply(
                lambda x: 1 if str(x).lower() in pos_vals else 0
            )

    for col in df.columns:
        if col == target_col:
            continue
        if df[col].isnull().sum() > 0:
            if df[col].dtype in [np.float64, np.int64, np.float32, np.int32]:
                df[col] = df[col].fillna(df[col].median())
            else:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "unknown")

    return df