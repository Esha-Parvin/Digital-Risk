from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Using asyncpg URL. Defaulting to local postgres for easy setup
    # Make sure to create the db `internship_db` in postgres.
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/internship_db"
    
    # Rate Limiting
    RATE_LIMIT_GLOBAL: str = "100/minute"
    RATE_LIMIT_TRANSACTION: str = "5/minute"
    
    # Ranking logic
    POINTS_PER_TRANSACTION: int = 10
    MIN_AMOUNT_FOR_POINTS: float = 1.0

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
