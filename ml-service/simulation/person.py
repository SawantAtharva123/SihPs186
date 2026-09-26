from typing import Dict, Any

class PersonSimulator:
    def __init__(self, interaction_model):
        self.model = interaction_model

    def simulate_scenario(self, baseline_state: Dict[str, float], scenario_features: Dict[str, float]) -> Dict[str, Any]:
        """
        Runs a what-if simulation for a single person.
        Reject impossible scenarios (e.g., negative sleep).
        """
        # Validate scenario
        if scenario_features.get("sleep_duration", 0) < 0:
            raise ValueError("Sleep duration cannot be negative.")
        if scenario_features.get("recovery_time", 0) < 0:
            raise ValueError("Recovery time cannot be negative.")
        if scenario_features.get("duty_duration", 0) < 0:
            raise ValueError("Duty duration cannot be negative.")
            
        # For MVP, we calculate a simple delta trajectory based on feature weights or the interaction model
        # Here we just mock the trajectory calculation
        current_recovery = baseline_state.get("recovery", 50.0)
        
        # A simple linear logic for MVP, or use the injected model
        simulated_recovery = current_recovery
        
        sleep_delta = scenario_features.get("sleep_duration", 7.0) - baseline_state.get("sleep_duration", 7.0)
        workload_delta = scenario_features.get("workload", 5) - baseline_state.get("workload", 5)
        
        simulated_recovery += (sleep_delta * 5.0) - (workload_delta * 2.0)
        simulated_recovery = max(0.0, min(100.0, simulated_recovery))
        
        return {
            "baseline_trajectory": [current_recovery, current_recovery, current_recovery],
            "scenario_trajectory": [current_recovery, current_recovery + (simulated_recovery - current_recovery)*0.5, simulated_recovery],
            "difference": simulated_recovery - current_recovery,
            "confidence": 0.65,
            "simulation_disclaimer": "This is a model simulation, not a guaranteed prediction."
        }
