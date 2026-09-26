import pandas as pd
from typing import Dict
from config.settings import settings

def calculate_recovery_debt(actual_recovery: pd.Series, expected_recovery: pd.Series) -> Dict[str, pd.Series]:
    """
    Calculates recovery debt over configured windows (1d, 3d, 7d).
    Debt = sum(Expected_Recovery - Actual_Recovery) over the window.
    Only positive values are considered debt (if actual > expected, debt is 0).
    """
    debt_series = {}
    
    # Deficit occurs when expected > actual
    diff = expected_recovery - actual_recovery
    deficit = diff.clip(lower=0)
    
    for window in settings.recovery.debt_windows:
        debt_name = f"debt_{window}d"
        debt_series[debt_name] = deficit.rolling(window=window, min_periods=1).sum()
        
    return debt_series
