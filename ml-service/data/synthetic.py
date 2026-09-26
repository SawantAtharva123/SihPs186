"""Synthetic scenario generators (MASTER §82).

Scenarios A–F produce 60 days of realistic daily records used for
development, tests and the in-app demo seeder.
"""
from __future__ import annotations

import random
from datetime import date, timedelta

SCENARIOS = {
    "scenario_a_stable": "Stable — normal baseline",
    "scenario_b_emerging_change": "Emerging Change — gradual deviation",
    "scenario_c_persistent_deviation": "Persistent Deviation — repeated abnormal pattern",
    "scenario_d_conflicting_signals": "Conflicting Signals — sources disagree",
    "scenario_e_recovery_journey": "Recovery After Intervention — return toward baseline",
    "scenario_f_high_volatility": "High Schedule Volatility — frequent transitions",
}


def _daterange(days: int) -> list[str]:
    today = date.today()
    return [(today - timedelta(days=days - 1 - i)).isoformat() for i in range(days)]


def generate_days(scenario: str, days: int = 60, seed: int = 42) -> list[dict]:
    """Generate daily records: sleep_hours, rest_hours, workload (1-5),
    duty_hours, shift_type, night_shift, recovery inputs.

    Values follow each scenario's narrative arc.
    """
    rng = random.Random(seed + hash(scenario) % 1000)
    dates = _daterange(days)
    out = []
    for i, d in enumerate(dates):
        t = i / max(1, days - 1)  # 0..1 progress through the window

        if scenario == "scenario_b_emerging_change":
            drift = max(0.0, (t - 0.6) / 0.4)  # deviation starts ~60% in
            night = 1 if (i >= days * 0.6 and i % 3 == 0) else (1 if i % 7 == 0 else 0)
            sleep = 7.1 - 1.4 * drift + rng.gauss(0, 0.25)
            workload = min(5.0, 3.0 + 1.2 * drift + rng.gauss(0, 0.2))
            rest = 10.0 - 1.5 * drift + rng.gauss(0, 0.4)
        elif scenario == "scenario_c_persistent_deviation":
            night = 1 if i >= days * 0.45 and i % 2 == 0 else (1 if i % 8 == 0 else 0)
            level = 1.0 if t > 0.45 else 0.0
            sleep = 7.2 - 1.8 * level + rng.gauss(0, 0.3)
            workload = min(5.0, 3.0 + 1.5 * level + rng.gauss(0, 0.2))
            rest = 10.0 - 2.0 * level + rng.gauss(0, 0.4)
        elif scenario == "scenario_d_conflicting_signals":
            # Operational load up, but self-report/sleep stay normal-ish.
            night = 1 if i % 4 == 0 else 0
            sleep = 7.0 + rng.gauss(0, 0.25)
            workload = min(5.0, 3.0 + (1.3 if t > 0.5 else 0.0) + rng.gauss(0, 0.2))
            rest = 9.8 + rng.gauss(0, 0.4)
        elif scenario == "scenario_e_recovery_journey":
            # Deviation mid-window, intervention at ~70%, then recovery.
            if t < 0.4:
                level = 0.0
            elif t < 0.7:
                level = (t - 0.4) / 0.3
            else:
                level = max(0.0, 1.0 - (t - 0.7) / 0.3)
            night = 1 if (0.4 <= t < 0.7 and i % 2 == 0) else (1 if i % 8 == 0 else 0)
            sleep = 7.2 - 1.6 * level + rng.gauss(0, 0.25)
            workload = min(5.0, 3.0 + 1.2 * level + rng.gauss(0, 0.2))
            rest = 10.0 - 1.8 * level + rng.gauss(0, 0.4)
        elif scenario == "scenario_f_high_volatility":
            night = 1 if rng.random() < 0.35 else 0
            sleep = 7.0 + rng.gauss(0, 0.6)
            workload = min(5.0, max(1.0, 3.0 + rng.gauss(0, 0.7)))
            rest = 10.0 + rng.gauss(0, 1.6)
        else:  # scenario_a_stable
            night = 1 if i % 7 == 0 else 0
            sleep = 7.2 + rng.gauss(0, 0.25)
            workload = min(5.0, max(1.0, 3.0 + rng.gauss(0, 0.25)))
            rest = 10.2 + rng.gauss(0, 0.4)

        shift = "night" if night else ("off" if rng.random() < 0.08 else "day")
        duty = 0.0 if shift == "off" else (10.0 if shift == "night" else 8.0) + rng.gauss(0, 0.5)
        out.append({
            "date": d,
            "shift_type": shift,
            "night_shift": 1 if shift == "night" else 0,
            "start_hour": 21.0 if shift == "night" else 8.0 + rng.gauss(0, 0.6),
            "duty_hours": round(max(0.0, duty), 1),
            "sleep_hours": round(max(3.5, sleep), 1),
            "rest_before_hours": round(max(4.0, rest), 1),
            "workload": round(workload, 1),
        })

    # Derived stressor features for the interaction model
    for row in out:
        row["sleep_deficit"] = round(max(0.0, min(1.0, (7.2 - row["sleep_hours"]) / 2.5)), 3)
        row["workload_excess"] = round(max(0.0, min(1.0, (row["workload"] - 3.0) / 2.0)), 3)
    return out
