import time
from typing import Callable, Any
import logging

logger = logging.getLogger(__name__)

def retry_with_backoff(func: Callable, max_attempts: int = 4, initial_backoff: int = 5) -> Any:
    """
    Retry with exponential backoff (5s → 15s → 30s → 60s approx, or 5, 10, 20, 40)
    """
    attempt = 0
    backoff = initial_backoff
    
    while attempt < max_attempts:
        try:
            return func()
        except Exception as e:
            attempt += 1
            if attempt >= max_attempts:
                logger.error(f"Job failed after {max_attempts} attempts: {e}")
                raise
            
            logger.warning(f"Attempt {attempt} failed, retrying in {backoff} seconds...")
            time.sleep(backoff)
            backoff *= 2
