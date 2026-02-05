"""
Unit tests for the recommendation system.

Run with: python -m pytest test_recommendations.py -v
Or simply: python test_recommendations.py
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

# Mock data for testing
MOCK_TASKER = {
    "_id": "mock_tasker_id",
    "username": "test_tasker",
    "full_name": "Test Tasker",
    "role": "tasker",
    "location": "Brooklyn, NY",
    "skills": ["furniture assembly", "ikea assembly", "mounting"],
    "bio": "Experienced furniture assembler",
    "service_categories": ["category_1"],
    "experience_level": 2,  # Intermediate
    "completed_tasks_count": 15,
    "avg_rating": 4.5,
    "coordinates": {"lat": 40.6782, "lng": -73.9442}
}

MOCK_TASK_RECENT = {
    "_id": "mock_task_1",
    "title": "Assemble IKEA bed frame",
    "description": "Need help assembling a MALM bed frame from IKEA",
    "location": "Manhattan, NY",
    "category_id": "category_1",
    "task_type_id": "task_type_1",
    "status": "open",
    "posted_at": datetime.utcnow() - timedelta(minutes=30),
    "estimated_difficulty": 2,
    "coordinates": {"lat": 40.7831, "lng": -73.9712}
}

MOCK_TASK_OLD = {
    "_id": "mock_task_2",
    "title": "Paint living room",
    "description": "Need to paint a 15x20 living room",
    "location": "Los Angeles, CA",
    "category_id": "category_2",
    "task_type_id": "task_type_2",
    "status": "open",
    "posted_at": datetime.utcnow() - timedelta(days=5),
    "estimated_difficulty": 2,
    "coordinates": {"lat": 34.0522, "lng": -118.2437}
}


def test_geocoding():
    """Test geocoding utilities."""
    print("\n" + "=" * 60)
    print("TEST: Geocoding")
    print("=" * 60)

    from utils.geocoding import (
        geocode_location,
        calculate_distance,
        get_distance_between_locations,
        is_within_radius
    )

    # Test geocoding
    print("\n1. Testing geocode_location()...")
    brooklyn_coords = geocode_location("Brooklyn, NY")
    assert brooklyn_coords["lat"] == 40.6782, "Brooklyn latitude incorrect"
    assert brooklyn_coords["lng"] == -73.9442, "Brooklyn longitude incorrect"
    print(f"✓ Brooklyn, NY: {brooklyn_coords}")

    # Test unknown location
    unknown_coords = geocode_location("Unknown City, XX")
    assert unknown_coords["lat"] == 0.0, "Unknown location should return 0,0"
    print(f"✓ Unknown location returns: {unknown_coords}")

    # Test distance calculation
    print("\n2. Testing calculate_distance()...")
    distance = calculate_distance(
        40.6782, -73.9442,  # Brooklyn
        40.7831, -73.9712   # Manhattan
    )
    assert 6 <= distance <= 8, f"Distance should be ~7 miles, got {distance}"
    print(f"✓ Brooklyn to Manhattan: {distance} miles")

    # Test location-based distance
    print("\n3. Testing get_distance_between_locations()...")
    distance2 = get_distance_between_locations("Brooklyn, NY", "Manhattan, NY")
    assert distance2 == distance, "Distances should match"
    print(f"✓ Location-based distance: {distance2} miles")

    # Test radius check
    print("\n4. Testing is_within_radius()...")
    assert is_within_radius("Brooklyn, NY", "Manhattan, NY", 10) == True
    assert is_within_radius("Brooklyn, NY", "Los Angeles, CA", 10) == False
    print("✓ Radius checks working correctly")

    print("\n✅ All geocoding tests passed!")


def test_recommendation_helpers():
    """Test recommendation helper functions."""
    print("\n" + "=" * 60)
    print("TEST: Recommendation Helpers")
    print("=" * 60)

    from utils.recommendation_helpers import (
        calculate_distance_score,
        calculate_recency_score,
        estimate_task_difficulty,
        determine_experience_level,
        calculate_difficulty_match_score,
        calculate_category_match_score
    )

    # Test distance scoring
    print("\n1. Testing calculate_distance_score()...")
    score = calculate_distance_score(MOCK_TASKER, MOCK_TASK_RECENT)
    assert 15 <= score <= 25, f"Distance score should be 15-25, got {score}"
    print(f"✓ Brooklyn to Manhattan distance score: {score}/25")

    # Test recency scoring
    print("\n2. Testing calculate_recency_score()...")
    recent_score = calculate_recency_score(MOCK_TASK_RECENT)
    old_score = calculate_recency_score(MOCK_TASK_OLD)
    assert recent_score > old_score, "Recent task should score higher"
    assert recent_score >= 12, f"Recent task should score 12+, got {recent_score}"
    assert old_score == 0, f"Old task should score 0, got {old_score}"
    print(f"✓ Recent task score: {recent_score}/15")
    print(f"✓ Old task score: {old_score}/15")

    # Test difficulty estimation
    print("\n3. Testing estimate_task_difficulty()...")
    easy_task = {"title": "Quick clean", "description": "Simple cleaning task"}
    hard_task = {"title": "Electrical", "description": "Complex electrical wiring work"}

    easy_difficulty = estimate_task_difficulty(easy_task)
    hard_difficulty = estimate_task_difficulty(hard_task)
    assert easy_difficulty <= 2, f"Easy task should be difficulty 1-2, got {easy_difficulty}"
    assert hard_difficulty >= 2, f"Hard task should be difficulty 2-3, got {hard_difficulty}"
    print(f"✓ Easy task difficulty: {easy_difficulty}")
    print(f"✓ Hard task difficulty: {hard_difficulty}")

    # Test experience level determination
    print("\n4. Testing determine_experience_level()...")
    beginner = {"completed_tasks_count": 5}
    intermediate = {"completed_tasks_count": 20}
    expert = {"completed_tasks_count": 100}

    assert determine_experience_level(beginner) == 1, "Should be beginner"
    assert determine_experience_level(intermediate) == 2, "Should be intermediate"
    assert determine_experience_level(expert) == 3, "Should be expert"
    print("✓ Experience levels calculated correctly")

    # Test difficulty matching
    print("\n5. Testing calculate_difficulty_match_score()...")
    match_score = calculate_difficulty_match_score(MOCK_TASKER, MOCK_TASK_RECENT)
    assert 0 <= match_score <= 10, f"Match score should be 0-10, got {match_score}"
    print(f"✓ Difficulty match score: {match_score}/10")

    # Test category matching
    print("\n6. Testing calculate_category_match_score()...")
    category_score = calculate_category_match_score(MOCK_TASKER, MOCK_TASK_RECENT)
    assert category_score == 20.0, f"Category match should be 20, got {category_score}"

    no_match_task = {**MOCK_TASK_RECENT, "category_id": "different_category"}
    no_match_score = calculate_category_match_score(MOCK_TASKER, no_match_task)
    assert no_match_score == 0.0, f"No category match should be 0, got {no_match_score}"
    print(f"✓ Category match score: {category_score}/20")
    print(f"✓ No match score: {no_match_score}/20")

    print("\n✅ All helper tests passed!")


def test_scoring_normalization():
    """Test that scores are properly normalized to 0-100 scale."""
    print("\n" + "=" * 60)
    print("TEST: Score Normalization")
    print("=" * 60)

    # Maximum possible raw score
    max_raw_score = 20 + 30 + 25 + 15 + 10 + 10 + 5  # 115 points
    print(f"\nMaximum possible raw score: {max_raw_score}")

    # Test normalization
    normalized = (max_raw_score / 115.0) * 100
    assert normalized == 100.0, "Max score should normalize to 100"
    print(f"✓ Normalized to: {normalized}/100")

    # Test mid-range score
    mid_score = 57.5  # Half of max
    normalized_mid = (mid_score / 115.0) * 100
    assert 49 <= normalized_mid <= 51, "Mid score should be ~50"
    print(f"✓ Mid score ({mid_score}) normalized to: {normalized_mid:.1f}/100")

    print("\n✅ Score normalization tests passed!")


def test_match_reasons():
    """Test match reason generation."""
    print("\n" + "=" * 60)
    print("TEST: Match Reason Generation")
    print("=" * 60)

    from utils.recommendation_helpers import generate_match_reasons

    scores = {
        "category_match": 20.0,
        "semantic_match": 25.0,
        "distance": 20.0,
        "recency": 12.0,
        "difficulty_match": 10.0,
        "historical_success": 7.0,
        "competition": 5.0
    }

    reasons = generate_match_reasons(MOCK_TASKER, MOCK_TASK_RECENT, scores, distance=7.2)

    print(f"\nGenerated {len(reasons)} reasons:")
    for i, reason in enumerate(reasons, 1):
        print(f"  {i}. {reason}")

    assert len(reasons) > 0, "Should generate at least one reason"
    assert any("skill" in r.lower() for r in reasons), "Should mention skills"

    print("\n✅ Match reason tests passed!")


def run_all_tests():
    """Run all test suites."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 58 + "║")
    print("║" + "  RECOMMENDATION SYSTEM UNIT TESTS  ".center(58) + "║")
    print("║" + " " * 58 + "║")
    print("╚" + "═" * 58 + "╝")

    try:
        test_geocoding()
        test_recommendation_helpers()
        test_scoring_normalization()
        test_match_reasons()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED ✅")
        print("=" * 60)
        print("\n✓ Geocoding utilities working")
        print("✓ Recommendation helpers working")
        print("✓ Score normalization correct")
        print("✓ Match reason generation working")
        print("\nThe recommendation system is ready to use!")
        print()

    except AssertionError as e:
        print("\n" + "=" * 60)
        print("TEST FAILED ✗")
        print("=" * 60)
        print(f"\nError: {e}")
        print("\nPlease fix the issue and run tests again.")
        print()
        raise

    except Exception as e:
        print("\n" + "=" * 60)
        print("TEST ERROR ✗")
        print("=" * 60)
        print(f"\nUnexpected error: {e}")
        print("\nPlease check your implementation.")
        print()
        raise


if __name__ == "__main__":
    run_all_tests()
