from supabase import create_client, Client
from .settings import settings
import logging

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase credentials not fully provided. Operating in mock mode or expect errors.")
        # We return a dummy client or raise, depending on strictness.
        # For now, we will return None if not configured, or we can just raise.
    
    try:
        return create_client(settings.supabase_url, settings.supabase_key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        raise
