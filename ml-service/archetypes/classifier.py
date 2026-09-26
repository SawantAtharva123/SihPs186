"""Stress Archetype Classifier (idea.md §16).

Discovers response patterns from longitudinal data without assigning
permanent labels such as 'resilient' or 'weak'.
"""
from __future__ import annotations

from typing import Any, Optional


ARCHETYPE_DESCRIPTIONS = {
    "fast_recoverer": {
        "title": "Fast Recoverer",
        "description": "Displays acute short-term response to workload surges, followed by rapid return toward personal baseline.",
        "recommended_focus": "Preserve dedicated rest windows post-deployment to capitalize on natural recovery kinetics.",
        "badge_color": "#10B981",
    },
    "slow_accumulator": {
        "title": "Slow Accumulator",
        "description": "Exhibits subtle daily deviations with steady, compounding cumulative load over extended multi-week cycles.",
        "recommended_focus": "Early workload rotation and mandatory scheduled rest days before cumulative exhaustion peaks.",
        "badge_color": "#F59E0B",
    },
    "acute_responder": {
        "title": "Acute Responder",
        "description": "Maintains steady physiological and cognitive stability until specific high-intensity events trigger elevated deviation.",
        "recommended_focus": "Targeted recovery intervention immediately following emergency, combat, or prolonged operations.",
        "badge_color": "#3B82F6",
    },
    "sleep_sensitive": {
        "title": "Sleep-Sensitive",
        "description": "Minor disruptions in sleep duration or sleep variability trigger disproportionate downstream cognitive and physiological deviation.",
        "recommended_focus": "Enforce sleep hygiene, mitigate split shifts, and minimize circadian disruption during night rotations.",
        "badge_color": "#8B5CF6",
    },
    "schedule_sensitive": {
        "title": "Schedule-Sensitive",
        "description": "Operational routine instability and frequent shift transitions (day/night flipping) strongly correlate with recovery debt.",
        "recommended_focus": "Standardize duty start times, reduce irregular shift swapping, and stabilize roster predictability.",
        "badge_color": "#EC4899",
    },
    "balanced": {
        "title": "Balanced Adapter",
        "description": "Longitudinal operating signals remain consistently aligned with expected personal baseline boundaries.",
        "recommended_focus": "Maintain current operational pacing and baseline wellness habits.",
        "badge_color": "#059669",
    }
}


def classify_archetype(
    days: list[dict[str, Any]],
    half_life_hours: Optional[float] = None,
    volatility_score: Optional[float] = None,
    baselines: Optional[dict[str, float]] = None,
) -> dict[str, Any]:
    """Classifies an individual's response pattern into a descriptive archetype."""
    if not days or len(days) < 5:
        arch_id = "balanced"
        meta = ARCHETYPE_DESCRIPTIONS[arch_id]
        return {
            "archetype_id": arch_id,
            "title": meta["title"],
            "description": meta["description"],
            "recommended_focus": meta["recommended_focus"],
            "badge_color": meta["badge_color"],
            "confidence": 0.4,
            "metrics": {"sample_days": len(days)},
        }

    sleeps = [d.get("sleep_hours", 7.0) for d in days if d.get("sleep_hours") is not None]
    workloads = [d.get("workload", 3.0) for d in days if d.get("workload") is not None]
    night_shifts = sum(1 for d in days if d.get("night_shift", 0) == 1 or d.get("shift_type") == "night")

    mean_sleep = sum(sleeps) / max(1, len(sleeps))
    sleep_deficits = [max(0.0, 7.2 - s) for s in sleeps]
    mean_deficit = sum(sleep_deficits) / max(1, len(sleep_deficits))

    # Check for sleep sensitivity
    if mean_deficit > 0.8 and mean_sleep < 6.0:
        arch_id = "sleep_sensitive"
    # Check for schedule sensitivity
    elif volatility_score and volatility_score > 0.55:
        arch_id = "schedule_sensitive"
    elif night_shifts >= len(days) * 0.35:
        arch_id = "schedule_sensitive"
    # Check for fast recoverer
    elif half_life_hours and half_life_hours < 16.0:
        arch_id = "fast_recoverer"
    # Check for slow accumulator
    elif len(workloads) >= 10 and workloads[-1] > workloads[0] + 0.8:
        arch_id = "slow_accumulator"
    # Check for acute responder
    elif max(workloads, default=3.0) - (sum(workloads) / max(1, len(workloads))) > 1.5:
        arch_id = "acute_responder"
    else:
        arch_id = "fast_recoverer" if (half_life_hours and half_life_hours < 24.0) else "balanced"

    meta = ARCHETYPE_DESCRIPTIONS[arch_id]
    return {
        "archetype_id": arch_id,
        "title": meta["title"],
        "description": meta["description"],
        "recommended_focus": meta["recommended_focus"],
        "badge_color": meta["badge_color"],
        "confidence": 0.78,
        "metrics": {
            "sample_days": len(days),
            "mean_sleep_hours": round(mean_sleep, 2),
            "night_shift_percentage": round((night_shifts / len(days)) * 100, 1),
            "half_life_hours": half_life_hours,
        },
    }
