from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from core.config import settings
from core.exceptions import global_exception_handler
from routers import market, system, websocket, genome, history

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 1. Environment & Config Governance: Abstraction of CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Centralized Error Handling Registration
app.add_exception_handler(Exception, global_exception_handler)

# 3. Router Governance: Include thin routers
app.include_router(market.router, prefix=f"{settings.API_V1_STR}/market", tags=["market"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["system"])
app.include_router(genome.router, prefix=f"{settings.API_V1_STR}/genome", tags=["genome"])
app.include_router(history.router, prefix=f"{settings.API_V1_STR}/history", tags=["history"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

# 4. Observability & Health-Check Preparation
@app.get("/api/v1/health", tags=["health"])
async def health_check():
    """
    Core health-check route for monitoring and orchestrator (e.g., Kubernetes) integration.
    """
    return {
        "status": "ok",
        "db_connected": True, # In a real scenario, ping the DB here
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
