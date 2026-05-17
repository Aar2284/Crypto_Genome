from pydantic import BaseModel, ConfigDict
from typing import Optional

class SystemMetricsResponse(BaseModel):
    active_streams: int
    events_per_second: int
    system_health: str
    total_latency_ms: int
    last_error: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
