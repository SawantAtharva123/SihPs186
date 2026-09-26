"""
features/pipeline.py
Compute canonical feature set from raw data with as_of_timestamp.
"""
from datetime import datetime
from typing import Dict, Any, List
from pydantic import BaseModel

class ComputedFeatures(BaseModel):
    person_id: str
    as_of_timestamp: datetime
    features: Dict[str, Any]
    missing_imputed: List[str]

def compute_features(person_id: str, timestamp: datetime, raw_observations: List[Dict[str, Any]]) -> ComputedFeatures:
    """
    Computes features based on a window of raw observations.
    Ensures no data leakage by using only data prior to or at `timestamp`.
    """
    
    # Filter observations to ensure no future leakage
    valid_obs = [obs for obs in raw_observations if obs.get("timestamp") <= timestamp]
    valid_obs.sort(key=lambda x: x["timestamp"])
    
    if not valid_obs:
        return ComputedFeatures(
            person_id=person_id,
            as_of_timestamp=timestamp,
            features={},
            missing_imputed=[]
        )
        
    latest_obs = valid_obs[-1]
    
    features = {}
    missing_imputed = []
    
    # Simple direct mappings for now, in a real scenario we'd do window aggregations
    if latest_obs.get("sleep_hours") is not None:
        features["sleep_duration_24h"] = latest_obs["sleep_hours"]
    else:
        # Example naive imputation or placeholder
        features["sleep_duration_24h"] = 7.0 
        missing_imputed.append("sleep_duration_24h")
        
    if latest_obs.get("workload_score") is not None:
        features["workload_intensity"] = latest_obs["workload_score"]
        
    if latest_obs.get("duty_hours") is not None:
        features["duty_duration_24h"] = latest_obs["duty_hours"]
        
    features["night_shift_exposure"] = latest_obs.get("is_night_shift", False)
    
    # Example pseudo-recovery computation
    if latest_obs.get("hrv_ms") is not None and latest_obs.get("resting_heart_rate") is not None:
        # Dummy formula
        features["recovery_score"] = min(100.0, max(0.0, float(latest_obs["hrv_ms"]) - float(latest_obs["resting_heart_rate"]) + 60.0))
        
    return ComputedFeatures(
        person_id=person_id,
        as_of_timestamp=timestamp,
        features=features,
        missing_imputed=missing_imputed
    )
