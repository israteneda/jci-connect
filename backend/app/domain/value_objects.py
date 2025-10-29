"""
Value objects for the communication domain
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from enum import Enum


class MessageStatus(str, Enum):
    """Message status enumeration"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    DELIVERED = "delivered"


class MessageType(str, Enum):
    """Message type enumeration"""
    EMAIL = "email"
    WHATSAPP = "whatsapp"


class TemplateType(str, Enum):
    """Template type enumeration"""
    EMAIL = "email"
    WHATSAPP = "whatsapp"


class SMTPConfig(BaseModel):
    """SMTP configuration value object"""
    host: str
    port: int = 587
    username: str
    password: str
    use_tls: bool = True
    from_email: str
    from_name: str


class WhatsAppConfig(BaseModel):
    """WhatsApp Evolution API configuration value object"""
    api_url: str
    api_key: str
    instance_name: str
    webhook_url: Optional[str] = None

