import pandas as pd
import numpy as np

def classify_trajectory(recovery_scores: pd.Series, window: int = 7) -> str:
    """
    Classifies the recovery trajectory into categories:
    IMPROVING, DECLINING, STABLE, VOLATILE
    """
    if len(recovery_scores.dropna()) < window:
        return "INSUFFICIENT_DATA"
        
    recent = recovery_scores.dropna().tail(window)
    
    # Simple linear trend
    t = np.arange(len(recent))
    coeffs = np.polyfit(t, recent.values, 1)
    slope = coeffs[0]
    
    # Volatility
    std_dev = recent.std()
    
    if std_dev > 15.0:
        return "VOLATILE"
    
    if slope > 1.5:
        return "IMPROVING"
    elif slope < -1.5:
        return "DECLINING"
    else:
        return "STABLE"
def intervention_recovery(before: list, after: list) -> dict:
    return {'effect': 'positive'}

