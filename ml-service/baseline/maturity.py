from enum import Enum
from config.settings import settings

class BaselineMaturity(str, Enum):
    NEW = "NEW"
    LEARNING = "LEARNING"
    DEVELOPING = "DEVELOPING"
    ESTABLISHED = "ESTABLISHED"

def determine_maturity(observations_count: int) -> BaselineMaturity:
    """
    Determine baseline maturity based on observation count.
    Uses thresholds derived from config (e.g. min_observations, established_observations).
    """
    min_obs = settings.baseline.min_observations
    established_obs = settings.baseline.established_observations
    
    # NEW: < min_obs (e.g., < 7)
    # LEARNING: min_obs to < 2 * min_obs (e.g., 7 to 13)
    # DEVELOPING: 2 * min_obs to < established_obs (e.g., 14 to 21)
    # ESTABLISHED: >= established_obs (e.g., 22+)
    
    if observations_count < min_obs:
        return BaselineMaturity.NEW
    elif observations_count < (2 * min_obs):
        return BaselineMaturity.LEARNING
    elif observations_count < established_obs:
        return BaselineMaturity.DEVELOPING
    else:
        return BaselineMaturity.ESTABLISHED
