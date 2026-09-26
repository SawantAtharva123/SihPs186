from typing import Dict, Any, List

class StateEngine:
    def __init__(self):
        # We might inject configurations here
        pass

    def determine_state(
        self,
        deviations: Dict[str, float],
        persistence_length: int,
        signal_agreement: Dict[str, Any],
        baseline_maturity: str
    ) -> Dict[str, Any]:
        """
        Determines the overall welfare-support state.
        STABLE / EMERGING_CHANGE / PERSISTENT_DEVIATION / CONFLICTING_SIGNALS / SUSTAINED_CONCERN
        """
        state = "STABLE"
        confidence = 0.8
        
        # Conflicting signals reduce confidence and force a conflict state
        if signal_agreement.get("conflict", False):
            state = "CONFLICTING_SIGNALS"
            confidence = 0.5
            return {"state": state, "confidence": confidence}
            
        # Analyze max deviation
        max_dev = 0.0
        if deviations:
            max_dev = max([abs(v) for v in deviations.values()])
            
        if max_dev < 1.0:
            state = "STABLE"
        elif max_dev >= 1.0 and persistence_length < 3:
            state = "EMERGING_CHANGE"
        elif max_dev >= 1.0 and 3 <= persistence_length < 5:
            state = "PERSISTENT_DEVIATION"
        elif max_dev >= 1.5 and persistence_length >= 5:
            state = "SUSTAINED_CONCERN"
            
        # Baseline maturity caps the state
        if baseline_maturity in ["NEW", "LEARNING"]:
            if state in ["PERSISTENT_DEVIATION", "SUSTAINED_CONCERN"]:
                state = "EMERGING_CHANGE"
            confidence = min(confidence, 0.4)
            
        if signal_agreement.get("agreement_level") == "LOW":
            confidence -= 0.2
            
        return {
            "state": state,
            "confidence": max(0.1, confidence)
        }
