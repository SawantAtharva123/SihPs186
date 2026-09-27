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
    MultiModalStressRequest, MedicalReportUploadRequest,
)
from stress_assessment.engine import assess_stress, get_model_bundle
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

router = APIRouter()


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
        observations_count=result["sample_count"],
    )
    result["baseline_confidence"] = conf
    warnings = []
    if result["sample_count"] < 14:
        warnings.append("Limited history — interpret with care.")
    return envelope(result, confidence=conf, warnings=warnings, engine="baseline")


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


@router.post("/stress/predict")
def stress_predict(req: MultiModalStressRequest) -> dict:
    """Multi-modal stress assessment across:
    1. Uploaded Doctor / Medical Reports
    2. Mini-Game Cognitive Reaction & Performance
    3. Self-Assessment Check-in (with explicit sleep hours)
    4. Operational Context
    
    Guarantees no undercounting via Asymmetric Bayes Risk minimization and strict safety floors.
    """
    doc_dict = req.doctor_reports.model_dump() if req.doctor_reports else None
    games_dict = req.mini_games.model_dump() if req.mini_games else None
    self_dict = req.self_assessment.model_dump() if req.self_assessment else None
    ops_dict = req.operational_context.model_dump() if req.operational_context else None

    result = assess_stress(
        person_id=req.person_id,
        doctor_reports=doc_dict,
        mini_games=games_dict,
        self_assessment=self_dict,
        operational_context=ops_dict
    )
    conf = result.get("confidence", 0.85)
    warnings = []
    if result.get("signal_agreement", {}).get("disagreement_detected"):
        warnings.append(result["signal_agreement"]["divergence_note"])
    if result.get("safety_guardrails", {}).get("safety_override_active"):
        for trig in result["safety_guardrails"]["safety_triggers"]:
            warnings.append(f"Safety bias applied: {trig}")
    return envelope(result, confidence=conf, warnings=warnings, engine="stress_assessment")


@router.post("/medical/report-analyze")
def medical_report_analyze(req: MedicalReportUploadRequest) -> dict:
    """Analyzes an uploaded doctor report using the local Qwen-0.5B clinical NLP engine."""
    from medical_llm.inference import get_clinical_analyzer
    analyzer = get_clinical_analyzer()
    analysis = analyzer.analyze(
        facility=req.facility or "Base Hospital",
        doctor_name=req.doctor_name or "Attending Medical Officer",
        consultation_type=req.consultation_type or "Routine",
        diagnosis=req.diagnosis or "",
        clinical_notes=req.clinical_notes or ""
    )

    stress_indicator = analysis["doctor_stress_indicator"]
    if analysis.get("fit_for_duty") and stress_indicator == "Normal":
        rest_days = analysis["recommended_rest_days"]
    elif analysis["recommended_rest_days"] > 0:
        rest_days = analysis["recommended_rest_days"]
    else:
        rest_days = req.recommended_rest_days
    fit_for_duty = analysis["fit_for_duty"]
    urgency = analysis["clinical_urgency"]

    result = {
        "person_id": req.person_id,
        "doctor_name": req.doctor_name,
        "facility": req.facility,
        "consultation_date": req.consultation_date,
        "consultation_type": req.consultation_type,
        "diagnosis": req.diagnosis,
        "clinical_notes": req.clinical_notes,
        "doctor_stress_indicator": stress_indicator,
        "recommended_rest_days": rest_days,
        "fit_for_duty": fit_for_duty,
        "clinical_urgency": urgency,
        "somatic_symptoms": analysis["somatic_symptoms"],
        "key_clinical_findings": analysis["key_clinical_findings"],
        "welfare_impact": analysis["welfare_recommendation"],
        "model_engine": analysis.get("model_engine", "Qwen-0.5B Local Clinical Model")
    }
    return envelope(result, confidence=analysis.get("confidence", 0.94), engine="qwen_clinical_llm")


@router.get("/stress/model-info")
def stress_model_info() -> dict:
    """Returns metadata and metrics for the multi-modal stress assessment model."""
    bundle = get_model_bundle()
    info = {
        "model_version": bundle.get("version", "2.0.0"),
        "metrics": bundle.get("metrics", {}),
        "modality_weights": bundle.get("modality_weights", {}),
        "asymmetric_cost_matrix": bundle.get("cost_matrix", []).tolist() if hasattr(bundle.get("cost_matrix"), "tolist") else bundle.get("cost_matrix"),
        "features_count": len(bundle.get("feature_columns", [])),
        "features": bundle.get("feature_columns", [])
    }
    return envelope(info, confidence=1.0, engine="stress_assessment")

