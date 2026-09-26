from typing import TypeVar, Generic, Optional, Any, List
from pydantic import BaseModel
from datetime import datetime

T = TypeVar("T")

class ResponseMeta(BaseModel):
    model_version: str
    generated_at: str
    data_quality: str
    confidence: Optional[float] = None
    baseline_maturity: Optional[str] = None

class ErrorDetail(BaseModel):
    code: str
    message: str

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    meta: Optional[ResponseMeta] = None
    warnings: List[str] = []
    error: Optional[ErrorDetail] = None

def create_success_response(data: T, meta: ResponseMeta, warnings: List[str] = None) -> APIResponse[T]:
    if warnings is None:
        warnings = []
    return APIResponse(
        success=True,
        data=data,
        meta=meta,
        warnings=warnings
    )

def create_error_response(code: str, message: str) -> APIResponse[None]:
    return APIResponse(
        success=False,
        error=ErrorDetail(code=code, message=message)
    )
