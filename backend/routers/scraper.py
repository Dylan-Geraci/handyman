"""
Scraper admin routes.
Handles triggering scrapes, checking status, and managing scraped tasks.
"""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from security import get_current_user
from database import tasks_collection, scrape_logs_collection
from models import ScrapeRequest, ScrapeResponse, ScrapeLog


router = APIRouter(prefix="/api/scraper", tags=["scraper"])


@router.post("/run", response_model=ScrapeResponse)
async def run_scraper(
    request: ScrapeRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Trigger a scrape run (admin only).

    Runs the full scrape -> map -> generate -> insert pipeline for the
    specified source and locations.
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )

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

    # Log the scrape run
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


@router.get("/status")
async def get_scraper_status(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Get the last scrape run info (admin only).

    Returns the most recent scrape log entry.
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )

    last_log = scrape_logs_collection.find_one(
        sort=[("timestamp", -1)]
    )

    if not last_log:
        return {"message": "No scrape runs found."}

    # Serialize ObjectId
    last_log["_id"] = str(last_log["_id"])
    return last_log


@router.delete("/tasks")
async def delete_scraped_tasks(
    current_user: Annotated[dict, Depends(get_current_user)],
    source: str = "craigslist"
):
    """
    Delete all auto-generated tasks from a given source (admin only).
    """
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
