<div align="center">

# FAIRCORE

**ML Bias Detection & Debiasing Engine**

*Upload any sklearn classifier. Detect bias across 6 fairness vectors. Get a debiased model back. Automatically.*

[![Google Solution Challenge 2026](https://img.shields.io/badge/Google_Solution_Challenge-2026-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/community/gdsc-solution-challenge)
[![Gemini API](https://img.shields.io/badge/Gemini_API-1.5_Flash-blue?style=for-the-badge&logo=google)](https://aistudio.google.com)
[![Google Cloud Run](https://img.shields.io/badge/Cloud_Run-Deployed-4285F4?style=for-the-badge&logo=googlecloud)](https://cloud.google.com/run)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)

[**Live Demo**](https://your-frontend-url.vercel.app) · [**API Docs**](https://your-backend-url.run.app/docs) · [**Demo Video**](#)

</div>

---

## The Problem

Computer programs now make life-changing decisions about who gets a job, a bank loan, or medical care. When trained on flawed historical data, they repeat and amplify discrimination at scale.

- **31%** average disparity in automated hiring systems against protected groups
- **2.4×** more likely for AI to deny loans to minority applicants
- **56%** of medical AI systems show racial bias in diagnostic recommendations
- **2024** — EU AI Act now legally requires bias audits before deployment of high-risk AI

Existing tools like IBM AIF360 and Google What-If Tool only **measure** bias. They give you numbers and stop.

**FairCore closes the loop: detect → explain → debias → verify → report.**

---

## What FairCore Does

```
Upload model (.pkl)  +  Dataset (.csv)
              ↓
    Auto-detect protected attributes
    (mutual information + chi-squared)
              ↓
    6-Vector Bias Analysis
    ├── Demographic Parity
    ├── Equalized Odds (TPR + FPR)
    ├── Disparate Impact (80% rule)
    ├── SHAP Feature Attribution
    ├── Counterfactual Analysis ← novel
    └── Intersectional Bias    ← novel
              ↓
    Adversarial Debiasing
    ├── Reweighting (primary)
    └── Prejudice Remover (fallback)
              ↓
    Closed-loop Verification
    (only accepts result if bias improves
     within your accuracy threshold)
              ↓
    Gemini 1.5 Flash Audit Report
    (plain English, SHAP-grounded,
     causal explanation of why bias existed)
              ↓
  ┌─────────────────────────────┐
  │  Debiased model (.pkl)      │
  │  Audit report (.txt)        │
  │  Threshold sweep table      │
  └─────────────────────────────┘
```

---

## What Makes FairCore Different

Most bias tools stop at measurement. FairCore does three things no existing free tool does together:

### 1. Automatic Protected Attribute Detection
No manual labeling of sensitive columns. FairCore uses mutual information and chi-squared statistical tests to automatically identify demographic attributes — even when columns aren't explicitly labeled as protected.

### 2. Counterfactual Analysis
> *"If I change only this person's race, does the prediction change?"*

FairCore flips each person's demographic group and measures how many predictions change. This directly quantifies proxy discrimination — not just statistical disparity.

### 3. Intersectional Bias Detection
Measures bias at the intersection of protected attributes — Black women vs. white women vs. Black men. IBM AIF360 doesn't do this by default. Compounding discrimination is invisible without intersectional analysis.

---

## Supported Model Types

| Model Type | Example | SHAP Method | Preprocessor |
|---|---|---|---|
| Raw sklearn estimator | `LogisticRegression`, `RandomForest` | LinearSHAP / TreeSHAP | Auto label-encode |
| Full sklearn Pipeline | `Pipeline([OHE, Scaler, GBC])` | TreeSHAP on final step | Passthrough |
| Model + separate scaler | `GBC` + `StandardScaler.pkl` | TreeSHAP | Upload preprocessor |
| Pre-encoded numeric CSV | Any model | TreeSHAP / coef_ | Direct |

SHAP auto-selects: TreeSHAP → LinearSHAP → KernelSHAP → coef_ magnitude → feature_importances_

---

## Tech Stack

```
Frontend          React 18 + TypeScript + Tailwind CSS + Vite
                  Recharts · Framer Motion · React Router

Backend           FastAPI + Python 3.10
                  scikit-learn · AIF360 · SHAP · joblib

AI Reports        Google Gemini 1.5 Flash (free tier)
                  Groq / Llama 3.3 70B (fallback)

Deploy            Google Cloud Run (backend)
                  Vercel (frontend)
```

---

## Fairness Metrics

| Metric | Formula | Threshold |
|---|---|---|
| Demographic Parity | `P(Ŷ=1\|A=0) = P(Ŷ=1\|A=1)` | Difference < 0.05 = low |
| Equalized Odds | `TPR_A = TPR_B` and `FPR_A = FPR_B` | Difference < 0.05 = low |
| Disparate Impact | `P(Ŷ=1\|minority) / P(Ŷ=1\|majority) ≥ 0.8` | Ratio ≥ 0.8 = passes |
| Counterfactual Flip Rate | `P(Ŷ changes \| only A changes)` | Lower = fairer |
| Intersectional Disparity | Max parity diff across A×B groups | Lower = fairer |
| Threshold Fairness | Fairness score at optimal threshold | Minimized |

---

## Quick Start

### Run Locally

```bash
# Clone
git clone https://github.com/RAK2315/faircore.git
cd faircore

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # add GEMINI_API_KEY and GROQ_API_KEY
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd ..
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend docs: `http://localhost:8000/docs`

### Generate Demo Data

```bash
cd backend

# Default COMPAS-style demo
python generate_demo_data.py

# 4 test scenarios (COMPAS, Hiring, Loan Pipeline, Medical)
python generate_test_artifacts.py
```

### API Keys (both free)

| Service | Get Key | Used For |
|---|---|---|
| Gemini API | [aistudio.google.com](https://aistudio.google.com) | Audit report generation |
| Groq API | [console.groq.com](https://console.groq.com) | Fallback if Gemini fails |

---

## Deploy to Google Cloud Run

```bash
cd backend

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/faircore-backend
gcloud run deploy faircore-backend \
  --image gcr.io/YOUR_PROJECT_ID/faircore-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key,GROQ_API_KEY=your_key \
  --memory 2Gi
```

Update `VITE_BACKEND_URL` in `.env` with your Cloud Run URL, then deploy frontend to Vercel.

---

## Test Scenarios

Four pre-built test scenarios covering all ingestion modes:

```
SCENARIO 1 — COMPAS Recidivism
  Model:  LogisticRegression (raw)
  Data:   compas_dataset.csv
  Target: two_year_recid
  SHAP:   LinearSHAP
  Bias:   race, sex

SCENARIO 2 — Hiring Screening
  Model:  LogisticRegression + separate StandardScaler
  Data:   hiring_dataset.csv
  Target: hired
  Extra:  Upload hiring_scaler.pkl as preprocessor
  Bias:   gender, race, age

SCENARIO 3 — Loan Approval (Pipeline)
  Model:  sklearn Pipeline (OHE + StandardScaler + RandomForest)
  Data:   loan_dataset.csv (raw strings)
  Target: loan_approved
  Extra:  None — pipeline handles everything
  Bias:   gender, race, employment_type

SCENARIO 4 — Medical Risk
  Model:  RandomForestClassifier (raw, pre-encoded data)
  Data:   medical_dataset.csv
  Target: high_risk
  Extra:  None
  Bias:   sex, age, smoking
```

---

## Project Structure

```
faircore/
├── backend/
│   ├── main.py                    # FastAPI app, all routes
│   ├── bias_detector.py           # 3 fairness metrics + SHAP auto-select
│   ├── debiaser.py                # Reweighting + prejudice remover
│   ├── counterfactual.py          # Counterfactual flip analysis
│   ├── intersectional.py          # Intersectional bias detection
│   ├── threshold_analysis.py      # Accuracy-fairness threshold sweep
│   ├── gemini_reporter.py         # Gemini + Groq audit report
│   ├── utils.py                   # Smart model ingestion layer
│   ├── schemas.py                 # Pydantic models
│   ├── generate_demo_data.py      # COMPAS-style demo artifacts
│   ├── generate_test_artifacts.py # 4 test scenarios
│   ├── requirements.txt
│   └── Dockerfile
├── src/
│   ├── pages/
│   │   ├── Landing.tsx            # Hero, how it works, tech stack
│   │   ├── Investigate.tsx        # Upload interface
│   │   ├── Results.tsx            # Full audit results + charts
│   │   └── About.tsx              # Research, metrics explained, team
│   ├── components/
│   │   ├── layout/Layout.tsx      # Nav + sidebar
│   │   └── ui/
│   │       ├── Radar.tsx          # Analysis loading screen
│   │       ├── TextScramble.tsx   # Kinetic typography
│   │       └── Marquee.tsx        # Scrolling ticker
│   ├── lib/AnalysisContext.tsx    # Global state
│   └── App.tsx
├── public/
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Research References

| Paper | Venue | Relevance |
|---|---|---|
| Fairness and Abstraction in Sociotechnical Systems — Selbst et al. | FAccT 2019 | Foundational fairness framing |
| A Reductions Approach to Fair Classification — Agarwal et al. | ICML 2018 | Prejudice remover algorithm |
| Certifying and Removing Disparate Impact — Feldman et al. | KDD 2015 | 80% rule and reweighting |
| A Unified Approach to Interpreting Model Predictions — Lundberg & Lee | NeurIPS 2017 | SHAP attribution method |
| Data Preprocessing Techniques for Classification without Discrimination — Kamiran & Calders | KAIS 2012 | Reweighting algorithm |

---

## Built By

**Rehaan Ahmad Khan** — B.Tech CS (AI & ML), JSS University Noida

Specialist in ML pipelines, NLP, computer vision, and agentic AI systems.

[GitHub](https://github.com/RAK2315) · [LinkedIn](https://linkedin.com/in/rehaanak)

---

## Google Solution Challenge 2026

Built for the **Unbiased AI Decision** problem statement:

> *"Build a clear, accessible solution to thoroughly inspect datasets and software models for hidden unfairness or discrimination. Provide organizations with an easy way to measure, flag, and fix harmful bias before their systems impact real people."*

**Google technologies used:**
- Google Gemini 1.5 Flash — AI audit report generation
- Google Cloud Run — scalable serverless backend deployment

---

<div align="center">

*FairCore — because fairness shouldn't require a PhD.*

</div>