"""Deviation detection (MASTER §73) + persistence rules.

States: Normal, Emerging Change, Persistent Deviation, Sustained Concern.
Conflicting Signals is decided by the signal-agreement engine and merged
at a higher level. A severe state is NEVER triggered by one measurement.
"""
from __future__ import annotations

import numpy as np

from baseline.robust_baseline import MAD_CONSISTENCY

# Robust z thresholds (tunable, documented — §73 thresholds.py role).
Z_EMERGING = 1.5
Z_PERSISTENT = 2.0
Z_SEVERE = 2.75

# Persistence windows (days).
DAYS_EMERGING = 3
DAYS_PERSISTENT = 7
DAYS_SUSTAINED = 10

WELFARE_STATES = [
    "Stable",
    "Emerging Change",
    "Persistent Deviation",
    "Sustained Concern",
    "Conflicting Signals",
]


def _robust_z_series(values: list[float], window: int = 14) -> list[float | None]:
    """Per-point robust z against the trailing median/MAD of previous points."""
    zs: list[float | None] = []
    for i, v in enumerate(values):
        hist = values[max(0, i - window):i]
        if len(hist) < 5:
            zs.append(None)
            continue
        med = float(np.median(hist))
        mad = float(np.median(np.abs(np.array(hist) - med)))
        scale = MAD_CONSISTENCY * mad
        if scale < 1e-9:
            std = float(np.std(hist))
            scale = std if std > 1e-9 else 1e-9
        zs.append((v - med) / scale)
    return zs


def analyze_deviation(
    series: list[dict],
    metric: str = "composite",
    direction: str = "auto",
) -> dict:
    """Analyze a dated series for deviation + persistence.

    `series`: [{"date": str, "value": float}] — value oriented so that
    NEGATIVE deviation = worse (callers invert metrics where higher is
    worse, e.g. workload stress exposure). `direction` is kept for
    interface stability.
    """
    ordered = sorted(
        (p for p in series if p.get("value") is not None),
        key=lambda p: p["date"],
    )
    values = [float(p["value"]) for p in ordered]
    dates = [p["date"] for p in ordered]
    zs = _robust_z_series(values)

    flags = []
    for d, v, z in zip(dates, values, zs):
        if z is None:
            level = "insufficient_history"
        elif z <= -Z_SEVERE:
            level = "severe"
        elif z <= -Z_PERSISTENT:
            level = "strong"
        elif z <= -Z_EMERGING:
            level = "mild"
        else:
            level = "normal"
        flags.append({"date": d, "value": round(v, 3),
                      "z": None if z is None else round(z, 3), "level": level})

    # --- persistence: count trailing consecutive deviated days (mild or worse)
    trailing = 0
    max_run = 0
    run = 0
    for f in flags:
        if f["level"] in ("mild", "strong", "severe"):
            run += 1
            max_run = max(max_run, run)
        else:
            run = 0
    trailing = run
    recent_severe = any(f["level"] == "severe" for f in flags[-5:])
    last_z = next((f["z"] for f in reversed(flags) if f["z"] is not None), None)

    if trailing >= DAYS_SUSTAINED and (recent_severe or max_run >= DAYS_SUSTAINED):
        state = "Sustained Concern"
    elif trailing >= DAYS_PERSISTENT or max_run >= DAYS_PERSISTENT:
        state = "Persistent Deviation"
    elif trailing >= DAYS_EMERGING:
        state = "Emerging Change"
    else:
        state = "Stable"

    observed = [f for f in flags if f["level"] != "insufficient_history"]
    confidence = min(1.0, len(observed) / 21.0) if observed else 0.0

    return {
        "metric": metric,
        "state": state,
        "trailing_deviated_days": trailing,
        "max_deviated_run": max_run,
        "last_z": last_z,
        "flags": flags[-30:],
        "explanation": _explain_state(state, trailing, metric),
        "thresholds": {
            "z_emerging": Z_EMERGING,
            "z_persistent": Z_PERSISTENT,
            "z_severe": Z_SEVERE,
            "days_emerging": DAYS_EMERGING,
            "days_persistent": DAYS_PERSISTENT,
            "days_sustained": DAYS_SUSTAINED,
        },
        "confidence": round(confidence, 3),
    }


def _explain_state(state: str, trailing: int, metric: str) -> str:
    if state == "Stable":
        return f"{metric} is within the usual personal range."
    if state == "Emerging Change":
        return (
            f"An emerging change in {metric} has been observed over the past "
            f"{trailing} days relative to the personal baseline."
        )
    if state == "Persistent Deviation":
        return (
            f"A persistent deviation in {metric} has been observed for about "
            f"{trailing} consecutive days. Additional observation may be useful."
        )
    return (
        f"A sustained deviation in {metric} has been observed over an extended "
        f"period ({trailing} days). A welfare review may be considered."
    )
