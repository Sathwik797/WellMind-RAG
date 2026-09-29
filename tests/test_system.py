"""
Automated Test Suite for eRTMAC-NWIS (SIH26121)
Covers ML prediction, leakage prevention, continuous learning safeguards,
RAG retrieval, event formatting, and simulator constraints.
"""
import os
import sys
import unittest
import pandas as pd
import joblib

# Add service roots to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_DIR = os.path.join(BASE_DIR, "ml-service")
WELLMIND_DIR = os.path.join(BASE_DIR, "wellMind")

if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)
if WELLMIND_DIR not in sys.path:
    sys.path.insert(0, WELLMIND_DIR)


class TestMLPipeline(unittest.TestCase):
    def setUp(self):
        from prediction import predict_risk, explain_prediction
        self.predict_risk = predict_risk
        self.explain_prediction = explain_prediction
        self.feature_cols = joblib.load(os.path.join(ML_DIR, "feature_columns.pkl"))
        self.models = joblib.load(os.path.join(ML_DIR, "drilling_risk_models.pkl"))

    def test_feature_columns_leak_free(self):
        """Verify Kick_Label and Fishing_Label are NOT in trained model feature columns."""
        self.assertNotIn("Kick_Label", self.feature_cols, "Data Leakage: Kick_Label in feature columns!")
        self.assertNotIn("Fishing_Label", self.feature_cols, "Data Leakage: Fishing_Label in feature columns!")
        self.assertNotIn("Mud_Loss_Label", self.feature_cols, "Target in feature columns!")

    def test_prediction_output_structure_and_probabilities(self):
        """Verify valid input produces probabilities between 0 and 1 without requiring leaked labels."""
        input_data = pd.DataFrame([{
            "Well_ID": "W001",
            "Depth_MD": 2450.0,
            "Depth_TVD": 2410.0,
            "Formation": "Shale_A",
            "ROP": 18.5,
            "WOB": 28.0,
            "RPM": 115.0,
            "Torque": 240.0,
            "Standpipe_Pressure": 1480.0,
            "Flow_Rate": 680.0,
            "Mud_Weight": 1.42,
            "Plastic_Viscosity": 21.0,
            "Yield_Point": 8.5,
            "Hook_Load": 175.0,
            "Inclination": 1.2,
            "Bit_Type": "PDC_8.5",
            "Reservoir_Pressure": 2450.0,
            "Formation_Pore_Pressure": 2450.0,
            "Distance_To_Nearest_Offset_m": 4800.0,
            "Historical_Event_Count": 0,
            "Previous_Mud_Loss_Count": 0,
            "Previous_Stuck_Pipe_Count": 0,
            "Previous_Kick_Count": 0,
            "Previous_NPT_Count": 0,
            "Similar_Well_Risk_Count": 0,
            # Note: Kick_Label and Fishing_Label are omitted completely
        }])

        results = self.predict_risk(input_data)
        expected_targets = [
            "Mud_Loss_Label",
            "Stuck_Pipe_Label",
            "Overpressure_Label",
            "Torque_Spike_Label",
            "Cementing_Issue_Label"
        ]

        for target in expected_targets:
            self.assertIn(target, results, f"Missing target {target} in predictions")
            prob = results[target]["probability"]
            pred = results[target]["prediction"]
            self.assertGreaterEqual(prob, 0.0, f"Probability for {target} < 0")
            self.assertLessEqual(prob, 1.0, f"Probability for {target} > 1")
            self.assertIn(pred, [0, 1], f"Binary prediction for {target} not in {0, 1}")

    def test_missing_data_resilience(self):
        """Verify partial inputs with missing columns are handled safely via reference schema."""
        minimal_input = pd.DataFrame([{
            "Depth_MD": 2100.0,
            "Mud_Weight": 1.35
        }])
        results = self.predict_risk(minimal_input)
        self.assertIn("Mud_Loss_Label", results)
        self.assertGreaterEqual(results["Mud_Loss_Label"]["probability"], 0.0)

    def test_shap_explanations(self):
        """Verify SHAP explainers generate valid feature contributions without error."""
        input_data = pd.DataFrame([{
            "Depth_MD": 2200.0,
            "Mud_Weight": 1.45,
            "ROP": 22.0,
            "WOB": 32.0,
            "Torque": 260.0
        }])
        explanations = self.explain_prediction(input_data)
        self.assertIn("Mud_Loss_Label", explanations)
        df_exp = explanations["Mud_Loss_Label"]
        self.assertFalse(df_exp.empty)
        self.assertIn("feature", df_exp.columns)
        self.assertIn("shap_value", df_exp.columns)


class TestContinuousLearningSafeguards(unittest.TestCase):
    def test_scenario_submissions_not_used_as_ground_truth(self):
        """Verify continuous learning does NOT consume ScenarioSubmission as ground truth."""
        import continuous_learning
        self.assertEqual(
            continuous_learning.COLLECTION_NAME,
            "verifiedincidents",
            "Continuous learning must point to verifiedincidents, NOT scenariosubmissions!"
        )
        self.assertIn("Kick_Label", continuous_learning.NON_FEATURE_COLUMNS)
        self.assertIn("Fishing_Label", continuous_learning.NON_FEATURE_COLUMNS)


class TestWellMindRAG(unittest.TestCase):
    def test_knowledge_retrieval(self):
        """Verify RAG retrieval pulls relevant documents from knowledge repository."""
        from rag.retrieve import retrieve
        results = retrieve("What is the mitigation for mud loss?", top_k=3)
        self.assertGreater(len(results), 0, "No chunks retrieved from knowledge repository")
        for chunk in results:
            self.assertIn("source", chunk)
            self.assertIn("page", chunk)
            self.assertIn("text", chunk)
            self.assertTrue(len(chunk["text"]) > 10)

    def test_answer_generation_structure(self):
        """Verify generate_answer returns structured response with sources."""
        from rag.generate_answer import generate_answer
        response = generate_answer("mud loss")
        self.assertIn("answer", response)
        self.assertIn("sources", response)
        self.assertIsInstance(response["sources"], list)


if __name__ == "__main__":
    unittest.main(verbosity=2)
