"""Robust personal baseline engine (MASTER §29).

Uses rolling median + MAD (median absolute deviation) which is robust to
outliers — appropriate for sparse, noisy self-report / operational data.

Never overwrite raw observations with these derived results (§99).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import numpy as np

# Robust z-score scaling: 1.4826 makes MAD consistent with std for normal data.
MAD_CONSISTENCY = 1.4826


@dataclass
class BaselineResult:
    metric: str
    baseline: Optional[float]
    current: Optional[float]
    deviation: Optional[float]
    standardized_deviation: Optional[float]
    mad: Optional[float]
    sample_count: int
    window_days: int

    def to_dict(self) -> dict:
        return {
            "metric": self.metric,
            "baseline": _round(self.baseline),
            "current": _round(self.current),
            "deviation": _round(self.deviation),
            "standardized_deviation": _round(self.standardized_deviation),
            "mad": _round(self.mad),
            "sample_count": self.sample_count,
            "window_days": self.window_days,
        }


def _round(v: Optional[float], nd: int = 3) -> Optional[float]:
    return None if v is None else round(float(v), nd)


def rolling_median_baseline(
    values: list[float],
    window: int = 14,
    min_samples: int = 5,
) -> BaselineResult:
    """Compute a robust baseline over the trailing `window` observations.

    The current value is compared against the median of the *preceding*
    window (current point excluded) so the baseline represents "what is
    normal for this person" rather than absorbing the change itself.
    """
    metric = "metric"
    clean = [float(v) for v in values if v is not None and np.isfinite(v)]
    n = len(clean)
    if n < min_samples:
        return BaselineResult(
            metric=metric,
            baseline=None,
            current=clean[-1] if clean else None,
            deviation=None,
            standardized_deviation=None,
            mad=None,
            sample_count=n,
            window_days=window,
        )

    current = clean[-1]
    hist = clean[-(window + 1):-1] if n > window else clean[:-1]
    if len(hist) < min_samples:
        hist = clean[:-1]

    median = float(np.median(hist))
    mad = float(np.median(np.abs(np.array(hist) - median)))
    deviation = current - median
    # Robust z: guard against zero MAD (very stable series).
    if mad < 1e-9:
        std = float(np.std(hist))
        scale = std if std > 1e-9 else None
    else:
        scale = MAD_CONSISTENCY * mad
    z = (deviation / scale) if scale else (0.0 if abs(deviation) < 1e-9 else None)

    return BaselineResult(
        metric=metric,
        baseline=median,
        current=current,
        deviation=deviation,
        standardized_deviation=z,
        mad=mad,
        sample_count=n,
        window_days=window,
    )


def compute_baseline(
    metric: str,
    series: list[dict],
    window: int = 14,
    min_samples: int = 5,
) -> dict:
    """Compute baseline for a dated series.

    `series`: [{"date": "YYYY-MM-DD", "value": float}, ...] sorted or not.
    Returns the §72-style payload with confidence inputs for confidence.py.
    """
    ordered = sorted(
        (p for p in series if p.get("value") is not None),
        key=lambda p: p["date"],
    )
    values = [float(p["value"]) for p in ordered]
    result = rolling_median_baseline(values, window=window, min_samples=min_samples)
    result.metric = metric
    payload = result.to_dict()
    payload["first_date"] = ordered[0]["date"] if ordered else None
    payload["last_date"] = ordered[-1]["date"] if ordered else None
    return payload
