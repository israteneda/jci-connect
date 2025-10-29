"""
Organization settings repository port (interface)
"""
from typing import Protocol, Optional, Dict, Any
from app.domain.entities import OrganizationSettings


class OrganizationSettingsRepository(Protocol):
    """Repository for managing organization settings"""
    
    async def get_settings(self) -> Optional[OrganizationSettings]:
        """Get organization settings"""
        ...
    
    async def update_settings(self, settings: OrganizationSettings) -> OrganizationSettings:
        """Update organization settings"""
        ...
    
    async def get_email_config(self) -> Optional[Dict[str, Any]]:
        """Get email configuration"""
        ...
    
    async def get_whatsapp_config(self) -> Optional[Dict[str, Any]]:
        """Get WhatsApp configuration"""
        ...

