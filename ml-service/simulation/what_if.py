"""What-if simulation engine (MASTER §32, §56, §69, §81).

A scenario model — NOT a medical digital twin (§33) and never a
guaranteed prediction. Re-projects a simple burden model under adjusted
parameters and compares with the current trajectory.
"""
from __future__ import annotations

from models.registry import SIMULATION_DISCLAIMER

DAYS = 14


def _burden(sleep: float, workload: float, night_shifts: float,
            recovery_time: float, duty_hours: float, rest_hours: float) -> float:
    """Simple transparent burden model (0..100-ish).

    sleep: hours/night; workload: 1..5; night_shifts: per week;
    recovery_time: hours/day; duty_hours: hours/day; rest_hours: between duties.
    """
    b = 50.0
    b -= 9.0 * (sleep - 7.0)          # more sleep reduces burden
    b += 8.0 * (workload - 3.0)       # heavier workload raises it
    b += 3.5 * (night_shifts - 2.0)   # night shifts per week
    b -= 4.0 * (recovery_time - 2.0)  # dedicated recovery time
    b += 2.0 * (duty_hours - 8.0)     # long duties
    b -= 1.5 * (rest_hours - 10.0)    # rest between duties
    return max(5.0, min(95.0, b))


def _project(start: float, target: float, days: int = DAYS) -> list[float]:
    """Exponential approach of burden toward its new equilibrium."""
    out = []
    val = start
    for _ in range(days):
        val = val + 0.25 * (target - val)
        out.append(round(val, 1))
    return out


def simulate_person(current: dict, scenario: dict) -> dict:
    """current/scenario: {sleep_hours, workload(1-5), night_shifts_per_week,
    recovery_time_hours, duty_hours, rest_hours}. Missing scenario keys
    fall back to current values.
    """
    cur = {
        "sleep_hours": float(current.get("sleep_hours", 7.0)),
        "workload": float(current.get("workload", 3.0)),
        "night_shifts_per_week": float(current.get("night_shifts_per_week", 2.0)),
        "recovery_time_hours": float(current.get("recovery_time_hours", 2.0)),
        "duty_hours": float(current.get("duty_hours", 8.0)),
        "rest_hours": float(current.get("rest_hours", 10.0)),
    }
    scn = {k: float(scenario.get(k, v)) for k, v in cur.items()}

    cur_burden = _burden(cur["sleep_hours"], cur["workload"], cur["night_shifts_per_week"],
                         cur["recovery_time_hours"], cur["duty_hours"], cur["rest_hours"])
    scn_burden = _burden(scn["sleep_hours"], scn["workload"], scn["night_shifts_per_week"],
                         scn["recovery_time_hours"], scn["duty_hours"], scn["rest_hours"])

    current_traj = _project(cur_burden, cur_burden)       # stays flat
    scenario_traj = _project(cur_burden, scn_burden)      # moves to new eq.

    delta = scn_burden - cur_burden
    if delta < -3:
        direction = "improving"
    elif delta > 3:
        direction = "worsening"
    else:
        direction = "stable"

    confidence = 0.55 + min(0.25, abs(delta) / 100.0)
    return {
        "current_burden": round(cur_burden, 1),
        "scenario_burden": round(scn_burden, 1),
        "delta": round(delta, 1),
        "direction": direction,
        "current_trajectory": current_traj,
        "scenario_trajectory": scenario_traj,
        "scenario_params": scn,
        "warning": SIMULATION_DISCLAIMER,
        "confidence": round(confidence, 2),
    }


def simulate_unit(current: dict, scenarios: list[dict]) -> dict:
    """Unit-level what-if (§69). `current`: aggregate burden inputs;
    each scenario: {id, label, params{...same keys...}}.
    """
    results = []
    for s in scenarios:
        r = simulate_person(current, s.get("params", {}))
        results.append({
            "id": s.get("id"),
            "label": s.get("label"),
            "modeled_burden": r["scenario_burden"],
            "delta": r["delta"],
            "direction": r["direction"],
            "trajectory": r["scenario_trajectory"],
            "confidence": r["confidence"],
        })
    base = simulate_person(current, {})
    return {
        "current_burden": base["current_burden"],
        "scenarios": results,
        "warning": SIMULATION_DISCLAIMER,
    }
