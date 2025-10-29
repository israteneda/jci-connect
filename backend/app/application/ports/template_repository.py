"""
Template repository port (interface)
"""
from typing import Protocol, Optional
from app.domain.entities import Template


class TemplateRepository(Protocol):
    """Repository for managing message templates"""
    
    async def get_by_id(self, template_id: str) -> Optional[Template]:
        """Get template by ID"""
        ...
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> list[Template]:
        """Get all templates"""
        ...
    
    async def create(self, template: Template) -> Template:
        """Create a new template"""
        ...
    
    async def update(self, template_id: str, template: Template) -> Template:
        """Update a template"""
        ...
    
    async def delete(self, template_id: str) -> bool:
        """Delete a template"""
        ...

