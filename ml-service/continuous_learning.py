from dotenv import load_dotenv
load_dotenv()
import os
import joblib
import shap
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import GroupKFold
from pymongo import MongoClient

script_dir = os.path.dirname(os.path.abspath(__file__))

CSV_PATH = os.path.join(script_dir, "datasets", "NWIS_drilling_data.csv")
MODEL_PATH = os.path.join(script_dir, "drilling_risk_models.pkl")
FEATURE_PATH = os.path.join(script_dir, "feature_columns.pkl")
DTYPE_PATH = os.path.join(script_dir, "reference_dtypes.pkl")
CATEGORICAL_PATH = os.path.join(script_dir, "categorical_columns.pkl")
SHAP_PATH = os.path.join(script_dir, "shap_explainers.pkl")
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nwis")
DB_NAME = os.getenv("DB_NAME", "nwis")
# PART 7 & 8 FIX: Continuous learning consumes only human-verified incidents, NOT What-If simulation outputs
COLLECTION_NAME = "verifiedincidents" 

MIN_NEW_RECORDS = 100

TARGET_COLUMNS = [
    "Mud_Loss_Label",
    "Stuck_Pipe_Label",
    "Overpressure_Label",
    "Torque_Spike_Label",
    "Cementing_Issue_Label"
]

NON_FEATURE_COLUMNS = [
    "Well_ID",
    "Risk_Severity",
    "Recommended_Action",
    "Kick_Label",
    "Fishing_Label",
    "verifiedBy",
    "verifiedAt",
    "usedForTraining",
    "actualOutcome",
    "description",
    "source",
    "eventType",
    "nptHours",
    "severity",
    "_id"
]


def prepare_data(df):
    df = df.copy()

    if "Timestamp" in df.columns:
        df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors="coerce")
        df["Hour"] = df["Timestamp"].dt.hour
        df["Day"] = df["Timestamp"].dt.day
        df["Month"] = df["Timestamp"].dt.month
        df = df.drop(columns=["Timestamp"])

    categorical_columns = df.select_dtypes(include=["object"]).columns.tolist()
    categorical_columns = [
        c for c in categorical_columns
        if c not in NON_FEATURE_COLUMNS and c not in TARGET_COLUMNS
    ]

    df = pd.get_dummies(df, columns=categorical_columns, drop_first=True)
    return df


def load_original_data():
    return pd.read_csv(CSV_PATH)

def create_original_split(df):
    df = prepare_data(df)

    groups = df["Well_ID"]
    X = df.drop(columns=TARGET_COLUMNS + NON_FEATURE_COLUMNS, errors="ignore")
    y = df[TARGET_COLUMNS]

    assert "Kick_Label" not in X.columns, "Critical Leakage: Kick_Label must not be in feature set"
    assert "Fishing_Label" not in X.columns, "Critical Leakage: Fishing_Label must not be in feature set"

    gkf = GroupKFold(n_splits=5)
    train_idx, test_idx = next(gkf.split(X, y, groups=groups))

    X_train = X.iloc[train_idx].copy()
    X_test = X.iloc[test_idx].copy()
    y_train = y.iloc[train_idx].copy()
    y_test = y.iloc[test_idx].copy()

    return X_train, X_test, y_train, y_test

def get_verified_data():
    """
    Fetches human-verified incidents that haven't been used for training yet.
    What-If Simulator submissions (ScenarioSubmission) are strictly rejected as ground truth.
    """
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        records = list(collection.find({"usedForTraining": False, "verified": True}, {"_id": 0}))
        client.close()

        if not records:
            return None

        df = pd.DataFrame(records)
        return df
    except Exception as e:
        print(f"Warning: Could not fetch verified incidents from MongoDB: {e}")
        return None

def mark_records_as_used():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        collection.update_many({"usedForTraining": False, "verified": True}, {"$set": {"usedForTraining": True}})
        client.close()
    except Exception as e:
        print(f"Warning: Could not mark records as used: {e}")

def prepare_verified_data(incident_df, original_columns):
    df = prepare_data(incident_df)

    X = df.drop(
        columns=TARGET_COLUMNS + NON_FEATURE_COLUMNS,
        errors="ignore"
    )

    y = df[TARGET_COLUMNS].copy()

    assert "Kick_Label" not in X.columns, "Critical Leakage: Kick_Label must not be in feature set"
    assert "Fishing_Label" not in X.columns, "Critical Leakage: Fishing_Label must not be in feature set"

    X = X.reindex(columns=original_columns, fill_value=0)
    X = X.apply(pd.to_numeric, errors="coerce").fillna(0)

    return X, y


def train_model(X, y):
    neg_count = (y == 0).sum()
    pos_count = (y == 1).sum()

    scale_pos_weight = 1 if pos_count == 0 else neg_count / pos_count

    model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss"
    )

    model.fit(X, y)
    return model


def train_candidate_models(X_train, y_train):
    models = {}

    for target in TARGET_COLUMNS:
        print(f"Training {target}")
        models[target] = train_model(
            X_train,
            y_train[target]
        )

    return models


def evaluate_models(models, X_test, y_test):
    scores = {}

    for target in TARGET_COLUMNS:
        predictions = models[target].predict(X_test)
        accuracy = (predictions == y_test[target]).mean()
        scores[target] = accuracy
        print(f"{target}: {accuracy:.4f}")

    average_accuracy = np.mean(list(scores.values()))

    print(f"Average accuracy: {average_accuracy:.4f}")

    return scores, average_accuracy


def save_new_model(models, feature_columns):
    joblib.dump(models, MODEL_PATH)
    joblib.dump(feature_columns, FEATURE_PATH)

    explainers = {}

    for target in TARGET_COLUMNS:
        explainers[target] = shap.TreeExplainer(models[target])

    joblib.dump(explainers, SHAP_PATH)

    print("New model and SHAP explainers saved.")


def continuous_learning():
    print("\nNWIS CONTINUOUS LEARNING ENGINE")

    try:
        original_df = load_original_data()
        verified_df = get_verified_data()

        if verified_df is None or len(verified_df) == 0:
            print("No verified incident data available for continuous learning.")
            return {
                "status": "no_data",
                "message": "No unused verified incident data available.",
                "updated": False
            }

        print(f"New verified incident records: {len(verified_df)}")

        if len(verified_df) < MIN_NEW_RECORDS:
            message = (
                f"Need at least {MIN_NEW_RECORDS} new verified records. "
                f"Currently available: {len(verified_df)}."
            )
            print(message)
            return {
                "status": "insufficient_data",
                "message": message,
                "updated": False,
                "new_records": len(verified_df)
            }

        (X_original_train,X_original_test,y_original_train,y_original_test) = create_original_split(original_df)
        original_features = X_original_train.columns.tolist()
        X_new, y_new = prepare_verified_data(
            verified_df,
            original_features
        )
        X_combined = pd.concat([X_original_train, X_new],ignore_index=True)
        y_combined = pd.concat([y_original_train, y_new],ignore_index=True)

        print(f"Original training records: {len(X_original_train)}")
        print(f"New simulator records: {len(X_new)}")
        print(f"Combined training records: {len(X_combined)}")
        current_models = joblib.load(MODEL_PATH)
        print("\nCurrent model:")
        current_scores, current_accuracy = evaluate_models(
            current_models,
            X_original_test,
            y_original_test
        )

        print("\nTraining candidate model...")
        candidate_models = train_candidate_models(X_combined,y_combined)
        print("\nCandidate model:")
        candidate_scores, candidate_accuracy = evaluate_models(candidate_models,X_original_test,y_original_test)

        print(f"\nCurrent accuracy:   {current_accuracy:.4f}")
        print(f"Candidate accuracy: {candidate_accuracy:.4f}")

        if candidate_accuracy >= current_accuracy:
            print("\nCandidate is better/equal. Updating model.")
            save_new_model(candidate_models,original_features)
            mark_records_as_used()
            print("Model successfully updated.")
            return {
                "status": "success",
                "message": "Candidate model was better/equal. Model updated.",
                "updated": True,
                "new_records": len(X_new),
                "current_accuracy": round(float(current_accuracy), 4),
                "candidate_accuracy": round(float(candidate_accuracy), 4),
                "current_scores": current_scores,
                "candidate_scores": candidate_scores
            }

        else:

            print("\nCandidate is worse.")
            print("Keeping the current model.")

            return {
                "status": "rejected",
                "message": "Candidate model was worse. Current model kept.",
                "updated": False,
                "new_records": len(X_new),
                "current_accuracy": round(float(current_accuracy), 4),
                "candidate_accuracy": round(float(candidate_accuracy), 4),
                "current_scores": current_scores,
                "candidate_scores": candidate_scores
            }

    except Exception as e:

        print(f"Continuous learning error: {str(e)}")

        return {
            "status": "error",
            "message": str(e),
            "updated": False
        }


if __name__ == "__main__":
    result = continuous_learning()
    print("\nFINAL RESULT:")
    print(result)