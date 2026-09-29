import pandas as pd
import numpy as np
import joblib
import shap
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score
from sklearn.model_selection import GroupKFold, cross_val_score
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "datasets", "NWIS_drilling_data.csv")
df = pd.read_csv(csv_path)
print("=" * 70)
print("NWIS DRILLING RISK MODEL TRAINING (CLEAN & LEAK-FREE)")
print("=" * 70)
print(f"Dataset rows: {len(df)}")
print(f"Total columns: {df.shape[1]}")
print(f"Number of wells: {df['Well_ID'].nunique()}")

# Convert Timestamp into calendar parts
df["Timestamp"] = pd.to_datetime(df["Timestamp"])
df["Hour"] = df["Timestamp"].dt.hour
df["Day"] = df["Timestamp"].dt.day
df["Month"] = df["Timestamp"].dt.month
df = df.drop(columns=["Timestamp"])

# Target Columns to Predict
TARGET_COLUMNS = [
    "Mud_Loss_Label",
    "Stuck_Pipe_Label",
    "Overpressure_Label",
    "Torque_Spike_Label",
    "Cementing_Issue_Label"
]

# Explicitly exclude non-features AND leaked post-incident/concomitant outcome labels
NON_FEATURE_COLUMNS = [
    "Well_ID",
    "Risk_Severity",
    "Recommended_Action",
    "Kick_Label",     # EXCLUDED TO PREVENT TARGET LEAKAGE
    "Fishing_Label"   # EXCLUDED TO PREVENT TARGET LEAKAGE
]

# Encode Categorical Columns
categorical_columns = df.select_dtypes(include=["object"]).columns.tolist()
categorical_columns = [c for c in categorical_columns if c not in NON_FEATURE_COLUMNS and c not in TARGET_COLUMNS]
print("Categorical features to encode:", categorical_columns)

df = pd.get_dummies(df, columns=categorical_columns, drop_first=True)

# Build Feature Matrix X and Target Matrix y
X = df.drop(columns=TARGET_COLUMNS + NON_FEATURE_COLUMNS)
y = df[TARGET_COLUMNS]

# STRICT LEAKAGE ASSERTIONS
assert "Kick_Label" not in X.columns, "FATAL LEAKAGE: Kick_Label is inside X!"
assert "Fishing_Label" not in X.columns, "FATAL LEAKAGE: Fishing_Label is inside X!"
for target in TARGET_COLUMNS:
    assert target not in X.columns, f"FATAL LEAKAGE: Target {target} is inside X!"

print(f"\nFeatures used in X ({X.shape[1]} features):")
for col in X.columns:
    print(f"  - {col}")

print("\nFeatures explicitly removed (prevent leakage):", NON_FEATURE_COLUMNS)
print("Targets:", TARGET_COLUMNS)

# Well-level GroupKFold split (zero well overlap)
groups = df["Well_ID"]
gkf = GroupKFold(n_splits=5)
train_idx, test_idx = next(gkf.split(X, y, groups=groups))

X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

train_wells = sorted(list(set(groups.iloc[train_idx])))
test_wells = sorted(list(set(groups.iloc[test_idx])))
overlap = set(train_wells) & set(test_wells)

print(f"\nTrain wells ({len(train_wells)}): {train_wells}")
print(f"Test wells ({len(test_wells)}): {test_wells}")
print(f"Overlap (must be 0): {len(overlap)}")
assert len(overlap) == 0, "FATAL ERROR: Well overlap detected between train and test sets!"
print(f"Training samples: {len(X_train)}")
print(f"Testing samples:  {len(X_test)}")

print("\nTarget distributions in training set:")
for target in TARGET_COLUMNS:
    pos = (y_train[target] == 1).sum()
    neg = (y_train[target] == 0).sum()
    print(f"  {target}: {pos} positive / {neg} negative ({pos / len(y_train) * 100:.2f}% positive)")

# Train 5 independent XGBoost models
models = {}
for target in TARGET_COLUMNS:
    neg_count = (y_train[target] == 0).sum()
    pos_count = (y_train[target] == 1).sum()
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0

    model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1,
        scale_pos_weight=scale_pos_weight,
        eval_metric='logloss'
    )
    model.fit(X_train, y_train[target])
    models[target] = model

# Comprehensive Model Evaluation
print("\n" + "=" * 70)
print("MODEL EVALUATION ON HOLDOUT TEST SET (CORRECTED METRICS)")
print("=" * 70)

metrics_summary = []
for target in TARGET_COLUMNS:
    model = models[target]
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test[target], preds)
    prec = precision_score(y_test[target], preds, zero_division=0)
    rec = recall_score(y_test[target], preds, zero_division=0)
    f1 = f1_score(y_test[target], preds, zero_division=0)
    try:
        roc_auc = roc_auc_score(y_test[target], probs)
    except Exception:
        roc_auc = float("nan")
    try:
        pr_auc = average_precision_score(y_test[target], probs)
    except Exception:
        pr_auc = float("nan")

    metrics_summary.append({
        "Target": target,
        "Accuracy": round(acc, 4),
        "Precision": round(prec, 4),
        "Recall": round(rec, 4),
        "F1": round(f1, 4),
        "ROC-AUC": round(roc_auc, 4),
        "PR-AUC": round(pr_auc, 4)
    })

    print(f"\nTarget: {target}")
    print("-" * 50)
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"PR-AUC:    {pr_auc:.4f}")
    print(classification_report(y_test[target], preds, digits=4))

# Save Artifacts
joblib.dump(models, os.path.join(script_dir, "drilling_risk_models.pkl"))
joblib.dump(X.columns.tolist(), os.path.join(script_dir, "feature_columns.pkl"))
reference_dtypes = X.dtypes.to_dict()
joblib.dump(reference_dtypes, os.path.join(script_dir, "reference_dtypes.pkl"))
joblib.dump(categorical_columns, os.path.join(script_dir, "categorical_columns.pkl"))
print("\n[OK] Corrected models and metadata saved successfully!")

# SHAP Explainers
print("\nGenerating SHAP TreeExplainers...")
explainers = {}
for target in TARGET_COLUMNS:
    explainers[target] = shap.TreeExplainer(models[target])
joblib.dump(explainers, os.path.join(script_dir, "shap_explainers.pkl"))
print("[OK] SHAP explainers saved successfully!")

# Cross-Validation
print("\n" + "-" * 70)
print("GROUPED CROSS-VALIDATION ACCURACY (5-Fold Well-Grouped)")
print("-" * 70)
train_groups = groups.iloc[train_idx]
cv_splitter = GroupKFold(n_splits=5)
for target in TARGET_COLUMNS:
    cv_scores = cross_val_score(
        models[target], X_train, y_train[target],
        cv=cv_splitter, groups=train_groups, scoring='accuracy'
    )
    print(f"{target:<25} Mean: {cv_scores.mean():.4f}  (+/- {cv_scores.std():.4f})")

print("\n" + "=" * 70)
print("SUMMARY TABLE")
print("=" * 70)
print(pd.DataFrame(metrics_summary).to_string(index=False))