"""
features/definitions.py
Canonical feature definitions (sleep, workload, duty, recovery, activity).
"""
from enum import Enum
from pydantic import BaseModel
from typing import Optional, List

class FeatureType(str, Enum):
    NUMERIC = "numeric"
    CATEGORICAL = "categorical"
    BOOLEAN = "boolean"

class FeatureDefinition(BaseModel):
    name: str
    type: FeatureType
    description: str
    unit: Optional[str] = None
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    is_imputable: bool = True

DEFINITIONS = [
    FeatureDefinition(
        name="sleep_duration_24h",
        type=FeatureType.NUMERIC,
        description="Total sleep duration in the last 24 hours",
        unit="hours",
        min_val=0.0,
        max_val=24.0
    ),
    FeatureDefinition(
        name="workload_intensity",
        type=FeatureType.NUMERIC,
        description="Subjective or objective workload intensity score",
        unit="score",
        min_val=0.0,
        max_val=100.0
    ),
    FeatureDefinition(
        name="duty_duration_24h",
        type=FeatureType.NUMERIC,
        description="Total duty duration in the last 24 hours",
        unit="hours",
        min_val=0.0,
        max_val=24.0
    ),
    FeatureDefinition(
        name="recovery_score",
        type=FeatureType.NUMERIC,
        description="Composite physiological recovery score (e.g., from HRV/RHR)",
        unit="score",
        min_val=0.0,
        max_val=100.0
    ),
    FeatureDefinition(
        name="night_shift_exposure",
        type=FeatureType.BOOLEAN,
        description="Whether the person worked a night shift in the last 24h",
        is_imputable=False
    ),
    FeatureDefinition(
        name="consecutive_duty_days",
        type=FeatureType.NUMERIC,
        description="Number of consecutive days on duty",
        unit="days",
        min_val=0.0,
        is_imputable=False
    )
]

def get_definition(name: str) -> Optional[FeatureDefinition]:
    for df in DEFINITIONS:
        if df.name == name:
            return df
    return None
