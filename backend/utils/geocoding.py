"""
Location geocoding utilities for the Handyman platform.

Provides simple city-to-coordinates mapping for distance calculations.
Can be upgraded to use external geocoding APIs (Google, OpenStreetMap) later.
"""

from typing import Dict, Optional, Tuple


# Major US cities and their coordinates
# Format: "City, State": {"lat": latitude, "lng": longitude}
CITY_COORDINATES: Dict[str, Dict[str, float]] = {
    # New York
    "Brooklyn, NY": {"lat": 40.6782, "lng": -73.9442},
    "Manhattan, NY": {"lat": 40.7831, "lng": -73.9712},
    "Queens, NY": {"lat": 40.7282, "lng": -73.7949},
    "Bronx, NY": {"lat": 40.8448, "lng": -73.8648},
    "Staten Island, NY": {"lat": 40.5795, "lng": -74.1502},
    "New York, NY": {"lat": 40.7128, "lng": -74.0060},

    # California
    "Los Angeles, CA": {"lat": 34.0522, "lng": -118.2437},
    "San Francisco, CA": {"lat": 37.7749, "lng": -122.4194},
    "San Diego, CA": {"lat": 32.7157, "lng": -117.1611},
    "San Jose, CA": {"lat": 37.3382, "lng": -121.8863},
    "Sacramento, CA": {"lat": 38.5816, "lng": -121.4944},
    "Oakland, CA": {"lat": 37.8044, "lng": -122.2712},

    # Texas
    "Houston, TX": {"lat": 29.7604, "lng": -95.3698},
    "Dallas, TX": {"lat": 32.7767, "lng": -96.7970},
    "Austin, TX": {"lat": 30.2672, "lng": -97.7431},
    "San Antonio, TX": {"lat": 29.4241, "lng": -98.4936},

    # Florida
    "Miami, FL": {"lat": 25.7617, "lng": -80.1918},
    "Orlando, FL": {"lat": 28.5383, "lng": -81.3792},
    "Tampa, FL": {"lat": 27.9506, "lng": -82.4572},
    "Jacksonville, FL": {"lat": 30.3322, "lng": -81.6557},

    # Illinois
    "Chicago, IL": {"lat": 41.8781, "lng": -87.6298},

    # Pennsylvania
    "Philadelphia, PA": {"lat": 39.9526, "lng": -75.1652},
    "Pittsburgh, PA": {"lat": 40.4406, "lng": -79.9959},

    # Arizona
    "Phoenix, AZ": {"lat": 33.4484, "lng": -112.0740},

    # Massachusetts
    "Boston, MA": {"lat": 42.3601, "lng": -71.0589},

    # Washington
    "Seattle, WA": {"lat": 47.6062, "lng": -122.3321},

    # Colorado
    "Denver, CO": {"lat": 39.7392, "lng": -104.9903},

    # Georgia
    "Atlanta, GA": {"lat": 33.7490, "lng": -84.3880},

    # Michigan
    "Detroit, MI": {"lat": 42.3314, "lng": -83.0458},

    # Nevada
    "Las Vegas, NV": {"lat": 36.1699, "lng": -115.1398},

    # Oregon
    "Portland, OR": {"lat": 45.5152, "lng": -122.6784},

    # North Carolina
    "Charlotte, NC": {"lat": 35.2271, "lng": -80.8431},
    "Raleigh, NC": {"lat": 35.7796, "lng": -78.6382},

    # Tennessee
    "Nashville, TN": {"lat": 36.1627, "lng": -86.7816},
    "Memphis, TN": {"lat": 35.1495, "lng": -90.0490},

    # Maryland
    "Baltimore, MD": {"lat": 39.2904, "lng": -76.6122},

    # Virginia
    "Virginia Beach, VA": {"lat": 36.8529, "lng": -75.9780},

    # Washington DC
    "Washington, DC": {"lat": 38.9072, "lng": -77.0369},
}


def geocode_location(location: str) -> Dict[str, float]:
    """
    Convert a location string to geographic coordinates.

    Args:
        location: Location string (e.g., "Brooklyn, NY")

    Returns:
        Dictionary with 'lat' and 'lng' keys, or default coordinates if not found

    Examples:
        >>> geocode_location("Brooklyn, NY")
        {'lat': 40.6782, 'lng': -73.9442}

        >>> geocode_location("Unknown City")
        {'lat': 0.0, 'lng': 0.0}
    """
    if not location:
        return {"lat": 0.0, "lng": 0.0}

    # Try exact match first
    if location in CITY_COORDINATES:
        return CITY_COORDINATES[location]

    # Try case-insensitive match
    location_lower = location.lower()
    for city, coords in CITY_COORDINATES.items():
        if city.lower() == location_lower:
            return coords

    # Try partial match (e.g., "Brooklyn" matches "Brooklyn, NY")
    for city, coords in CITY_COORDINATES.items():
        if location_lower in city.lower() or city.lower() in location_lower:
            return coords

    # Default coordinates if no match found
    return {"lat": 0.0, "lng": 0.0}


def calculate_distance(
    lat1: float, lng1: float, lat2: float, lng2: float
) -> float:
    """
    Calculate the distance between two geographic points using the Haversine formula.

    Args:
        lat1: Latitude of first point
        lng1: Longitude of first point
        lat2: Latitude of second point
        lng2: Longitude of second point

    Returns:
        Distance in miles

    Examples:
        >>> # Brooklyn to Manhattan (approx 6 miles)
        >>> calculate_distance(40.6782, -73.9442, 40.7831, -73.9712)
        7.24
    """
    from math import radians, sin, cos, sqrt, atan2

    # Earth's radius in miles
    R = 3959.0

    # Convert to radians
    lat1_rad = radians(lat1)
    lng1_rad = radians(lng1)
    lat2_rad = radians(lat2)
    lng2_rad = radians(lng2)

    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlng = lng2_rad - lng1_rad

    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlng / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c
    return round(distance, 2)


def get_distance_between_locations(location1: str, location2: str) -> float:
    """
    Calculate distance between two location strings.

    Args:
        location1: First location (e.g., "Brooklyn, NY")
        location2: Second location (e.g., "Manhattan, NY")

    Returns:
        Distance in miles, or 0.0 if either location cannot be geocoded

    Examples:
        >>> get_distance_between_locations("Brooklyn, NY", "Manhattan, NY")
        7.24
    """
    coords1 = geocode_location(location1)
    coords2 = geocode_location(location2)

    # If either location is at default coordinates, return 0
    if (coords1["lat"] == 0.0 and coords1["lng"] == 0.0) or \
       (coords2["lat"] == 0.0 and coords2["lng"] == 0.0):
        return 0.0

    return calculate_distance(
        coords1["lat"], coords1["lng"],
        coords2["lat"], coords2["lng"]
    )


def is_within_radius(location1: str, location2: str, radius_miles: float) -> bool:
    """
    Check if two locations are within a specified radius of each other.

    Args:
        location1: First location
        location2: Second location
        radius_miles: Maximum distance in miles

    Returns:
        True if locations are within radius, False otherwise

    Examples:
        >>> is_within_radius("Brooklyn, NY", "Manhattan, NY", 10)
        True

        >>> is_within_radius("Brooklyn, NY", "Los Angeles, CA", 10)
        False
    """
    distance = get_distance_between_locations(location1, location2)

    # If distance is 0.0 (unknown locations), consider them not within radius
    if distance == 0.0:
        return False

    return distance <= radius_miles


def get_nearby_cities(location: str, radius_miles: float = 25) -> list:
    """
    Get a list of cities within a specified radius of a location.

    Args:
        location: Center location
        radius_miles: Search radius in miles

    Returns:
        List of city names within the radius

    Examples:
        >>> get_nearby_cities("Manhattan, NY", 20)
        ['Brooklyn, NY', 'Queens, NY', 'Bronx, NY', 'New York, NY']
    """
    center_coords = geocode_location(location)

    # If location not found, return empty list
    if center_coords["lat"] == 0.0 and center_coords["lng"] == 0.0:
        return []

    nearby = []

    for city, coords in CITY_COORDINATES.items():
        if city == location:
            continue  # Skip the center city itself

        distance = calculate_distance(
            center_coords["lat"], center_coords["lng"],
            coords["lat"], coords["lng"]
        )

        if distance <= radius_miles:
            nearby.append(city)

    return nearby


def add_city_coordinates(city: str, lat: float, lng: float) -> None:
    """
    Add a new city to the coordinates database.

    This can be used to extend the database at runtime.

    Args:
        city: City name (e.g., "Custom City, ST")
        lat: Latitude
        lng: Longitude

    Examples:
        >>> add_city_coordinates("New City, CA", 37.1234, -122.5678)
    """
    CITY_COORDINATES[city] = {"lat": lat, "lng": lng}


# Utility function to get all supported cities
def get_supported_cities() -> list:
    """
    Get a list of all cities with known coordinates.

    Returns:
        List of city names

    Examples:
        >>> cities = get_supported_cities()
        >>> "Brooklyn, NY" in cities
        True
    """
    return list(CITY_COORDINATES.keys())
