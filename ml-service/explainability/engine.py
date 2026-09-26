from typing import Dict, Any, List

class ExplainabilityEngine:
    def __init__(self):
        pass

    def generate_contributors(self, deviations: Dict[str, Any], interactions: List[Dict[str, Any]] = None) -> List[Dict[str, str]]:
        contributors = []
        for metric, dev_info in deviations.items():
            if abs(dev_info['value']) > 1.0:
                contributors.append({
                    "type": "OBSERVED",
                    "metric": metric,
                    "description": f"{metric.replace('_', ' ').capitalize()} has deviated by {dev_info['value']:.2f} units from personal baseline."
                })
                
        if interactions:
            for inter in interactions:
                contributors.append({
                    "type": "POSSIBLE_CONTRIBUTOR",
                    "metric": inter['feature'],
                    "description": f"Model indicates {inter['feature']} is associated with recent changes (importance: {inter['importance']})."
                })
                
        return contributors
