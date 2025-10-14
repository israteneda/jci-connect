"""
Configuration management for JCI Connect Backend
"""
from typing import Optional, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    app_name: str = "JCI Connect API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS Configuration
    cors_origins_list: list[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ]
    )
    
    # Supabase Configuration
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_anon_key: Optional[str] = Field(None, env="SUPABASE_ANON_KEY")
    supabase_secret_key: str = Field(..., env="SUPABASE_SECRET_KEY")
    
    # Note: SMTP and WhatsApp configurations are now stored in organization_settings table
    
    # Security
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    def __init__(self, **kwargs):
        # Handle CORS_ORIGINS from environment manually
        import os
        cors_origins_env = os.getenv('CORS_ORIGINS')
        if cors_origins_env:
            kwargs['cors_origins_list'] = [origin.strip() for origin in cors_origins_env.split(',')]
        super().__init__(**kwargs)
    
    @property
    def cors_origins(self):
        """Backward compatibility property for cors_origins"""
        return self.cors_origins_list
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables


# Global settings instance
settings = Settings()
