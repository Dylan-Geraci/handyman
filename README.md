# Handyman Project — Setup and Development Guide

## Overview
Full-stack handyman management platform

- **Backend:** FastAPI + MongoDB
- **Frontend:** React + Vite + TailwindCSS
- **Auth:** JWT (JSON Web Token)
- **Ports:** Backend → 8000, Frontend → 5173

---

## 0) Requirements
Install the following before starting:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+ (LTS)](https://nodejs.org/)
- [MongoDB Community](https://www.mongodb.com/try/download/community) (local)  
  or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- Git

Verify:
```bash
python --version
node -v
npm -v
```

---

## 1) Clone the repository
```bash
git clone <your-repo-url>
cd handyman-project
```

**Project structure:**
```
handyman-project/
├─ backend/
│  ├─ main.py
│  ├─ create_admin.py
│  └─ .env
└─ frontend/
   ├─ package.json
   ├─ vite.config.js
   └─ src/
```

---

## 2) Environment configuration

### 2.1 MongoDB connection
Choose one:

**Local MongoDB:**
```
mongodb://localhost:27017
```

**MongoDB Atlas:**
```
mongodb+srv://<user>:<password>@<cluster>/test?retryWrites=true&w=majority
```

### 2.2 Create backend `.env`
In `backend/.env`:
```
DATABASE_URL="<your-mongo-connection-string>"
SECRET_KEY="replace_with_a_random_long_string"
GOOGLE_API_KEY=""   # optional
```

---

## 3) Backend setup

### 3.1 Create virtual environment
**Mac/Linux:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
```

**Windows:**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3.2 Install dependencies
No `requirements.txt` is included; install manually:
```bash
pip install fastapi "pydantic>=2" python-dotenv pymongo[srv] passlib[bcrypt] "python-jose[cryptography]" google-generativeai uvicorn
```

### 3.3 Run backend
```bash
uvicorn main:app --reload --port 8000
```

Go to:  
[http://localhost:8000/docs](http://localhost:8000/docs)

---

## 4) Create an admin user
Run:
```bash
python create_admin.py
```

- Reads `DATABASE_URL` from `.env`
- Prompts for username/email/password
- Inserts admin into `handyman_db.users`

If MongoDB errors occur, check `.env` and ensure Mongo is running.

---

## 5) Frontend setup

### 5.1 Install dependencies
```bash
cd ../frontend
npm install
```

### 5.2 Start development server
```bash
npm run dev
```

Runs at [http://localhost:5173](http://localhost:5173)

---

## 6) Development workflow
Run both together:

**Terminal 1**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2**
```bash
cd frontend
npm run dev
```

Frontend connects to backend automatically via `http://localhost:8000`.

---

## 7) Test authentication

**Register user:**
```bash
curl -X POST http://localhost:8000/register   -H "Content-Type: application/json"   -d '{"username":"alice","email":"alice@example.com","password":"Password123!"}'
```

**Login (get token):**
```bash
curl -X POST http://localhost:8000/token   -H "Content-Type: application/x-www-form-urlencoded"   -d "username=alice&password=Password123!"
```

**Test with token:**
```bash
curl http://localhost:8000/users/me   -H "Authorization: Bearer <token>"
```

---

## 8) Common API endpoints
| Route | Description |
|--------|--------------|
| `/register` | Create new user |
| `/token` | Get JWT access token |
| `/users/me` | Current user info |
| `/api/services` | Get all services |
| `/api/portfolio` | Get handyman portfolio |
| `/api/tasks` | Task management routes |

View all in Swagger UI → [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 9) Troubleshooting

**Mongo connection error**
```
Cannot connect to MongoDB
```
→ Start MongoDB or fix `DATABASE_URL` in `.env`.

**Missing modules**
```
ModuleNotFoundError: No module named 'fastapi'
```
→ Reinstall inside virtual environment:
```bash
pip install fastapi pymongo python-dotenv passlib[bcrypt] python-jose[cryptography]
```

**CORS errors**
→ Ensure backend CORS includes `http://localhost:5173`.

**401 Unauthorized**
→ Include JWT in header:
```
Authorization: Bearer <token>
```

---

## 10) Student exercises
- Add a `/hello` route in FastAPI and see it in `/docs`.
- Build a new React component that fetches `/api/services`.
- Create a login form that stores the token.
- Add a “Contact” form posting to `/api/contact`.

---

## 11) Optional: Docker
If you know Docker:
```bash
docker build -t handyman-backend ./backend
docker run -p 8000:8000 handyman-backend
```
and optionally containerize the frontend using:
```bash
npm run build
```

---

## 12) Stopping servers
Press `Ctrl+C` in both terminals to stop Vite and Uvicorn.

---

**You’re now ready to start developing!**
