"""
Repository interfaces for the communication domain
"""
from typing import Protocol, Optional, Dict, Any
from abc import ABC, abstractmethod

from app.domain.entities import Template, MessageLog, OrganizationSettings


class TemplateRepository(Protocol):
    """Repository for managing message templates"""
    
    async def get_by_id(self, template_id: str) -> Optional[Template]:
        """Get template by ID"""
        ...
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> list[Template]:
        """Get all templates"""
        ...
    
    async def create(self, template: Template) -> Template:
        """Create a new template"""
        ...
    
    async def update(self, template_id: str, template: Template) -> Template:
        """Update a template"""
        ...
    
    async def delete(self, template_id: str) -> bool:
        """Delete a template"""
        ...


class MessageLogRepository(Protocol):
    """Repository for managing message logs"""
    
    async def create(self, message_log: MessageLog) -> MessageLog:
        """Create a new message log"""
        ...
    
    async def get_by_id(self, log_id: str) -> Optional[MessageLog]:
        """Get message log by ID"""
        ...
    
    async def get_by_template_id(self, template_id: str) -> list[MessageLog]:
        """Get message logs by template ID"""
        ...


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

