import pandas as pd
import numpy as np

def compute_recovery_score(sleep_hours: float, rest_hours: float, sleep_quality: float = 1.0) -> float:
    """
    Computes a base recovery score for a given day.
    
    This is a simplistic composite score for demonstration. In a full system, 
    this would incorporate HRV, resting heart rate, sleep stages, etc.
    """
    # Assuming sleep is critical (e.g., 7-8 hours is good) and rest helps.
    # Sleep quality acts as a multiplier.
    base_score = (sleep_hours * 10) + (rest_hours * 5)
    return max(0.0, min(100.0, base_score * sleep_quality))

def generate_recovery_series(data: pd.DataFrame) -> pd.Series:
    """
    Given a dataframe with 'sleep_hours', 'rest_hours', and 'sleep_quality',
    returns a series of recovery scores.
    """
    required_cols = ['sleep_hours', 'rest_hours']
    for col in required_cols:
        if col not in data.columns:
            raise ValueError(f"Missing required column: {col}")
    
    sq = data['sleep_quality'] if 'sleep_quality' in data.columns else 1.0
    scores = (data['sleep_hours'] * 10 + data['rest_hours'] * 5) * sq
    return scores.clip(lower=0.0, upper=100.0)
