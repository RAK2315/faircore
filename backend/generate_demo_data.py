import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

np.random.seed(42)
n = 5000

race = np.random.choice(["African-American", "Caucasian", "Hispanic", "Other"], n, p=[0.40, 0.35, 0.15, 0.10])
sex = np.random.choice(["Male", "Female"], n, p=[0.60, 0.40])
age = np.random.randint(18, 70, n)
priors_count = np.random.negative_binomial(1, 0.5, n).clip(0, 15)
days_b_screening_arrest = np.random.randint(-30, 30, n)
c_charge_degree = np.random.choice(["F", "M"], n, p=[0.45, 0.55])
juv_fel_count = np.random.poisson(0.2, n).clip(0, 5)
juv_misd_count = np.random.poisson(0.3, n).clip(0, 5)

noise = np.random.normal(0, 1.0, n)
log_odds = (
    -1.5
    + 0.8  * (race == "African-American").astype(float)
    + 0.3  * (race == "Hispanic").astype(float)
    + 0.5  * (sex == "Male").astype(float)
    - 0.02 * (age - 35)
    + 0.25 * priors_count
    + 0.4  * juv_fel_count
    + 0.2  * juv_misd_count
    + 0.3  * (c_charge_degree == "F").astype(float)
    + noise
)
prob = 1 / (1 + np.exp(-log_odds))
two_year_recid = (prob > 0.5).astype(int)

df = pd.DataFrame({
    "race": race, "sex": sex, "age": age,
    "juv_fel_count": juv_fel_count, "juv_misd_count": juv_misd_count,
    "priors_count": priors_count, "days_b_screening_arrest": days_b_screening_arrest,
    "c_charge_degree": c_charge_degree, "two_year_recid": two_year_recid,
})

df_encoded = df.copy()
for col in ["race", "sex", "c_charge_degree"]:
    df_encoded[col] = LabelEncoder().fit_transform(df[col])

feature_cols = [c for c in df_encoded.columns if c != "two_year_recid"]
X = df_encoded[feature_cols]
y = df_encoded["two_year_recid"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

model = LogisticRegression(max_iter=1000, C=1.0, random_state=42)
model.fit(X_train, y_train)

print(f"Train accuracy: {accuracy_score(y_train, model.predict(X_train)):.3f}")
print(f"Test accuracy:  {accuracy_score(y_test, model.predict(X_test)):.3f}")
print(f"Dataset: {df.shape}, recidivism rate: {y.mean():.3f}")

joblib.dump(model, "demo_model.pkl")
df.to_csv("demo_dataset.csv", index=False)
print("Generated demo_model.pkl and demo_dataset.csv")
print("Features:", feature_cols)
