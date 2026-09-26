from pydantic import BaseModel
from datetime import date
from typing import Optional

class HealthCheckData(BaseModel):
    status: str
    version: str
    environment: str

class RawObservationBundle(BaseModel):
    date: date
    sleep_duration: Optional[float] = None
    sleep_quality: Optional[int] = None
    workload: Optional[int] = None
    energy: Optional[int] = None
    recovery: Optional[int] = None
    optional_note: Optional[str] = None

class SimScenario(BaseModel):
    sleep_duration: Optional[float] = None
    workload: Optional[int] = None
    night_shift_frequency: Optional[int] = None
    recovery_time: Optional[float] = None
    duty_duration: Optional[float] = None
    rest_interval: Optional[float] = None
    training_load: Optional[int] = None

class AnalysisResult(BaseModel):
    state: str
    metric: str
    value: float
    unit: str
    explanation: dict
