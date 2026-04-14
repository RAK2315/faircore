import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator
from sklearn.preprocessing import LabelEncoder


def run_threshold_analysis(
    model: BaseEstimator,
    df: pd.DataFrame,
    target_col: str,
    protected_attrs: list[str],
    thresholds: list[float] = None
) -> dict:
    """
    Sweeps decision threshold from 0.2 to 0.8 and computes fairness metrics at each.
    Shows the accuracy-fairness tradeoff curve.
    Lets users pick a fairer threshold without retraining.
    """
    if thresholds is None:
        thresholds = [round(t, 2) for t in np.arange(0.2, 0.81, 0.05)]

    feature_cols = [c for c in df.columns if c != target_col]
    X = _encode(df[feature_cols])
    y_true = df[target_col].values

    if not hasattr(model, "predict_proba"):
        return {"error": "Model does not support probability outputs. Threshold analysis unavailable.", "data": []}

    proba = model.predict_proba(X)[:, 1]

    results_by_threshold = []

    for thresh in thresholds:
        y_pred = (proba >= thresh).astype(int)

        from sklearn.metrics import accuracy_score
        accuracy = round(accuracy_score(y_true, y_pred), 4)

        attr_metrics = {}
        for attr in protected_attrs:
            if attr not in df.columns:
                continue
            groups = df[attr].unique()
            rates = {}
            for g in groups:
                mask = df[attr] == g
                if mask.sum() > 0:
                    rates[str(g)] = round(float(y_pred[mask].mean()), 4)

            vals = list(rates.values())
            if vals:
                dp_diff = round(max(vals) - min(vals), 4)
                di_ratio = round(min(vals) / max(vals), 4) if max(vals) > 0 else 0.0
            else:
                dp_diff = 0.0
                di_ratio = 1.0

            attr_metrics[attr] = {
                "demographic_parity_diff": dp_diff,
                "disparate_impact_ratio": di_ratio,
                "group_rates": rates,
            }

        # Overall fairness score = mean dp_diff across attrs
        all_dp = [m["demographic_parity_diff"] for m in attr_metrics.values()]
        overall_fairness = round(float(np.mean(all_dp)), 4) if all_dp else 0.0

        results_by_threshold.append({
            "threshold": thresh,
            "accuracy": accuracy,
            "overall_fairness_score": overall_fairness,
            "attr_metrics": attr_metrics,
            "positive_rate": round(float(y_pred.mean()), 4),
        })

    # Find optimal threshold — best fairness within 3% accuracy drop of default
    default = next((r for r in results_by_threshold if abs(r["threshold"] - 0.5) < 0.01), results_by_threshold[0])
    default_acc = default["accuracy"]

    candidates = [r for r in results_by_threshold if r["accuracy"] >= default_acc - 0.03]
    optimal = min(candidates, key=lambda r: r["overall_fairness_score"]) if candidates else default

    return {
        "thresholds": results_by_threshold,
        "default_threshold": 0.5,
        "optimal_threshold": optimal["threshold"],
        "optimal_fairness_score": optimal["overall_fairness_score"],
        "optimal_accuracy": optimal["accuracy"],
        "accuracy_at_default": default_acc,
        "fairness_at_default": default["overall_fairness_score"],
        "improvement": round(default["overall_fairness_score"] - optimal["overall_fairness_score"], 4),
    }


def _encode(X: pd.DataFrame) -> pd.DataFrame:
    X_enc = X.copy()
    for col in X_enc.select_dtypes(include=["object", "category"]).columns:
        X_enc[col] = LabelEncoder().fit_transform(X_enc[col].astype(str))
    return X_enc
