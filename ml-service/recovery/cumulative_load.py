import pandas as pd
from dataclasses import dataclass
from typing import Optional

@dataclass
class LoadWeights:
    w1_workload: float = 1.0
    w2_duty_hours: float = 1.0
    w3_night_shifts: float = 2.0
    w4_consecutive_duty: float = 1.5
    w5_routine_volatility: float = 1.0
    w6_sleep: float = 1.0
    w7_rest: float = 1.0
    w8_recovery_score: float = 1.0

def calculate_cumulative_load(data: pd.DataFrame, weights: Optional[LoadWeights] = None) -> pd.Series:
    """
    Calculates cumulative load over time.
    Load(t) = Load(t-1) + StressExposure(t) - Recovery(t)
    """
    if weights is None:
        weights = LoadWeights()
        
    df = data.copy()
    
    # Ensure all required columns exist, fill with 0.0 if not
    expected_cols = [
        'workload', 'duty_hours', 'night_shifts', 'consecutive_duty', 'routine_volatility',
        'sleep', 'rest', 'recovery_score'
    ]
    for col in expected_cols:
        if col not in df.columns:
            df[col] = 0.0
            
    stress_exposure = (
        weights.w1_workload * df['workload'] +
        weights.w2_duty_hours * df['duty_hours'] +
        weights.w3_night_shifts * df['night_shifts'] +
        weights.w4_consecutive_duty * df['consecutive_duty'] +
        weights.w5_routine_volatility * df['routine_volatility']
    )
    
    recovery = (
        weights.w6_sleep * df['sleep'] +
        weights.w7_rest * df['rest'] +
        weights.w8_recovery_score * df['recovery_score']
    )
    
    net_daily_load = stress_exposure - recovery
    
    load = pd.Series(0.0, index=df.index)
    current_load = 0.0
    
    for i, val in enumerate(net_daily_load):
        # Load generally doesn't drop below 0
        current_load = max(0.0, current_load + val)
        load.iloc[i] = current_load
        
    return load
