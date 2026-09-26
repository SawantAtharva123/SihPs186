from typing import Optional
from .maturity import BaselineMaturity, determine_maturity

def calculate_confidence(observations_count: int, missing_data_ratio: float = 0.0, data_quality: str = "good") -> float:
    """
    Calculates baseline confidence scoring.
    Confidence is a combination of maturity, data quality, and missing data ratio.
    """
    maturity = determine_maturity(observations_count)
    
    base_confidence = 0.0
    if maturity == BaselineMaturity.NEW:
        base_confidence = 0.2
    elif maturity == BaselineMaturity.LEARNING:
        base_confidence = 0.45
    elif maturity == BaselineMaturity.DEVELOPING:
        base_confidence = 0.7
    elif maturity == BaselineMaturity.ESTABLISHED:
        base_confidence = 0.9
        
    quality_factor = 1.0
    if data_quality == "poor":
        quality_factor = 0.5
    elif data_quality == "fair":
        quality_factor = 0.8
        
    confidence = base_confidence * (1 - missing_data_ratio) * quality_factor
    return max(0.0, min(1.0, confidence))
