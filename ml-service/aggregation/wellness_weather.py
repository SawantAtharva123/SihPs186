from typing import Dict, Any

class WellnessWeatherEngine:
    def determine_weather_state(self, aggregate_data: Dict[str, Any]) -> str:
        """
        Determines the aggregate state (STABLE, IMPROVING, EMERGING_CHANGE, ELEVATED_RECOVERY_PRESSURE, SUSTAINED_CONCERN)
        """
        if not aggregate_data.get("success", False):
            return "UNKNOWN"
            
        data = aggregate_data["data"]
        avg_recovery = data.get("avg_recovery", 50)
        avg_workload = data.get("avg_workload", 5)
        
        # Simple heuristic mapping for wellness weather
        if avg_recovery < 40 and avg_workload > 8:
            return "SUSTAINED_CONCERN"
        elif avg_recovery < 45:
            return "ELEVATED_RECOVERY_PRESSURE"
        elif avg_workload > 7:
            return "EMERGING_CHANGE"
        elif avg_recovery > 60:
            return "IMPROVING"
        else:
            return "STABLE"
