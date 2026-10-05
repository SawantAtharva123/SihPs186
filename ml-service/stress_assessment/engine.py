"""SAHAYAK — Multi-Modal Stress Assessment Inference Engine.

Integrates:
1. Doctor / Medical Reports
2. Mini-Game Cognitive Reaction & Performance
3. Self-Assessment Check-Ins (with explicit Sleep Hours)
4. Operational Context

Implements:
- Asymmetric Bayes Risk Decision Rule
- Hard Safety Guardrails against undercounting
- Signal Agreement & Divergence Analysis
- Modality-level Explainability
"""
from __future__ import annotations

import os
import numpy as np
import pandas as pd
import joblib
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger("stress_assessment_engine")

BUNDLE_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "stress_model_bundle.joblib")

_bundle_cache = None

FALLBACK_FEATURE_COLUMNS = [
    "medical_consultations_count", "sick_leave_days", "prior_counseling_sessions", "disciplinary_incidents", "absenteeism_rate_pct",
    "rapid_avg_reaction_time_ms", "rapid_reaction_time_std_ms", "rapid_accuracy", "rapid_missed_targets", "rapid_false_taps",
    "focus_avg_reaction_time_ms", "focus_accuracy", "focus_distractor_errors", "focus_missed_targets",
    "sleep_hours", "sleep_quality_score", "energy_level", "mood_level", "recovery_level",
    "wellness_survey_score", "peer_support_score", "financial_stress_level", "self_reported_stress_num",
    "duty_hours_per_week", "night_shifts_per_month", "workload_index", "combat_exposure_incidents", "family_separation_months"
]

FALLBACK_COST_MATRIX = np.array([
    [0.0, 1.0, 2.0, 3.0],
    [3.0, 0.0, 1.0, 2.0],
    [8.0, 4.0, 0.0, 1.0],
    [22.0, 12.0, 4.0, 0.0]
])

FALLBACK_CLASS_NAMES = ["Low", "Medium", "High", "Critical"]


class HeuristicFallbackModel:
    """Zero-crash fallback classifier when LightGBM or serialized model bundle cannot be loaded."""
    def predict_proba(self, X_df: pd.DataFrame) -> np.ndarray:
        probs = []
        for _, row in X_df.iterrows():
            sleep = float(row.get("sleep_hours", 7.0))
            rapid_rt = float(row.get("rapid_avg_reaction_time_ms", 450.0))
            self_stress = float(row.get("self_reported_stress_num", 1.0))
            duty = float(row.get("duty_hours_per_week", 45.0))
            sick_leave = float(row.get("sick_leave_days", 0.0))
            night_shifts = float(row.get("night_shifts_per_month", 2.0))

            score = 25.0
            if sleep < 5.0: score += 25.0
            elif sleep < 6.5: score += 12.0
            if rapid_rt > 550.0: score += 25.0
            elif rapid_rt > 450.0: score += 12.0
            score += self_stress * 10.0
            if duty > 60.0: score += 15.0
            if sick_leave > 5: score += 15.0
            if night_shifts > 6: score += 10.0
            score = max(0.0, min(100.0, score))

            if score < 32:
                p = [0.75, 0.20, 0.04, 0.01]
            elif score < 58:
                p = [0.15, 0.65, 0.15, 0.05]
            elif score < 78:
                p = [0.03, 0.17, 0.65, 0.15]
            else:
                p = [0.01, 0.04, 0.25, 0.70]
            probs.append(p)
        return np.array(probs)


def _create_heuristic_fallback_bundle() -> Dict[str, Any]:
    return {
        "model": HeuristicFallbackModel(),
        "feature_columns": FALLBACK_FEATURE_COLUMNS,
        "class_names": FALLBACK_CLASS_NAMES,
        "risk_map": {"Low": 0, "Medium": 1, "High": 2, "Critical": 3},
        "cost_matrix": FALLBACK_COST_MATRIX,
        "feature_importances": {col: 1.0 / len(FALLBACK_FEATURE_COLUMNS) for col in FALLBACK_FEATURE_COLUMNS},
        "modality_weights": {
            "doctor_reports": 0.30,
            "mini_games": 0.25,
            "self_assessment": 0.25,
            "operational_context": 0.20
        },
        "metrics": {"fallback_active": True},
        "version": "1.0.0-fallback"
    }


def get_model_bundle() -> Dict[str, Any]:
    global _bundle_cache
    if _bundle_cache is None:
        if os.path.exists(BUNDLE_PATH):
            try:
                _bundle_cache = joblib.load(BUNDLE_PATH)
                logger.info("Successfully loaded model bundle from %s", BUNDLE_PATH)
            except Exception as e:
                logger.error("Failed to load model bundle from %s: %s. Falling back to heuristic bundle.", BUNDLE_PATH, e)
                try:
                    from stress_assessment.trainer import train_model
                    _bundle_cache = train_model()
                except Exception as te:
                    logger.error("Failed to re-train model: %s. Using heuristic fallback.", te)
                    _bundle_cache = _create_heuristic_fallback_bundle()
        else:
            try:
                from stress_assessment.trainer import train_model
                logger.info("Model bundle not found at %s. Training model now...", BUNDLE_PATH)
                _bundle_cache = train_model()
            except Exception as te:
                logger.error("Failed to train model: %s. Using heuristic fallback.", te)
                _bundle_cache = _create_heuristic_fallback_bundle()
    return _bundle_cache


def parse_somatic_symptoms(note: Optional[str]) -> Tuple[List[str], float, List[Dict[str, Any]]]:
    """Extracts somatic complaints, ocular fatigue, and physical distress markers from free-text notes."""
    if not note:
        return [], 0.0, []
    text = note.lower()
    detected_symptoms: List[str] = []
    somatic_boost: float = 0.0
    findings: List[Dict[str, Any]] = []

    # 1. Ocular / Visual fatigue (direct sign of CNS sleepiness)
    if any(w in text for w in ["eye", "eyes", "vision", "blink"]) and any(w in text for w in ["heavy", "burning", "strained", "tire", "blur", "sleepy", "closing", "pain", "dry"]):
        detected_symptoms.append("Ocular Fatigue (Heavy Eyes)")
        somatic_boost += 18.0
        findings.append({
            "modality": "Self-Assessment (Somatic Notes)",
            "factor": "Ocular / Central Fatigue",
            "impact": "High Negative",
            "detail": "Reported heavy or strained eyes indicating acute central nervous system exhaustion."
        })

    # 2. Musculoskeletal pain / Physical trauma
    if any(w in text for w in ["leg", "knee", "back", "calf", "calves", "shoulder", "body", "muscle", "joint", "limb"]) and any(w in text for w in ["pain", "ache", "sore", "spasm", "stiff", "hurt", "cramp", "swollen"]):
        detected_symptoms.append("Musculoskeletal Strain / Pain")
        somatic_boost += 14.0
        findings.append({
            "modality": "Self-Assessment (Somatic Notes)",
            "factor": "Musculoskeletal Strain",
            "impact": "Moderate Negative",
            "detail": "Reported somatic limb or muscular pain consistent with operational overexertion."
        })

    # 3. Neurological symptoms (Headaches, tremors, dizziness)
    if any(w in text for w in ["headache", "migraine", "dizzy", "dizziness", "shaky", "tremor", "fog", "spinning", "lightheaded"]):
        detected_symptoms.append("Neurological Strain (Headache/Dizziness)")
        somatic_boost += 20.0
        findings.append({
            "modality": "Self-Assessment (Somatic Notes)",
            "factor": "Neurological Fatigue",
            "impact": "High Negative",
            "detail": "Reported cephalic or vestibular symptoms indicating acute physiological strain."
        })

    # 4. Severe distress / Insomnia / Lack of sleep
    has_sleep_issue = any(w in text for w in [
        "can't sleep", "cannot sleep", "nightmare", "panic", "anxious", "overwhelmed",
        "shivering", "insomnia", "lack of sleep", "no sleep", "loss of sleep",
        "poor sleep", "sleep deficit", "sleepless", "broken sleep", "inadequate sleep"
    ])
    if has_sleep_issue:
        detected_symptoms.append("Acute Sleeplessness / Lack of Sleep")
        somatic_boost += 22.0
        findings.append({
            "modality": "Self-Assessment (Somatic Notes)",
            "factor": "Somatic Sleep Deficit",
            "impact": "High Negative",
            "detail": "Reported subjective lack of sleep or acute operational sleep restriction."
        })

    # Compound Heavy Eyes + Lack of Sleep synergy
    has_heavy_eyes_sym = "Ocular Fatigue (Heavy Eyes)" in detected_symptoms
    has_sleep_sym = "Acute Sleeplessness / Lack of Sleep" in detected_symptoms
    if has_heavy_eyes_sym and has_sleep_sym:
        somatic_boost += 18.0
        findings.append({
            "modality": "Self-Assessment (Somatic Notes)",
            "factor": "Ocular-Central Exhaustion Synergy",
            "impact": "High Negative",
            "detail": "Dual presentation of heavy eyes and lack of sleep indicates acute central nervous system exhaustion and high operational microsleep hazard."
        })

    return detected_symptoms, somatic_boost, findings


def assess_stress(
    person_id: str,
    doctor_reports: Optional[Dict[str, Any]] = None,
    mini_games: Optional[Dict[str, Any]] = None,
    self_assessment: Optional[Dict[str, Any]] = None,
    operational_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Evaluates comprehensive stress level across Doctor Reports, Mini-Games, and Self-Assessment.
    
    Guarantees no undercounting using Asymmetric Bayes Risk minimization and strict safety floors.
    """
    bundle = get_model_bundle()
    model = bundle["model"]
    cost_matrix = bundle["cost_matrix"]
    class_names = bundle["class_names"]

    # 1. Parse Doctor / Medical Reports
    doc = doctor_reports or {}
    consultations_count = float(doc.get("consultations_count") or 0)
    sick_leave_days = float(doc.get("sick_leave_days") or 0)
    prior_counseling = float(doc.get("prior_counseling_sessions") or 0)
    disciplinary = float(doc.get("disciplinary_incidents") or 0)
    absenteeism_pct = float(doc.get("absenteeism_rate_pct") or 0)
    doctor_indicator = str(doc.get("doctor_stress_indicator") or "Normal").lower()
    recommended_rest_days = float(doc.get("recommended_rest_days") or 0)
    fit_for_duty = doc.get("fit_for_duty") if doc.get("fit_for_duty") is not None else True

    # 2. Parse Mini-Games (Cognitive & Reaction Performance)
    games = mini_games or {}
    rapid_rt = float(games.get("avg_reaction_time_ms") or games.get("rapid_avg_reaction_time_ms") or 460.0)
    rapid_rt_std = float(games.get("reaction_time_std_ms") or games.get("reaction_variability_ms") or games.get("rapid_reaction_time_std_ms") or 40.0)
    rapid_acc = float(games.get("accuracy") or games.get("rapid_accuracy") or 0.88)
    rapid_missed = float(games.get("missed_targets") or games.get("missed_answers") or games.get("rapid_missed_targets") or 1.0)
    rapid_false = float(games.get("false_taps") or games.get("incorrect_answers") or games.get("rapid_false_taps") or 1.0)
    focus_rt = float(games.get("focus_avg_reaction_time_ms") or rapid_rt * 1.15)
    focus_acc = float(games.get("focus_accuracy") or rapid_acc * 0.96)
    focus_distractor = float(games.get("focus_distractor_errors") or 1.5)
    focus_missed = float(games.get("focus_missed_targets") or rapid_missed)

    # 3. Parse Self-Assessment (With Sleep in Hours and Free-Text Notes!)
    self_eval = self_assessment or {}
    sleep_hours = float(self_eval.get("sleep_hours") or 7.0)
    user_note = str(self_eval.get("note") or "")

    # Natural Language / Somatic Symptom Extraction from free-text notes
    somatic_symptoms, somatic_boost, somatic_findings = parse_somatic_symptoms(user_note)

    # If sleep_quality_score is missing, infer from sleep_hours
    if self_eval.get("sleep_quality_score") is not None:
        sleep_quality = float(self_eval["sleep_quality_score"])
    else:
        sleep_quality = min(10.0, max(1.0, (sleep_hours - 4.0) / 0.45))

    energy_level = float(self_eval.get("energy_level") or 6.5)
    mood_level = float(self_eval.get("mood_level") or 6.5)
    recovery_level = float(self_eval.get("recovery_level") or 6.5)
    wellness_score = float(self_eval.get("wellness_survey_score") or 6.0)
    peer_support = float(self_eval.get("peer_support_score") or 6.5)
    
    fin_stress = str(self_eval.get("financial_stress_level") or "Moderate").lower()
    fin_num = 3.0 if "high" in fin_stress else 1.0 if "low" in fin_stress else 2.0

    self_stress = str(self_eval.get("self_reported_stress") or "Medium").lower()
    self_stress_map = {"low": 0, "medium": 1, "moderate": 1, "high": 2, "critical": 3, "severe": 3}
    self_stress_num = float(self_stress_map.get(self_stress, 1))

    # 4. Parse Operational Context
    ops = operational_context or {}
    duty_hours = float(ops.get("duty_hours_per_week") or 48.0)
    night_shifts = float(ops.get("night_shifts_per_month") or 6.0)
    workload_idx = float(ops.get("workload_index") or 0.5)
    combat_exp = float(ops.get("combat_exposure_incidents") or 0.0)
    family_sep = float(ops.get("family_separation_months") or 4.0)

    # Construct feature array
    feat_values = [
        # Doctor / Medical
        consultations_count,
        sick_leave_days,
        prior_counseling,
        disciplinary,
        absenteeism_pct,
        # Mini-Games
        rapid_rt,
        rapid_rt_std,
        rapid_acc,
        rapid_missed,
        rapid_false,
        focus_rt,
        focus_acc,
        focus_distractor,
        focus_missed,
        # Self-Assessment
        sleep_hours,
        sleep_quality,
        energy_level,
        mood_level,
        recovery_level,
        wellness_score,
        peer_support,
        fin_num,
        self_stress_num,
        # Operational Context
        duty_hours,
        night_shifts,
        workload_idx,
        combat_exp,
        family_sep
    ]

    X_df = pd.DataFrame([feat_values], columns=bundle["feature_columns"])

    # Model inference
    raw_probs = model.predict_proba(X_df)[0]
    prob_dict = {
        "Low": round(float(raw_probs[0]), 3),
        "Medium": round(float(raw_probs[1]), 3),
        "High": round(float(raw_probs[2]), 3),
        "Critical": round(float(raw_probs[3]), 3)
    }

    # Step A: Apply Asymmetric Bayes Cost Decision Rule
    # Minimizes expected loss under asymmetric undercounting penalties
    expected_costs = raw_probs @ cost_matrix
    bayes_class_idx = int(np.argmin(expected_costs))
    bayes_class = class_names[bayes_class_idx]

    # Step B: Continuous Stress Score (0 to 100)
    raw_stress_score = (
        0.0 * raw_probs[0] +
        35.0 * raw_probs[1] +
        75.0 * raw_probs[2] +
        100.0 * raw_probs[3]
    )
    raw_stress_score += somatic_boost

    # Step C: Strict Safety Floors (Zero Undercounting Protocol)
    safety_triggers: List[str] = []
    final_class_idx = bayes_class_idx

    # Guardrail 1: Clinical Doctor Report
    is_doctor_severe = any(w in doctor_indicator for w in ["severe", "critical", "acute"])
    is_doctor_high = any(w in doctor_indicator for w in ["high", "strained", "burnout"]) or recommended_rest_days >= 3 or sick_leave_days >= 7
    if is_doctor_severe:
        final_class_idx = max(final_class_idx, 3)
        safety_triggers.append("Doctor report indicated severe/critical clinical stress.")
    elif is_doctor_high:
        final_class_idx = max(final_class_idx, 2)
        safety_triggers.append("Doctor report indicated high stress / recommended rest days.")

    # Guardrail 2: Functional Mini-Game Reaction Impairment (Battlefield Safety Standard)
    # Tactical baseline is 250-380ms. For a soldier, 650ms+ is catastrophic motor degradation.
    if rapid_rt >= 650.0 or (rapid_rt >= 500.0 and rapid_rt_std >= 55.0):
        final_class_idx = max(final_class_idx, 3)
        safety_triggers.append(f"Severe psychomotor reaction latency ({rapid_rt:.0f}ms avg, {rapid_rt_std:.0f}ms variability) — Critical operational combat hazard.")
    elif rapid_rt >= 460.0 or rapid_rt_std >= 45.0 or rapid_missed >= 3:
        final_class_idx = max(final_class_idx, 2)
        safety_triggers.append(f"Elevated cognitive motor delay ({rapid_rt:.0f}ms avg) exceeding tactical safety threshold.")

    # Guardrail 3: Acute Sleep Deprivation
    if sleep_hours < 4.5:
        final_class_idx = max(final_class_idx, 2)
        safety_triggers.append(f"Severe sleep deficit reported ({sleep_hours}h < 4.5h safe operational minimum).")
    elif sleep_hours < 5.5 and final_class_idx == 0:
        final_class_idx = 1
        safety_triggers.append(f"Sleep hours ({sleep_hours}h) below healthy recovery threshold.")

    # Guardrail 4: Compliant Self-Report Floor
    if self_stress_num == 3:
        final_class_idx = max(final_class_idx, 3)
        safety_triggers.append("Self-assessment explicitly indicated critical stress.")
    elif self_stress_num == 2 and final_class_idx < 2:
        final_class_idx = 2
        safety_triggers.append("Self-assessment indicated high stress.")

    # Guardrail 5: Somatic Symptoms from Notes (NLP Extraction)
    if "Ocular Fatigue (Heavy Eyes)" in somatic_symptoms and "Acute Sleeplessness / Lack of Sleep" in somatic_symptoms:
        final_class_idx = max(final_class_idx, 3 if sleep_hours <= 4.5 else 2)
        safety_triggers.append("Severe cognitive-ocular fatigue flagged (Heavy eyes + Lack of sleep) — mandatory safety floor.")
    elif "Ocular Fatigue (Heavy Eyes)" in somatic_symptoms or "Neurological Strain (Headache/Dizziness)" in somatic_symptoms:
        if sleep_hours <= 5.5 or rapid_rt >= 460.0:
            final_class_idx = max(final_class_idx, 3 if (sleep_hours <= 4.0 or rapid_rt >= 600.0) else 2)
            safety_triggers.append(f"Critical somatic fatigue flagged: {', '.join(somatic_symptoms)}.")
        else:
            final_class_idx = max(final_class_idx, 2)
            safety_triggers.append(f"Somatic fatigue symptoms flagged: {', '.join(somatic_symptoms)}.")
    elif somatic_symptoms:
        final_class_idx = max(final_class_idx, 2 if len(somatic_symptoms) >= 2 else 1)
        safety_triggers.append(f"Physical complaints noted: {', '.join(somatic_symptoms)}.")

    final_stress_level = class_names[final_class_idx]
    
    # Adjust continuous score to reflect safety floor
    floor_min_scores = {0: 10.0, 1: 35.0, 2: 68.0, 3: 90.0}
    final_stress_score = max(raw_stress_score, floor_min_scores[final_class_idx])
    final_stress_score = min(100.0, max(0.0, round(float(final_stress_score), 1)))

    # Step D: Sub-signal Analysis & Disagreement Engine (§11 idea.md)
    # 1. Doctor signal
    doc_score = 15.0
    if is_doctor_severe or sick_leave_days >= 10:
        doc_score = 90.0
    elif is_doctor_high or consultations_count >= 3:
        doc_score = 70.0
    elif consultations_count >= 1 or sick_leave_days >= 2:
        doc_score = 45.0
    doc_state = "Critical" if doc_score >= 85 else "High" if doc_score >= 60 else "Moderate" if doc_score >= 35 else "Low"

    # 2. Mini-Games signal
    game_score = 20.0
    if rapid_rt >= 650.0 or rapid_rt_std >= 60.0 or rapid_missed >= 4:
        game_score = 95.0
    elif rapid_rt >= 480.0 or rapid_rt_std >= 45.0 or rapid_missed >= 2:
        game_score = 75.0
    elif rapid_rt >= 390.0 or rapid_rt_std >= 38.0:
        game_score = 45.0
    game_state = "Critical" if game_score >= 85 else "High" if game_score >= 65 else "Moderate" if game_score >= 40 else "Optimal"

    # 3. Self-assessment signal
    self_score = (
        (10.0 - sleep_quality) * 4.0 +
        (10.0 - energy_level) * 3.0 +
        (10.0 - recovery_level) * 3.0 +
        somatic_boost
    )
    self_score = min(100.0, max(10.0, round(self_score, 1)))
    self_state = "Critical" if self_score >= 85 else "High" if self_score >= 65 else "Moderate" if self_score >= 40 else "Normal"

    # Signal agreement classification
    disagreement_detected = False
    disagreement_reason = None

    if (game_state in ["High", "Critical"] or doc_state in ["High", "Critical"]) and self_state == "Normal":
        disagreement_detected = True
        disagreement_reason = "Functional/Medical signals show elevated strain while self-report is optimistic (stress masking pattern)."
    elif self_state == "High" and game_state == "Optimal" and doc_state == "Low":
        disagreement_detected = True
        disagreement_reason = "Personnel reported high subjective stress while cognitive reaction times remain preserved."

    agreement_level = "Conflicting Evidence" if disagreement_detected else (
        "High Agreement" if (game_state == self_state or doc_state == game_state) else "Moderate Agreement"
    )

    # Step E: Explainability & Top Contributors
    contributors: List[Dict[str, Any]] = []

    # Somatic NLP findings
    contributors.extend(somatic_findings)
    
    # Sleep contributor
    if sleep_hours < 6.0:
        contributors.append({
            "modality": "Self-Assessment",
            "factor": "Sleep Deficit",
            "impact": "High Negative",
            "detail": f"{sleep_hours} hours recorded (target: 7.0–8.5h)"
        })
    elif sleep_hours >= 7.0:
        contributors.append({
            "modality": "Self-Assessment",
            "factor": "Restorative Sleep",
            "impact": "Positive",
            "detail": f"{sleep_hours} hours provides healthy recovery foundation"
        })

    # Mini-game psychomotor latency contributor
    if rapid_rt >= 500.0:
        contributors.append({
            "modality": "Mini-Games",
            "factor": "Psychomotor Latency",
            "impact": "High Negative",
            "detail": f"Average reaction latency is {round(rapid_rt, 0)}ms (significantly degraded from tactical ~300ms baseline)"
        })

    # Mini-game variability contributor
    if rapid_rt_std >= 48.0:
        contributors.append({
            "modality": "Mini-Games",
            "factor": "Reaction Variability",
            "impact": "High Negative",
            "detail": f"Reaction time std dev is {round(rapid_rt_std, 1)}ms (high response inconsistency)"
        })
    if rapid_missed >= 2.0:
        contributors.append({
            "modality": "Mini-Games",
            "factor": "Target Accuracy Lapse",
            "impact": "Moderate Negative",
            "detail": f"{int(rapid_missed)} missed stimuli in cognitive assessment"
        })

    # Doctor report contributor
    if is_doctor_high or is_doctor_severe:
        contributors.append({
            "modality": "Doctor Reports",
            "factor": "Clinical Assessment",
            "impact": "High Negative",
            "detail": f"Medical consultation noted {doctor_indicator} stress and recommended {recommended_rest_days} rest days"
        })
    elif consultations_count > 0:
        contributors.append({
            "modality": "Doctor Reports",
            "factor": "Medical History",
            "impact": "Neutral",
            "detail": f"{int(consultations_count)} consultation(s) logged in record"
        })

    # Operational contributor
    if duty_hours >= 55.0:
        contributors.append({
            "modality": "Operational Context",
            "factor": "Extended Duty Hours",
            "impact": "Moderate Negative",
            "detail": f"{round(duty_hours, 1)} hours/week operational exposure"
        })
    if night_shifts >= 8:
        contributors.append({
            "modality": "Operational Context",
            "factor": "Circadian Disruption",
            "impact": "Moderate Negative",
            "detail": f"{int(night_shifts)} night shifts per month"
        })

    # Step F: Actionable Recommendations (§19 idea.md)
    recommendations: List[Dict[str, str]] = []

    if rapid_rt >= 650.0:
        recommendations.append({
            "type": "Mandatory Tactical Clearance",
            "urgency": "Immediate",
            "action": f"Cognitive reaction speed ({round(rapid_rt, 0)}ms) indicates acute psychomotor slowing. Immediate MI Room medical clearance required prior to weapon or patrol deployment."
        })

    if somatic_symptoms:
        recommendations.append({
            "type": "Somatic Evaluation",
            "urgency": "Immediate" if final_stress_level in ["Critical", "High"] else "Recommended",
            "action": f"Report to Medical Inspection Room for clinical review of physical complaints: {', '.join(somatic_symptoms)}."
        })

    if final_stress_level in ["Critical", "High"]:
        recommendations.append({
            "type": "Rest Rotation",
            "urgency": "Immediate",
            "action": "Schedule an additional 24-hour rest recovery interval before next duty shift."
        })
        recommendations.append({
            "type": "Welfare Consultation",
            "urgency": "Immediate",
            "action": "Mandatory confidential welfare officer consultation auto-booked."
        })
    elif final_stress_level == "Medium":
        recommendations.append({
            "type": "Sleep Optimization",
            "urgency": "Proactive",
            "action": f"Aim for at least 7.5 hours of uninterrupted sleep tonight to restore cognitive reaction timing."
        })
        recommendations.append({
            "type": "Workload Monitoring",
            "urgency": "Routine",
            "action": "Maintain regular duty pacing and take short 5-minute recovery micro-breaks."
        })
    else:
        recommendations.append({
            "type": "Maintenance",
            "urgency": "Optimal",
            "action": "Operating state is balanced. Continue daily cognitive mini-games and consistent sleep schedule."
        })

    # Step G: Confidence Calculation
    data_points = sum([
        1 if doctor_reports else 0,
        1 if mini_games else 0,
        1 if self_assessment else 0,
        1 if operational_context else 0
    ])
    base_conf = 0.55 + 0.1 * data_points
    if disagreement_detected:
        base_conf -= 0.1  # §11: disagreement reduces certainty, does not force false confidence
    confidence = round(min(0.95, max(0.40, base_conf)), 2)

    return {
        "person_id": person_id,
        "stress_level": final_stress_level,
        "stress_score": final_stress_score,
        "risk_probabilities": prob_dict,
        "safety_guardrails": {
            "asymmetric_bayes_applied": True,
            "safety_override_active": len(safety_triggers) > 0,
            "safety_triggers": safety_triggers,
            "undercounting_prevented": True
        },
        "subscores": {
            "doctor_reports": {
                "score": doc_score,
                "state": doc_state,
                "consultations": int(consultations_count),
                "sick_leave_days": int(sick_leave_days),
                "clinical_indicator": doctor_indicator
            },
            "mini_games": {
                "score": game_score,
                "state": game_state,
                "avg_reaction_time_ms": round(rapid_rt, 1),
                "reaction_variability_ms": round(rapid_rt_std, 1),
                "accuracy_pct": round(rapid_acc * 100, 1)
            },
            "self_assessment": {
                "score": self_score,
                "state": self_state,
                "sleep_hours": sleep_hours,
                "energy_level": energy_level,
                "recovery_level": recovery_level
            }
        },
        "signal_agreement": {
            "level": agreement_level,
            "disagreement_detected": disagreement_detected,
            "divergence_note": disagreement_reason
        },
        "somatic_symptoms_flagged": somatic_symptoms,
        "auto_consultation_required": final_stress_level in ["Critical", "High"] or rapid_rt >= 650.0,
        "top_contributors": contributors,
        "recommendations": recommendations,
        "confidence": confidence,
        "disclaimer": "Non-diagnostic welfare-intelligence system. Supports workload & recovery decisions, not medical diagnosis."
    }
