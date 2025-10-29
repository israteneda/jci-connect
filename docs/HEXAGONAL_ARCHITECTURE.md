# Hexagonal Architecture Refactoring

## Overview

The backend has been refactored to follow **Hexagonal Architecture** (also known as Ports and Adapters pattern). This architecture separates the core business logic from external dependencies, making the code more testable, maintainable, and flexible.

## Architecture Layers

### 1. Domain Layer (`app/domain/`)

Contains the core business logic and domain concepts that are independent of any framework or technology.

- **Entities** (`entities.py`): Domain entities like `Template`, `MessageLog`, `OrganizationSettings`
- **Value Objects** (`value_objects.py`): Immutable value objects like `SMTPConfig`, `WhatsAppConfig`, `MessageStatus`, `TemplateType`
- **Repository Interfaces** (`repositories.py`): Protocols defining contracts for data access
- **Exceptions** (`exceptions.py`): Domain-specific exceptions

### 2. Application Layer (`app/application/`)

Contains use cases (application services) that orchestrate domain logic.

- **Use Cases** (`use_cases/`):
  - `send_message_use_case.py`: Orchestrates sending messages via email or WhatsApp
  - `preview_template_use_case.py`: Orchestrates template preview functionality
- **Ports** (`ports/`): Interfaces that define contracts for external dependencies
  - `template_repository.py`: Interface for template data access
  - `message_log_repository.py`: Interface for message log data access
  - `organization_settings_repository.py`: Interface for organization settings data access
  - `message_sender.py`: Interface for sending messages
- **Schemas** (`schemas.py`): Request/response models for the application layer

### 3. Infrastructure Layer (`app/infrastructure/`)

Contains implementations of adapters for external systems.

- **Database Adapters** (`database/`):
  - `supabase_adapter.py`: Implementations of repository interfaces using Supabase
  - `client.py`: Supabase client initialization
- **Service Adapters** (`adapters/`):
  - `email_adapter.py`: Email sending adapter implementing the MessageSender protocol
  - `whatsapp_adapter.py`: WhatsApp sending adapter implementing the MessageSender protocol

### 4. Interfaces Layer (`app/interfaces/`)

Contains external interfaces like REST API endpoints.

- **API** (`api/`):
  - `communication.py`: FastAPI routes for communication endpoints
  - `dependencies.py`: Dependency injection configuration

## Dependency Flow

```
Interfaces (API) → Application (Use Cases) → Domain (Business Logic)
                              ↓
                 Infrastructure (Adapters/Implementations)
```

The key principle is that **dependencies always point inward**:
- Domain has no dependencies on other layers
- Application depends only on Domain
- Infrastructure implements Domain ports/interfaces
- Interfaces depends on Application and Infrastructure

## Benefits

1. **Testability**: Each layer can be tested independently with mocked dependencies
2. **Maintainability**: Clear separation of concerns makes code easier to understand and modify
3. **Flexibility**: External dependencies can be swapped without changing business logic
4. **Scalability**: Easy to add new features or adapters
5. **Independence**: Core business logic is independent of frameworks, databases, or external services

## Usage Example

### Sending a Message

```python
# API endpoint (Interfaces layer)
@router.post("/send-message")
async def send_message(
    message_data: SendMessageRequest,
    send_message_use_case: SendMessageUseCase = Depends(get_send_message_use_case)
):
    result = await send_message_use_case.execute(...)
    return result

# Use case (Application layer)
class SendMessageUseCase:
    def __init__(self, template_repository, message_log_repository, ...):
        # Dependencies injected
        
    async def execute(self, template_id, recipient_email, ...):
        # Business logic here
        template = await self.template_repository.get_by_id(template_id)
        # ...

# Repository implementation (Infrastructure layer)
class SupabaseTemplateRepository:
    async def get_by_id(self, template_id: str):
        # Supabase implementation
        return template
```

## Migration Notes

### Old Structure
```
app/
├── api/
├── core/
├── models/
├── services/
└── utils/
```

### New Structure
```
app/
├── domain/
│   ├── entities.py
│   ├── value_objects.py
│   ├── repositories.py
│   └── exceptions.py
├── application/
│   ├── use_cases/
│   ├── ports/
│   └── schemas.py
├── infrastructure/
│   ├── database/
│   └── adapters/
├── interfaces/
│   └── api/
└── core/
    └── config.py
```

### Breaking Changes

The old files in `app/services/`, `app/api/`, and `app/models/` have been refactored. If you have code that imports from these locations, update your imports:

**Old:**
```python
from app.api.communication import router
from app.services.email_service import EmailService
```

**New:**
```python
from app.interfaces.api.communication import router
from app.infrastructure.adapters.email_adapter import EmailAdapter
```

## Testing

With hexagonal architecture, testing becomes much easier:

```python
# Test use case with mocked repositories
def test_send_message_use_case():
    mock_template_repo = Mock()
    mock_message_log_repo = Mock()
    # ... other mocks
    
    use_case = SendMessageUseCase(
        template_repository=mock_template_repo,
        ...
    )
    
    result = await use_case.execute(...)
    assert result["success"] == True
```

## Future Enhancements

- Add unit tests for each layer
- Add integration tests for API endpoints
- Add more adapters (e.g., different messaging services)
- Add CQRS pattern for read/write separation
- Add event-driven architecture with domain events

