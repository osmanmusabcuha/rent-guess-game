import json
import argparse
from pathlib import Path
from collections import defaultdict
import random

def create_demo_dataset(limit=300):
    input_file = Path("data/listings_clean.json")
    output_file = Path("data/listings_demo.json")

    if not input_file.exists():
        print(f"Error: {input_file} not found. Please run prepare_data.py first.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        listings = json.load(f)

    print(f"Total listings found in clean file: {len(listings)}")

    valid_listings = []
    
    for item in listings:
        # Basic validation
        # Area_m2 might be 0 if not found, we want valid games
        if not all([item.get("id"), item.get("city"), item.get("rent")]):
            continue
            
        # Images should not be empty
        if not item.get("images") or len(item["images"]) == 0:
            continue

        # Range validation
        rent = item["rent"]
        area = item.get("area_m2", 0)
        
        if not (3000 <= rent <= 250000):
            continue
            
        # If area is unknown (0), we still might want it if images are good, 
        # but the request said area_m2 < 20 or > 500 should be filtered.
        # Let's be strict as requested.
        if not (20 <= area <= 500):
            continue
            
        valid_listings.append(item)

    print(f"Listings after filtering criteria: {len(valid_listings)}")

    if not valid_listings:
        print("No valid listings found after filtering.")
        return

    # Balanced selection by city
    city_map = defaultdict(list)
    for item in valid_listings:
        city_map[item["city"]].append(item)

    cities = list(city_map.keys())
    
    # How many items per city roughly?
    # If limit is 300 and we have 30 cities, 10 per city.
    demo_set = []
    
    # Randomly shuffle cities to avoid bias if we reach limit early
    random.shuffle(cities)
    
    per_city_target = max(1, limit // len(cities))
    
    for city in cities:
        city_items = city_map[city]
        random.shuffle(city_items)
        demo_set.extend(city_items[:per_city_target])

    # If we need more to reach the limit, pick randomly from the remaining
    already_selected_ids = {item["id"] for item in demo_set}
    remaining = [item for item in valid_listings if item["id"] not in already_selected_ids]
    
    needed = limit - len(demo_set)
    if needed > 0 and remaining:
        random.shuffle(remaining)
        demo_set.extend(remaining[:needed])

    # Final shuffle for the game
    random.shuffle(demo_set)
    demo_set = demo_set[:limit]

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(demo_set, f, ensure_ascii=False, indent=2)

    print(f"Successfully created demo dataset with {len(demo_set)} listings.")
    print(f"Saved to: {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a demo dataset for Rent Guess Game")
    parser.add_argument("--limit", type=int, default=300, help="Number of listings to include (default: 300)")
    args = parser.parse_args()
    create_demo_dataset(args.limit)
