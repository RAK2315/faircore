import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator
from sklearn.preprocessing import LabelEncoder
from itertools import combinations


def run_intersectional_analysis(
    model: BaseEstimator,
    df: pd.DataFrame,
    target_col: str,
    protected_attrs: list[str],
    min_group_size: int = 20
) -> dict:
    """
    Measures bias at intersections of protected attributes.
    e.g. Black women vs white women vs Black men etc.
    IBM AIF360 doesn't do this by default — this is the novel piece.
    """
    feature_cols = [c for c in df.columns if c != target_col]
    X = _encode(df[feature_cols])
    preds = model.predict(X)
    df_work = df.copy()
    df_work["__pred__"] = preds

    results = {}

    # Single attribute baselines
    for attr in protected_attrs:
        if attr not in df_work.columns:
            continue
        groups = {}
        for val, grp in df_work.groupby(attr):
            if len(grp) >= min_group_size:
                groups[str(val)] = {
                    "n": int(len(grp)),
                    "positive_rate": round(float(grp["__pred__"].mean()), 4),
                }
        if groups:
            rates = [v["positive_rate"] for v in groups.values()]
            results[attr] = {
                "type": "single",
                "groups": groups,
                "max_disparity": round(max(rates) - min(rates), 4),
            }

    # Pairwise intersections
    attr_pairs = list(combinations([a for a in protected_attrs if a in df_work.columns], 2))
    for attr1, attr2 in attr_pairs[:3]:  # cap at 3 pairs
        key = f"{attr1} × {attr2}"
        combo_groups = {}

        # Bucket age into brackets for cleaner intersections
        df_intersect = df_work.copy()
        if attr1 == "age" or attr2 == "age":
            age_col = "age" if "age" in [attr1, attr2] else None
            if age_col:
                df_intersect["age_bracket"] = pd.cut(
                    df_intersect["age"],
                    bins=[17, 25, 35, 50, 100],
                    labels=["18-25", "26-35", "36-50", "51+"]
                ).astype(str)
                a1 = "age_bracket" if attr1 == "age" else attr1
                a2 = "age_bracket" if attr2 == "age" else attr2
            else:
                a1, a2 = attr1, attr2
        else:
            a1, a2 = attr1, attr2

        for (v1, v2), grp in df_intersect.groupby([a1, a2]):
            if len(grp) >= min_group_size:
                combo_groups[f"{v1} + {v2}"] = {
                    "n": int(len(grp)),
                    "positive_rate": round(float(grp["__pred__"].mean()), 4),
                }

        if len(combo_groups) >= 2:
            rates = [v["positive_rate"] for v in combo_groups.values()]
            sorted_groups = dict(sorted(combo_groups.items(), key=lambda x: x[1]["positive_rate"], reverse=True))
            results[key] = {
                "type": "intersection",
                "attr1": attr1,
                "attr2": attr2,
                "groups": sorted_groups,
                "max_disparity": round(max(rates) - min(rates), 4),
                "worst_group": max(combo_groups, key=lambda k: combo_groups[k]["positive_rate"]),
                "best_group": min(combo_groups, key=lambda k: combo_groups[k]["positive_rate"]),
            }

    return results


def _encode(X: pd.DataFrame) -> pd.DataFrame:
    X_enc = X.copy()
    for col in X_enc.select_dtypes(include=["object", "category"]).columns:
        X_enc[col] = LabelEncoder().fit_transform(X_enc[col].astype(str))
    return X_enc
