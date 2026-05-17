from pydantic import BaseModel

# Structured error responses to prevent raw stack traces leaking to frontend
class ErrorResponse(BaseModel):
    error: str
    code: int
