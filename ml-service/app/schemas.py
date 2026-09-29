"""Pydantic schemas for the SAHAYAK ML API (MASTER §78)."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


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
    model_config = ConfigDict(extra="allow")

    sleep_hours: Optional[float] = None
    workload: Optional[float] = None
    night_shifts_per_week: Optional[float] = None
    recovery_time_hours: Optional[float] = None
    duty_hours: Optional[float] = None
    rest_hours: Optional[float] = None
    intervention: Optional[str] = None
    duration_days: Optional[int] = None
    avg_sleep: Optional[float] = None
    debt: Optional[float] = None


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


class ArchetypeRequest(BaseModel):
    person_id: str = "anonymous"
    days: list[DayInputs] = Field(default_factory=list)
    half_life_hours: Optional[float] = None
    volatility_score: Optional[float] = None
    baselines: dict[str, Optional[float]] = Field(default_factory=dict)


class DoctorReportData(BaseModel):
    consultations_count: int = 0
    sick_leave_days: float = 0.0
    prior_counseling_sessions: int = 0
    disciplinary_incidents: int = 0
    absenteeism_rate_pct: float = 0.0
    doctor_stress_indicator: Optional[str] = "Normal"
    recommended_rest_days: float = 0.0
    fit_for_duty: bool = True
    clinical_notes: Optional[str] = None
    doctor_name: Optional[str] = None
    facility: Optional[str] = None
    consultation_date: Optional[str] = None


class MiniGameData(BaseModel):
    avg_reaction_time_ms: Optional[float] = 460.0
    reaction_time_std_ms: Optional[float] = 40.0
    accuracy: Optional[float] = 0.88
    missed_targets: Optional[float] = 1.0
    false_taps: Optional[float] = 1.0
    sessions_count: Optional[int] = 1
    recent_activity_types: Optional[list[str]] = None


class SelfAssessmentData(BaseModel):
    sleep_hours: float = 7.0  # Exact sleep duration in hours!
    sleep_quality_score: Optional[float] = None
    energy_level: Optional[float] = 6.5
    mood_level: Optional[float] = 6.5
    recovery_level: Optional[float] = 6.5
    self_reported_stress: Optional[str] = "Medium"
    workload_compared: Optional[str] = "Usual"
    wellness_survey_score: Optional[float] = 6.0
    peer_support_score: Optional[float] = 6.5
    financial_stress_level: Optional[str] = "Moderate"
    note: Optional[str] = None


class OperationalContextData(BaseModel):
    duty_hours_per_week: Optional[float] = 48.0
    night_shifts_per_month: Optional[float] = 6.0
    workload_index: Optional[float] = 0.5
    combat_exposure_incidents: Optional[float] = 0.0
    family_separation_months: Optional[float] = 4.0


class MultiModalStressRequest(BaseModel):
    person_id: str = "person-001"
    doctor_reports: Optional[DoctorReportData] = None
    mini_games: Optional[MiniGameData] = None
    self_assessment: Optional[SelfAssessmentData] = None
    operational_context: Optional[OperationalContextData] = None


class MedicalReportUploadRequest(BaseModel):
    person_id: str = "person-001"
    doctor_name: str
    facility: Optional[str] = "Base Hospital"
    consultation_date: str
    consultation_type: str = "Routine"
    diagnosis: Optional[str] = None
    clinical_notes: Optional[str] = None
    doctor_stress_indicator: str = "Normal"
    recommended_rest_days: int = 0
    fit_for_duty: bool = True
    file_name: Optional[str] = None

