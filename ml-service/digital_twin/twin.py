from typing import Dict, Any, List

class WorkRecoveryDigitalTwin:
    def __init__(self):
        pass

    def generate_current_trajectory(self, state: Dict[str, Any], days: int = 3) -> List[float]:
        """
        Models exposure/recovery/deviation trajectories based on current state.
        Simplified computational representation.
        """
        burden = state.get("cumulative_load", 60.0)
        trajectory = []
        for _ in range(days):
            # Assume steady state if no changes
            trajectory.append(round(burden, 1))
            burden += 1.0 # Slight creep without intervention
        return trajectory

    def generate_intervention_trajectory(self, modified_state: Dict[str, Any], days: int = 3) -> List[float]:
        """
        Models trajectory after intervention.
        """
        burden = modified_state.get("cumulative_load", 60.0)
        trajectory = []
        for _ in range(days):
            # Intervention reduces burden
            burden -= 4.0
            trajectory.append(round(burden, 1))
        return trajectory
