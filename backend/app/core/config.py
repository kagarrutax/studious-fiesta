from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Studious Party API"
    secret_key: str = "dev-secret-key-change-in-production"
    database_url: str = "sqlite:///./studious_party.db"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    upload_dir: str = "uploads"
    rate_limit_enabled: bool = True
    rate_limit_login_per_minute: int = 20
    rate_limit_register_per_minute: int = 10
    rate_limit_upload_per_minute: int = 30
    rate_limit_message_per_minute: int = 60
    mobile_latest_version: str = "1.1.1"
    mobile_latest_version_code: int = 6
    mobile_apk_url: str = (
        "https://expo.dev/artifacts/eas/"
        "q53dBkvV0LWrVOBXhsDhYP4lr_2nWaJ_k_8BDwE4VKQ.apk"
    )
    mobile_update_mandatory: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
