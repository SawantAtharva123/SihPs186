from typing import Dict, Any, List
import numpy as np

class SignalAgreementEngine:
    """
    Normalizes each signal relative to personal baseline and evaluates direction/magnitude agreement.
    """
    def __init__(self):
        pass

    def evaluate_agreement(self, signal_deviations: Dict[str, float]) -> Dict[str, Any]:
        """
        Takes a dict of deviations (e.g. {'sleep': -1.2, 'workload': 1.5, 'recovery': -0.8})
        Returns agreement level, discordance, and potential conflict.
        Note: directions must be pre-aligned (e.g. negative means 'worse' for all, or we handle it here)
        Let's assume signals are already aligned such that positive = increased stress/exposure.
        """
        if not signal_deviations:
            return {
                "agreement_level": "UNKNOWN",
                "conflict": False,
                "discordance": 0.0
            }

        values = list(signal_deviations.values())
        if len(values) < 2:
            return {
                "agreement_level": "MODERATE",
                "conflict": False,
                "discordance": 0.0
            }

        # Simple variance/std to measure discordance
        discordance = float(np.std(values))
        
        # Check for opposing signals (e.g. one very high, one very low)
        max_val = max(values)
        min_val = min(values)
        
        conflict = False
        if max_val > 1.0 and min_val < -1.0:
            conflict = True
            
        if conflict or discordance > 1.5:
            agreement_level = "LOW"
        elif discordance < 0.5:
            agreement_level = "HIGH"
        else:
            agreement_level = "MODERATE"
            
        return {
            "agreement_level": agreement_level,
            "conflict": conflict,
            "discordance": discordance
        }
