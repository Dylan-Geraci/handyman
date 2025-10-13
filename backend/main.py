import os
import json
from datetime import datetime, timedelta, timezone
from fastapi import Depends, FastAPI, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Annotated, List, Optional
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import secrets

# --- Configuration ---
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# CORRECTED: Configure the Gemini API with the correct, latest stable model name
try:
    gemini_api_key = os.getenv("GOOGLE_API_KEY")
    if not gemini_api_key:
        raise ValueError("GOOGLE_API_KEY not found in .env file. Please add it.")
    genai.configure(api_key=gemini_api_key)
    # Using the model name you confirmed works: 'gemini-2.5-pro'
    model = genai.GenerativeModel('gemini-2.5-pro') 
except Exception as e:
    print(f"CRITICAL ERROR: Could not configure Gemini API. Please check your GOOGLE_API_KEY. Error: {e}")
    model = None

# --- Pydantic Models ---
class Service(BaseModel):
    name: str
    description: str

class PortfolioItem(BaseModel):
    title: str
    description: str
    image_url: str

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

class TokenData(BaseModel):
    username: str | None = None

class UserBase(BaseModel):
    username: str
    full_name: str
    role: str
    location: Optional[str] = None
    skills: Optional[List[str]] = []
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserPublic(UserBase):
    pass

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None

class Task(BaseModel):
    title: str
    description: str
    location: str
    status: str = "open"
    client_username: Optional[str] = None
    tasker_username: Optional[str] = None

class Review(BaseModel):
    task_id: str
    tasker_username: str
    rating: int = Field(..., gt=0, lt=6)
    comment: Optional[str] = None
    client_username: Optional[str] = None

class Message(BaseModel):
    task_id: str
    sender_username: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AISearchQuery(BaseModel):
    query: str
    
class Notification(BaseModel):
    user_to_notify: str
    message: str
    link: Optional[str] = None
    is_read: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

# --- Database Connection ---
DATABASE_URL = os.getenv("DATABASE_URL")
client = MongoClient(DATABASE_URL)
db = client.handyman_db
services_collection = db.services
portfolio_collection = db.portfolio_items
contact_requests_collection = db.contact_requests
users_collection = db.users
tasks_collection = db.tasks
reviews_collection = db.reviews
messages_collection = db.messages
notifications_collection = db.notifications

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = []
        self.active_connections[task_id].append(websocket)

    def disconnect(self, websocket: WebSocket, task_id: str):
        if task_id in self.active_connections and websocket in self.active_connections[task_id]:
            self.active_connections[task_id].remove(websocket)

    async def broadcast(self, message: str, task_id: str):
        if task_id in self.active_connections:
            for connection in self.active_connections[task_id]:
                await connection.send_text(message)

manager = ConnectionManager()

# --- Security & Helper Functions ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user_from_token(token: str):
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
    user = await get_current_user_from_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def serialize_document(doc) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# --- FastAPI App Initialization ---
app = FastAPI()

# --- CORS Middleware ---
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PUBLIC ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "Hello from the Handyman API!"}

@app.get("/api/services")
def get_services():
    services_cursor = services_collection.find({})
    return [serialize_document(service) for service in services_cursor]

@app.get("/api/portfolio")
def get_portfolio():
    portfolio_cursor = portfolio_collection.find({})
    return [serialize_document(item) for item in portfolio_cursor]

@app.post("/api/contact")
def submit_contact_request(request: ContactRequest):
    contact_requests_collection.insert_one(request.dict())
    return {"status": "success", "message": "Your message has been sent!"}

@app.get("/api/taskers/{username}", response_model=UserPublic)
def get_tasker_profile(username: str):
    user = users_collection.find_one({"username": username, "role": "tasker"})
    if not user:
        raise HTTPException(status_code=404, detail="Tasker not found")
    return user

@app.get("/api/reviews/{tasker_username}")
def get_tasker_reviews(tasker_username: str):
    reviews_cursor = reviews_collection.find({"tasker_username": tasker_username})
    return [serialize_document(review) for review in reviews_cursor]

# --- AUTHENTICATION & PASSWORD RESET ENDPOINTS ---
@app.post("/register", response_model=UserPublic)
def register(user: UserCreate):
    existing_user = users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    user_data = user.dict()
    user_data["hashed_password"] = hashed_password
    del user_data["password"]
    
    users_collection.insert_one(user_data)
    return user_data

@app.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    user = users_collection.find_one({"username": request.email})
    if user:
        token = secrets.token_urlsafe(32)
        expire_time = datetime.utcnow() + timedelta(minutes=15)
        users_collection.update_one({"_id": user["_id"]}, {"$set": {"reset_token": token, "reset_token_expires": expire_time}})
        print("--- PASSWORD RESET ---")
        print(f"Token for {request.email}: {token}")
        print(f"Full URL: http://localhost:5173/reset-password/{token}")
        print("----------------------")
    return {"message": "If an account with that email exists, a password reset token has been generated."}

@app.post("/reset-password")
async def reset_password(request: PasswordReset):
    user = users_collection.find_one({"reset_token": request.token, "reset_token_expires": {"$gt": datetime.utcnow()}})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")
    hashed_password = pwd_context.hash(request.new_password)
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"hashed_password": hashed_password}, "$unset": {"reset_token": "", "reset_token_expires": ""}})
    return {"message": "Password has been reset successfully."}

@app.get("/users/me", response_model=UserPublic)
async def read_users_me(current_user: Annotated[dict, Depends(get_current_user)]):
    return current_user

@app.put("/users/me", response_model=UserPublic)
async def update_user_me(user_update: UserUpdate, current_user: Annotated[dict, Depends(get_current_user)]):
    update_data = user_update.dict(exclude_unset=True)
    
    update_data.pop("role", None)
    update_data.pop("username", None)
    
    users_collection.update_one(
        {"username": current_user["username"]},
        {"$set": update_data}
    )
    
    updated_user = users_collection.find_one({"username": current_user["username"]})
    return updated_user

# --- AI SEARCH ENDPOINT ---
@app.post("/api/taskers/ai-search", response_model=List[UserPublic])
async def ai_search_taskers(query: AISearchQuery, current_user: Annotated[dict, Depends(get_current_user)]):
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API is not configured. Please check your API key.")
    if current_user["role"] != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can search for taskers.")

    prompt = f"""
    Analyze the following client request: "{query.query}"
    Extract the `skills` (as a list of lowercase strings) and the `location` (as a string).
    Return ONLY a valid JSON object. Example: {{"skills": ["plumbing", "faucet repair"], "location": "Fullerton"}}
    """

    try:
        response = model.generate_content(prompt)
        json_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        entities = json.loads(json_text)
        skills = [skill.lower() for skill in entities.get("skills", [])]
        location = entities.get("location")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process AI query: {e}")

    mongo_query = {"role": "tasker"}
    if skills:
        mongo_query["skills"] = {"$all": skills}
    if location:
        mongo_query["location"] = {"$regex": location, "$options": "i"}

    taskers_cursor = users_collection.find(mongo_query)
    return [UserPublic(**tasker) for tasker in taskers_cursor]

# --- PROTECTED TASK ENDPOINTS ---
@app.post("/api/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(task: Task, current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user["role"] != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can create tasks.")
    
    task_data = task.dict()
    task_data["client_username"] = current_user["username"]
    
    tasks_collection.insert_one(task_data)
    return serialize_document(task_data)

@app.get("/api/tasks")
async def get_open_tasks(
    current_user: Annotated[dict, Depends(get_current_user)],
    location: Optional[str] = None,
    q: Optional[str] = None
):
    if current_user["role"] != "tasker":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only taskers can view open tasks.")

    query = {"status": "open"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]

    tasks_cursor = tasks_collection.find(query)
    return [serialize_document(task) for task in tasks_cursor]

@app.put("/api/tasks/{task_id}/accept")
async def accept_task(task_id: str, current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user["role"] != "tasker":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only taskers can accept tasks.")

    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id), "status": "open"})
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid Task ID format")
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or has already been accepted.")

    update_data = {"$set": {"status": "in_progress", "tasker_username": current_user["username"]}}
    tasks_collection.update_one({"_id": ObjectId(task_id)}, update_data)
    
    notification_for_client = Notification(
        user_to_notify=task["client_username"],
        message=f"Your task '{task['title']}' has been accepted by {current_user['full_name']}.",
        link=f"/tasks/{task_id}/chat"
    )
    notifications_collection.insert_one(notification_for_client.dict())
    
    updated_task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    return serialize_document(updated_task)

@app.put("/api/tasks/{task_id}/complete")
async def complete_task(task_id: str, current_user: Annotated[dict, Depends(get_current_user)]):
    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid Task ID format")
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    if task.get("client_username") != current_user["username"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only complete your own tasks.")

    update_data = {"$set": {"status": "completed"}}
    tasks_collection.update_one({"_id": ObjectId(task_id)}, update_data)
    
    if task.get("tasker_username"):
        notification_for_tasker = Notification(
            user_to_notify=task["tasker_username"],
            message=f"The task '{task['title']}' has been marked as complete by the client.",
            link=f"/taskers/{task['tasker_username']}"
        )
        notifications_collection.insert_one(notification_for_tasker.dict())
    
    updated_task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    return serialize_document(updated_task)

@app.get("/api/my-client-tasks")
async def get_my_client_tasks(current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user["role"] != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    tasks_cursor = tasks_collection.find({"client_username": current_user["username"]})
    return [serialize_document(task) for task in tasks_cursor]

@app.get("/api/my-tasker-tasks")
async def get_my_tasker_tasks(current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user["role"] != "tasker":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    tasks_cursor = tasks_collection.find({"tasker_username": current_user["username"]})
    return [serialize_document(task) for task in tasks_cursor]

# --- PROTECTED REVIEW ENDPOINTS ---
@app.post("/api/reviews", status_code=status.HTTP_201_CREATED)
async def create_review(review: Review, current_user: Annotated[dict, Depends(get_current_user)]):
    try:
        task = tasks_collection.find_one({"_id": ObjectId(review.task_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid Task ID format")
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    if task.get("client_username") != current_user["username"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only review your own tasks.")
    if task.get("status") != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can only review completed tasks.")
    
    existing_review = reviews_collection.find_one({"task_id": review.task_id})
    if existing_review:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A review for this task has already been submitted.")

    review_data = review.dict()
    review_data["client_username"] = current_user["username"]
    
    reviews_collection.insert_one(review_data)
    return serialize_document(review_data)

# --- MESSAGING & NOTIFICATION ENDPOINTS ---
@app.get("/api/messages/{task_id}")
async def get_messages_for_task(task_id: str, current_user: Annotated[dict, Depends(get_current_user)]):
    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid Task ID format")
    if not task: raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user["username"] not in [task.get("client_username"), task.get("tasker_username")]:
        raise HTTPException(status_code=403, detail="Not authorized to view these messages")

    messages_cursor = messages_collection.find({"task_id": task_id}).sort("timestamp", 1)
    return [serialize_document(msg) for msg in messages_cursor]

@app.websocket("/ws/{task_id}/{token}")
async def websocket_endpoint(websocket: WebSocket, task_id: str, token: str):
    user = await get_current_user_from_token(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION); return
    
    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION); return
    if not task:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION); return
        
    if user["username"] not in [task.get("client_username"), task.get("tasker_username")]:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION); return

    await manager.connect(websocket, task_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = {
                "task_id": task_id,
                "sender_username": user["username"],
                "content": data,
                "timestamp": datetime.utcnow()
            }
            inserted_result = messages_collection.insert_one(message_data)
            created_message = messages_collection.find_one({"_id": inserted_result.inserted_id})
            
            await manager.broadcast(json.dumps(serialize_document(created_message), default=str), task_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, task_id)

@app.get("/api/notifications")
async def get_my_notifications(current_user: Annotated[dict, Depends(get_current_user)]):
    notifications_cursor = notifications_collection.find({
        "user_to_notify": current_user["username"]
    }).sort("timestamp", -1)
    return [serialize_document(n) for n in notifications_cursor]

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_as_read(notification_id: str, current_user: Annotated[dict, Depends(get_current_user)]):
    try:
        notification = notifications_collection.find_one({"_id": ObjectId(notification_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid Notification ID format")
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    if notification["user_to_notify"] != current_user["username"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this notification.")

    notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"is_read": True}}
    )
    return {"status": "success"}

# --- PROTECTED (ADMIN) ENDPOINTS ---
@app.post("/api/services", status_code=status.HTTP_201_CREATED)
async def create_service(service: Service, current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user["role"] != "admin": raise HTTPException(status_code=403, detail="Admin access required.")
    service_dict = service.dict()
    services_collection.insert_one(service_dict)
    return serialize_document(service_dict)

@app.delete("/api/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(service_id: str, current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user["role"] != "admin": raise HTTPException(status_code=403, detail="Admin access required.")
    result = services_collection.delete_one({"_id": ObjectId(service_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return

@app.get("/api/services/{service_id}")
def get_service(service_id: str):
    service = services_collection.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return serialize_document(service)

@app.put("/api/services/{service_id}")
async def update_service(service_id: str, service_update: Service, current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user["role"] != "admin": raise HTTPException(status_code=403, detail="Admin access required.")
    update_data = service_update.dict(exclude_unset=True)
    result = services_collection.update_one({"_id": ObjectId(service_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    updated_service = services_collection.find_one({"_id": ObjectId(service_id)})
    return serialize_document(updated_service)

@app.post("/api/portfolio", status_code=status.HTTP_201_CREATED)
async def create_portfolio_item(item: PortfolioItem, current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user["role"] != "admin": raise HTTPException(status_code=403, detail="Admin access required.")
    item_dict = item.dict()
    portfolio_collection.insert_one(item_dict)
    return serialize_document(item_dict)