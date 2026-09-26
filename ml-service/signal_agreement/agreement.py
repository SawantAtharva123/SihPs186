"""Signal agreement engine (MASTER §50, §76).

Fuses per-signal states. It is acceptable — and preferable — to report
"conflicting_signals" rather than forcing a single category.
"""
from __future__ import annotations

SIGNALS = ["self_report", "sleep", "workload", "activity", "wearable", "operational"]
STATES = ["normal", "elevated", "deviated", "high", "missing"]


def analyze_agreement(signals: dict[str, str | None]) -> dict:
    """signals: {"self_report": "normal"|"deviated"|None, ...}

    Returns agreement level, conflict flag, missing count, confidence.
    """
    normalized: dict[str, str] = {}
    missing = 0
    for name in SIGNALS:
        raw = signals.get(name)
        if raw is None or str(raw).lower() in ("missing", "unknown", "not available", "none"):
            missing += 1
            continue
        val = str(raw).lower()
        normalized[name] = "deviated" if val in ("deviated", "high", "elevated", "abnormal") else "normal"

    available = len(normalized)
    if available == 0:
        return {
            "result": "insufficient_data",
            "agreement_level": None,
            "conflict": False,
            "missing_signal_count": missing,
            "signals": {},
            "message": "No usable signals available. Additional observation may be useful.",
            "confidence": 0.0,
        }

    deviated = [k for k, v in normalized.items() if v == "deviated"]
    normal = [k for k, v in normalized.items() if v == "normal"]

    if not deviated:
        result = "aligned_normal"
        conflict = False
    elif not normal:
        result = "aligned_deviated"
        conflict = False
    else:
        # disagreement between sources
        conflict = min(len(deviated), len(normal)) >= 1 and available >= 3
        result = "conflicting_signals" if conflict else "mixed"

    agreement = (max(len(deviated), len(normal)) / available) if available else 0.0
    confidence = round(agreement * (available / len(SIGNALS)) + 0.2 * (available / len(SIGNALS)), 3)

    if result == "conflicting_signals":
        message = ("Different data sources currently show different patterns. "
                   "Additional observation may be useful.")
    elif result == "aligned_deviated":
        message = "Multiple signals currently show a consistent observed change."
    elif result == "aligned_normal":
        message = "Available signals are currently within usual ranges."
    else:
        message = "Signals show a mixed pattern. Continued observation may be useful."

    return {
        "result": result,
        "agreement_level": round(agreement, 3),
        "conflict": conflict,
        "missing_signal_count": missing,
        "deviated_signals": deviated,
        "normal_signals": normal,
        "signals": normalized,
        "message": message,
        "confidence": min(1.0, confidence),
    }
