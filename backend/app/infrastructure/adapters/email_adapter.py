"""
Email adapter for sending emails via SMTP
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from typing import Optional, Dict, Any
import logging
from jinja2 import Template

from app.domain.value_objects import SMTPConfig, MessageStatus
from app.application.ports.message_sender import MessageSender

logger = logging.getLogger(__name__)


class EmailAdapter(MessageSender):
    """Email adapter for sending emails via SMTP"""
    
    async def send(
        self,
        recipient: str,
        content: str,
        subject: Optional[str],
        variables: Dict[str, Any],
        config: SMTPConfig
    ) -> Dict[str, Any]:
        """
        Send an email via SMTP
        
        Args:
            recipient: Recipient email address
            content: Email content (with Jinja2 variables)
            subject: Email subject
            variables: Variables to replace in content
            config: SMTP configuration
            
        Returns:
            Dict with success status and details
        """
        try:
            # Validate configuration
            if not config.host or not config.username:
                return {
                    "success": False,
                    "error": "SMTP configuration incomplete",
                    "status": MessageStatus.FAILED.value
                }
            
            # Render template if variables provided
            if variables:
                content = self.render_template(content, variables)
                subject = self.render_template(subject, variables) if subject else None
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject or "Message from JCI Connect"
            message["From"] = formataddr((config.from_name, config.from_email))
            message["To"] = recipient
            
            # Add content (assume HTML by default)
            html_part = MIMEText(content, "html", "utf-8")
            message.attach(html_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=config.host,
                port=config.port,
                username=config.username,
                password=config.password,
                use_tls=config.use_tls,
                start_tls=config.use_tls
            )
            
            logger.info(f"Email sent successfully to {recipient}")
            return {
                "success": True,
                "message": "Email sent successfully",
                "status": MessageStatus.SENT.value,
                "recipient": recipient,
                "subject": subject
            }
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "status": MessageStatus.FAILED.value,
                "recipient": recipient,
                "subject": subject
            }
    
    def render_template(self, template_content: str, variables: Dict[str, Any]) -> str:
        """Render template with variables"""
        try:
            template = Template(template_content)
            return template.render(**variables)
        except Exception as e:
            logger.error(f"Failed to render template: {str(e)}")
            raise ValueError(f"Template rendering failed: {str(e)}")
    
    async def test_connection(self, config: SMTPConfig) -> Dict[str, Any]:
        """Test SMTP connection"""
        try:
            smtp = aiosmtplib.SMTP(
                hostname=config.host,
                port=config.port,
                use_tls=config.use_tls,
                start_tls=config.use_tls
            )
            
            await smtp.connect()
            await smtp.login(config.username, config.password)
            await smtp.quit()
            
            return {
                "success": True,
                "message": "SMTP connection successful",
                "host": config.host,
                "port": config.port
            }
            
        except Exception as e:
            logger.error(f"SMTP connection test failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "host": config.host,
                "port": config.port
            }

