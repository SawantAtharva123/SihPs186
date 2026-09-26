"""Stressor interaction model (MASTER §51, §77).

Builds interpretable interaction features:
  night_shift × poor_sleep, poor_sleep × high_workload,
  night_shift × high_workload, night_shift × poor_sleep × high_workload

Current implementation: interpretable linear model on standardized
features; per-observation contribution decomposition (SHAP-style
additive attributions). The `InteractionModel` interface allows a later
swap to XGBoost + real SHAP values without API changes (§83).
"""
from __future__ import annotations

import numpy as np

FEATURE_LABELS = {
    "night_shift": "Night-shift exposure",
    "poor_sleep": "Reduced sleep relative to personal baseline",
    "high_workload": "Higher workload than usual",
    "night_shift_x_poor_sleep": "Night shifts combined with reduced sleep",
    "poor_sleep_x_high_workload": "Reduced sleep combined with high workload",
    "night_shift_x_high_workload": "Night shifts combined with high workload",
    "night_shift_x_poor_sleep_x_high_workload": "Combined night shifts, reduced sleep and high workload",
}


def build_features(day: dict) -> dict[str, float]:
    """Binary/graded base features + interaction terms for one day.

    day: {night_shift: 0|1, sleep_deficit: 0..1, workload_excess: 0..1}
    """
    ns = float(day.get("night_shift", 0.0))
    ps = float(day.get("sleep_deficit", 0.0))
    hw = float(day.get("workload_excess", 0.0))
    return {
        "night_shift": ns,
        "poor_sleep": ps,
        "high_workload": hw,
        "night_shift_x_poor_sleep": ns * ps,
        "poor_sleep_x_high_workload": ps * hw,
        "night_shift_x_high_workload": ns * hw,
        "night_shift_x_poor_sleep_x_high_workload": ns * ps * hw,
    }


class InteractionModel:
    """Interpretable linear interaction model.

    Swappable: a future XGBoostModel can implement the same
    `fit(X, y)` / `contributions(x)` interface backed by SHAP values.
    """

    model_name = "linear-interaction"
    model_version = "0.1.0"

    def __init__(self) -> None:
        self.coef_: np.ndarray | None = None
        self.feature_names: list[str] = []
        self.x_mean_: np.ndarray | None = None
        self.x_std_: np.ndarray | None = None
        self.y_mean_: float = 0.0

    def fit(self, X: list[dict[str, float]], y: list[float]) -> "InteractionModel":
        if not X or not y or len(X) != len(y):
            raise ValueError("X and y must be non-empty and aligned")
        self.feature_names = list(X[0].keys())
        M = np.array([[row.get(f, 0.0) for f in self.feature_names] for row in X])
        t = np.array(y, dtype=float)
        self.x_mean_ = M.mean(axis=0)
        self.x_std_ = M.std(axis=0)
        self.x_std_[self.x_std_ < 1e-9] = 1.0
        Z = (M - self.x_mean_) / self.x_std_
        self.y_mean_ = float(t.mean())
        # Ridge-stabilized least squares for small samples.
        lam = 1.0
        A = Z.T @ Z + lam * np.eye(Z.shape[1])
        self.coef_ = np.linalg.solve(A, Z.T @ (t - self.y_mean_))
        return self

    def predict(self, row: dict[str, float]) -> float:
        self._check_fitted()
        z = (np.array([row.get(f, 0.0) for f in self.feature_names]) - self.x_mean_) / self.x_std_
        return float(self.y_mean_ + z @ self.coef_)

    def contributions(self, row: dict[str, float]) -> list[dict]:
        """Additive per-feature attributions (SHAP-style decomposition)."""
        self._check_fitted()
        x = np.array([row.get(f, 0.0) for f in self.feature_names])
        z = (x - self.x_mean_) / self.x_std_
        contrib = z * self.coef_
        out = [
            {
                "feature": f,
                "label": FEATURE_LABELS.get(f, f),
                "value": round(float(c), 4),
                "direction": "increases" if c > 0 else "decreases",
            }
            for f, c in zip(self.feature_names, contrib)
        ]
        out.sort(key=lambda r: abs(r["value"]), reverse=True)
        return out

    def _check_fitted(self) -> None:
        if self.coef_ is None:
            raise RuntimeError("Model is not fitted")


def analyze_stressors(days: list[dict], outcomes: list[float] | None = None) -> dict:
    """Rank likely contributing factors for the current period.

    `days`: chronological day dicts (see build_features) each with
    `recovery_gap` (expected − actual recovery) used as the target when
    `outcomes` is not given.
    """
    if len(days) < 7:
        return {
            "contributors": [],
            "message": "Not enough history yet. More observations are needed "
                       "before contributing factors can be estimated.",
            "model": None,
        }
    feats = [build_features(d) for d in days]
    y = outcomes if outcomes is not None else [float(d.get("recovery_gap", 0.0)) for d in days]
    model = InteractionModel().fit(feats, y)

    # Contributions for the most recent day, averaged with the last week
    # for stability.
    recent = feats[-7:]
    agg: dict[str, float] = {}
    for row in recent:
        for c in model.contributions(row):
            agg[c["feature"]] = agg.get(c["feature"], 0.0) + c["value"]
    ranked = sorted(
        (
            {
                "feature": f,
                "label": FEATURE_LABELS.get(f, f),
                "value": round(v / len(recent), 4),
                "direction": "increases" if v > 0 else "decreases",
            }
            for f, v in agg.items()
        ),
        key=lambda r: abs(r["value"]),
        reverse=True,
    )
    top = [r for r in ranked if r["value"] > 0][:5]
    return {
        "contributors": top,
        "message": "Possible contributing factors to the current observed change."
        if top else "No dominant contributing factors identified in the current period.",
        "model": {"name": model.model_name, "version": model.model_version},
    }
