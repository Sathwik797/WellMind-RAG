import pandas as pd
import numpy as np
import joblib
import os

script_dir = os.path.dirname(os.path.abspath(__file__))

# Load everything saved by train_model.py
models = joblib.load(os.path.join(script_dir, "drilling_risk_models.pkl"))
feature_columns = joblib.load(os.path.join(script_dir, "feature_columns.pkl"))
reference_dtypes = joblib.load(os.path.join(script_dir, "reference_dtypes.pkl"))
categorical_columns = joblib.load(os.path.join(script_dir, "categorical_columns.pkl"))
explainers = joblib.load(os.path.join(script_dir, "shap_explainers.pkl"))

target_columns = [
    "Mud_Loss_Label",
    "Stuck_Pipe_Label",
    "Overpressure_Label",
    "Torque_Spike_Label",
    "Cementing_Issue_Label"
]

# Raw numeric columns genuinely available in real-time drilling (NO Kick_Label / Fishing_Label)
RAW_NUMERIC_COLUMNS = [
    "Depth_MD", "Depth_TVD", "ROP", "WOB", "RPM", "Torque",
    "Standpipe_Pressure", "Flow_Rate", "Mud_Weight", "Plastic_Viscosity",
    "Yield_Point", "Hook_Load", "Inclination", "Reservoir_Pressure",
    "Formation_Pore_Pressure", "Distance_To_Nearest_Offset_m",
    "Historical_Event_Count", "Previous_Mud_Loss_Count",
    "Previous_Stuck_Pipe_Count", "Previous_Kick_Count",
    "Previous_NPT_Count", "Similar_Well_Risk_Count"
]

RAW_CATEGORICAL_COLUMNS = categorical_columns  # e.g. Formation, Bit_Type
REQUIRED_TIMESTAMP = "Timestamp"

REQUIRED_RAW_COLUMNS = RAW_NUMERIC_COLUMNS + RAW_CATEGORICAL_COLUMNS

# Default medians for graceful sensor imputation
DEFAULT_NUMERIC_IMPUTATION = {
    "Depth_MD": 2000.0, "Depth_TVD": 1980.0, "ROP": 20.0, "WOB": 30.0, "RPM": 110.0,
    "Torque": 250.0, "Standpipe_Pressure": 1500.0, "Flow_Rate": 700.0, "Mud_Weight": 1.4,
    "Plastic_Viscosity": 20.0, "Yield_Point": 8.0, "Hook_Load": 180.0, "Inclination": 1.5,
    "Reservoir_Pressure": 2500.0, "Formation_Pore_Pressure": 2500.0,
    "Distance_To_Nearest_Offset_m": 5000.0, "Historical_Event_Count": 0,
    "Previous_Mud_Loss_Count": 0, "Previous_Stuck_Pipe_Count": 0,
    "Previous_Kick_Count": 0, "Previous_NPT_Count": 0, "Similar_Well_Risk_Count": 0
}


def prepare_input(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # 1. Provide default/imputed values for missing required numeric columns
    for col in RAW_NUMERIC_COLUMNS:
        if col not in df.columns or df[col].isna().any():
            fallback = DEFAULT_NUMERIC_IMPUTATION.get(col, 0)
            if col not in df.columns:
                df[col] = fallback
            else:
                df[col] = df[col].fillna(fallback)

    # 2. Impute missing categoricals
    for col in RAW_CATEGORICAL_COLUMNS:
        if col not in df.columns or df[col].isna().any():
            if col not in df.columns:
                df[col] = "Unknown"
            else:
                df[col] = df[col].fillna("Unknown")

    # 3. Timestamp -> Hour/Day/Month
    if "Timestamp" not in df.columns or df["Timestamp"].isna().all() or (df["Timestamp"].astype(str) == "").all():
        now = pd.Timestamp.now()
        df["Hour"] = now.hour
        df["Day"] = now.day
        df["Month"] = now.month
    else:
        timestamp = df["Timestamp"].astype(str)
        timestamp = timestamp.str.replace(r" GMT[+-]\d{4} \(.*\)$", "", regex=True)
        parsed = pd.to_datetime(timestamp, errors="coerce", dayfirst=True)
        if parsed.isna().all():
            now = pd.Timestamp.now()
            df["Hour"] = now.hour
            df["Day"] = now.day
            df["Month"] = now.month
        else:
            parsed = parsed.fillna(pd.Timestamp.now())
            df["Hour"] = parsed.dt.hour
            df["Day"] = parsed.dt.day
            df["Month"] = parsed.dt.month

    if "Timestamp" in df.columns:
        df = df.drop(columns=["Timestamp"])

    # 4. Strictly drop Well_ID, outcome labels, and target columns if present
    drop_cols = [
        c for c in (["Well_ID", "Risk_Severity", "Recommended_Action", "Kick_Label", "Fishing_Label"] + target_columns)
        if c in df.columns
    ]
    df = df.drop(columns=drop_cols)

    # 5. One-hot encode categorical columns the same way training did
    df = pd.get_dummies(df, columns=RAW_CATEGORICAL_COLUMNS, drop_first=True)

    # 6. Align to the exact training-time feature columns (filling missing one-hot dummies with 0)
    df = df.reindex(columns=feature_columns, fill_value=0)
    df = df.apply(pd.to_numeric, errors="coerce").fillna(0)

    return df


def predict_risk(df: pd.DataFrame) -> dict:
    X = prepare_input(df)

    results = {}
    for target in target_columns:
        model = models[target]
        pred = model.predict(X)
        proba = model.predict_proba(X)
        pos_proba = proba[:, 1] if proba.shape[1] > 1 else proba[:, 0]
        results[target] = {
            "prediction": int(pred[0]),
            "probability": float(np.round(pos_proba[0], 4))
        }

    return results


def explain_prediction(df: pd.DataFrame) -> dict:
    X = prepare_input(df)

    explanations = {}
    for target in target_columns:
        explainer = explainers[target]
        shap_values = explainer.shap_values(X)

        if isinstance(shap_values, list):
            sv = shap_values[1] if len(shap_values) > 1 else shap_values[0]
        else:
            sv = shap_values

        row_shap = sv[0] if sv.ndim > 1 else sv

        feature_impact = pd.Series(row_shap, index=X.columns)
        top_features = feature_impact.abs().sort_values(ascending=False).head(5)

        explanations[target] = pd.DataFrame({
            "feature": top_features.index,
            "shap_value": feature_impact[top_features.index].values
        }).reset_index(drop=True)

    return explanations