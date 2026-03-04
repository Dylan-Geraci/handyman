"""
Scraper module for pulling external task/service data.
Supports multiple sources (TaskRabbit, etc.) and auto-generates tasks.
"""

from scrapers.taskrabbit_scraper import TaskRabbitScraper
from scrapers.task_generator import TaskGenerator
from scrapers.category_mapper import CategoryMapper


async def run_scraper(source: str = "taskrabbit", locations: list = None):
    """
    Run the full scrape -> map -> generate -> insert pipeline.

    Args:
        source: Which site to scrape ("taskrabbit")
        locations: List of city strings to generate tasks for

    Returns:
        Dict with counts: scraped, inserted, updated, errors
    """
    if locations is None:
        locations = ["New York, NY"]

    if source == "taskrabbit":
        scraper = TaskRabbitScraper()
    else:
        raise ValueError(f"Unknown scraper source: {source}")

    # Step 1: Scrape service data
    scraped_services = await scraper.scrape(locations)

    # Step 2: Generate and insert tasks
    generator = TaskGenerator(source=source)
    results = generator.generate_and_insert(scraped_services, locations)

    return results
