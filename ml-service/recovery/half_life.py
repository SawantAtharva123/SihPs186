import numpy as np
import pandas as pd
from config.settings import settings
from typing import Optional

def calculate_half_life(deviations: pd.Series) -> Optional[float]:
    """
    Fits an exponential decay model to a series of deviations to find the half-life.
    deviation(t) = deviation_initial * exp(-λ * t)
    half_life = ln(2) / λ
    Requires at least half_life_min_observations post-deviation observations.
    """
    # Assuming deviations is a pandas Series of positive deviation magnitudes after an initial spike.
    if len(deviations.dropna()) < settings.recovery.half_life_min_observations:
        return None
        
    # We want to fit ln(deviation(t)) = ln(deviation_initial) - λ * t
    y = deviations.dropna().values
    
    # Ignore zero or negative deviations for log
    valid_idx = y > 0
    if sum(valid_idx) < settings.recovery.half_life_min_observations:
        return None
        
    y_valid = y[valid_idx]
    log_y = np.log(y_valid)
    t = np.arange(len(y))[valid_idx]
    
    # Linear regression: log_y = b - λ * t
    coeffs = np.polyfit(t, log_y, 1)
    lambda_param = -coeffs[0]
    
    if lambda_param <= 0:
        # Not decaying or growing
        return np.inf
        
    half_life = np.log(2) / lambda_param
    return half_life
