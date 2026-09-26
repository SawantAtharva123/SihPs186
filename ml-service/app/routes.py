"""FastAPI routes — every response uses the §78 envelope:
{data, confidence, warnings, model_version, generated_at}
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from anomaly.deviation import analyze_deviation
from app.schemas import (
    AgreementRequest, BaselineRequest, DeviationRequest, ExplainRequest,
    InterventionRequest, PersonSimRequest, RecommendRequest, RecoveryRequest,
    StressorRequest, UnitSimRequest, VolatilityRequest,
)
from baseline.confidence import calculate_confidence
from baseline.robust_baseline import compute_baseline
from explainability.contributor_engine import build_contributor_timeline
from explainability.explanation_formatter import (
    format_contributors, uncertainty_message,
)
from models.registry import ENGINE_VERSIONS, MODEL_NAME, MODEL_VERSION, NON_DIAGNOSTIC_NOTE
from recovery.half_life import calculate_half_life
from recovery.recovery_debt import recovery_debt
from recovery.recovery_score import recovery_series, summarize_scores
from recovery.trajectory import classify_trajectory, intervention_recovery
from recommendations.welfare import generate_recommendations
from signal_agreement.agreement import analyze_agreement
from simulation.what_if import simulate_person, simulate_unit
from stressor_interaction.model import analyze_stressors
from volatility.routine_volatility import analyze_volatility

router = APIRouter(prefix="/api/v1")


def envelope(data: dict, confidence: float | None = None,
             warnings: list[str] | None = None, engine: str = "baseline") -> dict:
    return {
        "data": data,
        "confidence": confidence if confidence is not None else data.get("confidence"),
        "warnings": (warnings or []) + [NON_DIAGNOSTIC_NOTE],
        "model_version": f"{MODEL_NAME}/{MODEL_VERSION} (engine:{engine}@{ENGINE_VERSIONS.get(engine, MODEL_VERSION)})",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/baseline/calculate")
def baseline_calculate(req: BaselineRequest) -> dict:
    result = compute_baseline(req.metric, [p.model_dump() for p in req.series], window=req.window)
    conf = calculate_confidence(
        sample_count=result["sample_count"],
        first_date=result.get("first_date"),
        last_date=result.get("last_date"),
        expected_days=req.window * 2,
        mad=result.get("mad"),
        baseline=result.get("baseline"),
    )
    result["baseline_confidence"] = conf
    warnings = []
    if result["sample_count"] < 14:
        warnings.append("Limited history — interpret with care.")
    return envelope(result, confidence=conf["confidence"], warnings=warnings, engine="baseline")


@router.post("/deviation/analyze")
def deviation_analyze(req: DeviationRequest) -> dict:
    result = analyze_deviation([p.model_dump() for p in req.series], metric=req.metric)
    return envelope(result, engine="deviation")


@router.post("/recovery/analyze")
def recovery_analyze(req: RecoveryRequest) -> dict:
    days = [d.model_dump() for d in req.days]
    scores = recovery_series(days, req.baselines)
    values = [s["score"] for s in scores]
    summary = summarize_scores(values)
    debt = recovery_debt(scores)
    half = calculate_half_life(req.deviations)
    trajectory = classify_trajectory(values)
    data = {
        "summary": summary,
        "debt": debt,
        "trajectory": trajectory,
        "half_life": half,
        "scores": scores[-30:],
    }
    conf = min(1.0, len([v for v in values if v is not None]) / 21.0)
    return envelope(data, confidence=round(conf, 3), engine="recovery")


@router.post("/routine-volatility/analyze")
def volatility_analyze(req: VolatilityRequest) -> dict:
    records = []
    for r in req.duty_records:
        d = r.model_dump()
        d["duration_hours"] = d.pop("duration_hours", None)
        records.append(d)
    result = analyze_volatility(records)
    conf = min(1.0, len(records) / 30.0)
    return envelope(result, confidence=round(conf, 3), engine="volatility")


@router.post("/signal-agreement/analyze")
def agreement_analyze(req: AgreementRequest) -> dict:
    result = analyze_agreement(req.signals)
    return envelope(result, engine="signal_agreement")


@router.post("/stressor-interaction/analyze")
def stressor_analyze(req: StressorRequest) -> dict:
    days = [d.model_dump() for d in req.days]
    result = analyze_stressors(days)
    conf = min(1.0, len(days) / 30.0)
    return envelope(result, confidence=round(conf, 3), engine="stressor_interaction")


@router.post("/explain/person")
def explain_person(req: ExplainRequest) -> dict:
    stressor = analyze_stressors([d.model_dump() for d in req.days]) if req.days else {"contributors": []}
    timeline = build_contributor_timeline(
        night_shift_change=req.night_shift_change,
        sleep_change=req.sleep_change,
        rest_change=req.rest_change,
        workload_change=req.workload_change,
        recovery_change=req.recovery_change,
        stressor_contributors=stressor.get("contributors", []),
        confidence=None,
    )
    formatted = format_contributors(stressor.get("contributors", []), confidence=0.6)
    note = uncertainty_message(req.missing_signals, req.sample_count)
    data = {
        "timeline": timeline,
        "formatted": formatted,
        "uncertainty_note": note,
    }
    return envelope(data, warnings=[note] if note else [], engine="stressor_interaction")


@router.post("/simulate/person")
def simulate_person_endpoint(req: PersonSimRequest) -> dict:
    current = {k: v for k, v in req.current.model_dump().items() if v is not None}
    scenario = {k: v for k, v in req.scenario.model_dump().items() if v is not None}
    result = simulate_person(current, scenario)
    return envelope(result, warnings=[result["warning"]], engine="simulation")


@router.post("/simulate/unit")
def simulate_unit_endpoint(req: UnitSimRequest) -> dict:
    current = {k: v for k, v in req.current.model_dump().items() if v is not None}
    scenarios = [
        {"id": s.id, "label": s.label,
         "params": {k: v for k, v in s.params.model_dump().items() if v is not None}}
        for s in req.scenarios
    ]
    result = simulate_unit(current, scenarios)
    return envelope(result, warnings=[result["warning"]], engine="simulation")


@router.post("/intervention/analyze")
def intervention_analyze(req: InterventionRequest) -> dict:
    result = intervention_recovery(req.before_scores, req.after_scores)
    return envelope(result, engine="recovery")


@router.post("/recommendations/welfare")
def recommendations_welfare(req: RecommendRequest) -> dict:
    recs = generate_recommendations(req.bundle)
    return envelope({"recommendations": recs}, confidence=0.6, engine="recommendations")
