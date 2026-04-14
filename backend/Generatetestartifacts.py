"""
FairCore Test Artifact Generator
Generates 4 different test scenarios:

1. COMPAS-style (LogisticRegression, raw CSV) - recidivism prediction
2. Hiring (GradientBoosting + StandardScaler preprocessor, raw CSV) - job application screening  
3. Loan (full sklearn Pipeline with OHE + scaler + RF, raw CSV) - loan approval
4. Medical (RandomForest, encoded CSV) - disease risk prediction

Run: python generate_test_artifacts.py
Outputs go into test_artifacts/ folder
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

np.random.seed(42)
os.makedirs("test_artifacts", exist_ok=True)


def log(msg):
    print(f"\n{'='*50}")
    print(f"  {msg}")
    print('='*50)


# ─────────────────────────────────────────────────────────────
# SCENARIO 1: COMPAS-style Recidivism
# Model: LogisticRegression (raw model, no pipeline)
# Dataset: raw CSV with string columns
# SHAP: LinearSHAP
# Protected attrs: race, sex
# ─────────────────────────────────────────────────────────────
log("SCENARIO 1: COMPAS Recidivism — LogisticRegression + raw CSV")

n = 4000
race = np.random.choice(["African-American", "Caucasian", "Hispanic", "Other"], n, p=[0.40, 0.35, 0.15, 0.10])
sex = np.random.choice(["Male", "Female"], n, p=[0.60, 0.40])
age = np.random.randint(18, 70, n)
priors_count = np.random.negative_binomial(1, 0.5, n).clip(0, 15)
juv_fel_count = np.random.poisson(0.2, n).clip(0, 5)
juv_misd_count = np.random.poisson(0.3, n).clip(0, 5)
c_charge_degree = np.random.choice(["F", "M"], n, p=[0.45, 0.55])
days_b_screening = np.random.randint(-30, 30, n)

noise = np.random.normal(0, 1.0, n)
log_odds = (
    -1.5
    + 0.85 * (race == "African-American").astype(float)
    + 0.3  * (race == "Hispanic").astype(float)
    + 0.55 * (sex == "Male").astype(float)
    - 0.02 * (age - 35)
    + 0.28 * priors_count
    + 0.4  * juv_fel_count
    + 0.2  * juv_misd_count
    + 0.3  * (c_charge_degree == "F").astype(float)
    + noise
)
two_year_recid = (1 / (1 + np.exp(-log_odds)) > 0.5).astype(int)

df1 = pd.DataFrame({
    "race": race, "sex": sex, "age": age,
    "juv_fel_count": juv_fel_count, "juv_misd_count": juv_misd_count,
    "priors_count": priors_count, "days_b_screening_arrest": days_b_screening,
    "c_charge_degree": c_charge_degree, "two_year_recid": two_year_recid,
})

df1_enc = df1.copy()
for col in ["race", "sex", "c_charge_degree"]:
    df1_enc[col] = LabelEncoder().fit_transform(df1[col])

X1 = df1_enc.drop("two_year_recid", axis=1)
y1 = df1_enc["two_year_recid"]
X1_train, X1_test, y1_train, y1_test = train_test_split(X1, y1, test_size=0.3, random_state=42)

model1 = LogisticRegression(max_iter=1000, C=1.0, random_state=42)
model1.fit(X1_train, y1_train)

joblib.dump(model1, "test_artifacts/compas_model.pkl")
df1.to_csv("test_artifacts/compas_dataset.csv", index=False)

print(f"Train acc: {accuracy_score(y1_train, model1.predict(X1_train)):.3f}")
print(f"Test acc:  {accuracy_score(y1_test, model1.predict(X1_test)):.3f}")
print(f"Recidivism rate: {y1.mean():.3f}")
print("Files: test_artifacts/compas_model.pkl + compas_dataset.csv")
print("Upload: compas_model.pkl + compas_dataset.csv | Target: two_year_recid | No preprocessor needed")


# ─────────────────────────────────────────────────────────────
# SCENARIO 2: Hiring Screening
# Model: GradientBoostingClassifier (raw model)
# Preprocessor: StandardScaler (saved separately)
# Dataset: raw CSV
# SHAP: TreeSHAP
# Protected attrs: gender, age, race
# ─────────────────────────────────────────────────────────────
log("SCENARIO 2: Hiring Screening — GradientBoosting + separate StandardScaler")

n = 3500
gender = np.random.choice(["Male", "Female", "Non-binary"], n, p=[0.52, 0.44, 0.04])
age2 = np.random.randint(22, 60, n)
race2 = np.random.choice(["White", "Black", "Asian", "Hispanic", "Other"], n, p=[0.55, 0.18, 0.14, 0.10, 0.03])
years_experience = np.random.randint(0, 20, n)
education = np.random.choice(["High School", "Bachelor", "Master", "PhD"], n, p=[0.15, 0.50, 0.28, 0.07])
skills_score = np.random.randint(40, 100, n)
interview_score = np.random.randint(40, 100, n)
gpa = np.round(np.random.uniform(2.5, 4.0, n), 2)

noise2 = np.random.normal(0, 1.0, n)
log_odds2 = (
    -3.0
    + 0.6  * (gender == "Male").astype(float)
    - 0.3  * (gender == "Non-binary").astype(float)
    - 0.4  * (race2 == "Black").astype(float)
    - 0.2  * (race2 == "Hispanic").astype(float)
    + 0.3  * (race2 == "Asian").astype(float)
    - 0.015 * (age2 - 30)
    + 0.1  * years_experience
    + 0.03 * skills_score
    + 0.03 * interview_score
    + 0.5  * (education == "Master").astype(float)
    + 1.0  * (education == "PhD").astype(float)
    + 0.4  * gpa
    + noise2
)
hired = (1 / (1 + np.exp(-log_odds2)) > 0.5).astype(int)

df2 = pd.DataFrame({
    "gender": gender, "age": age2, "race": race2,
    "years_experience": years_experience, "education": education,
    "skills_score": skills_score, "interview_score": interview_score,
    "gpa": gpa, "hired": hired,
})

# Encode for model training
df2_enc = df2.copy()
for col in ["gender", "race", "education"]:
    df2_enc[col] = LabelEncoder().fit_transform(df2[col])

X2 = df2_enc.drop("hired", axis=1)
y2 = df2_enc["hired"]
X2_train, X2_test, y2_train, y2_test = train_test_split(X2, y2, test_size=0.3, random_state=42)

# Fit and save scaler separately
scaler2 = StandardScaler()
X2_train_scaled = scaler2.fit_transform(X2_train)
X2_test_scaled = scaler2.transform(X2_test)

model2 = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
model2.fit(X2_train_scaled, y2_train)

joblib.dump(model2, "test_artifacts/hiring_model.pkl")
joblib.dump(scaler2, "test_artifacts/hiring_scaler.pkl")
df2.to_csv("test_artifacts/hiring_dataset.csv", index=False)

print(f"Train acc: {accuracy_score(y2_train, model2.predict(X2_train_scaled)):.3f}")
print(f"Test acc:  {accuracy_score(y2_test, model2.predict(X2_test_scaled)):.3f}")
print(f"Hire rate: {y2.mean():.3f}")
print("Files: hiring_model.pkl + hiring_scaler.pkl + hiring_dataset.csv")
print("Upload: hiring_model.pkl + hiring_dataset.csv + hiring_scaler.pkl | Target: hired")


# ─────────────────────────────────────────────────────────────
# SCENARIO 3: Loan Approval
# Model: Full sklearn Pipeline (OHE + StandardScaler + RandomForest)
# Dataset: raw CSV with string columns — pipeline handles everything
# SHAP: TreeSHAP on pipeline final estimator
# Protected attrs: gender, race, age_group
# ─────────────────────────────────────────────────────────────
log("SCENARIO 3: Loan Approval — Full sklearn Pipeline (OHE + Scaler + RandomForest)")

n = 5000
gender3 = np.random.choice(["Male", "Female"], n, p=[0.55, 0.45])
race3 = np.random.choice(["White", "Black", "Hispanic", "Asian", "Other"], n, p=[0.58, 0.17, 0.13, 0.09, 0.03])
age3 = np.random.randint(21, 75, n)
income = np.random.lognormal(10.8, 0.5, n).astype(int).clip(20000, 300000)
credit_score = np.random.randint(300, 850, n)
loan_amount = np.random.randint(5000, 500000, n)
employment_type = np.random.choice(["Full-time", "Part-time", "Self-employed", "Unemployed"], n, p=[0.60, 0.15, 0.18, 0.07])
debt_to_income = np.round(np.random.uniform(0.1, 0.6, n), 3)
years_employed = np.random.randint(0, 30, n)

noise3 = np.random.normal(0, 0.8, n)
log_odds3 = (
    -2.0
    + 0.5  * (gender3 == "Male").astype(float)
    - 0.6  * (race3 == "Black").astype(float)
    - 0.35 * (race3 == "Hispanic").astype(float)
    - 0.01 * (age3 - 40)
    + 0.000008 * income
    + 0.004 * credit_score
    - 0.000001 * loan_amount
    - 2.0  * debt_to_income
    + 0.05 * years_employed
    + 0.4  * (employment_type == "Full-time").astype(float)
    - 1.2  * (employment_type == "Unemployed").astype(float)
    + noise3
)
loan_approved = (1 / (1 + np.exp(-log_odds3)) > 0.5).astype(int)

df3 = pd.DataFrame({
    "gender": gender3, "race": race3, "age": age3,
    "income": income, "credit_score": credit_score,
    "loan_amount": loan_amount, "employment_type": employment_type,
    "debt_to_income": debt_to_income, "years_employed": years_employed,
    "loan_approved": loan_approved,
})

# Build full pipeline — handles raw strings directly
cat_features = ["gender", "race", "employment_type"]
num_features = ["age", "income", "credit_score", "loan_amount", "debt_to_income", "years_employed"]

preprocessor3 = ColumnTransformer(transformers=[
    ("num", StandardScaler(), num_features),
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
])

pipeline3 = Pipeline([
    ("preprocessor", preprocessor3),
    ("classifier", RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)),
])

X3 = df3.drop("loan_approved", axis=1)
y3 = df3["loan_approved"]
X3_train, X3_test, y3_train, y3_test = train_test_split(X3, y3, test_size=0.3, random_state=42)

pipeline3.fit(X3_train, y3_train)

joblib.dump(pipeline3, "test_artifacts/loan_pipeline.pkl")
df3.to_csv("test_artifacts/loan_dataset.csv", index=False)

print(f"Train acc: {accuracy_score(y3_train, pipeline3.predict(X3_train)):.3f}")
print(f"Test acc:  {accuracy_score(y3_test, pipeline3.predict(X3_test)):.3f}")
print(f"Approval rate: {y3.mean():.3f}")
print("Files: loan_pipeline.pkl + loan_dataset.csv")
print("Upload: loan_pipeline.pkl + loan_dataset.csv | Target: loan_approved | No preprocessor (it's inside pipeline)")


# ─────────────────────────────────────────────────────────────
# SCENARIO 4: Medical Risk Prediction
# Model: RandomForestClassifier (raw model, pre-encoded)
# Dataset: pre-encoded CSV (no strings)
# SHAP: TreeSHAP
# Protected attrs: age_group encoded as int, sex (0/1)
# ─────────────────────────────────────────────────────────────
log("SCENARIO 4: Medical Risk — RandomForest + pre-encoded CSV")

n = 3000
sex4 = np.random.choice([0, 1], n, p=[0.48, 0.52])  # 0=Female, 1=Male
age4 = np.random.randint(30, 80, n)
bmi = np.round(np.random.normal(27, 5, n).clip(16, 50), 1)
blood_pressure = np.random.randint(80, 180, n)
cholesterol = np.random.randint(150, 300, n)
glucose = np.random.randint(70, 200, n)
smoking = np.random.choice([0, 1], n, p=[0.70, 0.30])
family_history = np.random.choice([0, 1], n, p=[0.65, 0.35])
exercise_hours = np.random.randint(0, 14, n)
alcohol_units = np.random.randint(0, 30, n)

noise4 = np.random.normal(0, 0.9, n)
log_odds4 = (
    -5.0
    + 0.4  * sex4
    + 0.04 * (age4 - 50)
    + 0.06 * (bmi - 25)
    + 0.02 * (blood_pressure - 120)
    + 0.01 * (cholesterol - 200)
    + 0.03 * (glucose - 100)
    + 0.8  * smoking
    + 0.9  * family_history
    - 0.1  * exercise_hours
    + 0.05 * alcohol_units
    + noise4
)
high_risk = (1 / (1 + np.exp(-log_odds4)) > 0.5).astype(int)

df4 = pd.DataFrame({
    "sex": sex4, "age": age4, "bmi": bmi,
    "blood_pressure": blood_pressure, "cholesterol": cholesterol,
    "glucose": glucose, "smoking": smoking, "family_history": family_history,
    "exercise_hours": exercise_hours, "alcohol_units": alcohol_units,
    "high_risk": high_risk,
})

X4 = df4.drop("high_risk", axis=1)
y4 = df4["high_risk"]
X4_train, X4_test, y4_train, y4_test = train_test_split(X4, y4, test_size=0.3, random_state=42)

model4 = RandomForestClassifier(n_estimators=150, max_depth=6, random_state=42)
model4.fit(X4_train, y4_train)

joblib.dump(model4, "test_artifacts/medical_model.pkl")
df4.to_csv("test_artifacts/medical_dataset.csv", index=False)

print(f"Train acc: {accuracy_score(y4_train, model4.predict(X4_train)):.3f}")
print(f"Test acc:  {accuracy_score(y4_test, model4.predict(X4_test)):.3f}")
print(f"High risk rate: {y4.mean():.3f}")
print("Files: medical_model.pkl + medical_dataset.csv")
print("Upload: medical_model.pkl + medical_dataset.csv | Target: high_risk | No preprocessor needed")


# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("ALL TEST ARTIFACTS GENERATED IN test_artifacts/")
print("="*60)
print("""
┌─────────────────────────────────────────────────────────────┐
│ SCENARIO 1 — COMPAS Recidivism                              │
│   Model:  compas_model.pkl (LogisticRegression)             │
│   Data:   compas_dataset.csv                                │
│   Target: two_year_recid                                    │
│   Extra:  none — auto-encode mode                           │
│   SHAP:   LinearSHAP                                        │
├─────────────────────────────────────────────────────────────┤
│ SCENARIO 2 — Hiring Screening                               │
│   Model:  hiring_model.pkl (GradientBoosting)               │
│   Data:   hiring_dataset.csv                                │
│   Target: hired                                             │
│   Extra:  hiring_scaler.pkl → upload as Preprocessor        │
│   SHAP:   TreeSHAP                                          │
├─────────────────────────────────────────────────────────────┤
│ SCENARIO 3 — Loan Approval                                  │
│   Model:  loan_pipeline.pkl (Pipeline: OHE+Scaler+RF)       │
│   Data:   loan_dataset.csv (raw strings)                    │
│   Target: loan_approved                                     │
│   Extra:  none — pipeline handles preprocessing             │
│   SHAP:   TreeSHAP on final estimator                       │
├─────────────────────────────────────────────────────────────┤
│ SCENARIO 4 — Medical Risk                                   │
│   Model:  medical_model.pkl (RandomForest)                  │
│   Data:   medical_dataset.csv (pre-encoded)                 │
│   Target: high_risk                                         │
│   Extra:  none — direct numeric mode                        │
│   SHAP:   TreeSHAP                                          │
└─────────────────────────────────────────────────────────────┘
""")