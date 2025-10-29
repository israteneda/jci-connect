"""
Supabase client for the infrastructure layer
"""
import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Supabase client
_supabase_client: Client = None


def get_supabase_client() -> Client:
    """
    Get Supabase client instance
    
    Returns:
        Supabase client
    """
    global _supabase_client
    
    if _supabase_client is None:
        try:
            logger.info(f"Creating Supabase client with URL: {settings.supabase_url}")
            
            # Use the secret key for backend operations
            _supabase_client = create_client(
                settings.supabase_url,
                settings.supabase_secret_key
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise
    
    return _supabase_client

