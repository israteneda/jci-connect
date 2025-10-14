"""
Communication API endpoints for JCI Connect
Handles email and WhatsApp message sending
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any
import logging

from app.models.schemas import (
    MessageSend, MessageResponse, ErrorResponse,
    SMTPConfig, WhatsAppConfig, TemplatePreview
)
from app.services.email_service import EmailService
from app.services.whatsapp_service import WhatsAppService
from app.services.config_service import ConfigService
from app.utils.database import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/communication", tags=["communication"])


@router.post("/send-message", response_model=MessageResponse)
async def send_message(
    message_data: MessageSend,
    supabase=Depends(get_supabase_client)
) -> MessageResponse:
    """
    Send a message using a template
    
    Args:
        message_data: Message sending data
        supabase: Supabase client dependency
        
    Returns:
        MessageResponse with sending results
    """
    try:
        # Get template from database
        template_result = supabase.table("message_templates").select("*").eq("id", message_data.template_id).execute()
        
        if not template_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        template = template_result.data[0]
        
        # Get organization settings for configuration
        settings_result = supabase.table("organization_settings").select("*").execute()
        org_settings = settings_result.data[0] if settings_result.data else {}
        
        # Send message based on template type
        if template["type"] == "email":
            if not message_data.recipient_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email recipient is required for email templates"
                )
            
            # Get SMTP configuration
            email_config_data = org_settings.get("email_config", {})
            if not email_config_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email configuration not found"
                )
            
            smtp_config = SMTPConfig(**email_config_data)
            email_service = EmailService(smtp_config)
            
            # Send email
            result = await email_service.send_template_email(
                to_email=message_data.recipient_email,
                template_content=template["content"],
                subject=template["subject"] or "Message from JCI Connect",
                variables=message_data.variables,
                is_html=True
            )
            
        elif template["type"] == "whatsapp":
            if not message_data.recipient_phone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phone number is required for WhatsApp templates"
                )
            
            # Get WhatsApp configuration
            whatsapp_config_data = org_settings.get("whatsapp_config", {})
            if not whatsapp_config_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="WhatsApp configuration not found"
                )
            
            whatsapp_config = WhatsAppConfig(**whatsapp_config_data)
            whatsapp_service = WhatsAppService(whatsapp_config)
            
            # Send WhatsApp message
            result = await whatsapp_service.send_template_message(
                to_phone=message_data.recipient_phone,
                template_content=template["content"],
                variables=message_data.variables
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported template type: {template['type']}"
            )
        
        # Log message in database
        log_data = {
            "template_id": message_data.template_id,
            "recipient_email": message_data.recipient_email,
            "recipient_phone": message_data.recipient_phone,
            "type": template["type"],
            "subject": template.get("subject"),
            "content": template["content"],
            "variables_used": message_data.variables,
            "status": result["status"],
            "error_message": result.get("error"),
            "sent_at": "now()" if result["success"] else None
        }
        
        supabase.table("message_logs").insert(log_data).execute()
        
        return MessageResponse(
            success=result["success"],
            message=result.get("message", "Message processed"),
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )


@router.post("/preview-template", response_model=TemplatePreview)
async def preview_template(
    template_id: str,
    variables: Dict[str, Any],
    supabase=Depends(get_supabase_client)
) -> TemplatePreview:
    """
    Preview a template with variables replaced
    
    Args:
        template_id: Template ID to preview
        variables: Variables to replace in template
        supabase: Supabase client dependency
        
    Returns:
        TemplatePreview with rendered content
    """
    try:
        # Get template from database
        template_result = supabase.table("message_templates").select("*").eq("id", template_id).execute()
        
        if not template_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        template = template_result.data[0]
        
        # Render template based on type
        if template["type"] == "email":
            email_service = EmailService()
            rendered_content = email_service.render_template(template["content"], variables)
            rendered_subject = email_service.render_template(template["subject"] or "", variables)
            
            return TemplatePreview(
                template_id=template_id,
                content=rendered_content,
                subject=rendered_subject,
                variables_used=variables
            )
        
        elif template["type"] == "whatsapp":
            whatsapp_service = WhatsAppService()
            rendered_content = whatsapp_service.render_template(template["content"], variables)
            
            return TemplatePreview(
                template_id=template_id,
                content=rendered_content,
                subject=None,
                variables_used=variables
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported template type: {template['type']}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to preview template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to preview template: {str(e)}"
        )


@router.post("/test-email", response_model=MessageResponse)
async def test_email_connection(
    test_email: str,
    supabase=Depends(get_supabase_client)
) -> MessageResponse:
    """
    Test SMTP email configuration from database
    
    Args:
        test_email: Email address to send test message to
        supabase: Supabase client dependency
        
    Returns:
        MessageResponse with test results
    """
    try:
        config_service = ConfigService(supabase)
        email_config = await config_service.get_email_config()
        
        if not email_config:
            return MessageResponse(
                success=False,
                message="Email configuration not found in database",
                data={"error": "No email configuration found"}
            )
        
        email_service = EmailService(email_config)
        
        # Test connection
        connection_result = await email_service.test_connection()
        
        if not connection_result["success"]:
            return MessageResponse(
                success=False,
                message="SMTP connection test failed",
                data=connection_result
            )
        
        # Send test email
        test_result = await email_service.send_email(
            to_email=test_email,
            subject="JCI Connect - SMTP Test",
            content="<h1>SMTP Test Successful!</h1><p>Your email configuration is working correctly.</p>",
            is_html=True
        )
        
        return MessageResponse(
            success=test_result["success"],
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
    supabase=Depends(get_supabase_client)
) -> MessageResponse:
    """
    Test WhatsApp Evolution API configuration from database
    
    Args:
        test_phone: Phone number to send test message to
        supabase: Supabase client dependency
        
    Returns:
        MessageResponse with test results
    """
    try:
        config_service = ConfigService(supabase)
        whatsapp_config = await config_service.get_whatsapp_config()
        
        if not whatsapp_config:
            return MessageResponse(
                success=False,
                message="WhatsApp configuration not found in database",
                data={"error": "No WhatsApp configuration found"}
            )
        
        whatsapp_service = WhatsAppService(whatsapp_config)
        
        # Test connection
        connection_result = await whatsapp_service.test_connection()
        
        if not connection_result["success"]:
            return MessageResponse(
                success=False,
                message="WhatsApp connection test failed",
                data=connection_result
            )
        
        # Send test message
        test_result = await whatsapp_service.send_message(
            to_phone=test_phone,
            message="*JCI Connect - WhatsApp Test*\n\nYour WhatsApp configuration is working correctly!",
            message_type="text"
        )
        
        return MessageResponse(
            success=test_result["success"],
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
    supabase=Depends(get_supabase_client)
) -> MessageResponse:
    """
    Get WhatsApp instance status
    
    Args:
        supabase: Supabase client dependency
        
    Returns:
        MessageResponse with WhatsApp status
    """
    try:
        # Get WhatsApp configuration
        settings_result = supabase.table("organization_settings").select("whatsapp_config").execute()
        org_settings = settings_result.data[0] if settings_result.data else {}
        
        whatsapp_config_data = org_settings.get("whatsapp_config", {})
        if not whatsapp_config_data:
            return MessageResponse(
                success=False,
                message="WhatsApp configuration not found",
                data={"error": "No WhatsApp configuration"}
            )
        
        whatsapp_config = WhatsAppConfig(**whatsapp_config_data)
        whatsapp_service = WhatsAppService(whatsapp_config)
        
        # Get status
        status_result = await whatsapp_service.get_instance_status()
        
        return MessageResponse(
            success=status_result["success"],
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
    supabase=Depends(get_supabase_client)
) -> MessageResponse:
    """
    Get WhatsApp QR code for connection
    
    Args:
        supabase: Supabase client dependency
        
    Returns:
        MessageResponse with QR code data
    """
    try:
        # Get WhatsApp configuration
        settings_result = supabase.table("organization_settings").select("whatsapp_config").execute()
        org_settings = settings_result.data[0] if settings_result.data else {}
        
        whatsapp_config_data = org_settings.get("whatsapp_config", {})
        if not whatsapp_config_data:
            return MessageResponse(
                success=False,
                message="WhatsApp configuration not found",
                data={"error": "No WhatsApp configuration"}
            )
        
        whatsapp_config = WhatsAppConfig(**whatsapp_config_data)
        whatsapp_service = WhatsAppService(whatsapp_config)
        
        # Get QR code
        qr_result = await whatsapp_service.get_qr_code()
        
        return MessageResponse(
            success=qr_result["success"],
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


@router.get("/test-supabase")
async def test_supabase_connection(supabase=Depends(get_supabase_client)):
    """
    Test Supabase connection by fetching basic data
    
    Returns:
        Dict with connection status and sample data
    """
    try:
        logger.info("Testing Supabase connection...")
        
        # Try to get basic info about the database
        # First, let's try to get the current user (this tests authentication)
        try:
            user_result = supabase.auth.get_user()
            user_info = {
                "authenticated": True,
                "user_id": user_result.user.id if user_result.user else None,
                "email": user_result.user.email if user_result.user else None
            }
        except Exception as auth_error:
            logger.info("No authenticated user (this is normal for backend)")
            user_info = {
                "authenticated": False,
                "note": "Backend service - no user authentication required"
            }
        
        # Try to access a simple table - let's check if we can list tables
        # We'll try to access the message_templates table
        try:
            templates_result = supabase.table("message_templates").select("id").limit(1).execute()
            table_access = {
                "message_templates_accessible": True,
                "template_count": len(templates_result.data) if templates_result.data else 0
            }
        except Exception as table_error:
            logger.warning(f"Could not access message_templates table: {str(table_error)}")
            table_access = {
                "message_templates_accessible": False,
                "error": str(table_error)
            }
        
        # Try to access organization_settings table
        try:
            org_result = supabase.table("organization_settings").select("id").limit(1).execute()
            org_access = {
                "organization_settings_accessible": True,
                "settings_count": len(org_result.data) if org_result.data else 0
            }
        except Exception as org_error:
            logger.warning(f"Could not access organization_settings table: {str(org_error)}")
            org_access = {
                "organization_settings_accessible": False,
                "error": str(org_error)
            }
        
        # Try to access profiles table
        try:
            # Try to access profiles with service role (bypasses RLS)
            profiles_result = supabase.table("profiles").select("*").execute()
            profiles_access = {
                "profiles_accessible": True,
                "profiles_count": len(profiles_result.data) if profiles_result.data else 0,
                "profiles_data": profiles_result.data if profiles_result.data else [],
                "note": "Using service role key - should bypass RLS policies"
            }
            
            # If no data returned, it might be due to RLS policies
            if not profiles_result.data:
                logger.info("No profiles data returned - this might be due to RLS policies")
                profiles_access["note"] += " - No data returned, likely due to RLS policies"
                
        except Exception as profiles_error:
            logger.warning(f"Could not access profiles table: {str(profiles_error)}")
            profiles_access = {
                "profiles_accessible": False,
                "error": str(profiles_error)
            }
        
        return {
            "success": True,
            "message": "Supabase connection test completed",
            "connection_status": "Connected",
            "supabase_url": supabase.supabase_url,
            "user_info": user_info,
            "table_access": {
                "message_templates": table_access,
                "organization_settings": org_access,
                "profiles": profiles_access
            }
        }
        
    except Exception as e:
        logger.error(f"Supabase connection test failed: {str(e)}")
        return {
            "success": False,
            "message": f"Supabase connection test failed: {str(e)}",
            "connection_status": "Failed",
            "error": str(e)
        }


@router.get("/test-profiles")
async def test_profiles_access(supabase=Depends(get_supabase_client)):
    """
    Test direct access to profiles table with RLS bypass
    
    Returns:
        Dict with profiles data and access details
    """
    try:
        logger.info("Testing direct profiles access with RLS analysis...")
        
        # Try different approaches to access profiles
        results = {}
        
        # Approach 1: Basic select (should be blocked by RLS)
        try:
            basic_result = supabase.table("profiles").select("*").execute()
            results["basic_select"] = {
                "success": True,
                "count": len(basic_result.data) if basic_result.data else 0,
                "data": basic_result.data if basic_result.data else [],
                "note": "Basic select - may be blocked by RLS"
            }
        except Exception as e:
            results["basic_select"] = {
                "success": False,
                "error": str(e),
                "note": "Basic select failed - likely RLS blocking"
            }
        
        # Approach 2: Try to authenticate as service role with explicit headers
        try:
            # Try to set the role explicitly in the request
            service_result = supabase.table("profiles").select("*").execute()
            results["service_role_select"] = {
                "success": True,
                "count": len(service_result.data) if service_result.data else 0,
                "data": service_result.data if service_result.data else [],
                "note": "Service role select - should bypass RLS"
            }
        except Exception as e:
            results["service_role_select"] = {
                "success": False,
                "error": str(e),
                "note": "Service role select failed"
            }
        
        # Approach 2b: Try to use SQL function to bypass RLS
        try:
            # Try to execute the SQL function that bypasses RLS
            function_result = supabase.rpc('get_profiles_for_service_role').execute()
            results["function_select"] = {
                "success": True,
                "count": len(function_result.data) if function_result.data else 0,
                "data": function_result.data if function_result.data else [],
                "note": "SQL function select - should bypass RLS with SECURITY DEFINER"
            }
        except Exception as e:
            results["function_select"] = {
                "success": False,
                "error": str(e),
                "note": "SQL function select failed - function may not exist yet"
            }
        
        # Approach 2c: Try to get profiles count using function
        try:
            # Try to get count using the count function
            count_result = supabase.rpc('get_profiles_count').execute()
            results["count_function"] = {
                "success": True,
                "count": count_result.data if isinstance(count_result.data, int) else (count_result.data[0] if count_result.data and len(count_result.data) > 0 else 0),
                "note": "Count function - should bypass RLS"
            }
        except Exception as e:
            results["count_function"] = {
                "success": False,
                "error": str(e),
                "note": "Count function failed - function may not exist yet"
            }
        
        # Approach 3: Check if we can access auth.users to understand the issue
        try:
            # Try to access auth.users to see if we can get user info
            auth_result = supabase.table("auth.users").select("id, email").limit(1).execute()
            results["auth_users_access"] = {
                "success": True,
                "count": len(auth_result.data) if auth_result.data else 0,
                "data": auth_result.data if auth_result.data else [],
                "note": "Auth users access - checking if we can see users"
            }
        except Exception as e:
            results["auth_users_access"] = {
                "success": False,
                "error": str(e),
                "note": "Auth users access failed - this is expected"
            }
        
        # Approach 4: Try to get current user info
        try:
            user_info = supabase.auth.get_user()
            results["current_user"] = {
                "success": True,
                "user": user_info.user.dict() if user_info.user else None,
                "note": "Current authenticated user info"
            }
        except Exception as e:
            results["current_user"] = {
                "success": False,
                "error": str(e),
                "note": "No authenticated user - this is expected for backend service"
            }
        
        return {
            "success": True,
            "message": "Profiles access test completed with RLS analysis",
            "results": results,
            "supabase_url": supabase.supabase_url,
            "rls_analysis": {
                "issue": "RLS policies require user authentication (auth.uid())",
                "solution": "Service role should bypass RLS, but may need proper configuration",
                "policies": [
                    "Users can view their own profile (auth.uid() = id)",
                    "Admins can view all profiles (requires admin role in auth.users)",
                    "No policy for service role access"
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Profiles access test failed: {str(e)}")
        return {
            "success": False,
            "message": f"Profiles access test failed: {str(e)}",
            "error": str(e)
        }
