"""
Database utilities for JCI Connect Backend
"""
from supabase import create_client, Client
from app.core.config import settings
import logging

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
            logger.info(f"Using secret key: {settings.supabase_secret_key[:20]}...")
            logger.info(f"Secret key length: {len(settings.supabase_secret_key)}")
            
            # Use the secret key for backend operations
            key = settings.supabase_secret_key
            
            _supabase_client = create_client(
                settings.supabase_url,
                key
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            logger.error(f"URL: {settings.supabase_url}")
            logger.error(f"Key: {settings.supabase_secret_key[:20]}...")
            raise
    
    return _supabase_client


# Note: Anon key not needed for backend operations
# Frontend applications should use their own Supabase client with anon key
