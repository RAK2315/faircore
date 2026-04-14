import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


def _build_prompt(before: dict, after: dict, shap_importance: dict, dataset_info: dict) -> str:
    protected_attrs = list(before.get("bias_metrics", {}).keys())
    before_accuracy = before.get("accuracy", "N/A")
    after_accuracy = after.get("after_accuracy", "N/A")
    method = after.get("method_used", "reweighting")
    removed_attrs = after.get("protected_attrs_removed", [])

    bias_summary_lines = []
    for attr in protected_attrs:
        bm = before["bias_metrics"].get(attr, {})
        am = after.get("after_metrics", {}).get(attr, {})
        dp_before = bm.get("demographic_parity", {}).get("difference", "N/A")
        dp_after = am.get("demographic_parity", {}).get("difference", "N/A")
        di_before = bm.get("disparate_impact", {}).get("ratio", "N/A")
        di_after = am.get("disparate_impact", {}).get("ratio", "N/A")
        passes_after = am.get("disparate_impact", {}).get("passes_80_percent_rule", False)
        group_rates = bm.get("demographic_parity", {}).get("group_rates", {})
        bias_summary_lines.append(
            f"- Attribute '{attr}': demographic parity diff went from {dp_before} to {dp_after}. "
            f"Disparate impact ratio went from {di_before} to {di_after}. "
            f"Passes 80% rule after debiasing: {passes_after}. "
            f"Group prediction rates before debiasing: {group_rates}."
        )

    top_features = list(shap_importance.get("top_features", {}).items())[:5]
    feature_lines = [f"  {i+1}. {f}: {round(v, 4)}" for i, (f, v) in enumerate(top_features)]

    bias_level_before = before.get("overall_bias_score", {}).get("level", "unknown")
    bias_score_before = before.get("overall_bias_score", {}).get("score", "N/A")
    improved_attrs = after.get("verification", {}).get("improved_attributes", [])
    accuracy_drop = after.get("verification", {}).get("accuracy_drop", "N/A")
    tradeoff = after.get("verification", {}).get("tradeoff_warning", False)

    return f"""You are an AI fairness auditor writing a professional but plain-English bias audit report.

Dataset: {dataset_info.get('n_samples', 'N/A')} samples, {dataset_info.get('n_features', 'N/A')} features, target: '{dataset_info.get('target_col', 'unknown')}'.

BEFORE DEBIASING:
- Model accuracy: {before_accuracy}
- Overall bias level: {bias_level_before} (score: {bias_score_before})
- Protected attributes detected automatically: {', '.join(protected_attrs) if protected_attrs else 'none'}
{chr(10).join(bias_summary_lines)}

Top features driving model decisions (SHAP):
{chr(10).join(feature_lines)}

AFTER DEBIASING:
- Method applied: {method}
- Attributes removed from model: {removed_attrs if removed_attrs else 'none (reweighting used)'}
- Model accuracy after: {after_accuracy}
- Accuracy drop: {accuracy_drop}
- Attributes where bias improved: {improved_attrs}
- Accuracy tradeoff warning: {tradeoff}

Write a bias audit report with these exact sections:
1. EXECUTIVE SUMMARY (2-3 sentences, non-technical, what was wrong and what happened)
2. WHAT BIAS WAS FOUND (explain each protected attribute finding in plain English, what it means for real people)
3. WHY THIS BIAS EXISTED (explain using the SHAP features — which features were proxies for protected attributes)
4. WHAT WE DID TO FIX IT (explain the debiasing method in plain English, no jargon)
5. RESULTS AFTER DEBIASING (before/after comparison, what improved, what tradeoffs exist)
6. RECOMMENDATIONS (3 concrete next steps for the organization)

Be direct, specific, and use numbers. Write for a non-technical executive audience. Write in paragraphs, no bullet points inside sections."""


def _try_gemini(prompt: str, api_key: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-latest"]:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            if "not found" in str(e).lower() or "404" in str(e):
                continue
            raise e
    raise Exception("No working Gemini model found")


def _try_groq(prompt: str, api_key: str) -> str:
    from groq import Groq
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
    )
    return response.choices[0].message.content


def generate_audit_report(
    before_analysis: dict,
    after_analysis: dict,
    shap_importance: dict,
    dataset_info: dict,
    api_key: Optional[str] = None,
    groq_api_key: Optional[str] = None,
) -> str:
    prompt = _build_prompt(before_analysis, after_analysis, shap_importance, dataset_info)

    gemini_key = api_key or os.environ.get("GEMINI_API_KEY", "")
    groq_key = groq_api_key or os.environ.get("GROQ_API_KEY", "")

    if gemini_key:
        try:
            return _try_gemini(prompt, gemini_key)
        except Exception as e:
            print(f"Gemini failed: {e}, trying Groq...")

    if groq_key:
        try:
            return _try_groq(prompt, groq_key)
        except Exception as e:
            print(f"Groq failed: {e}")

    return _fallback_report(before_analysis, after_analysis)


def _fallback_report(before: dict, after: dict) -> str:
    attrs = list(before.get("bias_metrics", {}).keys())
    level = before.get("overall_bias_score", {}).get("level", "unknown")
    acc_before = before.get("accuracy", "N/A")
    acc_after = after.get("after_accuracy", "N/A")
    method = after.get("method_used", "reweighting")
    improved = after.get("verification", {}).get("improved_attributes", [])

    lines = [
        "FAIRCORE BIAS AUDIT REPORT",
        "=" * 40,
        "",
        "EXECUTIVE SUMMARY",
        f"Analysis found {level} bias in this model affecting {len(attrs)} protected attribute(s): {', '.join(attrs)}.",
        f"Debiasing was applied using {method}. Accuracy changed from {acc_before} to {acc_after}.",
        "",
        "WHAT BIAS WAS FOUND",
    ]
    for attr in attrs:
        bm = before["bias_metrics"].get(attr, {})
        dp = bm.get("demographic_parity", {}).get("difference", "N/A")
        di = bm.get("disparate_impact", {}).get("ratio", "N/A")
        passes = bm.get("disparate_impact", {}).get("passes_80_percent_rule", False)
        lines.append(f"'{attr}': demographic parity difference = {dp}, disparate impact ratio = {di}, passes 80% rule = {passes}.")

    lines += [
        "",
        "AFTER DEBIASING",
        f"Improved attributes: {improved if improved else 'see metrics for details'}.",
        f"Method used: {method}.",
        "",
        "Note: Add GEMINI_API_KEY or GROQ_API_KEY to .env for full AI-generated report."
    ]
    return "\n".join(lines)