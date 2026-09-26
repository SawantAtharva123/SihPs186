"""Welfare recommendation engine (MASTER §45, §80).

Evidence-aware, non-diagnostic, non-punitive, human-reviewable.
Never automatically executes an intervention — the officer decides.
"""
from __future__ import annotations


def generate_recommendations(bundle: dict) -> list[dict]:
    """bundle: {
        night_shift_change?, sleep_change?, rest_change?, workload_change?,
        volatility_overall?, signal_result?, state?,
        consecutive_duties?, unit_volatility?
    }
    Returns: [{observed, potential, why, evidence, confidence}]
    """
    recs: list[dict] = []

    ns = bundle.get("night_shift_change")
    vol = (bundle.get("volatility_overall") or "").lower()
    if (ns is not None and ns > 0) or "volatility" in vol and "low" not in vol:
        recs.append({
            "observed": "Repeated night-to-day transitions."
            if (ns or 0) > 0 else "Elevated schedule volatility.",
            "potential": "Review shift sequence and recovery intervals.",
            "why": "Several related indicators show reduced recovery following "
                   "similar schedule patterns.",
            "evidence": "Observed pattern over the recent period",
            "confidence": "Moderate",
        })

    if (bundle.get("sleep_change") or 0) < -0.5:
        recs.append({
            "observed": "Sleep has been below the personal baseline.",
            "potential": "Consider protected sleep periods and consistent timing.",
            "why": "Recovery has repeatedly been lower on days following "
                   "reduced sleep.",
            "evidence": "Observed association in recent records",
            "confidence": "Moderate",
        })

    if (bundle.get("rest_change") or 0) < -1.0:
        recs.append({
            "observed": "Rest intervals between duties have shortened.",
            "potential": "Review duty spacing where operationally feasible.",
            "why": "Shorter rest intervals are associated with slower "
                   "return toward personal baseline.",
            "evidence": "Observed association in recent records",
            "confidence": "Low",
        })

    if (bundle.get("workload_change") or 0) > 0:
        recs.append({
            "observed": "Workload has been higher than usual.",
            "potential": "Consider temporary duty redistribution within the unit.",
            "why": "Elevated workload coincides with increased cumulative load "
                   "in the current period.",
            "evidence": "Observed pattern over the recent period",
            "confidence": "Moderate",
        })

    if bundle.get("signal_result") == "conflicting_signals":
        recs.append({
            "observed": "Different data sources currently show different patterns.",
            "potential": "Continue observation before drawing conclusions; a "
                         "voluntary check-in conversation may add context.",
            "why": "Conflicting signals reduce interpretability; additional "
                   "observation may be useful.",
            "evidence": "Signal agreement analysis",
            "confidence": "Low",
        })

    if not recs:
        recs.append({
            "observed": "No strong contributing pattern identified.",
            "potential": "Maintain routine monitoring and regular check-ins.",
            "why": "Available indicators remain close to personal baselines.",
            "evidence": "Current observation window",
            "confidence": "Low",
        })
    return recs[:4]
