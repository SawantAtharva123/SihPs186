"""Exponentially weighted moving average — smoothed personal trend (§29)."""
from __future__ import annotations

from typing import Optional


def ewma(values: list[float], alpha: float = 0.3) -> list[float]:
    """Return EWMA series for values (same length). alpha in (0,1]."""
    if not values:
        return []
    if not 0 < alpha <= 1:
        raise ValueError("alpha must be in (0, 1]")
    out = [float(values[0])]
    for v in values[1:]:
        out.append(alpha * float(v) + (1 - alpha) * out[-1])
    return out


def ewma_current(values: list[float], alpha: float = 0.3) -> Optional[float]:
    series = ewma(values, alpha)
    return series[-1] if series else None
