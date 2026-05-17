from fastapi import Request
from fastapi.responses import JSONResponse
from schemas.common import ErrorResponse

class BaseAPIException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all unhandled exceptions and prevents raw stack traces from reaching the frontend.
    """
    status_code = getattr(exc, "status_code", 500)
    message = getattr(exc, "message", "Internal Server Error")
    
    # Log the full error internally here (to be implemented with structured logging in Phase 7)
    
    error_response = ErrorResponse(error=message, code=status_code)
    return JSONResponse(
        status_code=status_code,
        content=error_response.model_dump()
    )
