from fastapi import APIRouter
from datetime import datetime
from pydantic import BaseModel
from ..envelope import create_success_response, ResponseMeta, APIResponse

router = APIRouter()

class UnitSimScenario(BaseModel):
    sleep_duration: float
    workload: int

@router.post("/{unit_id}/analyze", response_model=APIResponse)
async def analyze_unit(unit_id: str):
    meta = ResponseMeta(model_version="v1", generated_at=datetime.utcnow().isoformat(), data_quality="good")
    return create_success_response({"unit_id": unit_id, "wellness_weather": "STABLE"}, meta)

@router.get("/{unit_id}/trends", response_model=APIResponse)
async def get_unit_trends(unit_id: str):
    meta = ResponseMeta(model_version="v1", generated_at=datetime.utcnow().isoformat(), data_quality="good")
    return create_success_response({"unit_id": unit_id, "trends": []}, meta)

@router.post("/{unit_id}/simulate", response_model=APIResponse)
async def simulate_unit(unit_id: str, scenario: UnitSimScenario):
    meta = ResponseMeta(model_version="v1", generated_at=datetime.utcnow().isoformat(), data_quality="good")
    return create_success_response({
        "unit_id": unit_id, 
        "simulation_disclaimer": "This is a model simulation, not a guaranteed prediction."
    }, meta)
