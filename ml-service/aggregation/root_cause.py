from typing import Dict, Any, List

class UnitRootCauseAnalyzer:
    def analyze(self, aggregate_data: Dict[str, Any], unit_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Identifies aggregate associations for unit-level patterns.
        Never identifies an individual.
        """
        if not aggregate_data.get("success", False):
            return {"contributors": []}
            
        data = aggregate_data["data"]
        contributors = []
        
        if data.get("avg_night_shifts", 0) > 3:
            contributors.append("Night-shift exposure")
        if data.get("avg_workload", 0) > 7:
            contributors.append("High aggregate workload")
            
        return {
            "contributors": contributors,
            "disclaimer": "These are aggregate associations and do not imply causal relationships."
        }
