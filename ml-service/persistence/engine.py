from enum import Enum
from typing import List, Dict, Any
from config.settings import settings

class PersistenceState(str, Enum):
    ISOLATED = "ISOLATED"
    REPEATED = "REPEATED"
    PERSISTENT = "PERSISTENT"
    SUSTAINED = "SUSTAINED"

class PersistenceEngine:
    def __init__(self):
        self.config = settings.persistence

    def analyze_persistence(self, recent_deviations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Persistence detection tracking duration, frequency, and severity.
        recent_deviations should be chronological (oldest to newest).
        """
        if not recent_deviations:
            return {
                "state": "NONE",
                "duration": 0,
                "frequency": 0.0,
                "severity_trend": "NONE"
            }

        total_in_window = len(recent_deviations)
        concerning_count = sum(1 for dev in recent_deviations if dev.get("is_concerning", False))
        
        consecutive_concern = 0
        latest_severities = []

        # Walk backwards from the most recent to find continuous run
        for dev in reversed(recent_deviations):
            if dev.get("is_concerning", False):
                consecutive_concern += 1
                latest_severities.append(dev.get("severity", "NORMAL"))
            else:
                break

        # Map to State
        if consecutive_concern >= self.config.sustained_threshold:
            state = PersistenceState.SUSTAINED
        elif consecutive_concern >= self.config.persistent_threshold:
            state = PersistenceState.PERSISTENT
        elif consecutive_concern >= self.config.repeated_threshold:
            state = PersistenceState.REPEATED
        elif consecutive_concern >= self.config.isolated_threshold:
            state = PersistenceState.ISOLATED
        else:
            state = "NONE"

        frequency = concerning_count / total_in_window

        severity_trend = "STABLE"
        if len(latest_severities) >= 2:
            severity_map = {"NORMAL": 0, "MILD": 1, "MODERATE": 2, "SEVERE": 3}
            # latest_severities is reversed (newest first)
            last_sev = severity_map.get(latest_severities[0], 0)
            prev_sev = severity_map.get(latest_severities[1], 0)
            
            if last_sev > prev_sev:
                severity_trend = "WORSENING"
            elif last_sev < prev_sev:
                severity_trend = "IMPROVING"

        return {
            "state": state.value if isinstance(state, PersistenceState) else state,
            "duration": consecutive_concern,
            "frequency": frequency,
            "severity_trend": severity_trend
        }
