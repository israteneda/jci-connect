"""
Communication API endpoints for JCI Connect
Refactored to use hexagonal architecture with use cases
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any
import logging

from app.application.schemas import (
    SendMessageRequest, MessageResponse, TemplatePreviewRequest, TemplatePreviewResponse
)
from app.application.use_cases.send_message_use_case import SendMessageUseCase
from app.application.use_cases.preview_template_use_case import PreviewTemplateUseCase
from app.domain.exceptions import (
    TemplateNotFoundError, ConfigurationNotFoundError, MessageSendError, InvalidTemplateTypeError
)
from app.interfaces.api.dependencies import (
    get_send_message_use_case, get_preview_template_use_case,
    get_email_adapter, get_whatsapp_adapter,
    get_organization_settings_repository
)
from app.infrastructure.adapters.email_adapter import EmailAdapter
from app.infrastructure.adapters.whatsapp_adapter import WhatsAppAdapter
from app.domain.value_objects import SMTPConfig, WhatsAppConfig

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/communication", tags=["communication"])


@router.post("/send-message", response_model=MessageResponse)
async def send_message(
    message_data: SendMessageRequest,
    send_message_use_case: SendMessageUseCase = Depends(get_send_message_use_case)
) -> MessageResponse:
    """
    Send a message using a template
    
    Args:
        message_data: Message sending data
        send_message_use_case: Send message use case
        
    Returns:
        MessageResponse with sending results
    """
    try:
        result = await send_message_use_case.execute(
            template_id=message_data.template_id,
            recipient_email=message_data.recipient_email,
            recipient_phone=message_data.recipient_phone,
            variables=message_data.variables
        )
        
        return MessageResponse(
            success=result["success"],
            message=result.get("message", "Message processed"),
            data=result
        )
        
    except (TemplateNotFoundError, ConfigurationNotFoundError, InvalidTemplateTypeError) as e:
        logger.error(f"Failed to send message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if isinstance(e, (TemplateNotFoundError, ConfigurationNotFoundError)) else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except MessageSendError as e:
        logger.error(f"Failed to send message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to send message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )


@router.post("/preview-template", response_model=TemplatePreviewResponse)
async def preview_template(
    template_id: str,
    variables: Dict[str, Any],
    preview_template_use_case: PreviewTemplateUseCase = Depends(get_preview_template_use_case)
) -> TemplatePreviewResponse:
    """
    Preview a template with variables replaced
    
    Args:
        template_id: Template ID to preview
        variables: Variables to replace in template
        preview_template_use_case: Preview template use case
        
    Returns:
        TemplatePreview with rendered content
    """
    try:
        result = await preview_template_use_case.execute(template_id, variables)
        
        return TemplatePreviewResponse(
            template_id=result["template_id"],
            content=result["content"],
            subject=result.get("subject"),
            variables_used=result["variables_used"]
        )
        
    except (TemplateNotFoundError, ValueError) as e:
        logger.error(f"Failed to preview template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if isinstance(e, TemplateNotFoundError) else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to preview template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to preview template: {str(e)}"
        )


@router.post("/test-email", response_model=MessageResponse)
async def test_email_connection(
    test_email: str,
    email_adapter: EmailAdapter = Depends(get_email_adapter)
) -> MessageResponse:
    """
    Test SMTP email configuration
    
    Args:
        test_email: Email address to send test message to
        email_adapter: Email adapter
        
    Returns:
        MessageResponse with test results
    """
    try:
        org_settings_repo = get_organization_settings_repository()
        
        email_config_data = await org_settings_repo.get_email_config()
        
        if not email_config_data:
            return MessageResponse(
                success=False,
                message="Email configuration not found in database",
                data={"error": "No email configuration found"}
            )
        
        smtp_config = SMTPConfig(**email_config_data)
        
        # Test connection
        connection_result = await email_adapter.test_connection(smtp_config)
        
        if not connection_result.get("success"):
            return MessageResponse(
                success=False,
                message="SMTP connection test failed",
                data=connection_result
            )
        
        # Send test email
        test_result = await email_adapter.send(
            recipient=test_email,
            content="<h1>SMTP Test Successful!</h1><p>Your email configuration is working correctly.</p>",
            subject="JCI Connect - SMTP Test",
            variables={},
            config=smtp_config
        )
        
        return MessageResponse(
            success=test_result.get("success", False),
            message=test_result.get("message", "Email test completed"),
            data={
                "connection_test": connection_result,
                "email_test": test_result
            }
        )
        
    except Exception as e:
        logger.error(f"Email test failed: {str(e)}")
        return MessageResponse(
            success=False,
            message=f"Email test failed: {str(e)}",
            data={"error": str(e)}
        )


@router.post("/test-whatsapp", response_model=MessageResponse)
async def test_whatsapp_connection(
    test_phone: str,
    whatsapp_adapter: WhatsAppAdapter = Depends(get_whatsapp_adapter)
) -> MessageResponse:
    """
    Test WhatsApp Evolution API configuration
    
    Args:
        test_phone: Phone number to send test message to
        whatsapp_adapter: WhatsApp adapter
        
    Returns:
        MessageResponse with test results
    """
    try:
        org_settings_repo = get_organization_settings_repository()
        
        whatsapp_config_data = await org_settings_repo.get_whatsapp_config()
        
        if not whatsapp_config_data:
            return MessageResponse(
                success=False,
                message="WhatsApp configuration not found in database",
                data={"error": "No WhatsApp configuration found"}
            )
        
        wa_config = WhatsAppConfig(**whatsapp_config_data)
        
        # Test connection
        connection_result = await whatsapp_adapter.test_connection(wa_config)
        
        if not connection_result.get("success"):
            return MessageResponse(
                success=False,
                message="WhatsApp connection test failed",
                data=connection_result
            )
        
        # Send test message
        test_result = await whatsapp_adapter.send(
            recipient=test_phone,
            content="*JCI Connect - WhatsApp Test*\n\nYour WhatsApp configuration is working correctly!",
            subject=None,
            variables={},
            config=wa_config
        )
        
        return MessageResponse(
            success=test_result.get("success", False),
            message=test_result.get("message", "WhatsApp test completed"),
            data={
                "connection_test": connection_result,
                "message_test": test_result
            }
        )
        
    except Exception as e:
        logger.error(f"WhatsApp test failed: {str(e)}")
        return MessageResponse(
            success=False,
            message=f"WhatsApp test failed: {str(e)}",
            data={"error": str(e)}
        )


@router.get("/whatsapp/status", response_model=MessageResponse)
async def get_whatsapp_status(
    whatsapp_adapter: WhatsAppAdapter = Depends(get_whatsapp_adapter)
) -> MessageResponse:
    """
    Get WhatsApp instance status
    
    Args:
        whatsapp_adapter: WhatsApp adapter
        
    Returns:
        MessageResponse with WhatsApp status
    """
    try:
        from app.interfaces.api.dependencies import get_organization_settings_repository
        org_settings_repo = get_organization_settings_repository()
        
        whatsapp_config_data = await org_settings_repo.get_whatsapp_config()
        
        if not whatsapp_config_data:
            return MessageResponse(
                success=False,
                message="WhatsApp configuration not found",
                data={"error": "No WhatsApp configuration"}
            )
        
        from app.domain.value_objects import WhatsAppConfig
        wa_config = WhatsAppConfig(**whatsapp_config_data)
        
        status_result = await whatsapp_adapter.get_instance_status(wa_config)
        
        return MessageResponse(
            success=status_result.get("success", False),
            message="WhatsApp status retrieved",
            data=status_result
        )
        
    except Exception as e:
        logger.error(f"Failed to get WhatsApp status: {str(e)}")
        return MessageResponse(
            success=False,
            message=f"Failed to get WhatsApp status: {str(e)}",
            data={"error": str(e)}
        )


@router.get("/whatsapp/qr", response_model=MessageResponse)
async def get_whatsapp_qr(
    whatsapp_adapter: WhatsAppAdapter = Depends(get_whatsapp_adapter)
) -> MessageResponse:
    """
    Get WhatsApp QR code for connection
    
    Args:
        whatsapp_adapter: WhatsApp adapter
        
    Returns:
        MessageResponse with QR code data
    """
    try:
        from app.interfaces.api.dependencies import get_organization_settings_repository
        org_settings_repo = get_organization_settings_repository()
        
        whatsapp_config_data = await org_settings_repo.get_whatsapp_config()
        
        if not whatsapp_config_data:
            return MessageResponse(
                success=False,
                message="WhatsApp configuration not found",
                data={"error": "No WhatsApp configuration"}
            )
        
        from app.domain.value_objects import WhatsAppConfig
        wa_config = WhatsAppConfig(**whatsapp_config_data)
        
        qr_result = await whatsapp_adapter.get_qr_code(wa_config)
        
        return MessageResponse(
            success=qr_result.get("success", False),
            message="WhatsApp QR code retrieved",
            data=qr_result
        )
        
    except Exception as e:
        logger.error(f"Failed to get WhatsApp QR code: {str(e)}")
        return MessageResponse(
            success=False,
            message=f"Failed to get WhatsApp QR code: {str(e)}",
            data={"error": str(e)}
        )

