"""Explanation formatting (MASTER §79).

Converts model output into calm, human-readable, non-diagnostic language.
Instead of raw SHAP numbers, users see possible contributing factors
with confidence labels.
"""
from __future__ import annotations


def confidence_label(confidence: float | None) -> str:
    if confidence is None:
        return "Unknown"
    if confidence < 0.4:
        return "Low"
    if confidence < 0.7:
        return "Moderate"
    return "High"


def format_contributors(contributors: list[dict], confidence: float | None) -> dict:
    """Format ranked contributors into user-facing explanation."""
    if not contributors:
        return {
            "headline": "No clear contributing factors identified yet",
            "items": [],
            "confidence_label": confidence_label(confidence),
            "note": "Additional observation may be useful.",
        }
    items = []
    for i, c in enumerate(contributors, start=1):
        items.append({
            "rank": i,
            "text": c.get("label", c.get("feature", "Unknown factor")),
            "direction": c.get("direction", "increases"),
            "strength": _strength(c.get("value")),
            "evidence": c.get("evidence"),
            "period": c.get("period", "recent period"),
        })
    return {
        "headline": "Possible contributors to the current change",
        "items": items,
        "confidence_label": confidence_label(confidence),
        "note": "Observed associations — not confirmed causes.",
    }


def _strength(value: float | None) -> str:
    if value is None:
        return "unknown"
    v = abs(float(value))
    if v < 0.15:
        return "weak"
    if v < 0.35:
        return "moderate"
    return "strong"


def uncertainty_message(missing_signals: int, sample_count: int) -> str | None:
    notes = []
    if missing_signals > 0:
        notes.append(f"{missing_signals} signal(s) currently unavailable")
    if sample_count < 14:
        notes.append("limited history")
    if not notes:
        return None
    return "Interpret with care: " + ", ".join(notes) + "."
