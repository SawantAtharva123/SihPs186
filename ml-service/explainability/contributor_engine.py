"""Contributor engine (MASTER §79): assembles observed contributors from
raw series + stressor model output into the 'Why did my pattern change?'
timeline structure (§31).
"""
from __future__ import annotations

from explainability.explanation_formatter import confidence_label


def build_contributor_timeline(
    night_shift_change: float | None,
    sleep_change: float | None,
    rest_change: float | None,
    workload_change: float | None,
    recovery_change: float | None,
    stressor_contributors: list[dict],
    confidence: float | None,
) -> list[dict]:
    """Each item: factor, observed data, possible contribution, evidence,
    confidence, period. Never states unsupported causal conclusions (§31).
    """
    items = []

    def add(factor, change, unit, contribution, kind="Observed"):
        if change is None:
            return
        direction = "increased" if change > 0 else "decreased"
        items.append({
            "factor": factor,
            "observed_data": f"{factor} {direction} by {abs(round(change, 1))}{unit} vs personal baseline",
            "possible_contribution": contribution,
            "evidence": kind,
            "confidence": confidence_label(confidence),
            "period": "recent period",
            "direction": direction,
        })

    add("Night shifts", night_shift_change, "", "Often followed by reduced sleep and recovery in similar patterns.")
    add("Sleep", sleep_change, "h", "Sleep below the personal baseline is commonly followed by lower recovery.")
    add("Rest intervals", rest_change, "h", "Shorter rest intervals may slow return toward baseline.")
    add("Workload", workload_change, "", "Higher workload may add to cumulative load.")
    add("Recovery", recovery_change, "%", "Recovery below baseline contributes to the current observed deviation.")

    # Model-derived contributors appended, labeled as such (§49).
    for c in stressor_contributors[:3]:
        items.append({
            "factor": c.get("label", c.get("feature", "Combined factors")),
            "observed_data": "Identified from combined signal patterns",
            "possible_contribution": "Model-derived association — interpret with care.",
            "evidence": "Model-derived",
            "confidence": confidence_label(confidence),
            "period": "recent period",
            "direction": c.get("direction", "increases"),
        })
    return items
