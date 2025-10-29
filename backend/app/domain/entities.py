"""
Domain entities for the communication domain
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

from app.domain.value_objects import MessageStatus, MessageType, TemplateType


class Template(BaseModel):
    """Template entity"""
    id: str
    name: str
    type: TemplateType
    subject: Optional[str] = None
    content: str
    variables: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class MessageLog(BaseModel):
    """Message log entity"""
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


class OrganizationSettings(BaseModel):
    """Organization settings entity"""
    id: Optional[str] = None
    email_config: Optional[Dict[str, Any]] = None
    whatsapp_config: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

