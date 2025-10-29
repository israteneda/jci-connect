"""
Use case for previewing templates with variables
"""
import logging
from typing import Dict, Any
from jinja2 import Template

from app.domain.exceptions import TemplateNotFoundError
from app.application.ports.template_repository import TemplateRepository

logger = logging.getLogger(__name__)


class PreviewTemplateUseCase:
    """Use case for previewing templates"""
    
    def __init__(self, template_repository: TemplateRepository):
        self.template_repository = template_repository
    
    def render_template(self, template_content: str, variables: Dict[str, Any]) -> str:
        """Render template with variables"""
        try:
            template = Template(template_content)
            return template.render(**variables)
        except Exception as e:
            logger.error(f"Failed to render template: {str(e)}")
            raise ValueError(f"Template rendering failed: {str(e)}")
    
    async def execute(self, template_id: str, variables: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Preview a template with variables replaced
        
        Args:
            template_id: Template ID to preview
            variables: Variables to replace in template
            
        Returns:
            Dict with rendered content
            
        Raises:
            TemplateNotFoundError: If template not found
        """
        if variables is None:
            variables = {}
        
        # Get template
        template = await self.template_repository.get_by_id(template_id)
        if not template:
            raise TemplateNotFoundError(f"Template with id {template_id} not found")
        
        # Render content
        rendered_content = self.render_template(template.content, variables)
        rendered_subject = self.render_template(template.subject or "", variables) if template.subject else None
        
        return {
            "template_id": template_id,
            "content": rendered_content,
            "subject": rendered_subject,
            "variables_used": variables
        }

