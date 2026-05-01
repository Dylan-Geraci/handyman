# Expo Demo Checklist

Pre-flight steps to run before each demo session.

## One-time setup (do this once on the demo laptop)

1. Copy env files:
   ```powershell
   Copy-Item backend\.env.example backend\.env
   Copy-Item frontend\.env.example frontend\.env
   ```
   Then fill in real `DATABASE_URL`, `SECRET_KEY`, `GOOGLE_API_KEY` in `backend\.env`.

2. Set demo mode in both env files:
   - `backend\.env` → `DEMO_MODE=true`
   - `frontend\.env` → `VITE_DEMO_MODE=true`

3. Install deps if not already:
   ```powershell
   cd backend; pip install -r requirements.txt
   cd ..\frontend; npm install
   ```

## Before every demo session

1. **Seed demo accounts and tasks:**
   ```powershell
   cd backend; python create_test_data.py
   ```
   Creates: `mike_customer`, `alice_builder` (Sarah), `bob_fixer`, `admin` — all with password `demo123`.

2. **Start backend:**
   ```powershell
   cd backend; uvicorn main:app --reload --port 8000
   ```

3. **Start frontend (separate terminal):**
   ```powershell
   cd frontend; npm run dev
   ```

4. **Smoke test the arc** (do this once before judges arrive):
   - Open `http://localhost:5173/`
   - Confirm the red+teal "DEMO MODE" banner is visible at the top
   - Click `Login` → confirm Mike/Sarah/Admin quick-login buttons appear
   - Click **Mike (Customer)** → lands on `/client/dashboard`
   - Click **✨ Fill Demo Task** → form pre-fills with the TV-mount task → click **Post Task**
   - Logout → click **Sarah (Tasker)** → click **✨ See AI-ranked tasks for you**
   - Confirm `/recommended` page loads with the TV-mount task ranked, with a colored match score badge and reasons
   - Click **Accept Task**, then go to `My Accepted Jobs`, open chat, send a test message
   - Logout → **Admin** → click **Run Scraper** → confirm progress bar streams events over ~5s and ~15 cached gigs appear
   - Click **🔄 Reset Demo Data** → confirm tasks clear, demo seed restored

## During the demo (the script)

1. Land on `/` — narrate the marketplace concept
2. `/login` → **Mike (Customer)**
3. `/client/dashboard` → **Fill Demo Task** → **Post Task**
4. Logout → **Sarah (Tasker)**
5. `/recommended` → "the AI ranks tasks for Sarah using 7 factors..."
6. Accept → chat → send a message
7. Logout → **Admin** → Run Scraper → "and we enrich the marketplace with real Craigslist data"
8. **Reset Demo Data** → ready for the next visitor

## Troubleshooting

- **Demo login buttons don't appear**: `frontend\.env` doesn't have `VITE_DEMO_MODE=true`, or you didn't restart `npm run dev` after editing it.
- **Recommendations page shows "No recommendations found"**: Sarah's `service_categories` is empty or the categories collection is empty. Run `python seed_categories.py` then `python create_test_data.py` again.
- **Scraper progress bar fails**: Backend not started, or `DEMO_MODE=false` in `backend\.env`. Restart uvicorn after changing.
- **Reset Demo button missing**: `VITE_DEMO_MODE=true` not set in frontend env.
- **Gemini errors during recs**: `DEMO_MODE=true` should make this irrelevant (uses keyword fallback). If still seeing them, check `backend\.env`.

## What's hardcoded for the demo (be honest if asked)

- The TV-mount task description ("Mount a 65" TV...") is preset for one-click demoing.
- The "Run Scraper" replay loads from `backend/data/scraper_cache.json` (15 pre-captured gigs) instead of hitting Craigslist live.
- AI semantic match scores are cached in `backend/data/gemini_cache.json` after the first call. With `DEMO_MODE=true`, cache misses fall back to keyword scoring instead of calling Gemini live.
- Demo login passwords are all `demo123`.
