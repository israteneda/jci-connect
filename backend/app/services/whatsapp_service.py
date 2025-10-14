"""
WhatsApp Evolution API Service for JCI Connect
Handles sending WhatsApp messages using Evolution API
"""
import httpx
import logging
from typing import Optional, Dict, Any, List
from jinja2 import Template

from app.core.config import settings
from app.models.schemas import WhatsAppConfig, MessageStatus

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Service for sending WhatsApp messages via Evolution API"""
    
    def __init__(self, whatsapp_config: Optional[Dict[str, Any]] = None):
        """
        Initialize WhatsApp service with Evolution API configuration from database
        
        Args:
            whatsapp_config: WhatsApp configuration from organization_settings.whatsapp_config
        """
        if not whatsapp_config:
            whatsapp_config = {}
        
        self.config = WhatsAppConfig(
            api_url=whatsapp_config.get("api_url", ""),
            api_key=whatsapp_config.get("api_key", ""),
            instance_name=whatsapp_config.get("instance_name", ""),
            webhook_url=whatsapp_config.get("webhook_url")
        )
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Evolution API requests"""
        return {
            "Content-Type": "application/json",
            "apikey": self.config.api_key
        }
    
    def _format_phone_number(self, phone: str) -> str:
        """
        Format phone number for WhatsApp (remove non-digits, add country code if needed)
        
        Args:
            phone: Phone number to format
            
        Returns:
            Formatted phone number
        """
        # Remove all non-digit characters
        digits_only = ''.join(filter(str.isdigit, phone))
        
        # If number doesn't start with country code, assume it's a local number
        # You might want to customize this based on your default country
        if len(digits_only) == 10:  # US/Canada local number
            digits_only = "1" + digits_only
        elif len(digits_only) == 11 and digits_only.startswith("1"):  # US/Canada with country code
            pass  # Already formatted
        elif len(digits_only) < 10:
            raise ValueError(f"Invalid phone number format: {phone}")
        
        return digits_only
    
    def render_template(
        self,
        template_content: str,
        variables: Dict[str, Any]
    ) -> str:
        """
        Render WhatsApp template with variables
        
        Args:
            template_content: Template content with Jinja2 syntax
            variables: Variables to replace in template
            
        Returns:
            Rendered content
        """
        try:
            template = Template(template_content)
            return template.render(**variables)
        except Exception as e:
            logger.error(f"Failed to render WhatsApp template: {str(e)}")
            raise ValueError(f"Template rendering failed: {str(e)}")
    
    async def send_message(
        self,
        to_phone: str,
        message: str,
        message_type: str = "text"
    ) -> Dict[str, Any]:
        """
        Send a WhatsApp message via Evolution API
        
        Args:
            to_phone: Recipient phone number
            message: Message content
            message_type: Type of message (text, image, document, etc.)
            
        Returns:
            Dict with success status and details
        """
        try:
            # Validate configuration
            if not self.config.api_url or not self.config.api_key or not self.config.instance_name:
                return {
                    "success": False,
                    "error": "WhatsApp configuration incomplete",
                    "status": MessageStatus.FAILED
                }
            
            # Format phone number
            formatted_phone = self._format_phone_number(to_phone)
            
            # Prepare message payload
            payload = {
                "number": formatted_phone,
                "text": message
            }
            
            # Add message type specific fields
            if message_type == "image":
                payload["media"] = message
                payload["mediatype"] = "image"
            elif message_type == "document":
                payload["media"] = message
                payload["mediatype"] = "document"
            
            # Send message via Evolution API
            url = f"{self.config.api_url}/message/sendText/{self.config.instance_name}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers(),
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    response_data = response.json()
                    logger.info(f"WhatsApp message sent successfully to {formatted_phone}")
                    return {
                        "success": True,
                        "message": "WhatsApp message sent successfully",
                        "status": MessageStatus.SENT,
                        "recipient": formatted_phone,
                        "message_id": response_data.get("key", {}).get("id"),
                        "response": response_data
                    }
                else:
                    error_msg = f"Evolution API error: {response.status_code} - {response.text}"
                    logger.error(f"WhatsApp send failed: {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg,
                        "status": MessageStatus.FAILED,
                        "recipient": formatted_phone
                    }
                    
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message to {to_phone}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "status": MessageStatus.FAILED,
                "recipient": to_phone
            }
    
    async def send_template_message(
        self,
        to_phone: str,
        template_content: str,
        variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send WhatsApp message using a template with variables
        
        Args:
            to_phone: Recipient phone number
            template_content: Message template content
            variables: Variables to replace in template
            
        Returns:
            Dict with success status and details
        """
        try:
            # Render template with variables
            rendered_message = self.render_template(template_content, variables)
            
            # Send message
            return await self.send_message(
                to_phone=to_phone,
                message=rendered_message,
                message_type="text"
            )
            
        except Exception as e:
            logger.error(f"Failed to send template WhatsApp message to {to_phone}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "status": MessageStatus.FAILED,
                "recipient": to_phone
            }
    
    async def get_instance_status(self) -> Dict[str, Any]:
        """
        Get Evolution API instance status
        
        Returns:
            Dict with instance status information
        """
        try:
            if not self.config.api_url or not self.config.instance_name:
                return {
                    "success": False,
                    "error": "WhatsApp configuration incomplete"
                }
            
            url = f"{self.config.api_url}/instance/connectionState/{self.config.instance_name}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self._get_headers(),
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "instance_name": self.config.instance_name,
                        "status": data.get("instance", {}).get("state"),
                        "connected": data.get("instance", {}).get("state") == "open",
                        "response": data
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to get instance status: {response.status_code}",
                        "instance_name": self.config.instance_name
                    }
                    
        except Exception as e:
            logger.error(f"Failed to get WhatsApp instance status: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "instance_name": self.config.instance_name
            }
    
    async def get_qr_code(self) -> Dict[str, Any]:
        """
        Get QR code for WhatsApp instance connection
        
        Returns:
            Dict with QR code information
        """
        try:
            if not self.config.api_url or not self.config.instance_name:
                return {
                    "success": False,
                    "error": "WhatsApp configuration incomplete"
                }
            
            url = f"{self.config.api_url}/instance/connect/{self.config.instance_name}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self._get_headers(),
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "qr_code": data.get("base64"),
                        "instance_name": self.config.instance_name,
                        "response": data
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to get QR code: {response.status_code}",
                        "instance_name": self.config.instance_name
                    }
                    
        except Exception as e:
            logger.error(f"Failed to get WhatsApp QR code: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "instance_name": self.config.instance_name
            }
    
    def validate_config(self) -> Dict[str, Any]:
        """
        Validate WhatsApp configuration
        
        Returns:
            Dict with validation status and details
        """
        errors = []
        
        if not self.config.api_url:
            errors.append("WhatsApp API URL is required")
        
        if not self.config.api_key:
            errors.append("WhatsApp API key is required")
        
        if not self.config.instance_name:
            errors.append("WhatsApp instance name is required")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "config": {
                "api_url": self.config.api_url,
                "instance_name": self.config.instance_name,
                "webhook_url": self.config.webhook_url
            } if len(errors) == 0 else None
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test WhatsApp Evolution API connection
        
        Returns:
            Dict with connection test results
        """
        try:
            # Get instance status to test connection
            status_result = await self.get_instance_status()
            
            if status_result["success"]:
                return {
                    "success": True,
                    "message": "WhatsApp connection successful",
                    "instance_name": self.config.instance_name,
                    "status": status_result.get("status"),
                    "connected": status_result.get("connected", False)
                }
            else:
                return {
                    "success": False,
                    "error": status_result.get("error", "Connection test failed"),
                    "instance_name": self.config.instance_name
                }
                
        except Exception as e:
            logger.error(f"WhatsApp connection test failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "instance_name": self.config.instance_name
            }
