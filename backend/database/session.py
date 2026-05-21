from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from core.config import settings

# Create async engine with connection pooling and pool_pre_ping for stability
engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True, # Verifies connection validity before usage
    echo=False          # Set to true for SQL debugging
)

# Create an isolated async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False, # Prevents implicit IO on attribute access after commit
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

# Dependency for FastAPI to safely yield and cleanup sessions
async def get_db():
    session = AsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
