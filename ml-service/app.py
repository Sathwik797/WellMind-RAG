from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd
from prediction import predict_risk, explain_prediction
from early_warning import generate_early_warning
from continuous_learning import continuous_learning
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NWIS ML Service", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DrillingData(BaseModel):
    Well_ID: str = "W001"
    Timestamp: str = ""
    Depth_MD: float = 2000.0
    Depth_TVD: float = 1980.0
    Formation: str = "Alluvium_Top"
    ROP: float = 20.0
    WOB: float = 30.0
    RPM: float = 110.0
    Torque: float = 250.0
    Standpipe_Pressure: float = 1500.0
    Flow_Rate: float = 700.0
    Mud_Weight: float = 1.42
    Plastic_Viscosity: float = 20.0
    Yield_Point: float = 8.0
    Hook_Load: float = 180.0
    Inclination: float = 1.5
    Bit_Type: str = "PDC_8.5"
    Reservoir_Pressure: float = 2500.0
    Formation_Pore_Pressure: float = 2500.0
    Distance_To_Nearest_Offset_m: float = 5000.0
    Historical_Event_Count: int = 0
    Previous_Mud_Loss_Count: int = 0
    Previous_Stuck_Pipe_Count: int = 0
    Previous_Kick_Count: int = 0
    Previous_NPT_Count: int = 0
    Similar_Well_Risk_Count: int = 0
    # Optional legacy flags - never used for training or prediction
    Kick_Label: Optional[int] = 0
    Fishing_Label: Optional[int] = 0

class HistoricalQuestion(BaseModel):
    question: str
    well_ids: list[str] = []

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ml-service",
        "models": "drilling_risk_models"
    }

@app.post("/predict")
def make_prediction(data: DrillingData):
    df = pd.DataFrame([data.dict()])
    result = predict_risk(df)
    return result

@app.post("/explain")
def explain(data: DrillingData):
    df = pd.DataFrame([data.dict()])
    explanations = explain_prediction(df)
    
    result = {}
    for target, df_explain in explanations.items():
        result[target] = df_explain.to_dict(orient="records")
    
    return result

@app.post("/realtime-warning")
def realtime_warning(data: DrillingData):
    df = pd.DataFrame([data.dict()])
    risk_result = predict_risk(df)

    warning = generate_early_warning(
        mud_loss_risk=risk_result["Mud_Loss_Label"]["probability"] * 100,
        stuck_pipe_risk=risk_result["Stuck_Pipe_Label"]["probability"] * 100,
        overpressure_risk=risk_result["Overpressure_Label"]["probability"] * 100,
        torque_spike_risk=risk_result["Torque_Spike_Label"]["probability"] * 100,
        cementing_issue_risk=risk_result["Cementing_Issue_Label"]["probability"] * 100,
        drilling_data=data.dict()
    )

    return {
        "depth": data.Depth_MD,
        "risks": risk_result,
        "early_warning": warning,
        "recommendation": warning["recommendation"]
    }

@app.post("/continuous-learning")
def run_continuous_learning():
    try:
        result = continuous_learning()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Continuous learning failed: {str(e)}")

@app.get("/continuous-learning/status")
def continuous_learning_status():
    return {
        "service": "NWIS Continuous Learning Engine",
        "status": "ready",
        "endpoint": "POST /continuous-learning"
    }