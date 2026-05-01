"""
Scraper admin routes.
Handles triggering scrapes, checking status, and managing scraped tasks.
"""

import asyncio
import json
import os
import re
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from security import get_current_user, get_current_user_from_token
from database import tasks_collection, scrape_logs_collection
from models import ScrapeRequest, ScrapeResponse, ScrapeLog
from config import DEMO_MODE


router = APIRouter(prefix="/api/scraper", tags=["scraper"])

SCRAPER_CACHE_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "scraper_cache.json"
)


def _load_demo_cache() -> list:
    """Load the pre-captured demo scrape from disk."""
    if not os.path.exists(SCRAPER_CACHE_FILE):
        return []
    with open(SCRAPER_CACHE_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("tasks", [])


def _build_demo_task_doc(template: dict, source: str = "craigslist") -> dict:
    """Convert a cache template into a full Mongo task document."""
    location_slug = re.sub(r"[^a-z0-9]+", "-", template["location"].lower()).strip("-")
    title_slug = re.sub(r"[^a-z0-9]+", "-", template["title"].lower())[:40]
    dedup_key = f"{source}:demo:{title_slug}:{location_slug}"

    return {
        "title": template["title"],
        "description": template["description"]
        + f"\n\nSource: {source.title()} ({template.get('source_url', '')})",
        "location": template["location"],
        "category_id": None,
        "task_type_id": None,
        "status": "open",
        "client_username": source,
        "tasker_username": None,
        "posted_at": datetime.utcnow(),
        "estimated_difficulty": template.get("estimated_difficulty", 2),
        "coordinates": None,
        "budget_range": None,
        "source": source,
        "source_url": template.get("source_url"),
        "is_auto_generated": True,
        "is_demo_scrape": True,
        "external_price_range": template.get("external_price_range"),
        "scrape_metadata": {
            "scraped_at": datetime.utcnow(),
            "scraper_version": "demo-1.0",
        },
        "dedup_key": dedup_key,
    }


def _run_demo_replay(source: str, locations: list[str]) -> dict:
    """Insert cached scrape results into MongoDB. Idempotent via dedup_key."""
    templates = _load_demo_cache()
    inserted = 0
    updated = 0
    errors = 0

    for tpl in templates:
        try:
            doc = _build_demo_task_doc(tpl, source=source)
            existing = tasks_collection.find_one({"dedup_key": doc["dedup_key"]})
            if existing:
                tasks_collection.update_one(
                    {"dedup_key": doc["dedup_key"]},
                    {"$set": {
                        "scrape_metadata": doc["scrape_metadata"],
                        "posted_at": doc["posted_at"],
                    }}
                )
                updated += 1
            else:
                tasks_collection.insert_one(doc)
                inserted += 1
        except Exception as e:
            print(f"[demo-replay] error inserting {tpl.get('title')}: {e}")
            errors += 1

    return {
        "scraped": len(templates),
        "inserted": inserted,
        "updated": updated,
        "errors": errors,
    }


@router.post("/run", response_model=ScrapeResponse)
async def run_scraper(
    request: ScrapeRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Trigger a scrape run (admin only).

    In DEMO_MODE, replays a pre-captured scrape from disk instead of hitting
    the live source — instant, offline-safe, deterministic.
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )

    if DEMO_MODE:
        results = _run_demo_replay(request.source, request.locations)
    else:
        from scrapers import run_scraper as execute_scrape
        try:
            results = await execute_scrape(
                source=request.source,
                locations=request.locations
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Scraper failed: {str(e)}"
            )

    log_entry = ScrapeLog(
        source=request.source,
        locations=request.locations,
        scraped=results["scraped"],
        inserted=results["inserted"],
        updated=results["updated"],
        errors=results["errors"],
    )
    scrape_logs_collection.insert_one(log_entry.dict())

    return ScrapeResponse(
        source=request.source,
        scraped=results["scraped"],
        inserted=results["inserted"],
        updated=results["updated"],
        errors=results["errors"],
    )


@router.get("/run/stream")
async def run_scraper_stream(
    token: Annotated[str, Query(description="JWT bearer token")],
    source: str = "craigslist",
):
    """
    SSE endpoint that streams scripted progress events while running the
    demo replay. EventSource can't send Authorization headers, so the token
    is passed as a query param.
    """
    user = await get_current_user_from_token(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    locations = ["New York, NY"]

    async def event_stream():
        steps = [
            ("Connecting to Craigslist...", 5),
            ("Scanning labor-gigs in NYC...", 15),
            ("Scanning domestic-gigs...", 30),
            ("Scanning event-gigs...", 45),
            ("Mapping listings to internal categories...", 65),
            ("Estimating task difficulty (AI)...", 80),
            ("Inserting tasks into database...", 92),
        ]

        for message, pct in steps:
            payload = json.dumps({"message": message, "progress": pct})
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.6)

        # Run the actual replay (fast — local file read + Mongo inserts)
        results = _run_demo_replay(source, locations)

        # Log
        log_entry = ScrapeLog(
            source=source,
            locations=locations,
            scraped=results["scraped"],
            inserted=results["inserted"],
            updated=results["updated"],
            errors=results["errors"],
        )
        scrape_logs_collection.insert_one(log_entry.dict())

        done_payload = json.dumps({
            "message": f"Done. Scraped {results['scraped']}, inserted {results['inserted']}, updated {results['updated']}.",
            "progress": 100,
            "done": True,
            "results": results,
        })
        yield f"data: {done_payload}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/status")
async def get_scraper_status(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Get the last scrape run info (admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )

    last_log = scrape_logs_collection.find_one(sort=[("timestamp", -1)])

    if not last_log:
        return {"message": "No scrape runs found."}

    last_log["_id"] = str(last_log["_id"])
    return last_log


@router.delete("/tasks")
async def delete_scraped_tasks(
    current_user: Annotated[dict, Depends(get_current_user)],
    source: str = "craigslist"
):
    """Delete all auto-generated tasks from a given source (admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )

    result = tasks_collection.delete_many({
        "source": source,
        "is_auto_generated": True
    })

    return {"deleted_count": result.deleted_count, "source": source}
