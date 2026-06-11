# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, DateTime
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func
from database.session import Base

class SystemMetric(Base):
    __tablename__ = "system_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    active_streams = Column(Integer, default=0, nullable=False)
    events_per_second = Column(Integer, default=0, nullable=False)
    system_health = Column(String, default="healthy", nullable=False)
    total_latency_ms = Column(Integer, default=0, nullable=False)
    last_error = Column(String, nullable=True)
    
    # Tracked over time for monitoring
    recorded_at = Column(DateTime(timezone=True), default=func.now(), index=True, nullable=False)
