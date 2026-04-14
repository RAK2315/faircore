import streamlit as st
import requests
import json
import base64
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from io import BytesIO

st.set_page_config(
    page_title="FairCore",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600&display=swap');

html, body, [class*="css"] {
    font-family: 'IBM Plex Sans', sans-serif;
    background-color: #0a0a0a;
    color: #e8e8e8;
}

.main { background-color: #0a0a0a; }
.block-container { padding: 2rem 3rem; max-width: 1200px; }

.faircore-header {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 3rem;
    font-weight: 600;
    color: #00ff88;
    letter-spacing: -2px;
    margin-bottom: 0;
    line-height: 1;
}

.faircore-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.85rem;
    color: #555;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 4px;
}

.metric-card {
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 4px;
    padding: 1.2rem;
    margin: 0.5rem 0;
}

.metric-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.7rem;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.metric-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1.8rem;
    font-weight: 600;
    color: #00ff88;
    line-height: 1.2;
}

.metric-value.bad { color: #ff4444; }
.metric-value.warn { color: #ffaa00; }
.metric-value.good { color: #00ff88; }

.bias-level-severe { color: #ff4444; font-weight: 600; }
.bias-level-high { color: #ff8800; font-weight: 600; }
.bias-level-moderate { color: #ffcc00; font-weight: 600; }
.bias-level-low { color: #00ff88; font-weight: 600; }

.section-header {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 3px;
    border-bottom: 1px solid #1e1e1e;
    padding-bottom: 0.5rem;
    margin: 2rem 0 1rem 0;
}

.report-box {
    background: #0f0f0f;
    border: 1px solid #1e1e1e;
    border-left: 3px solid #00ff88;
    padding: 1.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    line-height: 1.8;
    white-space: pre-wrap;
    font-family: 'IBM Plex Sans', sans-serif;
    color: #ccc;
}

.attr-tag {
    display: inline-block;
    background: #1a1a2e;
    border: 1px solid #00ff8833;
    color: #00ff88;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
    padding: 2px 10px;
    border-radius: 2px;
    margin: 2px;
}

.upload-hint {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
    color: #333;
    margin-top: 0.5rem;
}

.stButton > button {
    background: #00ff88;
    color: #000;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 0.85rem;
    letter-spacing: 1px;
    border: none;
    border-radius: 2px;
    padding: 0.6rem 2rem;
    width: 100%;
    text-transform: uppercase;
}

.stButton > button:hover {
    background: #00cc6a;
    color: #000;
}

.stFileUploader { border: 1px solid #1e1e1e; border-radius: 4px; padding: 0.5rem; }
.stTextInput > div > div > input { background: #111; color: #e8e8e8; border: 1px solid #1e1e1e; }
.stSelectbox > div > div { background: #111; color: #e8e8e8; border: 1px solid #1e1e1e; }

div[data-testid="stExpander"] {
    background: #0f0f0f;
    border: 1px solid #1e1e1e;
    border-radius: 4px;
}

.improvement-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0;
    border-bottom: 1px solid #1a1a1a;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.8rem;
}

.arrow-good { color: #00ff88; }
.arrow-bad { color: #ff4444; }
</style>
""", unsafe_allow_html=True)

BACKEND_URL = "http://localhost:8000"


def bias_color_class(level: str) -> str:
    return f"bias-level-{level}"


def metric_color(value: float, lower_is_better: bool = True) -> str:
    if lower_is_better:
        if value < 0.05:
            return "good"
        elif value < 0.15:
            return "warn"
        else:
            return "bad"
    else:
        if value >= 0.8:
            return "good"
        elif value >= 0.6:
            return "warn"
        else:
            return "bad"


def render_before_after_chart(before_metrics: dict, after_metrics: dict, attr: str):
    metrics_names = ["Demographic Parity Diff", "TPR Difference", "FPR Difference", "Disparate Impact (inverted)"]

    bm = before_metrics.get(attr, {})
    am = after_metrics.get(attr, {})

    before_vals = [
        bm.get("demographic_parity", {}).get("difference", 0),
        bm.get("equalized_odds", {}).get("tpr_difference", 0),
        bm.get("equalized_odds", {}).get("fpr_difference", 0),
        1 - bm.get("disparate_impact", {}).get("ratio", 1),
    ]
    after_vals = [
        am.get("demographic_parity", {}).get("difference", 0),
        am.get("equalized_odds", {}).get("tpr_difference", 0),
        am.get("equalized_odds", {}).get("fpr_difference", 0),
        1 - am.get("disparate_impact", {}).get("ratio", 1),
    ]

    fig = go.Figure()
    fig.add_trace(go.Bar(
        name="Before Debiasing",
        x=metrics_names,
        y=before_vals,
        marker_color="#ff4444",
        opacity=0.8
    ))
    fig.add_trace(go.Bar(
        name="After Debiasing",
        x=metrics_names,
        y=after_vals,
        marker_color="#00ff88",
        opacity=0.8
    ))

    fig.update_layout(
        barmode="group",
        plot_bgcolor="#0a0a0a",
        paper_bgcolor="#0a0a0a",
        font=dict(family="IBM Plex Mono", color="#888", size=11),
        legend=dict(font=dict(color="#888")),
        xaxis=dict(gridcolor="#1a1a1a", tickfont=dict(size=10)),
        yaxis=dict(gridcolor="#1a1a1a", title="Bias Score (lower = fairer)"),
        margin=dict(l=20, r=20, t=30, b=20),
        title=dict(text=f"Bias Metrics: {attr}", font=dict(color="#555", size=12)),
    )
    st.plotly_chart(fig, use_container_width=True)


def render_shap_chart(shap_data: dict):
    features = list(shap_data.get("top_features", {}).keys())
    values = list(shap_data.get("top_features", {}).values())

    if not features:
        st.write("SHAP data unavailable.")
        return

    fig = go.Figure(go.Bar(
        x=values[::-1],
        y=features[::-1],
        orientation="h",
        marker_color="#00ff88",
        opacity=0.7,
    ))

    fig.update_layout(
        plot_bgcolor="#0a0a0a",
        paper_bgcolor="#0a0a0a",
        font=dict(family="IBM Plex Mono", color="#888", size=11),
        xaxis=dict(gridcolor="#1a1a1a", title="Mean |SHAP value|"),
        yaxis=dict(gridcolor="#1a1a1a"),
        margin=dict(l=20, r=20, t=10, b=20),
        height=300,
    )
    st.plotly_chart(fig, use_container_width=True)


st.markdown('<div class="faircore-header">FairCore</div>', unsafe_allow_html=True)
st.markdown('<div class="faircore-sub">ML Bias Detection & Debiasing Engine</div>', unsafe_allow_html=True)
st.markdown("<br>", unsafe_allow_html=True)

col_upload, col_options = st.columns([3, 2])

with col_upload:
    st.markdown('<div class="section-header">Upload</div>', unsafe_allow_html=True)
    model_file = st.file_uploader("Trained Model (.pkl / .joblib)", type=["pkl", "joblib"])
    st.markdown('<div class="upload-hint">sklearn-compatible classifier only</div>', unsafe_allow_html=True)
    data_file = st.file_uploader("Dataset (.csv)", type=["csv"])
    st.markdown('<div class="upload-hint">must include target column and original training features</div>', unsafe_allow_html=True)

with col_options:
    st.markdown('<div class="section-header">Config</div>', unsafe_allow_html=True)
    target_col_input = st.text_input("Target column name", placeholder="leave blank to auto-detect")
    accuracy_threshold = st.slider("Max accuracy drop allowed", 0.01, 0.15, 0.05, 0.01,
                                   help="Debiasing will warn if accuracy drops more than this")

st.markdown("<br>", unsafe_allow_html=True)

run_col, _ = st.columns([2, 3])
with run_col:
    run_analysis = st.button("⚖ Run Bias Analysis", disabled=(model_file is None or data_file is None))

if model_file is None or data_file is None:
    st.markdown("""
    <div style="border:1px solid #1a1a1a; border-radius:4px; padding:2rem; text-align:center; margin-top:2rem;">
        <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:#333; letter-spacing:2px;">
            UPLOAD MODEL + DATASET TO BEGIN
        </div>
        <div style="font-family:'IBM Plex Sans',sans-serif; font-size:0.85rem; color:#2a2a2a; margin-top:0.5rem;">
            FairCore will automatically detect protected attributes, measure bias across fairness metrics,<br>
            debias your model, and generate a plain-English audit report via Gemini.
        </div>
    </div>
    """, unsafe_allow_html=True)

if run_analysis:
    with st.spinner("Running analysis..."):
        try:
            response = requests.post(
                f"{BACKEND_URL}/analyze",
                files={
                    "model_file": (model_file.name, model_file.getvalue(), "application/octet-stream"),
                    "data_file": (data_file.name, data_file.getvalue(), "text/csv"),
                },
                data={
                    "target_column": target_col_input,
                    "accuracy_threshold": accuracy_threshold,
                    "gemini_api_key": "",
                },
                timeout=120
            )

            if response.status_code != 200:
                st.error(f"Backend error {response.status_code}: {response.json().get('detail', response.text)}")
                st.stop()

            result = response.json()
            st.session_state["result"] = result

        except requests.exceptions.ConnectionError:
            st.error(f"Cannot connect to backend at {BACKEND_URL}. Is it running?")
            st.stop()
        except Exception as e:
            st.error(f"Request failed: {str(e)}")
            st.stop()

if "result" in st.session_state:
    result = st.session_state["result"]

    if result.get("status") == "no_protected_attributes":
        st.warning(result.get("message", "No protected attributes detected."))
        st.json(result.get("before", {}))
        st.stop()

    before = result.get("before", {})
    after = result.get("after", {})
    dataset_info = result.get("dataset_info", {})
    audit_report = result.get("audit_report", "")
    session_id = result.get("session_id", "")
    protected_attrs = before.get("protected_attributes_detected", [])
    bias_level = before.get("overall_bias_score", {}).get("level", "unknown")
    bias_score = before.get("overall_bias_score", {}).get("score", 0)
    verification = after.get("verification", {})

    st.markdown('<div class="section-header">Overview</div>', unsafe_allow_html=True)

    m1, m2, m3, m4 = st.columns(4)

    with m1:
        color = metric_color(bias_score)
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Bias Level</div>
            <div class="metric-value {color}">{bias_level.upper()}</div>
            <div class="metric-label">score: {bias_score}</div>
        </div>""", unsafe_allow_html=True)

    with m2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Accuracy Before</div>
            <div class="metric-value">{round(before.get('accuracy', 0) * 100, 1)}%</div>
        </div>""", unsafe_allow_html=True)

    with m3:
        after_acc = after.get("after_accuracy", 0)
        drop = verification.get("accuracy_drop", 0)
        drop_color = "good" if drop <= 0.02 else "warn" if drop <= 0.05 else "bad"
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Accuracy After</div>
            <div class="metric-value">{round(after_acc * 100, 1)}%</div>
            <div class="metric-label {drop_color}">drop: {round(drop * 100, 2)}%</div>
        </div>""", unsafe_allow_html=True)

    with m4:
        method = after.get("method_used", "N/A")
        success = verification.get("debiasing_successful", False)
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Method</div>
            <div class="metric-value" style="font-size:1.1rem; margin-top:4px">{method.replace('_', ' ').title()}</div>
            <div class="metric-label {'good' if success else 'warn'}">{'✓ verified' if success else '⚠ partial'}</div>
        </div>""", unsafe_allow_html=True)

    st.markdown('<div class="section-header">Protected Attributes Detected</div>', unsafe_allow_html=True)
    attr_html = " ".join([f'<span class="attr-tag">{a}</span>' for a in protected_attrs])
    st.markdown(attr_html if attr_html else '<span style="color:#333">none detected</span>', unsafe_allow_html=True)

    st.markdown('<div class="section-header">Bias Metrics — Before vs After</div>', unsafe_allow_html=True)
    after_metrics = after.get("after_metrics", {})

    for attr in protected_attrs:
        render_before_after_chart(before.get("bias_metrics", {}), after_metrics, attr)

    st.markdown('<div class="section-header">Feature Attribution (SHAP)</div>', unsafe_allow_html=True)
    col_shap, col_shap_info = st.columns([3, 2])
    with col_shap:
        render_shap_chart(before.get("shap_importance", {}))
    with col_shap_info:
        st.markdown("""
        <div style="padding:1rem; font-size:0.82rem; color:#555; font-family:'IBM Plex Mono',monospace; line-height:1.8;">
            SHAP values show which features drive model decisions. High SHAP values for features<br>
            correlated with protected attributes indicate proxy discrimination.
        </div>""", unsafe_allow_html=True)
        top = list(before.get("shap_importance", {}).get("top_features", {}).items())[:3]
        for f, v in top:
            st.markdown(f'<div style="font-family:IBM Plex Mono,monospace;font-size:0.75rem;color:#888;padding:2px 0">{f}: {round(v,4)}</div>', unsafe_allow_html=True)

    st.markdown('<div class="section-header">Gemini Audit Report</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="report-box">{audit_report}</div>', unsafe_allow_html=True)

    st.markdown('<div class="section-header">Download</div>', unsafe_allow_html=True)
    dl_col1, dl_col2 = st.columns(2)

    with dl_col1:
        if session_id:
            model_bytes = requests.get(f"{BACKEND_URL}/download/{session_id}").content
            st.download_button(
                label="⬇ Download Debiased Model (.pkl)",
                data=model_bytes,
                file_name=f"faircore_debiased_{session_id[:8]}.pkl",
                mime="application/octet-stream"
            )

    with dl_col2:
        report_bytes = audit_report.encode("utf-8")
        st.download_button(
            label="⬇ Download Audit Report (.txt)",
            data=report_bytes,
            file_name=f"faircore_report_{session_id[:8]}.txt",
            mime="text/plain"
        )

    with st.expander("Raw JSON Response"):
        result_display = {k: v for k, v in result.items() if k != "debiased_model_b64"}
        st.json(result_display)
