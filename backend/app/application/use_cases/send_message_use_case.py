"""
Use case for sending messages via email or WhatsApp
"""
import logging
from typing import Dict, Any
from datetime import datetime

from app.domain.entities import Template
from app.domain.exceptions import (
    TemplateNotFoundError,
    ConfigurationNotFoundError,
    MessageSendError,
    InvalidTemplateTypeError
)
from app.application.ports.message_sender import MessageSender
from app.application.ports.template_repository import TemplateRepository
from app.application.ports.message_log_repository import MessageLogRepository
from app.application.ports.organization_settings_repository import OrganizationSettingsRepository
from app.domain.value_objects import SMTPConfig, WhatsAppConfig, MessageStatus

logger = logging.getLogger(__name__)


class SendMessageUseCase:
    """Use case for sending messages"""
    
    def __init__(
        self,
        template_repository: TemplateRepository,
        message_log_repository: MessageLogRepository,
        organization_settings_repository: OrganizationSettingsRepository,
        email_sender: MessageSender,
        whatsapp_sender: MessageSender
    ):
        self.template_repository = template_repository
        self.message_log_repository = message_log_repository
        self.organization_settings_repository = organization_settings_repository
        self.email_sender = email_sender
        self.whatsapp_sender = whatsapp_sender
    
    async def execute(
        self,
        template_id: str,
        recipient_email: str = None,
        recipient_phone: str = None,
        variables: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Send a message using a template
        
        Args:
            template_id: Template ID to use
            recipient_email: Recipient email (for email templates)
            recipient_phone: Recipient phone (for WhatsApp templates)
            variables: Variables to replace in template
            
        Returns:
            Dict with success status and details
            
        Raises:
            TemplateNotFoundError: If template not found
            ConfigurationNotFoundError: If configuration not found
            MessageSendError: If message sending fails
            InvalidTemplateTypeError: If template type is invalid
        """
        if variables is None:
            variables = {}
        
        # Get template
        template = await self.template_repository.get_by_id(template_id)
        if not template:
            raise TemplateNotFoundError(f"Template with id {template_id} not found")
        
        # Get organization settings
        settings = await self.organization_settings_repository.get_settings()
        if not settings:
            raise ConfigurationNotFoundError("Organization settings not found")
        
        # Send message based on template type
        result = {}
        
        if template.type.value == "email":
            if not recipient_email:
                raise ValueError("Email recipient is required for email templates")
            
            email_config = await self.organization_settings_repository.get_email_config()
            if not email_config:
                raise ConfigurationNotFoundError("Email configuration not found")
            
            smtp_config = SMTPConfig(**email_config)
            result = await self.email_sender.send(
                recipient_email,
                template.content,
                template.subject or "Message from JCI Connect",
                variables,
                smtp_config
            )
        
        elif template.type.value == "whatsapp":
            if not recipient_phone:
                raise ValueError("Phone number is required for WhatsApp templates")
            
            whatsapp_config = await self.organization_settings_repository.get_whatsapp_config()
            if not whatsapp_config:
                raise ConfigurationNotFoundError("WhatsApp configuration not found")
            
            wa_config = WhatsAppConfig(**whatsapp_config)
            result = await self.whatsapp_sender.send(
                recipient_phone,
                template.content,
                None,
                variables,
                wa_config
            )
        
        else:
            raise InvalidTemplateTypeError(f"Unsupported template type: {template.type}")
        
        # Log message
        message_log = {
            "template_id": template_id,
            "recipient_email": recipient_email,
            "recipient_phone": recipient_phone,
            "type": template.type.value,
            "subject": template.subject,
            "content": template.content,
            "variables_used": variables,
            "status": result.get("status", MessageStatus.FAILED),
            "error_message": result.get("error"),
            "sent_at": datetime.now() if result.get("success") else None
        }
        
        await self.message_log_repository.create(message_log)
        
        return {
            "success": result.get("success", False),
            "message": result.get("message", "Message processed"),
            "data": result
        }

