"""
Abstract base class for all scrapers.
Defines the interface that concrete scrapers must implement.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ScrapedService:
    """Represents a service scraped from an external site."""
    title: str
    description: str
    external_category: str  # The category name/slug from the source site
    source_url: str
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    time_estimate: Optional[str] = None
    source_slug: Optional[str] = None  # URL slug for category mapping


class BaseScraper(ABC):
    """Abstract base class for scrapers."""

    @abstractmethod
    async def scrape(self, locations: List[str]) -> List[ScrapedService]:
        """
        Scrape service data from the external site.

        Args:
            locations: List of city/location strings

        Returns:
            List of ScrapedService objects
        """
        pass
