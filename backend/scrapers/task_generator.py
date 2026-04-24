"""
Converts ScrapedService objects into MongoDB task documents.

Handles category mapping, deduplication via upsert, and setting all
required fields for auto-generated tasks.
"""

import re
from datetime import datetime
from typing import Dict, List

from database import tasks_collection
from scrapers.base_scraper import ScrapedService
from scrapers.category_mapper import CategoryMapper
from utils.recommendation_helpers import estimate_task_difficulty
from utils.geocoding import geocode_location


class TaskGenerator:
    """Generates MongoDB task documents from scraped services."""

    SCRAPER_VERSION = "1.0"

    def __init__(self, source: str = "craigslist"):
        self.source = source
        self.mapper = CategoryMapper()

    def generate_and_insert(
        self, services: List[ScrapedService], locations: List[str]
    ) -> Dict:
        """
        Generate task documents from scraped services and upsert into MongoDB.

        For each service + location combo, creates one task document.

        Args:
            services: List of ScrapedService objects
            locations: List of location strings to create tasks for

        Returns:
            Dict with counts: scraped, inserted, updated, errors
        """
        results = {"scraped": len(services), "inserted": 0, "updated": 0, "errors": 0}

        for service in services:
            for location in locations:
                try:
                    print(f"\n--- Processing service: {service.title} in {location} ---")

                    task_doc = self._build_task_document(service, location)
                    if not task_doc:
                        print("Task document could not be built.")
                        results["errors"] += 1
                        continue

                    # Upsert: update if dedup_key exists, insert if new
                    dedup_key = task_doc["dedup_key"]
                    print(f"Dedup key: {dedup_key}")

                    existing = tasks_collection.find_one({"dedup_key": dedup_key})

                    if existing:
                        print("Existing task found. Updating...")
                        # Update metadata fields only
                        tasks_collection.update_one(
                            {"dedup_key": dedup_key},
                            {
                                "$set": {
                                    "scrape_metadata": task_doc["scrape_metadata"],
                                    "external_price_range": task_doc[
                                        "external_price_range"
                                    ],
                                    "description": task_doc["description"],
                                }
                            },
                        )
                        results["updated"] += 1
                    else:
                        print("No existing task found. Inserting...")
                        tasks_collection.insert_one(task_doc)
                        results["inserted"] += 1

                except Exception as e:
                    print(f"Error generating task for {service.title} in {location}: {repr(e)}")
                    results["errors"] += 1

        return results

    def _build_task_document(
        self, service: ScrapedService, location: str
    ) -> Dict | None:
        """
        Build a complete task document from a ScrapedService.

        Returns None if category mapping fails completely.
        """
        # Map to internal categories
        print("Mapping category...")
        mapping = self.mapper.map(
            source_slug=service.source_slug or service.external_category,
            title=service.title,
            description=service.description,
        )
        print("Mapping result:", mapping)

        if not mapping:
            return None

        # Build location slug for dedup key
        location_slug = re.sub(r"[^a-z0-9]+", "-", location.lower()).strip("-")

        # Build dedup key
        dedup_key = f"{self.source}:{mapping['category_id']}:{mapping['task_type_id']}:{location_slug}"

        # Build price range dict
        price_range = None
        if service.price_range_min is not None:
            price_range = {
                "min_hourly": service.price_range_min,
                "max_hourly": service.price_range_max,
                "currency": "USD",
            }

        # Build description with source info
        description = service.description
        if price_range:
            description += f"\n\nEstimated rate: ${price_range['min_hourly']:.0f}-${price_range['max_hourly']:.0f}/hr"
        description += f"\n\nSource: {self.source.title()} ({service.source_url})"

        print("Geocoding location...")
        coordinates = geocode_location(location)
        print("Coordinates:", coordinates)

        estimated_difficulty = estimate_task_difficulty(
            {"title": service.title, "description": service.description}
        )
        print("Estimated difficulty:", estimated_difficulty)

        # Build the task document
        task_doc = {
            # Standard task fields
            "title": f"{service.title} - {location}",
            "description": description,
            "location": location,
            "category_id": mapping["category_id"],
            "task_type_id": mapping["task_type_id"],
            "status": "open",
            "client_username": self.source,
            "tasker_username": None,
            # Recommendation fields
            "posted_at": datetime.utcnow(),
            "estimated_difficulty": estimated_difficulty,
            "coordinates": coordinates,
            "budget_range": None,
            # Scraper-specific fields
            "source": self.source,
            "source_url": service.source_url,
            "is_auto_generated": True,
            "external_price_range": price_range,
            "scrape_metadata": {
                "scraped_at": datetime.utcnow(),
                "scraper_version": self.SCRAPER_VERSION,
            },
            "dedup_key": dedup_key,
        }

        print("Built task doc successfully.")
        return task_doc