from typing import Dict, Any

class InterventionSimulator:
    def __init__(self, digital_twin):
        self.twin = digital_twin

    def simulate_intervention(self, current_state: Dict[str, Any], intervention_type: str) -> Dict[str, Any]:
        """
        Welfare Officer intervention simulation (e.g., 'add_recovery_day', 'move_night_shift')
        """
        base_trajectory = self.twin.generate_current_trajectory(current_state)
        
        # Modify state based on intervention
        simulated_state = dict(current_state)
        if intervention_type == "add_recovery_day":
            simulated_state["rest_interval"] = simulated_state.get("rest_interval", 12) + 24
            simulated_state["workload"] = max(0, simulated_state.get("workload", 5) - 2)
        elif intervention_type == "move_night_shift":
            simulated_state["night_shift_freq"] = max(0, simulated_state.get("night_shift_freq", 1) - 1)
            
        intervention_trajectory = self.twin.generate_intervention_trajectory(simulated_state)
        
        return {
            "current_modeled_burden": base_trajectory,
            "scenario": intervention_trajectory,
            "simulation_disclaimer": "Model simulation — not a guaranteed outcome.",
            "message": "Observed modeled movement toward personal baseline."
        }
