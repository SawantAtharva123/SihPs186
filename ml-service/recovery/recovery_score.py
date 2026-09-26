"""Recovery score — daily 0..100 estimate (MASTER §74).

A modeling construct, not a clinically validated metric (§25).
Blends sleep, rest, workload and duty exposure relative to personal
baseline. Higher = better recovered.
"""
from __future__ import annotations

import numpy as np


def _clip(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def daily_recovery_score(
    sleep_hours: float | None,
    sleep_baseline: float | None,
    rest_hours: float | None,
    rest_baseline: float | None,
    workload: float | None,          # 1..5 self-report or index
    workload_baseline: float | None,
    duty_hours: float | None,
    duty_baseline: float | None,
) -> float | None:
    """Compute a single-day recovery score. None if no usable inputs."""
    parts: list[tuple[float, float]] = []  # (value 0..100, weight)

    if sleep_hours is not None and sleep_baseline:
        ratio = sleep_hours / max(sleep_baseline, 1e-6)
        parts.append((_clip(100 * ratio - 20 * max(0.0, 1 - ratio)), 0.4))
    if rest_hours is not None and rest_baseline:
        ratio = rest_hours / max(rest_baseline, 1e-6)
        parts.append((_clip(100 * min(ratio, 1.3) / 1.3), 0.2))
    if workload is not None and workload_baseline:
        delta = workload - workload_baseline  # positive = heavier than usual
        parts.append((_clip(70 - 18 * delta), 0.2))
    if duty_hours is not None and duty_baseline:
        delta = duty_hours - duty_baseline
        parts.append((_clip(75 - 6 * delta), 0.2))

    if not parts:
        return None
    total_w = sum(w for _, w in parts)
    return round(sum(v * w for v, w in parts) / total_w, 1)


def recovery_series(
    days: list[dict],
    baselines: dict,
) -> list[dict]:
    """Compute recovery scores for a list of day dicts.

    Each day: {date, sleep_hours?, rest_hours?, workload?, duty_hours?}.
    `baselines`: {sleep, rest, workload, duty} baseline values.
    """
    out = []
    for d in days:
        score = daily_recovery_score(
            d.get("sleep_hours"), baselines.get("sleep"),
            d.get("rest_hours"), baselines.get("rest"),
            d.get("workload"), baselines.get("workload"),
            d.get("duty_hours"), baselines.get("duty"),
        )
        out.append({"date": d.get("date"), "score": score})
    return out


def summarize_scores(scores: list[float | None]) -> dict:
    clean = [s for s in scores if s is not None]
    if not clean:
        return {"current": None, "average": None, "label": "Unknown"}
    current = clean[-1]
    avg = float(np.mean(clean))
    if current >= 75:
        label = "Restored"
    elif current >= 60:
        label = "Moderate"
    elif current >= 45:
        label = "Strained"
    else:
        label = "Low"
    return {"current": round(current, 1), "average": round(avg, 1), "label": label}
