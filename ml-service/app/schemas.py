"""Pydantic schemas for the SAHAYAK ML API (MASTER §78)."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class SeriesPoint(BaseModel):
    date: str
    value: Optional[float] = None


class BaselineRequest(BaseModel):
    person_id: str = "anonymous"
    metric: str
    series: list[SeriesPoint]
    window: int = 14


class DeviationRequest(BaseModel):
    person_id: str = "anonymous"
    metric: str = "composite"
    series: list[SeriesPoint]


class DayInputs(BaseModel):
    date: str
    sleep_hours: Optional[float] = None
    rest_hours: Optional[float] = None
    workload: Optional[float] = None
    duty_hours: Optional[float] = None


class RecoveryRequest(BaseModel):
    person_id: str = "anonymous"
    baselines: dict[str, Optional[float]] = Field(default_factory=dict)
    days: list[DayInputs]
    deviations: list[float] = Field(default_factory=list)


class DutyRecord(BaseModel):
    date: str
    shift_type: str = "day"
    start_hour: Optional[float] = None
    duration_hours: Optional[float] = None
    rest_before_hours: Optional[float] = None


class VolatilityRequest(BaseModel):
    person_id: str = "anonymous"
    duty_records: list[DutyRecord]


class AgreementRequest(BaseModel):
    person_id: str = "anonymous"
    signals: dict[str, Optional[str]] = Field(default_factory=dict)


class StressorDay(BaseModel):
    date: Optional[str] = None
    night_shift: float = 0.0
    sleep_deficit: float = 0.0
    workload_excess: float = 0.0
    recovery_gap: float = 0.0


class StressorRequest(BaseModel):
    person_id: str = "anonymous"
    days: list[StressorDay]


class ExplainRequest(BaseModel):
    person_id: str = "anonymous"
    night_shift_change: Optional[float] = None
    sleep_change: Optional[float] = None
    rest_change: Optional[float] = None
    workload_change: Optional[float] = None
    recovery_change: Optional[float] = None
    days: list[StressorDay] = Field(default_factory=list)
    missing_signals: int = 0
    sample_count: int = 0


class SimParams(BaseModel):
    sleep_hours: Optional[float] = None
    workload: Optional[float] = None
    night_shifts_per_week: Optional[float] = None
    recovery_time_hours: Optional[float] = None
    duty_hours: Optional[float] = None
    rest_hours: Optional[float] = None


class PersonSimRequest(BaseModel):
    person_id: str = "anonymous"
    current: SimParams = Field(default_factory=SimParams)
    scenario: SimParams = Field(default_factory=SimParams)


class UnitScenario(BaseModel):
    id: str
    label: str
    params: SimParams = Field(default_factory=SimParams)


class UnitSimRequest(BaseModel):
    unit_id: str = "anonymous"
    current: SimParams = Field(default_factory=SimParams)
    scenarios: list[UnitScenario] = Field(default_factory=list)


class InterventionRequest(BaseModel):
    case_id: str = "anonymous"
    before_scores: list[float] = Field(default_factory=list)
    after_scores: list[float] = Field(default_factory=list)


class RecommendRequest(BaseModel):
    subject_id: str = "anonymous"
    bundle: dict[str, Any] = Field(default_factory=dict)
