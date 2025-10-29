"""
Supabase adapter for database access
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime

from app.domain.entities import Template, MessageLog, OrganizationSettings
from app.domain.value_objects import TemplateType, MessageType, MessageStatus
from app.infrastructure.database.client import get_supabase_client

logger = logging.getLogger(__name__)


class SupabaseTemplateRepository:
    """Template repository implementation using Supabase"""
    
    async def get_by_id(self, template_id: str) -> Optional[Template]:
        """Get template by ID"""
        try:
            supabase = get_supabase_client()
            result = supabase.table("message_templates").select("*").eq("id", template_id).execute()
            
            if not result.data:
                return None
            
            data = result.data[0]
            return Template(
                id=data["id"],
                name=data["name"],
                type=TemplateType(data["type"]),
                subject=data.get("subject"),
                content=data["content"],
                variables=data.get("variables", []),
                is_active=data.get("is_active", True),
                created_by=data.get("created_by"),
                created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")) if isinstance(data["created_at"], str) else data["created_at"],
                updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")) if isinstance(data["updated_at"], str) else data["updated_at"]
            )
        except Exception as e:
            logger.error(f"Error fetching template: {str(e)}")
            return None
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> list[Template]:
        """Get all templates"""
        try:
            supabase = get_supabase_client()
            result = supabase.table("message_templates").select("*").range(skip, skip + limit - 1).execute()
            
            templates = []
            for data in result.data:
                templates.append(Template(
                    id=data["id"],
                    name=data["name"],
                    type=TemplateType(data["type"]),
                    subject=data.get("subject"),
                    content=data["content"],
                    variables=data.get("variables", []),
                    is_active=data.get("is_active", True),
                    created_by=data.get("created_by"),
                    created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")) if isinstance(data["created_at"], str) else data["created_at"],
                    updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")) if isinstance(data["updated_at"], str) else data["updated_at"]
                ))
            return templates
        except Exception as e:
            logger.error(f"Error fetching templates: {str(e)}")
            return []
    
    async def create(self, template: Template) -> Template:
        """Create a new template"""
        try:
            supabase = get_supabase_client()
            data = template.model_dump(exclude={"id", "created_at", "updated_at"})
            data["type"] = template.type.value
            
            result = supabase.table("message_templates").insert(data).execute()
            data = result.data[0]
            
            return Template(
                id=data["id"],
                name=data["name"],
                type=TemplateType(data["type"]),
                subject=data.get("subject"),
                content=data["content"],
                variables=data.get("variables", []),
                is_active=data.get("is_active", True),
                created_by=data.get("created_by"),
                created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")) if isinstance(data["created_at"], str) else data["created_at"],
                updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")) if isinstance(data["updated_at"], str) else data["updated_at"]
            )
        except Exception as e:
            logger.error(f"Error creating template: {str(e)}")
            raise
    
    async def update(self, template_id: str, template: Template) -> Template:
        """Update a template"""
        try:
            supabase = get_supabase_client()
            data = template.model_dump(exclude={"id", "created_at", "updated_at"})
            data["type"] = template.type.value
            
            result = supabase.table("message_templates").update(data).eq("id", template_id).execute()
            data = result.data[0]
            
            return Template(
                id=data["id"],
                name=data["name"],
                type=TemplateType(data["type"]),
                subject=data.get("subject"),
                content=data["content"],
                variables=data.get("variables", []),
                is_active=data.get("is_active", True),
                created_by=data.get("created_by"),
                created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")) if isinstance(data["created_at"], str) else data["created_at"],
                updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")) if isinstance(data["updated_at"], str) else data["updated_at"]
            )
        except Exception as e:
            logger.error(f"Error updating template: {str(e)}")
            raise
    
    async def delete(self, template_id: str) -> bool:
        """Delete a template"""
        try:
            supabase = get_supabase_client()
            supabase.table("message_templates").delete().eq("id", template_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting template: {str(e)}")
            return False


class SupabaseMessageLogRepository:
    """Message log repository implementation using Supabase"""
    
    async def create(self, message_log: Dict[str, Any]) -> MessageLog:
        """Create a new message log"""
        try:
            supabase = get_supabase_client()
            data = message_log.copy()
            data["type"] = message_log.get("type")
            data["status"] = message_log.get("status", MessageStatus.FAILED).value if isinstance(message_log.get("status"), MessageStatus) else message_log.get("status")
            
            result = supabase.table("message_logs").insert(data).execute()
            data = result.data[0]
            
            return MessageLog(
                id=data["id"],
                template_id=data.get("template_id"),
                recipient_id=data.get("recipient_id"),
                recipient_email=data.get("recipient_email"),
                recipient_phone=data.get("recipient_phone"),
                type=MessageType(data["type"]),
                subject=data.get("subject"),
                content=data["content"],
                variables_used=data.get("variables_used", {}),
                status=MessageStatus(data["status"]),
                error_message=data.get("error_message"),
                sent_at=datetime.fromisoformat(data["sent_at"].replace("Z", "+00:00")) if data.get("sent_at") and isinstance(data["sent_at"], str) else data.get("sent_at"),
                delivered_at=datetime.fromisoformat(data["delivered_at"].replace("Z", "+00:00")) if data.get("delivered_at") and isinstance(data["delivered_at"], str) else data.get("delivered_at"),
                created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")) if isinstance(data["created_at"], str) else data["created_at"]
            )
        except Exception as e:
            logger.error(f"Error creating message log: {str(e)}")
            raise
    
    async def get_by_id(self, log_id: str) -> Optional[MessageLog]:
        """Get message log by ID"""
        try:
            supabase = get_supabase_client()
            result = supabase.table("message_logs").select("*").eq("id", log_id).execute()
            
            if not result.data:
                return None
            
            data = result.data[0]
            return MessageLog(
                id=data["id"],
                template_id=data.get("template_id"),
                recipient_id=data.get("recipient_id"),
                recipient_email=data.get("recipient_email"),
                recipient_phone=data.get("recipient_phone"),
                type=MessageType(data["type"]),
                subject=data.get("subject"),
                content=data["content"],
                variables_used=data.get("variables_used", {}),
                status=MessageStatus(data["status"]),
                error_message=data.get("error_message"),
                sent_at=datetime.fromisoformat(data["sent_at"].replace("Z", "+00:00")) if data.get("sent_at") and isinstance(data["sent_at"], str) else data.get("sent_at"),
                delivered_at=datetime.fromisoformat(data["delivered_at"].replace("Z", "+00:00")) if data.get("delivered_at") and isinstance(data["delivered_at"], str) else data.get("delivered_at"),
                created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")) if isinstance(data["created_at"], str) else data["created_at"]
            )
        except Exception as e:
            logger.error(f"Error fetching message log: {str(e)}")
            return None
    
    async def get_by_template_id(self, template_id: str) -> list[MessageLog]:
        """Get message logs by template ID"""
        try:
            supabase = get_supabase_client()
            result = supabase.table("message_logs").select("*").eq("template_id", template_id).execute()
            
            logs = []
            for data in result.data:
                logs.append(MessageLog(
                    id=data["id"],
                    template_id=data.get("template_id"),
                    recipient_id=data.get("recipient_id"),
                    recipient_email=data.get("recipient_email"),
                    recipient_phone=data.get("recipient_phone"),
                    type=MessageType(data["type"]),
                    subject=data.get("subject"),
                    content=data["content"],
                    variables_used=data.get("variables_used", {}),
                    status=MessageStatus(data["status"]),
                    error_message=data.get("error_message"),
                    sent_at=datetime.fromisoformat(data["sent_at"].replace("Z", "+00:00")) if data.get("sent_at") and isinstance(data["sent_at"], str) else data.get("sent_at"),
                    delivered_at=datetime.fromisoformat(data["delivered_at"].replace("Z", "+00:00")) if data.get("delivered_at") and isinstance(data["delivered_at"], str) else data.get("delivered_at"),
                    created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")) if isinstance(data["created_at"], str) else data["created_at"]
                ))
            return logs
        except Exception as e:
            logger.error(f"Error fetching message logs: {str(e)}")
            return []


class SupabaseOrganizationSettingsRepository:
    """Organization settings repository implementation using Supabase"""
    
    async def get_settings(self) -> Optional[OrganizationSettings]:
        """Get organization settings"""
        try:
            supabase = get_supabase_client()
            result = supabase.table("organization_settings").select("*").limit(1).execute()
            
            if not result.data:
                return None
            
            data = result.data[0]
            return OrganizationSettings(
                id=data.get("id"),
                email_config=data.get("email_config"),
                whatsapp_config=data.get("whatsapp_config"),
                created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")) if data.get("created_at") and isinstance(data["created_at"], str) else data.get("created_at"),
                updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")) if data.get("updated_at") and isinstance(data["updated_at"], str) else data.get("updated_at")
            )
        except Exception as e:
            logger.error(f"Error fetching organization settings: {str(e)}")
            return None
    
    async def update_settings(self, settings: OrganizationSettings) -> OrganizationSettings:
        """Update organization settings"""
        try:
            supabase = get_supabase_client()
            data = settings.model_dump(exclude={"id", "created_at", "updated_at"})
            
            result = supabase.table("organization_settings").update(data).eq("id", settings.id).execute()
            data = result.data[0]
            
            return OrganizationSettings(
                id=data.get("id"),
                email_config=data.get("email_config"),
                whatsapp_config=data.get("whatsapp_config"),
                created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")) if data.get("created_at") and isinstance(data["created_at"], str) else data.get("created_at"),
                updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")) if data.get("updated_at") and isinstance(data["updated_at"], str) else data.get("updated_at")
            )
        except Exception as e:
            logger.error(f"Error updating organization settings: {str(e)}")
            raise
    
    async def get_email_config(self) -> Optional[Dict[str, Any]]:
        """Get email configuration"""
        settings = await self.get_settings()
        return settings.email_config if settings else None
    
    async def get_whatsapp_config(self) -> Optional[Dict[str, Any]]:
        """Get WhatsApp configuration"""
        settings = await self.get_settings()
        return settings.whatsapp_config if settings else None

