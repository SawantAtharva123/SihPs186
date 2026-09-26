"""Persistence rules — kept separate for clarity (§73).

Re-exported logic lives in deviation.analyze_deviation; this module
provides the standalone run-length utilities used across engines.
"""
from __future__ import annotations


def trailing_run(levels: list[str], deviated: tuple[str, ...] = ("mild", "strong", "severe")) -> int:
    """Count trailing consecutive entries whose level is in `deviated`."""
    run = 0
    for level in reversed(levels):
        if level in deviated:
            run += 1
        else:
            break
    return run


def max_run(levels: list[str], deviated: tuple[str, ...] = ("mild", "strong", "severe")) -> int:
    best = cur = 0
    for level in levels:
        if level in deviated:
            cur += 1
            best = max(best, cur)
        else:
            cur = 0
    return best
