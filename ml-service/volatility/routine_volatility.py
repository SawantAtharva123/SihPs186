"""Routine volatility engine (MASTER §24, §75).

Interpretable components: shift transition rate, duty start/duration
variance, rest variance, day/night switching, sequence entropy.
"""
from __future__ import annotations

import math
from datetime import date, datetime

import numpy as np


def _cv(values: list[float]) -> float | None:
    """Coefficient of variation; None when not computable."""
    clean = [float(v) for v in values if v is not None]
    if len(clean) < 3:
        return None
    mean = float(np.mean(clean))
    if abs(mean) < 1e-9:
        return None
    return float(np.std(clean) / abs(mean))


def _entropy(labels: list[str]) -> float | None:
    """Shannon entropy of a categorical sequence, normalized 0..1."""
    if len(labels) < 2:
        return None
    counts: dict[str, int] = {}
    for lab in labels:
        counts[lab] = counts.get(lab, 0) + 1
    n = len(labels)
    ent = -sum((c / n) * math.log2(c / n) for c in counts.values())
    max_ent = math.log2(len(counts)) if len(counts) > 1 else 1.0
    return ent / max_ent if max_ent > 0 else 0.0


def _transitions(labels: list[str]) -> float | None:
    if len(labels) < 2:
        return None
    switches = sum(1 for a, b in zip(labels, labels[1:]) if a != b)
    return switches / (len(labels) - 1)


def analyze_volatility(duty_records: list[dict]) -> dict:
    """duty_records: [{date, shift_type(day|night|off|leave), start_hour,
    duration_hours, rest_before_hours}] sorted by date.
    """
    recs = sorted(duty_records, key=lambda r: r.get("date", ""))
    if len(recs) < 5:
        return {
            "overall": "Unknown",
            "score": None,
            "components": {},
            "message": "Not enough history yet. More observations are needed "
                       "before routine volatility can be interpreted reliably.",
        }

    shifts = [str(r.get("shift_type", "day")) for r in recs]
    starts = [r.get("start_hour") for r in recs if r.get("start_hour") is not None]
    durations = [r.get("duration_hours") for r in recs if r.get("duration_hours") is not None]
    rests = [r.get("rest_before_hours") for r in recs if r.get("rest_before_hours") is not None]

    daynight = ["night" if s == "night" else "day" if s == "day" else "other" for s in shifts]
    dn_switches = sum(
        1 for a, b in zip(daynight, daynight[1:])
        if {a, b} == {"day", "night"}
    )
    dn_rate = dn_switches / max(1, len(daynight) - 1)

    components = {
        "shift_transition_rate": _round(_transitions(shifts)),
        "duty_start_variability": _round(_cv(starts)),
        "duty_duration_variability": _round(_cv(durations)),
        "rest_variability": _round(_cv(rests)),
        "day_night_switch_rate": _round(dn_rate),
        "sequence_entropy": _round(_entropy(shifts)),
    }

    weighted = [
        (components["shift_transition_rate"], 0.25),
        (components["duty_start_variability"], 0.15),
        (components["duty_duration_variability"], 0.15),
        (components["rest_variability"], 0.20),
        (components["day_night_switch_rate"], 0.15),
        (components["sequence_entropy"], 0.10),
    ]
    usable = [(v, w) for v, w in weighted if v is not None]
    score = None
    if usable:
        tw = sum(w for _, w in usable)
        score = round(100 * sum(v * w for v, w in usable) / tw, 1)

    if score is None:
        overall = "Unknown"
    elif score < 25:
        overall = "Low volatility"
    elif score < 45:
        overall = "Moderate volatility"
    elif score < 65:
        overall = "High volatility"
    else:
        overall = "Elevated routine volatility"

    return {
        "overall": overall,
        "score": score,
        "components": components,
        "message": f"Overall: {overall}." if score is not None else
                   "Not enough history yet.",
    }


def _round(v: float | None) -> float | None:
    return None if v is None else round(float(v), 3)
