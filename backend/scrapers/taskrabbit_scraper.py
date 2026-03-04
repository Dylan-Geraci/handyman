"""
TaskRabbit scraper using crawl4ai.

Scrapes TaskRabbit's public service pages (not individual task listings,
since TaskRabbit doesn't publish those publicly). Extracts service templates
with titles, descriptions, and price ranges.
"""

import asyncio
import re
from typing import List

from scrapers.base_scraper import BaseScraper, ScrapedService

# TaskRabbit service pages to scrape (slug -> URL path)
TASKRABBIT_SERVICES = [
    # Assembly
    "assemble-furniture",
    "desk-assembly",
    "bookshelf-assembly",
    "bed-frame-assembly",
    "crib-assembly",
    "exercise-equipment-assembly",
    "outdoor-furniture-assembly",
    "swing-set-assembly",
    # Mounting & Installation
    "tv-mounting",
    "shelf-installation",
    "curtain-blind-installation",
    "smart-home-installation",
    "ceiling-fan-installation",
    "light-fixture-installation",
    # Moving & Packing
    "help-moving",
    "heavy-lifting",
    "junk-removal",
    # Cleaning
    "home-cleaning",
    "deep-cleaning",
    "move-out-cleaning",
    # Outdoor
    "yard-work",
    "lawn-mowing",
    "snow-removal",
    "gutter-cleaning",
    "pressure-washing",
    # Home Repairs
    "general-handyman",
    "plumbing",
    "drywall-repair",
    "electrical",
    # Painting
    "painting",
    "interior-painting",
    "exterior-painting",
    # General
    "delivery",
    "errands",
    "personal-assistant",
]

BASE_URL = "https://www.taskrabbit.com/services"


class TaskRabbitScraper(BaseScraper):
    """Scrapes TaskRabbit service category pages."""

    async def scrape(self, locations: List[str]) -> List[ScrapedService]:
        """
        Scrape TaskRabbit service pages using crawl4ai.

        Args:
            locations: List of city strings (used for task generation, not URL building)

        Returns:
            List of ScrapedService objects
        """
        try:
            from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
        except ImportError:
            print("crawl4ai not installed. Install with: pip install crawl4ai")
            print("Then run: crawl4ai-setup")
            return self._get_fallback_services()

        services = []

        try:
            config = CrawlerRunConfig(
                verbose=False,
            )

            async with AsyncWebCrawler() as crawler:
                for slug in TASKRABBIT_SERVICES:
                    url = f"{BASE_URL}/{slug}"
                    try:
                        result = await crawler.arun(url=url, config=config)

                        if result.success and result.markdown:
                            parsed = self._parse_service_page(
                                result.markdown, slug, url
                            )
                            if parsed:
                                services.append(parsed)
                        else:
                            # Use fallback data for this slug
                            fallback = self._get_fallback_for_slug(slug)
                            if fallback:
                                services.append(fallback)

                        # Rate limiting: 1-2 seconds between requests
                        await asyncio.sleep(1.5)

                    except Exception as e:
                        print(f"Error scraping {url}: {e}")
                        fallback = self._get_fallback_for_slug(slug)
                        if fallback:
                            services.append(fallback)
                        continue

        except Exception as e:
            print(f"Crawler failed: {e}. Using fallback data.")
            return self._get_fallback_services()

        # If crawling got nothing, use fallback
        if not services:
            return self._get_fallback_services()

        return services

    def _parse_service_page(
        self, markdown: str, slug: str, url: str
    ) -> ScrapedService | None:
        """
        Parse a TaskRabbit service page from markdown content.

        Extracts title, description, and price range from the page content.
        """
        lines = markdown.strip().split("\n")

        # Extract title from first heading
        title = None
        for line in lines:
            line = line.strip()
            if line.startswith("# "):
                title = line.lstrip("# ").strip()
                break

        if not title:
            # Try slug-based title
            title = slug.replace("-", " ").title()

        # Extract description (first substantial paragraph)
        description = ""
        for line in lines:
            line = line.strip()
            if len(line) > 50 and not line.startswith("#") and not line.startswith("["):
                description = line[:500]
                break

        if not description:
            description = f"Professional {title.lower()} services available in your area."

        # Extract price range from content
        price_min, price_max = self._extract_price_range(markdown)

        return ScrapedService(
            title=title,
            description=description,
            external_category=slug,
            source_url=url,
            price_range_min=price_min,
            price_range_max=price_max,
            source_slug=slug,
        )

    def _extract_price_range(self, text: str) -> tuple:
        """Extract hourly price range from page text."""
        # Look for patterns like "$18-28/hr", "$25/hr", "$20 - $40 per hour"
        patterns = [
            r"\$(\d+)\s*[-–]\s*\$?(\d+)\s*/?\s*(?:hr|hour)",
            r"\$(\d+)\s*/?\s*(?:hr|hour)",
            r"starting at \$(\d+)",
            r"from \$(\d+)",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    return float(groups[0]), float(groups[1])
                elif len(groups) == 1:
                    base = float(groups[0])
                    return base, base + 15  # Estimated range

        return None, None

    def _get_fallback_for_slug(self, slug: str) -> ScrapedService | None:
        """Get fallback data for a single slug."""
        data = FALLBACK_SERVICE_DATA.get(slug)
        if not data:
            return None
        return ScrapedService(
            title=data["title"],
            description=data["description"],
            external_category=slug,
            source_url=f"{BASE_URL}/{slug}",
            price_range_min=data.get("price_min"),
            price_range_max=data.get("price_max"),
            source_slug=slug,
        )

    def _get_fallback_services(self) -> List[ScrapedService]:
        """Return fallback service data when crawling fails entirely."""
        services = []
        for slug in TASKRABBIT_SERVICES:
            svc = self._get_fallback_for_slug(slug)
            if svc:
                services.append(svc)
        return services


# Fallback data based on known TaskRabbit service pages
FALLBACK_SERVICE_DATA = {
    "assemble-furniture": {
        "title": "Furniture Assembly",
        "description": "Get help assembling furniture from IKEA, Wayfair, Amazon, and more. Taskers bring their own tools and handle all types of furniture assembly.",
        "price_min": 25,
        "price_max": 50,
    },
    "desk-assembly": {
        "title": "Desk Assembly",
        "description": "Professional desk assembly for office desks, standing desks, and workstations. Includes all hardware and setup.",
        "price_min": 30,
        "price_max": 55,
    },
    "bookshelf-assembly": {
        "title": "Bookshelf Assembly",
        "description": "Assemble bookshelves, storage units, KALLAX, BILLY, and other shelving systems quickly and securely.",
        "price_min": 25,
        "price_max": 45,
    },
    "bed-frame-assembly": {
        "title": "Bed Frame Assembly",
        "description": "Assemble bed frames, headboards, and platform beds. Includes all sizes from twin to king.",
        "price_min": 30,
        "price_max": 60,
    },
    "crib-assembly": {
        "title": "Crib Assembly",
        "description": "Safe and secure crib assembly for cribs, bassinets, and baby furniture by experienced Taskers.",
        "price_min": 35,
        "price_max": 55,
    },
    "exercise-equipment-assembly": {
        "title": "Exercise Equipment Assembly",
        "description": "Assemble treadmills, ellipticals, Peloton bikes, weight benches, and home gym equipment.",
        "price_min": 40,
        "price_max": 70,
    },
    "outdoor-furniture-assembly": {
        "title": "Outdoor Furniture Assembly",
        "description": "Assemble patio furniture, outdoor dining sets, grills, and garden equipment.",
        "price_min": 30,
        "price_max": 55,
    },
    "swing-set-assembly": {
        "title": "Swing Set Assembly",
        "description": "Assemble swing sets, playsets, trampolines, and outdoor play equipment for kids.",
        "price_min": 50,
        "price_max": 100,
    },
    "tv-mounting": {
        "title": "TV Mounting",
        "description": "Professional TV wall mounting with bracket installation and cable management for any screen size.",
        "price_min": 40,
        "price_max": 80,
    },
    "shelf-installation": {
        "title": "Shelf Installation",
        "description": "Install floating shelves, wall shelves, and shelving systems with secure wall anchoring.",
        "price_min": 30,
        "price_max": 55,
    },
    "curtain-blind-installation": {
        "title": "Curtain & Blind Installation",
        "description": "Install curtain rods, blinds, shades, and window treatments throughout your home.",
        "price_min": 30,
        "price_max": 55,
    },
    "smart-home-installation": {
        "title": "Smart Home Installation",
        "description": "Install smart thermostats, Ring doorbells, security cameras, and home automation devices.",
        "price_min": 35,
        "price_max": 65,
    },
    "ceiling-fan-installation": {
        "title": "Ceiling Fan Installation",
        "description": "Install or replace ceiling fans with proper wiring and secure mounting.",
        "price_min": 40,
        "price_max": 70,
    },
    "light-fixture-installation": {
        "title": "Light Fixture Installation",
        "description": "Install chandeliers, pendant lights, recessed lighting, and other light fixtures.",
        "price_min": 35,
        "price_max": 65,
    },
    "help-moving": {
        "title": "Help Moving",
        "description": "Get help loading, unloading, and moving furniture and boxes. Taskers provide the muscle.",
        "price_min": 25,
        "price_max": 50,
    },
    "heavy-lifting": {
        "title": "Heavy Lifting",
        "description": "Move heavy furniture, appliances, and oversized items safely with experienced help.",
        "price_min": 30,
        "price_max": 55,
    },
    "junk-removal": {
        "title": "Junk Removal",
        "description": "Remove and dispose of unwanted furniture, appliances, and household junk.",
        "price_min": 30,
        "price_max": 60,
    },
    "home-cleaning": {
        "title": "Home Cleaning",
        "description": "Professional house cleaning services including kitchens, bathrooms, floors, and general tidying.",
        "price_min": 25,
        "price_max": 50,
    },
    "deep-cleaning": {
        "title": "Deep Cleaning",
        "description": "Thorough deep cleaning of your home including baseboards, behind appliances, and detailed scrubbing.",
        "price_min": 35,
        "price_max": 65,
    },
    "move-out-cleaning": {
        "title": "Move-Out Cleaning",
        "description": "Complete cleaning to prepare your home for the next tenant. Get your deposit back.",
        "price_min": 35,
        "price_max": 70,
    },
    "yard-work": {
        "title": "Yard Work",
        "description": "General yard maintenance including mowing, trimming, weeding, and cleanup.",
        "price_min": 25,
        "price_max": 50,
    },
    "lawn-mowing": {
        "title": "Lawn Mowing",
        "description": "Professional lawn mowing and edging services to keep your yard looking great.",
        "price_min": 20,
        "price_max": 45,
    },
    "snow-removal": {
        "title": "Snow Removal",
        "description": "Shovel snow from driveways, walkways, and stairs after a storm.",
        "price_min": 30,
        "price_max": 60,
    },
    "gutter-cleaning": {
        "title": "Gutter Cleaning",
        "description": "Clean gutters and downspouts to prevent water damage and clogs.",
        "price_min": 35,
        "price_max": 65,
    },
    "pressure-washing": {
        "title": "Pressure Washing",
        "description": "Power wash driveways, decks, patios, siding, and other surfaces.",
        "price_min": 40,
        "price_max": 80,
    },
    "general-handyman": {
        "title": "General Handyman",
        "description": "Hire a skilled handyman for home repairs, maintenance, and odd jobs around the house.",
        "price_min": 30,
        "price_max": 60,
    },
    "plumbing": {
        "title": "Plumbing Help",
        "description": "Get help with basic plumbing tasks like faucet installation, drain clearing, and leak fixes.",
        "price_min": 35,
        "price_max": 70,
    },
    "drywall-repair": {
        "title": "Drywall Repair",
        "description": "Patch holes, repair cracks, and fix drywall damage in your walls and ceilings.",
        "price_min": 30,
        "price_max": 60,
    },
    "electrical": {
        "title": "Electrical Help",
        "description": "Help with basic electrical tasks like outlet installation, switch replacement, and wiring.",
        "price_min": 35,
        "price_max": 70,
    },
    "painting": {
        "title": "Painting",
        "description": "Professional interior and exterior painting services for rooms, walls, and trim.",
        "price_min": 25,
        "price_max": 55,
    },
    "interior-painting": {
        "title": "Interior Painting",
        "description": "Paint interior walls, ceilings, and trim with professional results.",
        "price_min": 25,
        "price_max": 55,
    },
    "exterior-painting": {
        "title": "Exterior Painting",
        "description": "Paint exterior siding, trim, doors, and other outdoor surfaces.",
        "price_min": 30,
        "price_max": 65,
    },
    "delivery": {
        "title": "Delivery Service",
        "description": "Get items picked up and delivered around town. Taskers use their own vehicles.",
        "price_min": 20,
        "price_max": 45,
    },
    "errands": {
        "title": "Errands",
        "description": "Hire someone to run errands: pickups, drop-offs, returns, and more.",
        "price_min": 20,
        "price_max": 40,
    },
    "personal-assistant": {
        "title": "Personal Assistant",
        "description": "Get help with tasks, organization, scheduling, and other personal assistance.",
        "price_min": 20,
        "price_max": 45,
    },
}
