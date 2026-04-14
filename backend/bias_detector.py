import numpy as np
import pandas as pd
import shap
from sklearn.base import BaseEstimator
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from scipy.stats import chi2_contingency
from sklearn.feature_selection import mutual_info_classif
from typing import Any


PROTECTED_KEYWORDS = [
    "gender", "sex", "race", "ethnicity", "age", "religion",
    "nationality", "marital", "disability", "color", "caste"
]


def auto_detect_protected_attributes(df: pd.DataFrame, target_col: str) -> list[str]:
    candidates = []
    feature_cols = [c for c in df.columns if c != target_col]

    for col in feature_cols:
        col_lower = col.lower()
        if any(kw in col_lower for kw in PROTECTED_KEYWORDS):
            candidates.append(col)
            continue

        if df[col].nunique() <= 10:
            try:
                contingency = pd.crosstab(df[col], df[target_col])
                chi2, p, _, _ = chi2_contingency(contingency)
                if p < 0.05:
                    encoded = LabelEncoder().fit_transform(df[col].astype(str))
                    mi = mutual_info_classif(
                        encoded.reshape(-1, 1),
                        df[target_col],
                        random_state=42
                    )[0]
                    if mi > 0.01:
                        candidates.append(col)
            except Exception:
                continue

    return candidates


def demographic_parity_difference(y_pred: np.ndarray, sensitive: pd.Series) -> dict:
    groups = sensitive.unique()
    rates = {}
    for g in groups:
        mask = sensitive == g
        rates[str(g)] = float(y_pred[mask].mean())

    vals = list(rates.values())
    diff = max(vals) - min(vals)
    return {"group_rates": rates, "difference": round(diff, 4)}


def equalized_odds_difference(y_true: np.ndarray, y_pred: np.ndarray, sensitive: pd.Series) -> dict:
    groups = sensitive.unique()
    tpr = {}
    fpr = {}
    for g in groups:
        mask = sensitive == g
        yt, yp = y_true[mask], y_pred[mask]
        pos = yt == 1
        neg = yt == 0
        tpr[str(g)] = float(yp[pos].mean()) if pos.sum() > 0 else 0.0
        fpr[str(g)] = float(yp[neg].mean()) if neg.sum() > 0 else 0.0

    tpr_vals = list(tpr.values())
    fpr_vals = list(fpr.values())
    tpr_diff = round(max(tpr_vals) - min(tpr_vals), 4)
    fpr_diff = round(max(fpr_vals) - min(fpr_vals), 4)
    return {"tpr_by_group": tpr, "fpr_by_group": fpr, "tpr_difference": tpr_diff, "fpr_difference": fpr_diff}


def disparate_impact_ratio(y_pred: np.ndarray, sensitive: pd.Series) -> dict:
    groups = sensitive.unique()
    rates = {}
    for g in groups:
        mask = sensitive == g
        rates[str(g)] = float(y_pred[mask].mean())

    vals = list(rates.values())
    if max(vals) == 0:
        ratio = 0.0
    else:
        ratio = round(min(vals) / max(vals), 4)

    return {"group_rates": rates, "ratio": ratio, "passes_80_percent_rule": ratio >= 0.8}


def compute_shap_importance(model: BaseEstimator, X: pd.DataFrame) -> dict:
    try:
        sample = X.sample(min(200, len(X)), random_state=42)
        shap_values = None
        method = "unavailable"

        # TreeExplainer — RandomForest, XGBoost, GBM
        try:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(sample)
            method = "TreeSHAP"
        except Exception:
            pass

        # LinearExplainer — LogisticRegression, Ridge, LinearSVC
        if shap_values is None:
            try:
                explainer = shap.LinearExplainer(model, sample)
                shap_values = explainer.shap_values(sample)
                method = "LinearSHAP"
            except Exception:
                pass

        # KernelExplainer — any model with predict_proba
        if shap_values is None and hasattr(model, "predict_proba"):
            try:
                background = shap.sample(sample, min(30, len(sample)))
                explainer = shap.KernelExplainer(model.predict_proba, background)
                small = sample.sample(min(20, len(sample)), random_state=42)
                shap_values = explainer.shap_values(small)
                method = "KernelSHAP"
            except Exception:
                pass

        if shap_values is not None:
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
            mean_abs = np.abs(shap_values).mean(axis=0)
            if hasattr(mean_abs, 'ndim') and mean_abs.ndim > 1:
                mean_abs = mean_abs.mean(axis=1)
            importance = dict(zip(X.columns.tolist(), np.array(mean_abs).flatten().tolist()))
            sorted_importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
            return {"top_features": dict(list(sorted_importance.items())[:10]), "method": method}

        # Coefficient fallback for linear models
        coefs = getattr(model, "coef_", None)
        if coefs is not None:
            importance = dict(zip(X.columns.tolist(), np.abs(coefs).flatten().tolist()))
            sorted_importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
            return {"top_features": dict(list(sorted_importance.items())[:10]), "method": "coef_magnitude"}

        # feature_importances_ fallback
        importances = getattr(model, "feature_importances_", None)
        if importances is not None:
            importance = dict(zip(X.columns.tolist(), importances.tolist()))
            sorted_importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
            return {"top_features": dict(list(sorted_importance.items())[:10]), "method": "feature_importance"}

        return {"top_features": {}, "method": "unavailable"}
    except Exception:
        return {"top_features": {}, "method": "unavailable"}


def run_bias_analysis(model: BaseEstimator, df: pd.DataFrame, target_col: str) -> dict:
    from sklearn.pipeline import Pipeline

    feature_cols = [c for c in df.columns if c != target_col]
    X = df[feature_cols].copy()
    y = df[target_col].values

    # For pipelines: pass raw data — pipeline handles encoding internally
    is_pipeline = isinstance(model, Pipeline)

    if is_pipeline:
        X_for_predict = X.copy()
    else:
        X_for_predict = X.copy()
        for col in X_for_predict.select_dtypes(include=["object", "category"]).columns:
            le = LabelEncoder()
            X_for_predict[col] = le.fit_transform(X_for_predict[col].astype(str))

    y_pred = model.predict(X_for_predict)
    accuracy = round(accuracy_score(y, y_pred), 4)

    protected_attrs = auto_detect_protected_attributes(df, target_col)

    bias_metrics = {}
    for attr in protected_attrs:
        sensitive = df[attr]
        bias_metrics[attr] = {
            "demographic_parity": demographic_parity_difference(y_pred, sensitive),
            "equalized_odds": equalized_odds_difference(y, y_pred, sensitive),
            "disparate_impact": disparate_impact_ratio(y_pred, sensitive),
        }

    # For SHAP on pipelines, pass raw X; for raw models pass encoded X
    shap_result = compute_shap_importance(model, X_for_predict)

    overall_bias_score = _compute_overall_bias_score(bias_metrics)

    return {
        "accuracy": accuracy,
        "protected_attributes_detected": protected_attrs,
        "bias_metrics": bias_metrics,
        "shap_importance": shap_result,
        "overall_bias_score": overall_bias_score,
        "target_column": target_col,
        "n_samples": len(df),
        "n_features": len(feature_cols),
    }

def _compute_overall_bias_score(bias_metrics: dict) -> dict:
    if not bias_metrics:
        return {"score": 0.0, "level": "unknown", "details": "No protected attributes found"}

    scores = []
    for attr, metrics in bias_metrics.items():
        dp_diff = metrics["demographic_parity"]["difference"]
        tpr_diff = metrics["equalized_odds"]["tpr_difference"]
        di_ratio = metrics["disparate_impact"]["ratio"]

        attr_score = (dp_diff * 0.35) + (tpr_diff * 0.35) + ((1 - di_ratio) * 0.30)
        scores.append(attr_score)

    avg = float(np.mean(scores))

    if avg < 0.05:
        level = "low"
    elif avg < 0.15:
        level = "moderate"
    elif avg < 0.25:
        level = "high"
    else:
        level = "severe"

    return {"score": round(avg, 4), "level": level}