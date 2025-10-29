"""
Dependency injection for the API layer
"""
from app.infrastructure.database.supabase_adapter import (
    SupabaseTemplateRepository,
    SupabaseMessageLogRepository,
    SupabaseOrganizationSettingsRepository
)
from app.infrastructure.adapters.email_adapter import EmailAdapter
from app.infrastructure.adapters.whatsapp_adapter import WhatsAppAdapter
from app.application.use_cases.send_message_use_case import SendMessageUseCase
from app.application.use_cases.preview_template_use_case import PreviewTemplateUseCase


def get_template_repository() -> SupabaseTemplateRepository:
    """Get template repository instance"""
    return SupabaseTemplateRepository()


def get_message_log_repository() -> SupabaseMessageLogRepository:
    """Get message log repository instance"""
    return SupabaseMessageLogRepository()


def get_organization_settings_repository() -> SupabaseOrganizationSettingsRepository:
    """Get organization settings repository instance"""
    return SupabaseOrganizationSettingsRepository()


def get_email_adapter() -> EmailAdapter:
    """Get email adapter instance"""
    return EmailAdapter()


def get_whatsapp_adapter() -> WhatsAppAdapter:
    """Get WhatsApp adapter instance"""
    return WhatsAppAdapter()


def get_send_message_use_case() -> SendMessageUseCase:
    """Get send message use case instance"""
    return SendMessageUseCase(
        template_repository=get_template_repository(),
        message_log_repository=get_message_log_repository(),
        organization_settings_repository=get_organization_settings_repository(),
        email_sender=get_email_adapter(),
        whatsapp_sender=get_whatsapp_adapter()
    )


def get_preview_template_use_case() -> PreviewTemplateUseCase:
    """Get preview template use case instance"""
    return PreviewTemplateUseCase(
        template_repository=get_template_repository()
    )

