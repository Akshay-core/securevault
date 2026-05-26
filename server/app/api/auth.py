# Re-export for backwards compatibility.
# The actual implementation lives in app.auth.auth
from app.auth.auth import router, get_current_user

__all__ = ["router", "get_current_user"]