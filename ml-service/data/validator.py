"""
data/validator.py
Schema validation + missing-data metadata.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ValidationError

class RawObservation(BaseModel):
    person_id: str
    timestamp: datetime
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    workload_score: Optional[float] = Field(None, ge=0, le=100)
    duty_hours: Optional[float] = Field(None, ge=0, le=24)
    resting_heart_rate: Optional[float] = Field(None, ge=30, le=200)
    hrv_ms: Optional[float] = Field(None, ge=0, le=250)
    reaction_time_ms: Optional[float] = Field(None, ge=100, le=2000)
    is_night_shift: Optional[bool] = False

class ValidationResult(BaseModel):
    is_valid: bool
    data: Optional[RawObservation] = None
    missing_fields: List[str] = []
    errors: List[str] = []
    metadata: Dict[str, Any] = {}

def validate_observation(raw_data: dict) -> ValidationResult:
    """Validates raw observation data and tags missing fields."""
    missing_fields = []
    errors = []
    valid_data = None
    
    try:
        valid_data = RawObservation(**raw_data)
        # Check for missing optional fields
        for field in valid_data.model_fields.keys():
            if getattr(valid_data, field) is None:
                missing_fields.append(field)
    except ValidationError as e:
        for err in e.errors():
            loc = ".".join([str(loc) for loc in err["loc"]])
            errors.append(f"{loc}: {err['msg']}")
            
    return ValidationResult(
        is_valid=len(errors) == 0,
        data=valid_data if len(errors) == 0 else None,
        missing_fields=missing_fields,
        errors=errors,
        metadata={
            "imputation_needed": len(missing_fields) > 0,
            "validated_at": datetime.utcnow().isoformat()
        }
    )
