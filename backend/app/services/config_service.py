"""
Configuration service for retrieving organization settings from Supabase
"""
from typing import Dict, Any, Optional
from supabase import Client
import logging

logger = logging.getLogger(__name__)

class ConfigService:
    """Service for managing organization configuration"""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    
    async def get_organization_settings(self) -> Dict[str, Any]:
        """Get organization settings from database"""
        try:
            response = self.supabase.from_("organization_settings").select("*").limit(1).execute()
            
            if not response.data:
                logger.warning("No organization settings found")
                return {}
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error fetching organization settings: {e}")
            return {}
    
    async def get_email_config(self) -> Dict[str, Any]:
        """Get email configuration from organization settings"""
        settings = await self.get_organization_settings()
        return settings.get("email_config", {})
    
    async def get_whatsapp_config(self) -> Dict[str, Any]:
        """Get WhatsApp configuration from organization settings"""
        settings = await self.get_organization_settings()
        return settings.get("whatsapp_config", {})
    
    async def is_email_enabled(self) -> bool:
        """Check if email service is enabled"""
        email_config = await self.get_email_config()
        return email_config.get("enabled", False)
    
    async def is_whatsapp_enabled(self) -> bool:
        """Check if WhatsApp service is enabled"""
        whatsapp_config = await self.get_whatsapp_config()
        return whatsapp_config.get("enabled", False)
