from typing import List
from config.settings import settings

def calculate_ewma_baseline(values: List[float], alpha: float = None) -> float:
    """
    Gradual baseline adaptation (EWMA alpha)
    EWMA(t) = alpha * x(t) + (1 - alpha) * EWMA(t-1)
    """
    if not values:
        return 0.0
        
    if alpha is None:
        alpha = settings.baseline.adaptation_rate
    
    ewma = values[0]
    for x in values[1:]:
        ewma = alpha * x + (1 - alpha) * ewma
    return ewma
