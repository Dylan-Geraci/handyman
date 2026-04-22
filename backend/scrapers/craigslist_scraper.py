"""
Temporary Craigslist scraper stub for testing the scraper pipeline.
Replace this with real Craigslist scraping logic later.
"""

from scrapers.base_scraper import ScrapedService


class CraigslistScraper:
    async def scrape(self, locations):
        scraped = []

        for location in locations:
            scraped.append(
                ScrapedService(
                    title="Handyman needed",
                    description=f"Test Craigslist task scraped for {location}",
                    external_category="home-repair",
                    source_url="https://craigslist.org",
                    price_range_min=25,
                    price_range_max=45,
                    source_slug="home-repair",
                )
            )

        return scraped