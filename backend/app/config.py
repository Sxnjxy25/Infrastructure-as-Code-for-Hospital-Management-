import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PORT: int = int(os.getenv("PORT", 5000))
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "hms_super_secret_jwt_key_2026_capstone")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60 * 24 # 24 hours
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Normalize SQLite URL for SQLAlchemy if provided in Prisma style 'file:./dev.db'
if settings.DATABASE_URL.startswith("file:"):
    db_path = settings.DATABASE_URL.replace("file:", "").strip()
    settings.DATABASE_URL = f"sqlite:///{db_path}"
elif settings.DATABASE_URL.startswith("postgresql://"):
    # If postgresql:// is provided, SQLAlchemy supports psycopg2 or standard drivers
    pass
