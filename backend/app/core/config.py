from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Studious Fiesta API"
    secret_key: str = "dev-secret-key-change-in-production"
    database_url: str = "sqlite:///./studious_fiesta.db"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
