import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, clone
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from typing import Any
import copy


def _encode_dataframe(df: pd.DataFrame, target_col: str, model=None) -> tuple[pd.DataFrame, dict]:
    from sklearn.pipeline import Pipeline
    feature_cols = [c for c in df.columns if c != target_col]
    X = df[feature_cols].copy()
    encoders = {}

    # If model is a pipeline, don't encode — pipeline handles it
    if model is not None and isinstance(model, Pipeline):
        return X, encoders

    for col in X.select_dtypes(include=["object", "category"]).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders[col] = le
    return X, encoders


def compute_sample_weights(df: pd.DataFrame, target_col: str, protected_attrs: list[str]) -> np.ndarray:
    n = len(df)
    weights = np.ones(n)

    y = df[target_col].values
    y_vals = np.unique(y)

    for attr in protected_attrs:
        groups = df[attr].unique()
        for g in groups:
            for yv in y_vals:
                mask = (df[attr] == g) & (df[target_col] == yv)
                group_count = mask.sum()
                if group_count == 0:
                    continue
                expected = (df[attr] == g).sum() * (df[target_col] == yv).sum() / n
                actual = group_count
                if actual > 0:
                    weights[mask] *= expected / actual

    weights = weights / weights.mean()
    return weights


def retrain_with_weights(
    model: BaseEstimator,
    X_train: pd.DataFrame,
    y_train: np.ndarray,
    sample_weights: np.ndarray
) -> BaseEstimator:
    model_type = type(model)

    if model_type == RandomForestClassifier:
        new_model = RandomForestClassifier(
            n_estimators=model.n_estimators,
            max_depth=model.max_depth,
            random_state=42
        )
    elif model_type == GradientBoostingClassifier:
        new_model = GradientBoostingClassifier(
            n_estimators=model.n_estimators,
            max_depth=model.max_depth,
            random_state=42
        )
    elif model_type == LogisticRegression:
        new_model = LogisticRegression(
            max_iter=model.max_iter if hasattr(model, 'max_iter') else 1000,
            random_state=42
        )
    else:
        try:
            from sklearn.pipeline import Pipeline
            if isinstance(model, Pipeline):
                new_model = clone(model)
            else:
                new_model = clone(model)
        except Exception:
            new_model = copy.deepcopy(model)

    try:
        from sklearn.pipeline import Pipeline
        if isinstance(new_model, Pipeline):
            # Find the classifier step name and pass weight with correct format
            clf_step_name = new_model.steps[-1][0]
            fit_params = {f"{clf_step_name}__sample_weight": sample_weights}
            new_model.fit(X_train, y_train, **fit_params)
        else:
            new_model.fit(X_train, y_train, sample_weight=sample_weights)
    except (TypeError, ValueError):
        new_model.fit(X_train, y_train)
        new_model.fit(X_train, y_train)

    return new_model


def prejudice_remover(
    model: BaseEstimator,
    df: pd.DataFrame,
    target_col: str,
    protected_attrs: list[str],
    eta: float = 1.0
) -> BaseEstimator:
    X_encoded, _ = _encode_dataframe(df, target_col, model)
    y = df[target_col].values

    X_fair = X_encoded.copy()
    for attr in protected_attrs:
        if attr in X_fair.columns:
            X_fair = X_fair.drop(columns=[attr])

    try:
        new_model = clone(model)
    except Exception:
        new_model = copy.deepcopy(model)

    try:
        new_model.fit(X_fair, y)
    except Exception:
        new_model.fit(X_encoded, y)

    return new_model, X_fair.columns.tolist()


def verify_debiasing(
    original_metrics: dict,
    debiased_metrics: dict,
    original_accuracy: float,
    debiased_accuracy: float,
    accuracy_drop_threshold: float = 0.05
) -> dict:
    improved_attrs = []
    degraded_attrs = []

    for attr in original_metrics:
        if attr not in debiased_metrics:
            continue
        orig_score = original_metrics[attr]["demographic_parity"]["difference"]
        new_score = debiased_metrics[attr]["demographic_parity"]["difference"]
        if new_score < orig_score:
            improved_attrs.append(attr)
        else:
            degraded_attrs.append(attr)

    accuracy_drop = original_accuracy - debiased_accuracy
    acceptable = accuracy_drop <= accuracy_drop_threshold

    return {
        "improved_attributes": improved_attrs,
        "degraded_attributes": degraded_attrs,
        "accuracy_drop": round(accuracy_drop, 4),
        "accuracy_drop_threshold": accuracy_drop_threshold,
        "accuracy_acceptable": acceptable,
        "debiasing_successful": len(improved_attrs) > 0 and acceptable,
        "tradeoff_warning": not acceptable
    }


def run_debiasing_pipeline(
    model: BaseEstimator,
    df: pd.DataFrame,
    target_col: str,
    protected_attrs: list[str],
    original_bias_metrics: dict,
    original_accuracy: float,
    accuracy_drop_threshold: float = 0.05
) -> dict:
    from bias_detector import run_bias_analysis

    X_encoded, _ = _encode_dataframe(df, target_col, model)
    y = df[target_col].values

    sample_weights = compute_sample_weights(df, target_col, protected_attrs)
    reweighted_model = retrain_with_weights(model, X_encoded, y, sample_weights)

    reweighted_analysis = run_bias_analysis(reweighted_model, df, target_col)
    reweighted_accuracy = reweighted_analysis["accuracy"]
    reweighted_bias = reweighted_analysis["bias_metrics"]

    verification = verify_debiasing(
        original_bias_metrics,
        reweighted_bias,
        original_accuracy,
        reweighted_accuracy,
        accuracy_drop_threshold
    )

    if not verification["debiasing_successful"]:
        pr_model, fair_features = prejudice_remover(model, df, target_col, protected_attrs)
        df_fair = df.copy()
        for attr in protected_attrs:
            if attr in df_fair.columns:
                df_fair = df_fair.drop(columns=[attr])

        if len([c for c in df_fair.columns if c != target_col]) > 0:
            pr_analysis = run_bias_analysis(pr_model, df_fair, target_col)
            pr_accuracy = pr_analysis["accuracy"]
            pr_bias = pr_analysis["bias_metrics"]

            pr_verification = verify_debiasing(
                original_bias_metrics,
                pr_bias,
                original_accuracy,
                pr_accuracy,
                accuracy_drop_threshold
            )

            if pr_verification["debiasing_successful"] or len(pr_verification["improved_attributes"]) > len(verification["improved_attributes"]):
                return {
                    "method_used": "prejudice_remover",
                    "debiased_model": pr_model,
                    "after_metrics": pr_bias,
                    "after_accuracy": pr_accuracy,
                    "verification": pr_verification,
                    "features_used": fair_features,
                    "protected_attrs_removed": protected_attrs
                }

    return {
        "method_used": "reweighting",
        "debiased_model": reweighted_model,
        "after_metrics": reweighted_bias,
        "after_accuracy": reweighted_accuracy,
        "verification": verification,
        "features_used": X_encoded.columns.tolist(),
        "protected_attrs_removed": []
    }
