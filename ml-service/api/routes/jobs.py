from fastapi import APIRouter
from datetime import datetime
from pydantic import BaseModel
from typing import List, Dict, Any
from ..envelope import create_success_response, ResponseMeta, APIResponse
from ...pipelines.job_manager import MLJobManager

router = APIRouter()
job_manager = MLJobManager()

class MLJobRequest(BaseModel):
    person_id: str
    trigger_type: str
    events: List[Dict[str, Any]]

@router.post("", response_model=APIResponse)
async def create_job(request: MLJobRequest):
    job_id = job_manager.create_job(request.person_id, request.trigger_type, request.events)
    
    meta = ResponseMeta(model_version="v1", generated_at=datetime.utcnow().isoformat(), data_quality="N/A")
    return create_success_response({
        "job_id": job_id,
        "status": "PENDING"
    }, meta)
