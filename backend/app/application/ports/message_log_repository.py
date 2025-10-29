"""
Message log repository port (interface)
"""
from typing import Protocol, Optional, Dict, Any
from app.domain.entities import MessageLog


class MessageLogRepository(Protocol):
    """Repository for managing message logs"""
    
    async def create(self, message_log: Dict[str, Any]) -> MessageLog:
        """Create a new message log"""
        ...
    
    async def get_by_id(self, log_id: str) -> Optional[MessageLog]:
        """Get message log by ID"""
        ...
    
    async def get_by_template_id(self, template_id: str) -> list[MessageLog]:
        """Get message logs by template ID"""
        ...

