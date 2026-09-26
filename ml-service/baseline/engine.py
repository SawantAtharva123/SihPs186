from typing import List, Dict, Any, Optional
import numpy as np
from config.settings import settings
from .maturity import BaselineMaturity, determine_maturity
from .confidence import calculate_confidence
from .adaptation import calculate_ewma_baseline

class BaselineEngine:
    def __init__(self):
        self.config = settings.baseline

    def calculate_mad(self, values: List[float], median: float) -> float:
        if not values:
            return 0.0
        deviations = [abs(x - median) for x in values]
        return float(np.median(deviations))

    def compute_baseline(self, values: List[float], missing_data_ratio: float = 0.0, data_quality: str = "good") -> Dict[str, Any]:
        """
        Compute robust baseline using rolling median, MAD, and EWMA.
        """
        observations_count = len(values)
        maturity = determine_maturity(observations_count)
        confidence = calculate_confidence(observations_count, missing_data_ratio, data_quality)

        if observations_count == 0:
            return {
                "median": None,
                "mad": None,
                "ewma": None,
                "maturity": maturity.value,
                "confidence": confidence,
                "short_term_median": None,
                "long_term_median": None
            }

        median = float(np.median(values))
        mad = self.calculate_mad(values, median)
        
        # Avoid MAD = 0 for z-score division later
        if mad == 0.0:
            mad = 1e-6

        st_window = self.config.short_term_window
        lt_window = self.config.long_term_window

        short_term_vals = values[-st_window:] if len(values) >= st_window else values
        long_term_vals = values[-lt_window:] if len(values) >= lt_window else values

        short_term_median = float(np.median(short_term_vals))
        long_term_median = float(np.median(long_term_vals))

        ewma = calculate_ewma_baseline(values, self.config.adaptation_rate)

        return {
            "median": median,
            "mad": mad,
            "ewma": ewma,
            "maturity": maturity.value,
            "confidence": confidence,
            "short_term_median": short_term_median,
            "long_term_median": long_term_median
        }
