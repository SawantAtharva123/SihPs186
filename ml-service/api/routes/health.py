from fastapi import APIRouter
from datetime import datetime
from ..envelope import create_success_response, ResponseMeta, APIResponse
from ..schemas import HealthCheckData
from ...config.settings import settings

router = APIRouter()

@router.get("/health", response_model=APIResponse[HealthCheckData])
async def health_check():
    meta = ResponseMeta(
        model_version="system-v1.0",
        generated_at=datetime.utcnow().isoformat() + "Z",
        data_quality="N/A"
    )
    data = HealthCheckData(
        status="ok",
        version="1.0.0",
        environment=settings.environment
    )
    return create_success_response(data=data, meta=meta)
