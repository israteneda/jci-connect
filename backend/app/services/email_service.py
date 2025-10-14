"""
SMTP Email Service for JCI Connect
Handles sending emails using SMTP configuration
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from typing import Optional, Dict, Any
import logging
from jinja2 import Template

from app.core.config import settings
from app.models.schemas import SMTPConfig, MessageStatus

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP"""
    
    def __init__(self, email_config: Optional[Dict[str, Any]] = None):
        """
        Initialize email service with SMTP configuration from database
        
        Args:
            email_config: Email configuration from organization_settings.email_config
        """
        if not email_config:
            email_config = {}
        
        self.config = SMTPConfig(
            host=email_config.get("smtp_host", ""),
            port=email_config.get("smtp_port", 587),
            username=email_config.get("smtp_username", ""),
            password=email_config.get("smtp_password", ""),
            use_tls=email_config.get("smtp_use_tls", True),
            from_email=email_config.get("from_email", ""),
            from_name=email_config.get("from_name", "JCI Connect")
        )
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        content: str,
        is_html: bool = True
    ) -> Dict[str, Any]:
        """
        Send an email via SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            content: Email content (HTML or plain text)
            is_html: Whether content is HTML (default: True)
            
        Returns:
            Dict with success status and details
        """
        try:
            # Validate configuration
            if not self.config.host or not self.config.username:
                return {
                    "success": False,
                    "error": "SMTP configuration incomplete",
                    "status": MessageStatus.FAILED
                }
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = formataddr((self.config.from_name, self.config.from_email))
            message["To"] = to_email
            
            # Add content
            if is_html:
                html_part = MIMEText(content, "html", "utf-8")
                message.attach(html_part)
            else:
                text_part = MIMEText(content, "plain", "utf-8")
                message.attach(text_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.config.host,
                port=self.config.port,
                username=self.config.username,
                password=self.config.password,
                use_tls=self.config.use_tls,
                start_tls=self.config.use_tls
            )
            
            logger.info(f"Email sent successfully to {to_email}")
            return {
                "success": True,
                "message": "Email sent successfully",
                "status": MessageStatus.SENT,
                "recipient": to_email,
                "subject": subject
            }
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "status": MessageStatus.FAILED,
                "recipient": to_email,
                "subject": subject
            }
    
    def render_template(
        self,
        template_content: str,
        variables: Dict[str, Any]
    ) -> str:
        """
        Render email template with variables
        
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
            logger.error(f"Failed to render template: {str(e)}")
            raise ValueError(f"Template rendering failed: {str(e)}")
    
    async def send_template_email(
        self,
        to_email: str,
        template_content: str,
        subject: str,
        variables: Dict[str, Any],
        is_html: bool = True
    ) -> Dict[str, Any]:
        """
        Send email using a template with variables
        
        Args:
            to_email: Recipient email address
            template_content: Email template content
            subject: Email subject (can contain variables)
            variables: Variables to replace in template and subject
            is_html: Whether content is HTML (default: True)
            
        Returns:
            Dict with success status and details
        """
        try:
            # Render subject with variables
            rendered_subject = self.render_template(subject, variables)
            
            # Render content with variables
            rendered_content = self.render_template(template_content, variables)
            
            # Send email
            return await self.send_email(
                to_email=to_email,
                subject=rendered_subject,
                content=rendered_content,
                is_html=is_html
            )
            
        except Exception as e:
            logger.error(f"Failed to send template email to {to_email}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "status": MessageStatus.FAILED,
                "recipient": to_email
            }
    
    def validate_config(self) -> Dict[str, Any]:
        """
        Validate SMTP configuration
        
        Returns:
            Dict with validation status and details
        """
        errors = []
        
        if not self.config.host:
            errors.append("SMTP host is required")
        
        if not self.config.username:
            errors.append("SMTP username is required")
        
        if not self.config.password:
            errors.append("SMTP password is required")
        
        if not self.config.from_email:
            errors.append("From email is required")
        
        if self.config.port <= 0 or self.config.port > 65535:
            errors.append("Invalid SMTP port")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "config": {
                "host": self.config.host,
                "port": self.config.port,
                "username": self.config.username,
                "use_tls": self.config.use_tls,
                "from_email": self.config.from_email,
                "from_name": self.config.from_name
            } if len(errors) == 0 else None
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test SMTP connection
        
        Returns:
            Dict with connection test results
        """
        try:
            # Create a test message
            test_message = MIMEText("This is a test email from JCI Connect.", "plain", "utf-8")
            test_message["Subject"] = "JCI Connect - SMTP Test"
            test_message["From"] = formataddr((self.config.from_name, self.config.from_email))
            test_message["To"] = self.config.from_email  # Send to self for testing
            
            # Try to send (but don't actually send)
            # This will test the connection without sending an email
            smtp = aiosmtplib.SMTP(
                hostname=self.config.host,
                port=self.config.port,
                use_tls=self.config.use_tls,
                start_tls=self.config.use_tls
            )
            
            await smtp.connect()
            await smtp.login(self.config.username, self.config.password)
            await smtp.quit()
            
            return {
                "success": True,
                "message": "SMTP connection successful",
                "host": self.config.host,
                "port": self.config.port
            }
            
        except Exception as e:
            logger.error(f"SMTP connection test failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "host": self.config.host,
                "port": self.config.port
            }
