from typing import Dict, Any, Optional
from config.settings import settings

class DeviationEngine:
    def __init__(self):
        self.config = settings.deviation

    def compute_robust_z_score(self, value: float, median: float, mad: float) -> float:
        """
        Compute robust z-score: (x - median) / (MAD * 1.4826)
        """
        if mad <= 0:
            mad = 1e-6
        return (value - median) / (mad * 1.4826)

    def compute_deviation(self, value: float, baseline_data: Dict[str, Any], direction_inverted: bool = False) -> Dict[str, Any]:
        """
        Direction-aware robust z-score deviation.
        direction_inverted = True means a lower value is the concerning direction (e.g., sleep↓).
        direction_inverted = False means a higher value is the concerning direction (e.g., workload↑).
        """
        median = baseline_data.get("median")
        mad = baseline_data.get("mad")
        maturity = baseline_data.get("maturity")

        # No deviation computed for NEW baseline
        if median is None or mad is None or maturity == "NEW":
            return {
                "z_score": None,
                "effective_z_score": None,
                "severity": "NONE",
                "direction": "NONE",
                "is_concerning": False
            }

        z_score = self.compute_robust_z_score(value, median, mad)
        
        effective_z_score = -z_score if direction_inverted else z_score
        direction = "UP" if z_score > 0 else ("DOWN" if z_score < 0 else "FLAT")

        # Determine severity based on absolute z_score
        abs_z = abs(z_score)
        if abs_z >= self.config.severe_threshold:
            severity = "SEVERE"
        elif abs_z >= self.config.moderate_threshold:
            severity = "MODERATE"
        elif abs_z >= self.config.mild_threshold:
            severity = "MILD"
        else:
            severity = "NORMAL"

        is_concerning = bool(effective_z_score >= self.config.mild_threshold)

        return {
            "z_score": float(z_score),
            "effective_z_score": float(effective_z_score),
            "severity": severity,
            "direction": direction,
            "is_concerning": is_concerning
        }
