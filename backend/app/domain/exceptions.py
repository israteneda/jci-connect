"""
Domain exceptions for the communication domain
"""


class DomainException(Exception):
    """Base domain exception"""
    pass


class TemplateNotFoundError(DomainException):
    """Raised when a template is not found"""
    pass


class ConfigurationNotFoundError(DomainException):
    """Raised when configuration is not found"""
    pass


class MessageSendError(DomainException):
    """Raised when message sending fails"""
    pass


class InvalidTemplateTypeError(DomainException):
    """Raised when template type is invalid"""
    pass

