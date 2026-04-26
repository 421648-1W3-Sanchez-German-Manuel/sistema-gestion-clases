import os
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Optional

SECRET_KEY = os.environ.get("JWT_SECRET", "super-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 8
COOKIE_NAME = "session_token"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str, role: str, email: str) -> str:
    payload = {
        "userId": user_id,
        "role": role,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


def get_token_from_request(request: Request) -> str:
    # Try cookie first
    token = request.cookies.get(COOKIE_NAME)
    if token:
        return token
    # Try Authorization header (for testing/API clients)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    raise HTTPException(status_code=401, detail="No autenticado")


def get_current_user(request: Request) -> dict:
    token = get_token_from_request(request)
    return decode_token(token)


def require_role(*roles):
    """Dependency that checks the user has one of the specified roles."""
    def dependency(request: Request):
        user = get_current_user(request)
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Permiso denegado")
        return user
    return dependency


def set_auth_cookie(response: JSONResponse, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,  # Set True in production with HTTPS
        samesite="lax",
        path="/api",
        max_age=TOKEN_EXPIRE_HOURS * 3600,
    )


def clear_auth_cookie(response: JSONResponse):
    response.set_cookie(
        key=COOKIE_NAME,
        value="",
        httponly=True,
        secure=False,
        samesite="lax",
        path="/api",
        max_age=0,
    )
