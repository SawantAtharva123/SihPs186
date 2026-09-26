from typing import Dict, Any, List

class UnitSimulator:
    def __init__(self, person_simulator):
        self.person_simulator = person_simulator

    def simulate_unit_scenario(self, unit_members_baselines: List[Dict[str, float]], scenario_features: Dict[str, float]) -> Dict[str, Any]:
        """
        Runs a what-if simulation for a unit.
        Applies privacy guard (k >= 5).
        """
        if len(unit_members_baselines) < 5:
            return {
                "success": False,
                "error": {
                    "code": "PRIVACY_GUARD",
                    "message": "Insufficient group size for unit simulation (k < 5)."
                }
            }
            
        simulated_results = []
        for baseline in unit_members_baselines:
            res = self.person_simulator.simulate_scenario(baseline, scenario_features)
            simulated_results.append(res['scenario_trajectory'][-1])
            
        avg_recovery = sum(simulated_results) / len(simulated_results)
        
        return {
            "success": True,
            "unit_aggregate_recovery": avg_recovery,
            "confidence": 0.6,
            "simulation_disclaimer": "This is a model simulation, not a guaranteed prediction."
        }
