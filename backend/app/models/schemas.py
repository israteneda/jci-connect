"""
Pydantic schemas for API requests and responses
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    """Message type enumeration"""
    EMAIL = "email"
    WHATSAPP = "whatsapp"


class MessageStatus(str, Enum):
    """Message status enumeration"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    DELIVERED = "delivered"


class TemplateType(str, Enum):
    """Template type enumeration"""
    EMAIL = "email"
    WHATSAPP = "whatsapp"


# Template Schemas
class TemplateBase(BaseModel):
    """Base template schema"""
    name: str = Field(..., min_length=1, max_length=255)
    type: TemplateType
    subject: Optional[str] = Field(None, max_length=500)
    content: str = Field(..., min_length=1)
    variables: List[str] = Field(default_factory=list)
    is_active: bool = True


class TemplateCreate(TemplateBase):
    """Schema for creating a template"""
    pass


class TemplateUpdate(BaseModel):
    """Schema for updating a template"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = Field(None, min_length=1)
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None


class Template(TemplateBase):
    """Complete template schema"""
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Message Schemas
class MessageSend(BaseModel):
    """Schema for sending a message"""
    template_id: str
    recipient_email: Optional[EmailStr] = None
    recipient_phone: Optional[str] = None
    variables: Dict[str, Any] = Field(default_factory=dict)


class MessageLog(BaseModel):
    """Message log schema"""
    id: str
    template_id: Optional[str] = None
    recipient_id: Optional[str] = None
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    type: MessageType
    subject: Optional[str] = None
    content: str
    variables_used: Dict[str, Any] = Field(default_factory=dict)
    status: MessageStatus
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Configuration Schemas
class SMTPConfig(BaseModel):
    """SMTP configuration schema"""
    host: str
    port: int = 587
    username: str
    password: str
    use_tls: bool = True
    from_email: str
    from_name: str


class WhatsAppConfig(BaseModel):
    """WhatsApp Evolution API configuration schema"""
    api_url: str
    api_key: str
    instance_name: str
    webhook_url: Optional[str] = None


class CommunicationConfig(BaseModel):
    """Communication configuration schema"""
    smtp: Optional[SMTPConfig] = None
    whatsapp: Optional[WhatsAppConfig] = None


# Response Schemas
class MessageResponse(BaseModel):
    """Standard API response schema"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None


# Template Preview Schema
class TemplatePreview(BaseModel):
    """Template preview with variables replaced"""
    template_id: str
    content: str
    subject: Optional[str] = None
    variables_used: Dict[str, Any]
