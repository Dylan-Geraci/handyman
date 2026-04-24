"""
Production Craigslist scraper for handyman gig listings.

Scrapes the gigs section across multiple cities using httpx + BeautifulSoup.
Falls back to hardcoded mock data if scraping fails.
"""

import asyncio
import random
import re
from typing import Dict, List, Optional, Tuple

import httpx
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

from scrapers.base_scraper import BaseScraper, ScrapedService


# Map friendly city names to Craigslist subdomains
CRAIGSLIST_CITIES: Dict[str, str] = {
    "New York, NY": "newyork",
    "Los Angeles, CA": "losangeles",
    "Chicago, IL": "chicago",
    "Houston, TX": "houston",
    "Phoenix, AZ": "phoenix",
    "Philadelphia, PA": "philadelphia",
    "San Antonio, TX": "sanantonio",
    "San Diego, CA": "sandiego",
    "Dallas, TX": "dallas",
    "San Jose, CA": "sfbay",
    "San Francisco, CA": "sfbay",
    "Austin, TX": "austin",
    "Jacksonville, FL": "jacksonville",
    "Columbus, OH": "columbus",
    "Indianapolis, IN": "indianapolis",
    "Charlotte, NC": "charlotte",
    "Seattle, WA": "seattle",
    "Denver, CO": "denver",
    "Washington, DC": "washingtondc",
    "Nashville, TN": "nashville",
    "Portland, OR": "portland",
    "Las Vegas, NV": "lasvegas",
    "Memphis, TN": "memphis",
    "Baltimore, MD": "baltimore",
    "Milwaukee, WI": "milwaukee",
    "Albuquerque, NM": "albuquerque",
    "Tucson, AZ": "tucson",
    "Fresno, CA": "fresno",
    "Sacramento, CA": "sacramento",
    "Miami, FL": "miami",
    "Atlanta, GA": "atlanta",
    "Boston, MA": "boston",
    "Minneapolis, MN": "minneapolis",
    "Tampa, FL": "tampa",
    "Orlando, FL": "orlando",
    "Detroit, MI": "detroit",
    "Pittsburgh, PA": "pittsburgh",
    "Cleveland, OH": "cleveland",
    "St. Louis, MO": "stlouis",
    "Kansas City, MO": "kansascity",
    "Cincinnati, OH": "cincinnati",
    "Raleigh, NC": "raleigh",
    "Richmond, VA": "richmond",
    "Salt Lake City, UT": "saltlakecity",
    "New Orleans, LA": "neworleans",
    "Honolulu, HI": "honolulu",
}

# Craigslist gig section codes relevant to handyman work
# ggg = all gigs, lbg = labor, dmg = domestic, evg = event, cwg = crew
GIG_SECTIONS = ["lbg", "dmg", "evg", "cwg"]

# Map CL URL category codes to our internal category slugs
CL_CATEGORY_CODE_MAP: Dict[str, str] = {
    "lbg": "labor-gig",
    "dmg": "domestic-gig",
    "evg": "event-gig",
    "crg": "creative-gig",
    "cwg": "crew-gig",
    "cpg": "computer-gig",
    "tlg": "talent-gig",
    "wrg": "writing-gig",
}


class CraigslistScraper(BaseScraper):
    """Scrapes Craigslist gig listings for handyman-relevant work."""

    MAX_RESULTS_PER_SECTION = 50  # Cap per city+section to avoid over-scraping

    def __init__(self):
        try:
            self._ua = UserAgent()
        except Exception:
            self._ua = None

    def _get_user_agent(self) -> str:
        if self._ua:
            try:
                return self._ua.random
            except Exception:
                pass
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

    def _resolve_city(self, location: str) -> Optional[str]:
        """Resolve a location string to a Craigslist subdomain."""
        # Exact match first
        if location in CRAIGSLIST_CITIES:
            return CRAIGSLIST_CITIES[location]

        # Fuzzy: try matching just the city name
        city_lower = location.lower().split(",")[0].strip()
        for key, subdomain in CRAIGSLIST_CITIES.items():
            if key.lower().startswith(city_lower):
                return subdomain

        # Last resort: slugify the city name
        return re.sub(r"[^a-z]+", "", city_lower)

    def _build_search_url(self, subdomain: str, section: str) -> str:
        return f"https://{subdomain}.craigslist.org/search/{section}"

    async def _fetch_page(self, url: str) -> Optional[str]:
        """Fetch a page with retries and rotating user agents."""
        headers = {
            "User-Agent": self._get_user_agent(),
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        }

        for attempt in range(3):
            try:
                async with httpx.AsyncClient(
                    follow_redirects=True, timeout=15.0
                ) as client:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        return resp.text
                    if resp.status_code == 403:
                        print(f"[CL] 403 on {url} (attempt {attempt + 1})")
                        await asyncio.sleep(5 + random.uniform(1, 3))
                        continue
                    print(f"[CL] HTTP {resp.status_code} on {url}")
                    return None
            except Exception as e:
                print(f"[CL] Fetch error on {url}: {e}")
                if attempt < 2:
                    await asyncio.sleep(3 + random.uniform(1, 2))

        return None

    def _parse_listing_page(
        self, html: str, section: str
    ) -> List[Dict]:
        """
        Parse a Craigslist search results page.

        Craigslist includes static (no-JS) result items inside
        <ol class="cl-static-search-results"> with <li> children.
        Each <li> contains a link with the title and URL.
        """
        soup = BeautifulSoup(html, "lxml")
        results = []

        # Primary: static search results (available without JS)
        static_list = soup.select("li.cl-static-search-result")

        if not static_list:
            # Fallback: try older markup
            static_list = soup.select("div.result-row")

        if not static_list:
            # Try any <li> inside the results ol
            ol = soup.find("ol", class_="cl-static-search-results")
            if ol:
                static_list = ol.find_all("li", recursive=False)

        for item in static_list[: self.MAX_RESULTS_PER_SECTION]:
            parsed = self._parse_single_result(item, section)
            if parsed:
                results.append(parsed)

        return results

    def _parse_single_result(
        self, item, section: str
    ) -> Optional[Dict]:
        """Extract data from a single search result element."""
        # Find the title link
        link = item.find("a")
        if not link:
            return None

        # Craigslist structure: <li title="..."><a><div class="title">...</div>...
        # Prefer the <li> title attribute (clean, no child text pollution)
        title = item.get("title", "").strip()

        # Fallback: get text from div.title inside the link
        if not title:
            title_div = link.find("div", class_="title")
            if title_div:
                title = title_div.get_text(strip=True)

        # Last fallback: strip price/location from full link text
        if not title:
            raw = link.get_text(strip=True)
            title = re.sub(r"\$\d[\d,]*(?:\.\d+)?", "", raw).strip()

        if not title or len(title) < 5:
            return None

        href = link.get("href", "")
        if not href.startswith("http"):
            return None

        # Extract price from div.price (skip $0 which CL uses as default)
        price = None
        price_div = item.find("div", class_="price")
        if price_div:
            match = re.search(r"\$(\d+(?:,\d{3})*(?:\.\d{2})?)", price_div.get_text())
            if match:
                val = float(match.group(1).replace(",", ""))
                price = val if val > 0 else None

        # Fallback price extraction
        if price is None:
            price = self._extract_price_from_element(item)

        # Determine category from the URL path or section code
        category_slug = self._detect_category(href, section)

        return {
            "title": title,
            "url": href,
            "price": price,
            "category_slug": category_slug,
            "section": section,
        }

    def _extract_price_from_element(self, item) -> Optional[float]:
        """Try to extract a dollar amount from the listing element."""
        # Look for price-specific elements
        price_el = item.find(class_=re.compile(r"price", re.I))
        if price_el:
            text = price_el.get_text(strip=True)
            match = re.search(r"\$(\d+(?:,\d{3})*(?:\.\d{2})?)", text)
            if match:
                val = float(match.group(1).replace(",", ""))
                return val if val > 0 else None

        # Fallback: search the full text for a price
        text = item.get_text()
        match = re.search(r"\$(\d+(?:,\d{3})*(?:\.\d{2})?)", text)
        if match:
            val = float(match.group(1).replace(",", ""))
            return val if val > 0 else None

        return None

    def _detect_category(self, url: str, section: str) -> str:
        """Detect internal category slug from the URL path or section code."""
        # URL contains the section code, e.g. /mnh/lbg/d/...
        for code, slug in CL_CATEGORY_CODE_MAP.items():
            if f"/{code}/" in url:
                return slug

        # Fall back to section-level mapping
        return CL_CATEGORY_CODE_MAP.get(section, "labor-gig")

    async def _fetch_detail_description(self, url: str) -> Optional[str]:
        """Optionally fetch the detail page for a richer description."""
        html = await self._fetch_page(url)
        if not html:
            return None

        soup = BeautifulSoup(html, "lxml")

        # Craigslist detail pages put the body in section#postingbody
        body = soup.find("section", id="postingbody")
        if not body:
            body = soup.find("div", id="postingbody")

        if body:
            # Remove the "QR Code Link" disclaimer
            for el in body.select(".print-information, .print-qrcode-label"):
                el.decompose()
            text = body.get_text(separator=" ", strip=True)
            # Trim to reasonable length
            return text[:1000] if text else None

        return None

    async def scrape(self, locations: List[str]) -> List[ScrapedService]:
        """
        Scrape Craigslist gig listings for the given locations.

        Returns a list of ScrapedService objects. Falls back to mock data
        if scraping fails entirely.
        """
        all_services: List[ScrapedService] = []

        for location in locations:
            subdomain = self._resolve_city(location)
            if not subdomain:
                print(f"[CL] Could not resolve city: {location}")
                continue

            print(f"[CL] Scraping gigs for {location} ({subdomain}.craigslist.org)")

            for section in GIG_SECTIONS:
                url = self._build_search_url(subdomain, section)
                print(f"[CL]   Section /{section}/ -> {url}")

                html = await self._fetch_page(url)
                if not html:
                    print(f"[CL]   Failed to fetch {url}")
                    continue

                listings = self._parse_listing_page(html, section)
                print(f"[CL]   Found {len(listings)} listings")

                for listing in listings:
                    # Fetch detail page for a real description (rate-limited)
                    description = None
                    if listing["url"]:
                        await asyncio.sleep(random.uniform(1.5, 3.0))
                        description = await self._fetch_detail_description(
                            listing["url"]
                        )

                    if not description:
                        description = f'{listing["title"]} - gig posted on Craigslist for {location}.'

                    # Build price range from posted price
                    price_min, price_max = None, None
                    if listing["price"]:
                        price_min = listing["price"]
                        price_max = listing["price"]

                    service = ScrapedService(
                        title=listing["title"],
                        description=description,
                        external_category=listing["category_slug"],
                        source_url=listing["url"],
                        price_range_min=price_min,
                        price_range_max=price_max,
                        source_slug=listing["category_slug"],
                    )
                    all_services.append(service)

                # Rate limit between sections
                await asyncio.sleep(random.uniform(2.0, 4.0))

            # Rate limit between cities
            await asyncio.sleep(random.uniform(3.0, 5.0))

        if not all_services:
            print("[CL] No live results. Falling back to mock data.")
            return self._get_fallback_services()

        print(f"[CL] Total scraped: {len(all_services)} services")
        return all_services

    # ------------------------------------------------------------------
    # Fallback mock data
    # ------------------------------------------------------------------

    def _get_fallback_services(self) -> List[ScrapedService]:
        """Return hardcoded mock data when live scraping fails."""
        return [
            ScrapedService(
                title="General labor help needed",
                description="Looking for someone to help with heavy lifting and general labor. Must be reliable and able to lift 50+ lbs.",
                external_category="labor-gig",
                source_url="https://craigslist.org",
                price_range_min=20,
                price_range_max=30,
                source_slug="labor-gig",
            ),
            ScrapedService(
                title="Handyman needed for home repairs",
                description="Need a skilled handyman for drywall patching, door adjustment, and minor plumbing fixes. Tools provided.",
                external_category="labor-gig",
                source_url="https://craigslist.org",
                price_range_min=25,
                price_range_max=45,
                source_slug="labor-gig",
            ),
            ScrapedService(
                title="House cleaning help wanted",
                description="Looking for reliable house cleaner for weekly deep cleaning. Kitchen, bathrooms, floors, and general tidying.",
                external_category="domestic-gig",
                source_url="https://craigslist.org",
                price_range_min=20,
                price_range_max=35,
                source_slug="domestic-gig",
            ),
            ScrapedService(
                title="Yard work and landscaping",
                description="Need help with yard cleanup, mowing, hedge trimming, and leaf removal. Bring your own tools if possible.",
                external_category="crew-gig",
                source_url="https://craigslist.org",
                price_range_min=18,
                price_range_max=30,
                source_slug="crew-gig",
            ),
            ScrapedService(
                title="Moving help - load/unload truck",
                description="Need two strong people to help load a 16ft moving truck. Boxes and furniture. Should take 3-4 hours.",
                external_category="labor-gig",
                source_url="https://craigslist.org",
                price_range_min=20,
                price_range_max=25,
                source_slug="labor-gig",
            ),
            ScrapedService(
                title="Painting interior rooms",
                description="Need painter for 3 bedrooms. Walls and trim. Paint and supplies provided. Experience preferred.",
                external_category="labor-gig",
                source_url="https://craigslist.org",
                price_range_min=25,
                price_range_max=40,
                source_slug="labor-gig",
            ),
            ScrapedService(
                title="Event setup and breakdown help",
                description="Need crew for wedding reception setup. Tables, chairs, decorations. Saturday 8am-2pm.",
                external_category="event-gig",
                source_url="https://craigslist.org",
                price_range_min=15,
                price_range_max=25,
                source_slug="event-gig",
            ),
            ScrapedService(
                title="Furniture assembly needed",
                description="IKEA bedroom set needs assembly: bed frame, dresser, nightstand, bookshelf. Must have own tools.",
                external_category="labor-gig",
                source_url="https://craigslist.org",
                price_range_min=25,
                price_range_max=40,
                source_slug="labor-gig",
            ),
            ScrapedService(
                title="Junk removal and hauling",
                description="Old furniture and appliances need to be removed and taken to dump. Truck or van needed.",
                external_category="labor-gig",
                source_url="https://craigslist.org",
                price_range_min=30,
                price_range_max=50,
                source_slug="labor-gig",
            ),
            ScrapedService(
                title="Pressure washing driveway and patio",
                description="Need someone with pressure washer to clean concrete driveway and back patio. Approximately 800 sq ft total.",
                external_category="crew-gig",
                source_url="https://craigslist.org",
                price_range_min=30,
                price_range_max=50,
                source_slug="crew-gig",
            ),
        ]
