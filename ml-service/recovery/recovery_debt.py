"""Recovery debt (MASTER §27): Expected Recovery − Actual Recovery."""
from __future__ import annotations

EXPECTED_RECOVERY = 75.0  # expected daily recovery under usual conditions


def recovery_debt(scores: list[dict]) -> dict:
    """scores: [{"date", "score"}] chronological.

    Debt is accumulated only on days where actual < expected, and paid
    back when actual > expected (floor at 0).
    """
    clean = [s for s in scores if s.get("score") is not None]
    if not clean:
        return {
            "today": None, "yesterday": None, "three_day": None,
            "status": "Unknown", "series": [],
        }

    series = []
    debt = 0.0
    for s in clean:
        gap = EXPECTED_RECOVERY - float(s["score"])
        debt = max(0.0, debt + gap * 0.4)  # partial carry-over per day
        series.append({"date": s["date"], "debt": round(debt, 1)})

    today = series[-1]["debt"]
    yesterday = series[-2]["debt"] if len(series) > 1 else None
    three_day = round(sum(
        max(0.0, EXPECTED_RECOVERY - float(s["score"])) for s in clean[-3:]
    ), 1)

    recent = [p["debt"] for p in series[-3:]]
    if len(recent) >= 2 and recent[-1] > recent[0] + 1:
        status = "Accumulating"
    elif len(recent) >= 2 and recent[-1] < recent[0] - 1:
        status = "Reducing"
    else:
        status = "Stable"

    return {
        "today": today,
        "yesterday": yesterday,
        "three_day": three_day,
        "status": status,
        "series": series[-30:],
    }
