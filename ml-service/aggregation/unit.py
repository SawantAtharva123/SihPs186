from typing import List, Dict, Any
import numpy as np

class UnitAggregator:
    def __init__(self, min_k: int = 5):
        self.min_k = min_k

    def aggregate_metrics(self, unit_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates unit aggregate metrics with a privacy guard (k >= 5).
        """
        if len(unit_data) < self.min_k:
            return {
                "success": False,
                "error": {
                    "code": "PRIVACY_GUARD",
                    "message": "Insufficient group size for unit aggregate display."
                }
            }
            
        recovery_scores = [d.get("recovery_score", 0) for d in unit_data if "recovery_score" in d]
        workloads = [d.get("workload", 0) for d in unit_data if "workload" in d]
        night_shifts = [d.get("night_shift_freq", 0) for d in unit_data if "night_shift_freq" in d]
        
        return {
            "success": True,
            "data": {
                "avg_recovery": float(np.mean(recovery_scores)) if recovery_scores else None,
                "avg_workload": float(np.mean(workloads)) if workloads else None,
                "avg_night_shifts": float(np.mean(night_shifts)) if night_shifts else None,
                "sample_size": len(unit_data)
            }
        }
