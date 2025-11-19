"""
Handyman Platform API - Main Application Entry Point

This file sets up the FastAPI application and includes all routers.
All business logic is organized in separate router modules.
"""

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from routers import auth, tasks, messaging, admin, categories

# Import WebSocket handler
from routers.messaging import websocket_chat


# --- FastAPI App Initialization ---
app = FastAPI(
    title="Handyman Platform API",
    description="API for connecting clients with taskers for various services",
    version="1.0.0"
)


# --- CORS Middleware ---
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Include Routers ---
app.include_router(auth.router)           # /register, /token, /users/me, etc.
app.include_router(tasks.router)          # /api/tasks, /api/taskers/ai-search, etc.
app.include_router(messaging.router)      # /api/messages, /api/notifications
app.include_router(admin.router)          # /api/services, /api/portfolio, /api/reviews, etc.
app.include_router(categories.router)     # /api/categories, /api/task-types


# --- Root Endpoint ---
@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"message": "Hello from the Handyman API!"}


# --- WebSocket Endpoint ---
# WebSocket needs to be at app level, not in router
@app.websocket("/ws/{task_id}/{token}")
async def websocket_endpoint(websocket: WebSocket, task_id: str, token: str):
    """WebSocket endpoint for real-time chat."""
    await websocket_chat(websocket, task_id, token)
