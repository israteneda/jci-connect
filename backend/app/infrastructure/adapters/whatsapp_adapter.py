"""
WhatsApp adapter for sending messages via Evolution API
"""
import httpx
import logging
from typing import Optional, Dict, Any
from jinja2 import Template

from app.domain.value_objects import WhatsAppConfig, MessageStatus
from app.application.ports.message_sender import MessageSender

logger = logging.getLogger(__name__)


class WhatsAppAdapter(MessageSender):
    """WhatsApp adapter for sending messages via Evolution API"""
    
    def _get_headers(self, api_key: str) -> Dict[str, str]:
        """Get headers for Evolution API requests"""
        return {
            "Content-Type": "application/json",
            "apikey": api_key
        }
    
    def _format_phone_number(self, phone: str) -> str:
        """Format phone number for WhatsApp"""
        digits_only = ''.join(filter(str.isdigit, phone))
        
        if len(digits_only) == 10:
            digits_only = "1" + digits_only
        elif len(digits_only) == 11 and digits_only.startswith("1"):
            pass
        elif len(digits_only) < 10:
            raise ValueError(f"Invalid phone number format: {phone}")
        
        return digits_only
    
    def render_template(self, template_content: str, variables: Dict[str, Any]) -> str:
        """Render template with variables"""
        try:
            template = Template(template_content)
            return template.render(**variables)
        except Exception as e:
            logger.error(f"Failed to render WhatsApp template: {str(e)}")
            raise ValueError(f"Template rendering failed: {str(e)}")
    
    async def send(
        self,
        recipient: str,
        content: str,
        subject: Optional[str],
        variables: Dict[str, Any],
        config: WhatsAppConfig
    ) -> Dict[str, Any]:
        """
        Send a WhatsApp message via Evolution API
        
        Args:
            recipient: Recipient phone number
            content: Message content (with Jinja2 variables)
            subject: Not used for WhatsApp
            variables: Variables to replace in content
            config: WhatsApp configuration
            
        Returns:
            Dict with success status and details
        """
        try:
            # Validate configuration
            if not config.api_url or not config.api_key or not config.instance_name:
                return {
                    "success": False,
                    "error": "WhatsApp configuration incomplete",
                    "status": MessageStatus.FAILED.value
                }
            
            # Format phone number
            formatted_phone = self._format_phone_number(recipient)
            
            # Render template if variables provided
            if variables:
                content = self.render_template(content, variables)
            
            # Prepare message payload
            payload = {
                "number": formatted_phone,
                "text": content
            }
            
            # Send message via Evolution API
            url = f"{config.api_url}/message/sendText/{config.instance_name}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers(config.api_key),
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    response_data = response.json()
                    logger.info(f"WhatsApp message sent successfully to {formatted_phone}")
                    return {
                        "success": True,
                        "message": "WhatsApp message sent successfully",
                        "status": MessageStatus.SENT.value,
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
                        "status": MessageStatus.FAILED.value,
                        "recipient": formatted_phone
                    }
                    
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message to {recipient}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "status": MessageStatus.FAILED.value,
                "recipient": recipient
            }
    
    async def get_instance_status(self, config: WhatsAppConfig) -> Dict[str, Any]:
        """Get Evolution API instance status"""
        try:
            if not config.api_url or not config.instance_name:
                return {
                    "success": False,
                    "error": "WhatsApp configuration incomplete"
                }
            
            url = f"{config.api_url}/instance/connectionState/{config.instance_name}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self._get_headers(config.api_key),
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "instance_name": config.instance_name,
                        "status": data.get("instance", {}).get("state"),
                        "connected": data.get("instance", {}).get("state") == "open",
                        "response": data
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to get instance status: {response.status_code}",
                        "instance_name": config.instance_name
                    }
                    
        except Exception as e:
            logger.error(f"Failed to get WhatsApp instance status: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "instance_name": config.instance_name
            }
    
    async def get_qr_code(self, config: WhatsAppConfig) -> Dict[str, Any]:
        """Get QR code for WhatsApp instance connection"""
        try:
            if not config.api_url or not config.instance_name:
                return {
                    "success": False,
                    "error": "WhatsApp configuration incomplete"
                }
            
            url = f"{config.api_url}/instance/connect/{config.instance_name}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self._get_headers(config.api_key),
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "qr_code": data.get("base64"),
                        "instance_name": config.instance_name,
                        "response": data
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to get QR code: {response.status_code}",
                        "instance_name": config.instance_name
                    }
                    
        except Exception as e:
            logger.error(f"Failed to get WhatsApp QR code: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "instance_name": config.instance_name
            }
    
    async def test_connection(self, config: WhatsAppConfig) -> Dict[str, Any]:
        """Test WhatsApp Evolution API connection"""
        try:
            status_result = await self.get_instance_status(config)
            
            if status_result.get("success"):
                return {
                    "success": True,
                    "message": "WhatsApp connection successful",
                    "instance_name": config.instance_name,
                    "status": status_result.get("status"),
                    "connected": status_result.get("connected", False)
                }
            else:
                return {
                    "success": False,
                    "error": status_result.get("error", "Connection test failed"),
                    "instance_name": config.instance_name
                }
                
        except Exception as e:
            logger.error(f"WhatsApp connection test failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "instance_name": config.instance_name
            }

