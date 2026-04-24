"""
Scraper module for pulling external task/service data.
Supports Craigslist as primary source, with auto-generation into MongoDB tasks.
"""

from scrapers.craigslist_scraper import CraigslistScraper
from scrapers.task_generator import TaskGenerator


async def run_scraper(source: str = "craigslist", locations: list = None):
    """
    Run the full scrape -> map -> generate -> insert pipeline.

    Args:
        source: Which site to scrape ("craigslist")
        locations: List of city strings to generate tasks for

    Returns:
        Dict with counts: scraped, inserted, updated, errors
    """
    if locations is None:
        locations = ["New York, NY"]

    source = source.strip().lower()

    if source == "craigslist":
        scraper = CraigslistScraper()
    else:
        raise ValueError(f"Unknown scraper source: {source}")

    # Step 1: Scrape service data
    scraped_services = await scraper.scrape(locations)

    # Step 2: Generate and insert tasks
    generator = TaskGenerator(source=source)
    results = generator.generate_and_insert(scraped_services, locations)

    return results
