"""
Message sender port (interface)
"""
from typing import Protocol, Dict, Any, Optional
from app.domain.value_objects import SMTPConfig, WhatsAppConfig


class MessageSender(Protocol):
    """Interface for sending messages"""
    
    async def send(
        self,
        recipient: str,
        content: str,
        subject: Optional[str],
        variables: Dict[str, Any],
        config: SMTPConfig | WhatsAppConfig
    ) -> Dict[str, Any]:
        """
        Send a message
        
        Args:
            recipient: Recipient identifier (email or phone)
            content: Message content
            subject: Message subject (for email)
            variables: Variables to replace in content
            config: Configuration (SMTP or WhatsApp)
            
        Returns:
            Dict with success status and details
        """
        ...

