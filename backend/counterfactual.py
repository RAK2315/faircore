import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator
from sklearn.preprocessing import LabelEncoder
from typing import Any


def run_counterfactual_analysis(
    model: BaseEstimator,
    df: pd.DataFrame,
    target_col: str,
    protected_attrs: list[str],
    n_samples: int = 500
) -> dict:
    """
    For each protected attribute, flip each person's group membership
    and check if the model prediction changes.
    Shows how many people would get a different outcome if their
    demographic were different — the most visceral fairness metric.
    """
    feature_cols = [c for c in df.columns if c != target_col]
    sample = df.sample(min(n_samples, len(df)), random_state=42).copy()

    X_orig = _encode(sample[feature_cols])
    orig_preds = model.predict(X_orig)

    results = {}

    for attr in protected_attrs:
        if attr not in sample.columns:
            continue

        # Skip continuous columns — too many groups, counterfactual meaningless
        groups = sample[attr].unique()
        if len(groups) > 15:
            continue
        if len(groups) < 2:
            continue

        flip_counts = {}
        group_flip_rates = {}

        for group in groups:
            group_mask = sample[attr] == group
            group_size = group_mask.sum()
            if group_size == 0:
                continue

            total_flipped = 0
            comparisons = 0

            for other_group in groups:
                if other_group == group:
                    continue

                counterfactual = sample.copy()
                counterfactual.loc[group_mask, attr] = other_group

                X_cf = _encode(counterfactual[feature_cols])
                cf_preds = model.predict(X_cf)

                flipped = (orig_preds[group_mask] != cf_preds[group_mask]).sum()
                total_flipped += flipped
                comparisons += 1

            avg_flipped = total_flipped / comparisons if comparisons > 0 else 0
            flip_counts[str(group)] = int(avg_flipped)
            group_flip_rates[str(group)] = round(float(avg_flipped) / float(group_size), 4) if group_size > 0 else 0.0

        total_affected = sum(flip_counts.values())
        total_in_sample = int(group_mask.sum()) * len(groups)

        results[attr] = {
            "flip_counts_by_group": flip_counts,
            "flip_rates_by_group": group_flip_rates,
            "total_affected": total_affected,
            "sample_size": int(len(sample)),
            "pct_affected": round(total_affected / len(sample) * 100, 1),
            "interpretation": _interpret(attr, flip_counts, group_flip_rates, len(sample)),
        }

    return results


def _encode(X: pd.DataFrame) -> pd.DataFrame:
    X_enc = X.copy()
    for col in X_enc.select_dtypes(include=["object", "category"]).columns:
        X_enc[col] = LabelEncoder().fit_transform(X_enc[col].astype(str))
    return X_enc


def _interpret(attr: str, flip_counts: dict, flip_rates: dict, n: int) -> str:
    if not flip_counts:
        return "Insufficient data for counterfactual analysis."
    max_group = max(flip_rates, key=flip_rates.get)
    max_rate = flip_rates[max_group]
    count = flip_counts[max_group]
    return (
        f"Individuals identified as '{max_group}' have a {round(max_rate*100,1)}% chance "
        f"of receiving a different prediction if their '{attr}' were changed. "
        f"Approximately {count} out of {n} sampled individuals would be predicted differently "
        f"based solely on this attribute — evidence of proxy discrimination."
    )
