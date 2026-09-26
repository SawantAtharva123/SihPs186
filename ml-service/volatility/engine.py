import pandas as pd
from typing import Tuple

class VolatilityConfig:
    moderate_threshold: float = 2.0
    elevated_threshold: float = 4.0
    high_threshold: float = 6.0

def calculate_routine_volatility(df: pd.DataFrame, config: VolatilityConfig = VolatilityConfig()) -> Tuple[pd.Series, pd.Series]:
    """
    Calculates routine volatility based on variations in duty timing and rest.
    Returns a tuple of (volatility_score_series, volatility_category_series).
    Categories: LOW, MODERATE, ELEVATED, HIGH
    """
    if 'duty_start_hour' not in df.columns or 'rest_hours' not in df.columns:
        # Fallback if required columns are missing
        volatility_score = pd.Series(0.0, index=df.index)
        categories = pd.Series("LOW", index=df.index)
        return volatility_score, categories
        
    # Standard deviation of duty start hours (rolling 7 days)
    duty_vol = df['duty_start_hour'].rolling(window=7, min_periods=3).std().fillna(0)
    
    # Standard deviation of rest hours
    rest_vol = df['rest_hours'].rolling(window=7, min_periods=3).std().fillna(0)
    
    # Composite volatility score
    volatility_score = duty_vol + rest_vol
    
    # Categorization
    categories = pd.Series("LOW", index=df.index)
    
    categories[volatility_score > config.moderate_threshold] = "MODERATE"
    categories[volatility_score > config.elevated_threshold] = "ELEVATED"
    categories[volatility_score > config.high_threshold] = "HIGH"
    
    return volatility_score, categories
