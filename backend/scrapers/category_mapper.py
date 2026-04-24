"""
Maps external service categories to our internal category_id + task_type_id.

Uses a static mapping table for known slugs, then falls back to keyword
matching against our task_types collection's keywords arrays.
"""

import re
from typing import Dict, Optional, Tuple
from database import categories_collection, task_types_collection


# Static mapping: TaskRabbit URL slugs -> (our category name, our task type name)
TASKRABBIT_SLUG_MAP: Dict[str, Tuple[str, str]] = {
    # Assembly
    "assemble-furniture": ("Assembly", "Furniture Assembly"),
    "furniture-assembly": ("Assembly", "Furniture Assembly"),
    "crib-assembly": ("Assembly", "Crib Assembly"),
    "desk-assembly": ("Assembly", "Desk Assembly"),
    "pax-wardrobe-assembly": ("Assembly", "PAX Wardrobe Assembly"),
    "exercise-equipment-assembly": ("Assembly", "Exercise Equipment Assembly"),
    "bookshelf-assembly": ("Assembly", "Bookshelf Assembly"),
    "bed-frame-assembly": ("Assembly", "Bed Frame Assembly"),
    "swing-set-assembly": ("Assembly", "Swing Set Assembly"),
    "outdoor-furniture-assembly": ("Assembly", "Outdoor Furniture Assembly"),
    "general-assembly": ("Assembly", "General Assembly"),

    # Mounting & Installation
    "tv-mounting": ("Mounting & Installation", "TV Mounting"),
    "shelf-installation": ("Mounting & Installation", "Shelf Installation"),
    "curtain-blind-installation": ("Mounting & Installation", "Curtain & Blind Installation"),
    "mirror-art-hanging": ("Mounting & Installation", "Mirror & Art Hanging"),
    "smart-home-installation": ("Mounting & Installation", "Smart Home Installation"),
    "ceiling-fan-installation": ("Mounting & Installation", "Ceiling Fan Installation"),
    "light-fixture-installation": ("Mounting & Installation", "Light Fixture Installation"),
    "baby-proofing": ("Mounting & Installation", "Baby Proofing"),

    # Moving & Packing
    "moving-help": ("Moving & Packing", "Help Moving"),
    "help-moving": ("Moving & Packing", "Help Moving"),
    "packing-unpacking": ("Moving & Packing", "Packing & Unpacking"),
    "heavy-lifting": ("Moving & Packing", "Heavy Lifting"),
    "junk-removal": ("Moving & Packing", "Junk Removal"),
    "furniture-removal": ("Moving & Packing", "Furniture Removal"),

    # Cleaning
    "home-cleaning": ("Cleaning", "Home Cleaning"),
    "deep-cleaning": ("Cleaning", "Deep Cleaning"),
    "move-out-cleaning": ("Cleaning", "Move-Out Cleaning"),
    "move-in-cleaning": ("Cleaning", "Move-In Cleaning"),
    "garage-cleaning": ("Cleaning", "Garage Cleaning"),
    "carpet-cleaning": ("Cleaning", "Carpet Cleaning"),
    "window-cleaning": ("Cleaning", "Window Cleaning"),

    # Outdoor Help
    "yard-work": ("Outdoor Help", "Yard Work"),
    "lawn-mowing": ("Outdoor Help", "Lawn Mowing"),
    "gardening": ("Outdoor Help", "Gardening"),
    "leaf-removal": ("Outdoor Help", "Leaf Removal"),
    "tree-trimming": ("Outdoor Help", "Tree Trimming"),
    "snow-removal": ("Outdoor Help", "Snow Removal"),
    "gutter-cleaning": ("Outdoor Help", "Gutter Cleaning"),
    "pressure-washing": ("Outdoor Help", "Pressure Washing"),
    "fence-repair": ("Outdoor Help", "Fence Repair"),

    # Home Repairs
    "general-handyman": ("Home Repairs", "General Handyman"),
    "handyman": ("Home Repairs", "General Handyman"),
    "plumbing": ("Home Repairs", "Faucet Installation"),
    "drywall-repair": ("Home Repairs", "Drywall Repair"),
    "door-repair": ("Home Repairs", "Door Repair"),
    "flooring-repair": ("Home Repairs", "Flooring Repair"),
    "lock-installation": ("Home Repairs", "Lock Installation"),
    "electrical": ("Home Repairs", "Outlet & Switch Installation"),

    # Painting
    "painting": ("Painting", "Interior Painting"),
    "interior-painting": ("Painting", "Interior Painting"),
    "exterior-painting": ("Painting", "Exterior Painting"),
    "cabinet-painting": ("Painting", "Cabinet Painting"),
    "deck-staining": ("Painting", "Deck Staining"),
    "wallpaper-removal": ("Painting", "Wallpaper Removal"),

    # General Help
    "delivery": ("General Help", "Delivery"),
    "errands": ("General Help", "Errands"),
    "shopping": ("General Help", "Shopping"),
    "personal-assistant": ("General Help", "Personal Assistant"),
    "event-help": ("General Help", "Event Help"),
    "wait-for-delivery": ("General Help", "Wait for Delivery"),
}

# Craigslist gig category slugs -> (our category name, our task type name)
CRAIGSLIST_SLUG_MAP: Dict[str, Tuple[str, str]] = {
    # Labor gigs (lbg)
    "labor-gig": ("Moving & Packing", "Heavy Lifting"),

    # Domestic gigs (dmg)
    "domestic-gig": ("Cleaning", "Home Cleaning"),

    # Event gigs (evg)
    "event-gig": ("General Help", "Event Help"),

    # Crew gigs (cwg)
    "crew-gig": ("Outdoor Help", "Yard Work"),

    # Less relevant but still mappable
    "creative-gig": ("General Help", "Other"),
    "computer-gig": ("General Help", "Other"),
    "talent-gig": ("General Help", "Other"),
    "writing-gig": ("General Help", "Other"),
}


class CategoryMapper:
    """Maps external categories to internal category_id and task_type_id."""

    def __init__(self):
        self._categories = None
        self._task_types = None
        self._category_name_to_id = {}
        self._task_type_lookup = {}  # (category_name, task_type_name) -> task_type_doc

    def _load_from_db(self):
        """Load categories and task types from DB (cached after first call)."""
        if self._categories is not None:
            return

        self._categories = list(categories_collection.find({}))
        self._task_types = list(task_types_collection.find({}))

        print(f"Loaded {len(self._categories)} categories and {len(self._task_types)} task types from DB")

        # Build lookup maps
        for cat in self._categories:
            self._category_name_to_id[cat["name"]] = str(cat["_id"])

        for tt in self._task_types:
            cat_id = tt["category_id"]
            # Find category name for this task type
            for cat in self._categories:
                if str(cat["_id"]) == cat_id:
                    key = (cat["name"], tt["name"])
                    self._task_type_lookup[key] = tt
                    break

    def _normalize_slug(self, value: str) -> str:
        """Normalize a slug/title to lowercase hyphenated form."""
        return re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")

    def map(self, source_slug: str, title: str = "", description: str = "") -> Optional[Dict]:
        """
        Map an external slug/category to internal category_id + task_type_id.

        Args:
            source_slug: URL slug from the source site
            title: Service title for fallback matching
            description: Service description for fallback matching

        Returns:
            Dict with category_id, task_type_id, category_name, task_type_name
            or None if no mapping found (falls back to General Help)
        """
        self._load_from_db()

        normalized_slug = self._normalize_slug(source_slug)
        normalized_title_slug = self._normalize_slug(title)

        print(f"Mapping source_slug='{source_slug}' normalized='{normalized_slug}' title='{title}' title_slug='{normalized_title_slug}'")

        # 1. Try static slug mapping (check both maps)
        for slug_map, map_name in [
            (CRAIGSLIST_SLUG_MAP, "Craigslist"),
            (TASKRABBIT_SLUG_MAP, "TaskRabbit"),
        ]:
            if normalized_slug in slug_map:
                cat_name, tt_name = slug_map[normalized_slug]
                print(f"Matched {map_name} slug map with source slug: {normalized_slug} -> {cat_name} / {tt_name}")
                return self._resolve_names(cat_name, tt_name)

        # 1b. Try normalized title as slug
        for slug_map, map_name in [
            (CRAIGSLIST_SLUG_MAP, "Craigslist"),
            (TASKRABBIT_SLUG_MAP, "TaskRabbit"),
        ]:
            if normalized_title_slug in slug_map:
                cat_name, tt_name = slug_map[normalized_title_slug]
                print(f"Matched {map_name} slug map with title slug: {normalized_title_slug} -> {cat_name} / {tt_name}")
                return self._resolve_names(cat_name, tt_name)

        # 2. Fallback: keyword matching against task_types keywords
        result = self._keyword_match(title, description)
        if result:
            print(f"Matched keyword fallback -> {result}")
            return result

        # 3. Last resort: General Help -> Other
        print("Falling back to General Help -> Other")
        return self._resolve_names("General Help", "Other")

    def _resolve_names(self, category_name: str, task_type_name: str) -> Optional[Dict]:
        """Resolve category/task_type names to their IDs."""
        cat_id = self._category_name_to_id.get(category_name)
        if not cat_id:
            print(f"Category not found in DB: {category_name}")
            return None

        tt_doc = self._task_type_lookup.get((category_name, task_type_name))
        if not tt_doc:
            # Try to find any task type in this category
            for (cn, tn), doc in self._task_type_lookup.items():
                if cn == category_name:
                    tt_doc = doc
                    task_type_name = tn
                    break

        if not tt_doc:
            print(f"Task type not found in DB: {category_name} / {task_type_name}")
            return None

        return {
            "category_id": cat_id,
            "task_type_id": str(tt_doc["_id"]),
            "category_name": category_name,
            "task_type_name": task_type_name,
        }

    def _keyword_match(self, title: str, description: str) -> Optional[Dict]:
        """Fall back to keyword matching against task_types keywords."""
        normalized_text = re.sub(r"[^a-z0-9\s]+", " ", f"{title} {description}".lower())
        text_tokens = set(normalized_text.split())

        best_match = None
        best_overlap = 0

        for tt in self._task_types:
            keyword_tokens = set()
            for kw in tt.get("keywords", []):
                normalized_kw = re.sub(r"[^a-z0-9\s]+", " ", kw.lower())
                keyword_tokens.update(normalized_kw.split())

            overlap = len(text_tokens & keyword_tokens)

            if overlap > best_overlap:
                best_overlap = overlap
                best_match = tt

        if best_match and best_overlap >= 1:
            # Find category name
            cat_id = best_match["category_id"]
            for cat in self._categories:
                if str(cat["_id"]) == cat_id:
                    return {
                        "category_id": cat_id,
                        "task_type_id": str(best_match["_id"]),
                        "category_name": cat["name"],
                        "task_type_name": best_match["name"],
                    }

        return None