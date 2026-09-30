import os
import sys
import unittest
import pandas as pd
import numpy as np
import joblib

class TestMLPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.script_dir = os.path.join(os.path.dirname(__file__), "..", "ml-service")
        cls.models = joblib.load(os.path.join(cls.script_dir, "drilling_risk_models.pkl"))
        cls.feature_columns = joblib.load(os.path.join(cls.script_dir, "feature_columns.pkl"))
        cls.categorical_columns = joblib.load(os.path.join(cls.script_dir, "categorical_columns.pkl"))
        cls.explainers = joblib.load(os.path.join(cls.script_dir, "shap_explainers.pkl"))

    def test_models_loaded(self):
        expected_targets = [
            "Mud_Loss_Label",
            "Stuck_Pipe_Label",
            "Overpressure_Label",
            "Torque_Spike_Label",
            "Cementing_Issue_Label"
        ]
        for target in expected_targets:
            self.assertIn(target, self.models, f"Missing model for target: {target}")

    def test_no_target_leakage(self):
        """CRITICAL: Kick_Label and Fishing_Label must NOT be in feature columns"""
        self.assertNotIn("Kick_Label", self.feature_columns, "Leakage detected: Kick_Label in features")
        self.assertNotIn("Fishing_Label", self.feature_columns, "Leakage detected: Fishing_Label in features")
        for target in self.models.keys():
            self.assertNotIn(target, self.feature_columns, f"Target {target} cannot be in feature columns")

    def test_feature_count(self):
        self.assertEqual(len(self.feature_columns), 32, "Feature column count should be 32")

    def test_prediction_output_schema(self):
        sys.path.insert(0, self.script_dir)
        from prediction import predict_risk, explain_prediction

        sample_record = {
            "Well_ID": "W001",
            "Timestamp": "2026-09-30 10:00:00",
            "Depth_MD": 2450.4,
            "Depth_TVD": 2210.8,
            "Formation": "Barail Sandstone",
            "ROP": 18.5,
            "WOB": 14.2,
            "RPM": 110.0,
            "Torque": 240.0,
            "Standpipe_Pressure": 1500.0,
            "Flow_Rate": 700.0,
            "Mud_Weight": 1.42,
            "Plastic_Viscosity": 20.0,
            "Yield_Point": 8.0,
            "Hook_Load": 180.0,
            "Inclination": 1.5,
            "Bit_Type": "PDC_8.5",
            "Reservoir_Pressure": 2500.0,
            "Formation_Pore_Pressure": 2500.0,
            "Distance_To_Nearest_Offset_m": 5000.0,
            "Historical_Event_Count": 1,
            "Previous_Mud_Loss_Count": 1,
            "Previous_Stuck_Pipe_Count": 0,
            "Previous_Kick_Count": 0,
            "Previous_NPT_Count": 0,
            "Similar_Well_Risk_Count": 1
        }
        df = pd.DataFrame([sample_record])
        predictions = predict_risk(df)

        for target in self.models.keys():
            self.assertIn(target, predictions)
            pred_item = predictions[target]
            self.assertIn("prediction", pred_item)
            self.assertIn("probability", pred_item)
            self.assertIn(pred_item["prediction"], [0, 1])
            self.assertTrue(0.0 <= pred_item["probability"] <= 1.0)

    def test_shap_explanations(self):
        sys.path.insert(0, self.script_dir)
        from prediction import explain_prediction

        sample_record = {
            "Well_ID": "W001",
            "Timestamp": "2026-09-30 10:00:00",
            "Depth_MD": 2450.4,
            "Depth_TVD": 2210.8,
            "Formation": "Barail Sandstone",
            "ROP": 18.5,
            "WOB": 14.2,
            "RPM": 110.0,
            "Torque": 240.0,
            "Standpipe_Pressure": 1500.0,
            "Flow_Rate": 700.0,
            "Mud_Weight": 1.42,
            "Plastic_Viscosity": 20.0,
            "Yield_Point": 8.0,
            "Hook_Load": 180.0,
            "Inclination": 1.5,
            "Bit_Type": "PDC_8.5",
            "Reservoir_Pressure": 2500.0,
            "Formation_Pore_Pressure": 2500.0,
            "Distance_To_Nearest_Offset_m": 5000.0,
            "Historical_Event_Count": 0,
            "Previous_Mud_Loss_Count": 0,
            "Previous_Stuck_Pipe_Count": 0,
            "Previous_Kick_Count": 0,
            "Previous_NPT_Count": 0,
            "Similar_Well_Risk_Count": 0
        }
        df = pd.DataFrame([sample_record])
        explanations = explain_prediction(df)

        for target in self.models.keys():
            self.assertIn(target, explanations)
            exp_df = explanations[target]
            self.assertTrue(len(exp_df) > 0)
            self.assertIn("feature", exp_df.columns)
            self.assertIn("shap_value", exp_df.columns)

if __name__ == "__main__":
    unittest.main()
