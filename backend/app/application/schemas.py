"""
Request and response schemas for the application layer
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field


class SendMessageRequest(BaseModel):
    """Schema for sending a message"""
    template_id: str
    recipient_email: Optional[EmailStr] = None
    recipient_phone: Optional[str] = None
    variables: Dict[str, Any] = Field(default_factory=dict)


class MessageResponse(BaseModel):
    """Standard API response schema"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class TemplatePreviewRequest(BaseModel):
    """Schema for previewing a template"""
    template_id: str
    variables: Dict[str, Any] = Field(default_factory=dict)


class TemplatePreviewResponse(BaseModel):
    """Template preview response"""
    template_id: str
    content: str
    subject: Optional[str] = None
    variables_used: Dict[str, Any]

