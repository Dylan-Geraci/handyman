"""
Seed script for categories and task types.
Based on TaskRabbit's service categories.
Run: python seed_categories.py
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
client = MongoClient(DATABASE_URL)
db = client.handyman_db

# Collections
categories_collection = db.categories
task_types_collection = db.task_types

# TaskRabbit-based categories data
CATEGORIES = [
    {
        "name": "Assembly",
        "description": "Furniture assembly, equipment setup, and product assembly services",
        "icon_url": "/icons/assembly.svg"
    },
    {
        "name": "Mounting & Installation",
        "description": "TV mounting, shelf installation, and fixture setup",
        "icon_url": "/icons/mounting.svg"
    },
    {
        "name": "Moving & Packing",
        "description": "Help with moving, packing, unpacking, and heavy lifting",
        "icon_url": "/icons/moving.svg"
    },
    {
        "name": "Cleaning",
        "description": "Home cleaning, deep cleaning, and organization services",
        "icon_url": "/icons/cleaning.svg"
    },
    {
        "name": "Outdoor Help",
        "description": "Yard work, gardening, lawn care, and outdoor maintenance",
        "icon_url": "/icons/outdoor.svg"
    },
    {
        "name": "Home Repairs",
        "description": "General repairs, maintenance, electrical, plumbing, and handyman services",
        "icon_url": "/icons/repairs.svg"
    },
    {
        "name": "Painting",
        "description": "Interior and exterior painting services",
        "icon_url": "/icons/painting.svg"
    },
    {
        "name": "General Help",
        "description": "Errands, delivery, personal assistance, and miscellaneous tasks",
        "icon_url": "/icons/general.svg"
    }
]

# Task types for each category (based on TaskRabbit)
TASK_TYPES = {
    "Assembly": [
        {
            "name": "Furniture Assembly",
            "description": "Assemble beds, desks, chairs, tables, dressers, and other furniture",
            "keywords": ["furniture", "assemble", "put together", "build", "ikea", "desk", "chair", "table", "bed", "dresser", "bookshelf", "wardrobe"]
        },
        {
            "name": "Crib Assembly",
            "description": "Assemble cribs, bassinets, and baby furniture",
            "keywords": ["crib", "baby", "nursery", "bassinet", "baby furniture", "infant"]
        },
        {
            "name": "PAX Wardrobe Assembly",
            "description": "Assemble IKEA PAX wardrobes and closet systems",
            "keywords": ["pax", "wardrobe", "closet", "ikea", "storage system"]
        },
        {
            "name": "Desk Assembly",
            "description": "Assemble office desks, standing desks, and workstations",
            "keywords": ["desk", "office", "standing desk", "workstation", "computer desk"]
        },
        {
            "name": "Exercise Equipment Assembly",
            "description": "Assemble treadmills, ellipticals, weight benches, and gym equipment",
            "keywords": ["treadmill", "gym", "exercise", "fitness", "elliptical", "bike", "weight bench", "peloton"]
        },
        {
            "name": "Outdoor Furniture Assembly",
            "description": "Assemble patio furniture, grills, and outdoor equipment",
            "keywords": ["patio", "outdoor", "grill", "bbq", "garden furniture", "deck"]
        },
        {
            "name": "Bookshelf Assembly",
            "description": "Assemble bookshelves, storage units, and shelving systems",
            "keywords": ["bookshelf", "shelves", "storage", "kallax", "billy"]
        },
        {
            "name": "Bed Frame Assembly",
            "description": "Assemble bed frames, headboards, and platform beds",
            "keywords": ["bed frame", "headboard", "platform bed", "bunk bed"]
        },
        {
            "name": "Swing Set Assembly",
            "description": "Assemble swing sets, playsets, and outdoor play equipment",
            "keywords": ["swing set", "playset", "playground", "trampoline", "kids"]
        },
        {
            "name": "General Assembly",
            "description": "Assemble various items not listed elsewhere",
            "keywords": ["assemble", "assembly", "put together", "build"]
        }
    ],
    "Mounting & Installation": [
        {
            "name": "TV Mounting",
            "description": "Mount TVs on walls with proper brackets and cable management",
            "keywords": ["tv", "television", "mount", "wall mount", "flat screen", "bracket"]
        },
        {
            "name": "Shelf Installation",
            "description": "Install floating shelves, wall shelves, and shelving units",
            "keywords": ["shelf", "shelves", "floating shelf", "wall shelf", "bracket"]
        },
        {
            "name": "Curtain & Blind Installation",
            "description": "Install curtain rods, blinds, and window treatments",
            "keywords": ["curtain", "blinds", "drapes", "window", "rod", "shades"]
        },
        {
            "name": "Mirror & Art Hanging",
            "description": "Hang mirrors, pictures, and artwork securely",
            "keywords": ["mirror", "art", "picture", "frame", "hang", "wall art", "gallery wall"]
        },
        {
            "name": "Smart Home Installation",
            "description": "Install smart thermostats, doorbells, cameras, and home automation",
            "keywords": ["smart home", "nest", "ring", "thermostat", "doorbell", "camera", "alexa", "google home"]
        },
        {
            "name": "Ceiling Fan Installation",
            "description": "Install or replace ceiling fans",
            "keywords": ["ceiling fan", "fan", "install fan", "replace fan"]
        },
        {
            "name": "Light Fixture Installation",
            "description": "Install chandeliers, pendant lights, and light fixtures",
            "keywords": ["light", "fixture", "chandelier", "pendant", "lamp", "lighting"]
        },
        {
            "name": "Closet Organization Installation",
            "description": "Install closet systems, organizers, and storage solutions",
            "keywords": ["closet", "organizer", "storage", "wardrobe", "elfa", "container store"]
        },
        {
            "name": "Towel Bar & Bathroom Hardware",
            "description": "Install towel bars, toilet paper holders, and bathroom accessories",
            "keywords": ["towel bar", "bathroom", "toilet paper holder", "hardware", "accessories"]
        },
        {
            "name": "Baby Proofing",
            "description": "Install baby gates, cabinet locks, and safety equipment",
            "keywords": ["baby proof", "child safety", "baby gate", "cabinet lock", "outlet cover"]
        }
    ],
    "Moving & Packing": [
        {
            "name": "Help Moving",
            "description": "Assistance with loading, unloading, and moving items",
            "keywords": ["moving", "move", "relocate", "load", "unload", "truck"]
        },
        {
            "name": "Packing & Unpacking",
            "description": "Help packing boxes and unpacking after a move",
            "keywords": ["packing", "unpacking", "boxes", "pack", "unpack", "organize"]
        },
        {
            "name": "Heavy Lifting",
            "description": "Move heavy furniture, appliances, and large items",
            "keywords": ["heavy lifting", "heavy", "furniture", "appliance", "couch", "fridge"]
        },
        {
            "name": "Furniture Moving",
            "description": "Move furniture within home or between locations",
            "keywords": ["furniture", "move furniture", "rearrange", "relocate"]
        },
        {
            "name": "Storage Unit Help",
            "description": "Load or unload storage units",
            "keywords": ["storage", "storage unit", "load storage", "unload storage"]
        },
        {
            "name": "Junk Removal",
            "description": "Remove and dispose of unwanted items and junk",
            "keywords": ["junk", "removal", "dispose", "trash", "haul away", "dump"]
        },
        {
            "name": "Donation Drop-off",
            "description": "Transport items to donation centers",
            "keywords": ["donation", "donate", "goodwill", "salvation army", "charity"]
        },
        {
            "name": "Furniture Removal",
            "description": "Remove and dispose of old furniture",
            "keywords": ["furniture removal", "remove furniture", "dispose furniture", "old furniture"]
        }
    ],
    "Cleaning": [
        {
            "name": "Home Cleaning",
            "description": "General house cleaning and tidying",
            "keywords": ["cleaning", "clean", "house cleaning", "home cleaning", "tidy"]
        },
        {
            "name": "Deep Cleaning",
            "description": "Thorough deep cleaning of home spaces",
            "keywords": ["deep clean", "thorough", "detailed cleaning", "spring cleaning"]
        },
        {
            "name": "Move-Out Cleaning",
            "description": "Clean home after moving out",
            "keywords": ["move out", "moving", "end of lease", "apartment cleaning"]
        },
        {
            "name": "Move-In Cleaning",
            "description": "Clean home before moving in",
            "keywords": ["move in", "moving", "new home", "new apartment"]
        },
        {
            "name": "Garage Cleaning",
            "description": "Clean and organize garage spaces",
            "keywords": ["garage", "clean garage", "organize garage"]
        },
        {
            "name": "Carpet Cleaning",
            "description": "Deep clean carpets and rugs",
            "keywords": ["carpet", "rug", "steam clean", "shampooing"]
        },
        {
            "name": "Window Cleaning",
            "description": "Clean interior and exterior windows",
            "keywords": ["window", "windows", "glass", "window washing"]
        },
        {
            "name": "Oven Cleaning",
            "description": "Deep clean ovens and stovetops",
            "keywords": ["oven", "stove", "range", "kitchen appliance"]
        },
        {
            "name": "Refrigerator Cleaning",
            "description": "Deep clean and organize refrigerators",
            "keywords": ["fridge", "refrigerator", "freezer", "kitchen"]
        },
        {
            "name": "Organization",
            "description": "Organize closets, rooms, and spaces",
            "keywords": ["organize", "organization", "declutter", "tidy", "sort"]
        }
    ],
    "Outdoor Help": [
        {
            "name": "Lawn Mowing",
            "description": "Mow lawns and maintain grass",
            "keywords": ["lawn", "mow", "grass", "mowing", "yard"]
        },
        {
            "name": "Yard Work",
            "description": "General yard maintenance and cleanup",
            "keywords": ["yard", "yard work", "outdoor", "garden", "maintenance"]
        },
        {
            "name": "Leaf Removal",
            "description": "Rake and remove leaves from yard",
            "keywords": ["leaf", "leaves", "rake", "fall cleanup", "autumn"]
        },
        {
            "name": "Gardening",
            "description": "Plant flowers, maintain gardens, and landscaping",
            "keywords": ["garden", "gardening", "plant", "flowers", "landscaping", "planting"]
        },
        {
            "name": "Weeding",
            "description": "Remove weeds from gardens and yards",
            "keywords": ["weed", "weeding", "garden", "pull weeds"]
        },
        {
            "name": "Tree Trimming",
            "description": "Trim trees, hedges, and bushes",
            "keywords": ["tree", "trim", "prune", "hedge", "bush", "shrub"]
        },
        {
            "name": "Snow Removal",
            "description": "Shovel snow from driveways and walkways",
            "keywords": ["snow", "shovel", "ice", "winter", "driveway", "walkway"]
        },
        {
            "name": "Gutter Cleaning",
            "description": "Clean gutters and downspouts",
            "keywords": ["gutter", "gutters", "downspout", "roof", "drainage"]
        },
        {
            "name": "Pressure Washing",
            "description": "Pressure wash driveways, decks, and siding",
            "keywords": ["pressure wash", "power wash", "driveway", "deck", "siding", "patio"]
        },
        {
            "name": "Fence Repair",
            "description": "Repair and maintain fences",
            "keywords": ["fence", "repair fence", "fence post", "gate"]
        }
    ],
    "Home Repairs": [
        {
            "name": "General Handyman",
            "description": "Various home repairs and maintenance tasks",
            "keywords": ["handyman", "repair", "fix", "maintenance", "home repair"]
        },
        {
            "name": "Drywall Repair",
            "description": "Patch holes and repair drywall",
            "keywords": ["drywall", "wall", "hole", "patch", "sheetrock"]
        },
        {
            "name": "Door Repair",
            "description": "Fix doors, hinges, and door frames",
            "keywords": ["door", "hinge", "door frame", "fix door", "repair door"]
        },
        {
            "name": "Window Repair",
            "description": "Repair windows, screens, and seals",
            "keywords": ["window", "screen", "seal", "glass", "window repair"]
        },
        {
            "name": "Flooring Repair",
            "description": "Repair hardwood, tile, and laminate flooring",
            "keywords": ["floor", "flooring", "hardwood", "tile", "laminate", "repair floor"]
        },
        {
            "name": "Caulking",
            "description": "Apply caulk around tubs, sinks, and windows",
            "keywords": ["caulk", "caulking", "seal", "bathroom", "tub", "sink"]
        },
        {
            "name": "Grout Repair",
            "description": "Repair and replace tile grout",
            "keywords": ["grout", "tile", "regrout", "bathroom", "kitchen"]
        },
        {
            "name": "Deck Repair",
            "description": "Repair and maintain decks and patios",
            "keywords": ["deck", "patio", "wood", "repair deck", "boards"]
        },
        {
            "name": "Lock Installation",
            "description": "Install or replace door locks and deadbolts",
            "keywords": ["lock", "deadbolt", "door lock", "security", "key"]
        },
        {
            "name": "Weather Stripping",
            "description": "Install weather stripping around doors and windows",
            "keywords": ["weather strip", "insulation", "draft", "seal", "energy"]
        },
        {
            "name": "Light Fixture Installation",
            "description": "Install or replace light fixtures",
            "keywords": ["light", "fixture", "install light", "replace light", "lighting"]
        },
        {
            "name": "Ceiling Fan Installation",
            "description": "Install or replace ceiling fans",
            "keywords": ["ceiling fan", "fan", "install fan", "replace fan"]
        },
        {
            "name": "Outlet & Switch Installation",
            "description": "Install or replace electrical outlets and switches",
            "keywords": ["outlet", "switch", "electrical", "plug", "receptacle"]
        },
        {
            "name": "Dimmer Switch Installation",
            "description": "Install dimmer switches for lights",
            "keywords": ["dimmer", "switch", "light dimmer", "brightness"]
        },
        {
            "name": "Doorbell Installation",
            "description": "Install doorbells including video doorbells",
            "keywords": ["doorbell", "ring", "nest", "video doorbell", "chime"]
        },
        {
            "name": "Smoke Detector Installation",
            "description": "Install or replace smoke and CO detectors",
            "keywords": ["smoke detector", "carbon monoxide", "fire alarm", "safety"]
        },
        {
            "name": "Faucet Installation",
            "description": "Install or replace faucets in kitchens and bathrooms",
            "keywords": ["faucet", "tap", "sink", "kitchen", "bathroom", "install faucet"]
        },
        {
            "name": "Toilet Repair",
            "description": "Repair or replace toilets and components",
            "keywords": ["toilet", "repair", "running", "flush", "clogged", "wax ring"]
        },
        {
            "name": "Toilet Installation",
            "description": "Install new toilets",
            "keywords": ["toilet", "install", "replace", "new toilet"]
        },
        {
            "name": "Drain Cleaning",
            "description": "Clear clogged drains and pipes",
            "keywords": ["drain", "clog", "clogged", "slow drain", "blocked"]
        },
        {
            "name": "Garbage Disposal Installation",
            "description": "Install or replace garbage disposals",
            "keywords": ["garbage disposal", "disposal", "kitchen sink", "install disposal"]
        },
        {
            "name": "Showerhead Installation",
            "description": "Install or replace showerheads",
            "keywords": ["shower", "showerhead", "bathroom", "rain shower"]
        },
        {
            "name": "Leak Repair",
            "description": "Fix leaky pipes, faucets, and fixtures",
            "keywords": ["leak", "leaky", "drip", "pipe", "water"]
        }
    ],
    "Painting": [
        {
            "name": "Interior Painting",
            "description": "Paint interior walls, ceilings, and trim",
            "keywords": ["interior", "paint", "wall", "ceiling", "room", "inside"]
        },
        {
            "name": "Exterior Painting",
            "description": "Paint exterior walls, siding, and trim",
            "keywords": ["exterior", "outside", "siding", "house painting", "outdoor"]
        },
        {
            "name": "Cabinet Painting",
            "description": "Paint or refinish kitchen and bathroom cabinets",
            "keywords": ["cabinet", "kitchen", "refinish", "cabinet painting"]
        },
        {
            "name": "Furniture Painting",
            "description": "Paint or refinish furniture pieces",
            "keywords": ["furniture", "refinish", "restore", "paint furniture"]
        },
        {
            "name": "Deck Staining",
            "description": "Stain and seal decks and fences",
            "keywords": ["deck", "stain", "seal", "fence", "wood stain"]
        },
        {
            "name": "Wallpaper Removal",
            "description": "Remove old wallpaper from walls",
            "keywords": ["wallpaper", "remove", "strip", "wall covering"]
        },
        {
            "name": "Wallpaper Installation",
            "description": "Install new wallpaper and wall coverings",
            "keywords": ["wallpaper", "install", "wall covering", "hang wallpaper"]
        },
        {
            "name": "Touch-Up Painting",
            "description": "Small touch-up paint jobs and repairs",
            "keywords": ["touch up", "small", "repair", "spot", "fix"]
        }
    ],
    "General Help": [
        {
            "name": "Delivery",
            "description": "Pick up and deliver items",
            "keywords": ["delivery", "deliver", "pick up", "transport", "haul"]
        },
        {
            "name": "Errands",
            "description": "Run errands and complete tasks around town",
            "keywords": ["errand", "errands", "pickup", "drop off", "task"]
        },
        {
            "name": "Wait for Delivery",
            "description": "Wait at home for deliveries or service appointments",
            "keywords": ["wait", "delivery", "service", "appointment", "home"]
        },
        {
            "name": "Personal Assistant",
            "description": "Personal assistance with various tasks",
            "keywords": ["assistant", "help", "personal", "tasks", "organize"]
        },
        {
            "name": "Event Help",
            "description": "Help with event setup, serving, and cleanup",
            "keywords": ["event", "party", "setup", "cleanup", "serve", "catering"]
        },
        {
            "name": "Shopping",
            "description": "Shop for groceries, household items, or gifts",
            "keywords": ["shopping", "grocery", "shop", "buy", "purchase"]
        },
        {
            "name": "Dog Walking",
            "description": "Walk dogs and pet care",
            "keywords": ["dog", "pet", "walk", "dog walking", "pet sitting"]
        },
        {
            "name": "Car Wash",
            "description": "Wash and detail vehicles",
            "keywords": ["car wash", "car", "vehicle", "detail", "clean car"]
        },
        {
            "name": "Data Entry",
            "description": "Data entry and administrative tasks",
            "keywords": ["data entry", "typing", "admin", "office", "computer"]
        },
        {
            "name": "Other",
            "description": "Other tasks not listed elsewhere",
            "keywords": ["other", "misc", "miscellaneous", "help", "task"]
        }
    ]
}


def seed_database():
    """Seed the database with categories and task types."""

    print("Starting database seed...")

    # Clear existing data (optional - makes it idempotent)
    categories_collection.delete_many({})
    task_types_collection.delete_many({})
    print("Cleared existing categories and task types")

    # Insert categories and track their IDs
    category_id_map = {}

    for category in CATEGORIES:
        result = categories_collection.insert_one(category)
        category_id_map[category["name"]] = str(result.inserted_id)
        print(f"Created category: {category['name']}")

    # Insert task types with category references
    task_type_count = 0
    for category_name, task_types in TASK_TYPES.items():
        category_id = category_id_map.get(category_name)
        if not category_id:
            print(f"Warning: Category '{category_name}' not found, skipping task types")
            continue

        for task_type in task_types:
            task_type_doc = {
                "name": task_type["name"],
                "description": task_type["description"],
                "category_id": category_id,
                "keywords": task_type["keywords"]
            }
            task_types_collection.insert_one(task_type_doc)
            task_type_count += 1

        print(f"Created {len(task_types)} task types for: {category_name}")

    # Create indexes for better query performance
    categories_collection.create_index("name", unique=True)
    task_types_collection.create_index("category_id")
    task_types_collection.create_index("name")
    task_types_collection.create_index("keywords")
    print("Created database indexes")

    print(f"\nSeed complete!")
    print(f"Total categories: {len(CATEGORIES)}")
    print(f"Total task types: {task_type_count}")


def verify_seed():
    """Verify the seeded data."""

    print("\nVerifying seeded data...")

    # Count documents
    cat_count = categories_collection.count_documents({})
    task_type_count = task_types_collection.count_documents({})

    print(f"Categories in database: {cat_count}")
    print(f"Task types in database: {task_type_count}")

    # Sample query
    print("\nSample category:")
    sample_cat = categories_collection.find_one({"name": "Assembly"})
    if sample_cat:
        print(f"  Name: {sample_cat['name']}")
        print(f"  Description: {sample_cat['description']}")
        print(f"  ID: {sample_cat['_id']}")

        # Get task types for this category
        task_types = list(task_types_collection.find({"category_id": str(sample_cat['_id'])}))
        print(f"  Task types: {len(task_types)}")
        for tt in task_types[:3]:
            print(f"    - {tt['name']}")


if __name__ == "__main__":
    seed_database()
    verify_seed()
