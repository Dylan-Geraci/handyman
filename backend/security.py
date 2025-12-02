"""
Authentication and security utilities.
Contains password hashing, JWT token creation, and user validation.
"""

from datetime import datetime, timedelta
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, pwd_context
from database import users_collection


# --- OAuth2 Scheme ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# --- Password Functions ---
MAX_BCRYPT_LENGTH = 72

def _truncate_for_bcrypt(password: str) -> str:
    """Ensure password length is safe for bcrypt."""
    if not isinstance(password, str):
        password = str(password)
    return password[:MAX_BCRYPT_LENGTH]

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    safe = _truncate_for_bcrypt(plain_password)
    return pwd_context.verify(safe, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password for storing."""
    safe = _truncate_for_bcrypt(password)
    return pwd_context.hash(safe)


# --- JWT Token Functions ---
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# --- User Authentication ---
async def get_current_user_from_token(token: str):
    """Get user from JWT token without raising exceptions."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except (JWTError, AttributeError):
        return None
    user = users_collection.find_one({"username": username})
    return user


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """FastAPI dependency to get current authenticated user."""
    user = await get_current_user_from_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# --- Helper Functions ---
def serialize_document(doc) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc
