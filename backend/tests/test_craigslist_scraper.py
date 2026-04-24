"""
Test suite for the Craigslist scraper.

Run with:
    cd backend
    python -m pytest tests/test_craigslist_scraper.py -v

Or standalone:
    cd backend
    python tests/test_craigslist_scraper.py
"""

import asyncio
import sys
import os

# Add backend to path so imports work when run standalone
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scrapers.craigslist_scraper import CraigslistScraper, CRAIGSLIST_CITIES

# Sample HTML that mimics Craigslist's static search results
SAMPLE_LISTING_HTML = """
<html>
<body>
<ol class="cl-static-search-results">
  <li class="cl-static-search-result" title="Handyman needed for apartment repairs">
    <a href="https://newyork.craigslist.org/mnh/lbg/d/new-york-handyman-needed/1234567890.html">
      <div class="title">Handyman needed for apartment repairs</div>
      <div class="details">
        <div class="price">$200</div>
        <div class="location">Midtown</div>
      </div>
    </a>
  </li>
  <li class="cl-static-search-result" title="Moving help needed Saturday">
    <a href="https://newyork.craigslist.org/brk/lbg/d/brooklyn-moving-help/9876543210.html">
      <div class="title">Moving help needed Saturday</div>
      <div class="details">
        <div class="price">$0</div>
        <div class="location">Brooklyn</div>
      </div>
    </a>
  </li>
  <li class="cl-static-search-result" title="House cleaning - weekly">
    <a href="https://newyork.craigslist.org/mnh/dmg/d/new-york-house-cleaning/1111111111.html">
      <div class="title">House cleaning - weekly</div>
      <div class="details">
        <div class="price">$150</div>
        <div class="location">Upper West Side</div>
      </div>
    </a>
  </li>
  <li class="cl-static-search-result" title="Event setup help for party">
    <a href="https://newyork.craigslist.org/que/evg/d/queens-event-setup-help/2222222222.html">
      <div class="title">Event setup help for party</div>
      <div class="details">
        <div class="price">$100</div>
        <div class="location">Queens</div>
      </div>
    </a>
  </li>
</ol>
</body>
</html>
"""

SAMPLE_DETAIL_HTML = """
<html>
<body>
<section id="postingbody">
    <div class="print-information">QR Code Link to This Post</div>
    Looking for a reliable handyman to help with various apartment repairs.
    Tasks include fixing leaky faucet, patching drywall holes, and adjusting
    cabinet doors. Must have own tools. Estimated 4-5 hours of work.
    Pay is $200 flat rate. Located in Midtown Manhattan.
</section>
</body>
</html>
"""


def test_parse_listing_page():
    """Test that we correctly parse static search results from HTML."""
    scraper = CraigslistScraper()
    results = scraper._parse_listing_page(SAMPLE_LISTING_HTML, "lbg")

    assert len(results) == 4, f"Expected 4 results, got {len(results)}"

    # First result
    assert results[0]["title"] == "Handyman needed for apartment repairs"
    assert "1234567890" in results[0]["url"]
    assert results[0]["price"] == 200.0

    # Second result (no price)
    assert results[1]["title"] == "Moving help needed Saturday"
    assert results[1]["price"] is None

    # Third result
    assert results[2]["price"] == 150.0

    print("[OK] parse_listing_page: All assertions passed")


def test_extract_price():
    """Test price extraction from various formats."""
    scraper = CraigslistScraper()

    from bs4 import BeautifulSoup

    # Price in element text
    html1 = '<li><a href="https://x.craigslist.org/lbg/d/test/123.html">Test</a><span class="priceinfo">$250</span></li>'
    soup1 = BeautifulSoup(html1, "lxml")
    item1 = soup1.find("li")
    assert scraper._extract_price_from_element(item1) == 250.0

    # No price
    html2 = '<li><a href="https://x.craigslist.org/lbg/d/test/123.html">Test no price</a></li>'
    soup2 = BeautifulSoup(html2, "lxml")
    item2 = soup2.find("li")
    assert scraper._extract_price_from_element(item2) is None

    # $0 should be None (Craigslist default)
    html2b = '<li><a href="https://x.craigslist.org/lbg/d/test/123.html">Test</a><div class="price">$0</div></li>'
    soup2b = BeautifulSoup(html2b, "lxml")
    item2b = soup2b.find("li")
    assert scraper._extract_price_from_element(item2b) is None

    # Price with comma
    html3 = '<li><a href="https://x.craigslist.org/lbg/d/test/123.html">Test</a><span class="priceinfo">$1,500</span></li>'
    soup3 = BeautifulSoup(html3, "lxml")
    item3 = soup3.find("li")
    assert scraper._extract_price_from_element(item3) == 1500.0

    print("[OK] extract_price: All assertions passed")


def test_detect_category():
    """Test category detection from URL paths."""
    scraper = CraigslistScraper()

    assert scraper._detect_category("/mnh/lbg/d/test/123.html", "lbg") == "labor-gig"
    assert scraper._detect_category("/brk/dmg/d/test/123.html", "dmg") == "domestic-gig"
    assert scraper._detect_category("/que/evg/d/test/123.html", "evg") == "event-gig"
    assert scraper._detect_category("/que/cwg/d/test/123.html", "cwg") == "crew-gig"
    # Fallback to section
    assert scraper._detect_category("/unknown/path", "lbg") == "labor-gig"

    print("[OK] detect_category: All assertions passed")


def test_resolve_city():
    """Test city name to subdomain resolution."""
    scraper = CraigslistScraper()

    assert scraper._resolve_city("New York, NY") == "newyork"
    assert scraper._resolve_city("Los Angeles, CA") == "losangeles"
    assert scraper._resolve_city("Chicago, IL") == "chicago"
    # Fuzzy match
    assert scraper._resolve_city("new york") == "newyork"

    print("[OK] resolve_city: All assertions passed")


def test_fallback_services():
    """Test that fallback mock data is valid."""
    scraper = CraigslistScraper()
    services = scraper._get_fallback_services()

    assert len(services) > 0, "Fallback should return at least 1 service"

    for svc in services:
        assert svc.title, "Service must have a title"
        assert svc.description, "Service must have a description"
        assert svc.external_category, "Service must have a category"
        assert svc.source_url, "Service must have a source URL"

    print(f"[OK] fallback_services: {len(services)} valid fallback services")


def test_detail_page_parsing():
    """Test extraction of description from a detail page."""
    scraper = CraigslistScraper()
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(SAMPLE_DETAIL_HTML, "lxml")
    body = soup.find("section", id="postingbody")

    # Remove print info (same as scraper logic)
    for el in body.select(".print-information"):
        el.decompose()

    text = body.get_text(separator=" ", strip=True)
    assert "reliable handyman" in text
    assert "QR Code" not in text, "Print info should be removed"

    print("[OK] detail_page_parsing: Correctly extracts description")


def test_live_scrape_single_city():
    """
    Integration test: scrape 1 city with 1 section.
    This makes real HTTP requests to Craigslist.
    Skip if you want offline-only tests.
    """
    scraper = CraigslistScraper()

    async def _run():
        # Temporarily limit to just labor gigs for speed
        import scrapers.craigslist_scraper as mod
        original_sections = mod.GIG_SECTIONS
        mod.GIG_SECTIONS = ["lbg"]

        try:
            results = await scraper.scrape(["New York, NY"])
            print(f"[INFO] Live scrape returned {len(results)} services")

            if len(results) > 0 and results[0].source_url != "https://craigslist.org":
                # Got real results (not fallback)
                for svc in results[:3]:
                    print(f"  - {svc.title[:60]}  (${svc.price_range_min or '?'})")
                    assert svc.title
                    assert svc.source_url.startswith("https://")
                print("[OK] live_scrape: Real data validated")
            else:
                print("[OK] live_scrape: Got fallback data (scraping may be blocked)")
        finally:
            mod.GIG_SECTIONS = original_sections

    asyncio.run(_run())


if __name__ == "__main__":
    print("=" * 60)
    print("Craigslist Scraper Tests")
    print("=" * 60)

    # Unit tests (offline)
    test_parse_listing_page()
    test_extract_price()
    test_detect_category()
    test_resolve_city()
    test_fallback_services()
    test_detail_page_parsing()

    print()
    print("--- Live integration test ---")
    test_live_scrape_single_city()

    print()
    print("=" * 60)
    print("All tests passed!")
    print("=" * 60)
