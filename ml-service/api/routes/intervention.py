from fastapi import APIRouter
from datetime import datetime
from pydantic import BaseModel
from ..envelope import create_success_response, ResponseMeta, APIResponse

router = APIRouter()

class InterventionScenario(BaseModel):
    person_id: str
    intervention_type: str

@router.post("/simulate", response_model=APIResponse)
async def simulate_intervention(scenario: InterventionScenario):
    meta = ResponseMeta(model_version="v1", generated_at=datetime.utcnow().isoformat(), data_quality="good")
    return create_success_response({
        "person_id": scenario.person_id,
        "scenario": [],
        "simulation_disclaimer": "Model simulation — not a guaranteed outcome."
    }, meta)
