import pandas as pd
from prediction import predict_risk, explain_prediction, prepare_input

# Test data with genuinely available features (NO Kick_Label / Fishing_Label)
test_data = pd.DataFrame({
    "Well_ID": ["W001"],
    "Timestamp": ["16-01-2026 04:45"],
    "Depth_MD": [2020.0],
    "Depth_TVD": [2001.0],
    "Formation": ["Limestone_B"],
    "ROP": [28.11],
    "WOB": [54.94],
    "RPM": [116.7],
    "Torque": [261.2],
    "Standpipe_Pressure": [357.4],
    "Flow_Rate": [864.2],
    "Mud_Weight": [1.404],
    "Plastic_Viscosity": [25.17],
    "Yield_Point": [7.47],
    "Hook_Load": [237.2],
    "Inclination": [2.21],
    "Bit_Type": ["PDC_8.5"],
    "Reservoir_Pressure": [2600.0],
    "Formation_Pore_Pressure": [2653.8],
    "Distance_To_Nearest_Offset_m": [13194.0],
    "Historical_Event_Count": [0],
    "Previous_Mud_Loss_Count": [82],
    "Previous_Stuck_Pipe_Count": [0],
    "Previous_Kick_Count": [1],
    "Previous_NPT_Count": [8781],
    "Similar_Well_Risk_Count": [8],
})

print("=" * 50)
print("TEST 1: PREDICTION (WITHOUT LEAKED LABELS)")
print("=" * 50)
try:
    result = predict_risk(test_data)
    print("[OK] Prediction successful")
    print(result)
except Exception as e:
    print(f"[FAIL] Prediction failed: {e}")

print("\n" + "=" * 50)
print("TEST 2: SHAP EXPLANATION")
print("=" * 50)
try:
    explanation = explain_prediction(test_data)
    print("[OK] Explanation successful")
    for target, top_features in explanation.items():
        print(f"\n{target}:")
        print(top_features)
except Exception as e:
    print(f"[FAIL] Explanation failed: {e}")

print("\n" + "=" * 50)
print("TEST 3: GRACEFUL IMPUTATION (EMPTY/MISSING COLUMNS)")
print("=" * 50)
incomplete_data = test_data.drop(columns=["Depth_MD", "ROP", "Torque"])
try:
    result_imputed = predict_risk(incomplete_data)
    print("[OK] Graceful fallback imputation succeeded without crash:")
    print(result_imputed)
except Exception as e:
    print(f"[FAIL] Imputation failed: {e}")