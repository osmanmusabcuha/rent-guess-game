import os
import json
import re
from pathlib import Path

def extract_price(text):
    if not text:
        return None
    # Regex to find patterns like "17.500 TL" or "17500 TL" or "17.500TL"
    match = re.search(r'(\d{1,3}(?:\.\d{3})*|\d+)\s*TL', text)
    if match:
        price_str = match.group(1).replace('.', '')
        try:
            return int(price_str)
        except ValueError:
            return None
    return None

def get_local_images(ilan_id):
    image_dir = Path(f"data/images/{ilan_id}")
    if not image_dir.exists() or not image_dir.is_dir():
        return []
    
    valid_extensions = ('.jpg', '.jpeg', '.png', '.webp')
    images = []
    
    # List files and sort them
    for file_path in sorted(image_dir.iterdir()):
        if file_path.suffix.lower() in valid_extensions:
            images.append(f"http://localhost:8000/images/{ilan_id}/{file_path.name}")
            
    return images

def prepare_data():
    details_dir = Path("data/details")
    output_file = Path("data/listings_clean.json")
    
    if not details_dir.exists():
        print(f"Directory {details_dir} does not exist.")
        return

    clean_listings = []
    
    for file_path in details_dir.glob("*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            listings = data if isinstance(data, list) else [data]
            
            for item in listings:
                ilan_id = str(item.get("ilan_id", item.get("id", "")))
                if not ilan_id:
                    continue
                    
                # Extract rent
                rent = extract_price(item.get("card_text", ""))
                if rent is None and item.get("price"):
                    price_val = str(item.get("price")).replace('.', '').replace(' TL', '').strip()
                    if price_val.isdigit():
                        rent = int(price_val)
                
                # Check for alternative price fields in nested structure
                if rent is None and isinstance(item.get("general_specs"), dict):
                    price_text = item["general_specs"].get("Fiyat") or item["general_specs"].get("Kira")
                    if price_text:
                        rent = extract_price(price_text)

                if rent is None:
                    continue

                images = get_local_images(ilan_id)
                if not images:
                    images = item.get("image_urls", [])

                # Process specs (Handle both list and dict)
                specs = item.get("general_specs", {})
                building_age = "Bilinmiyor"
                floor = "Bilinmiyor"
                furnished = "Bilinmiyor"
                
                if isinstance(specs, list):
                    for spec in specs:
                        if isinstance(spec, dict):
                            val = spec.get("value", "")
                            if "Yaşında" in val or "Yeni" in val:
                                building_age = val
                            elif "Kat" in val or "Giriş" in val:
                                floor = val
                            elif "Eşyalı" in val:
                                furnished = val
                elif isinstance(specs, dict):
                    building_age = specs.get("Bina Yaşı", "Bilinmiyor")
                    floor = specs.get("Bulunduğu Kat", specs.get("Kat", "Bilinmiyor"))
                    furnished = specs.get("Eşya Durumu", "Bilinmiyor")

                clean_item = {
                    "id": ilan_id,
                    "title": item.get("title", "İsimsiz İlan"),
                    "city": item.get("city", "Bilinmiyor"),
                    "district": item.get("district", "Bilinmiyor"),
                    "neighbourhood": item.get("neighbourhood", "Bilinmiyor"),
                    "rooms": item.get("rooms", item.get("oda_sayisi", "Bilinmiyor")),
                    "area_m2": item.get("area_m2", item.get("brut_net_m2", 0)),
                    "building_age": building_age,
                    "floor": floor,
                    "furnished": furnished,
                    "rent": rent,
                    "images": images,
                    "source_url": item.get("detail_url", "#")
                }
                
                # area_m2 can be a string like "80 m2 / 75 m2"
                if isinstance(clean_item["area_m2"], str):
                    m = re.search(r'(\d+)', clean_item["area_m2"])
                    if m:
                        clean_item["area_m2"] = int(m.group(1))
                    else:
                        clean_item["area_m2"] = 0

                clean_listings.append(clean_item)
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(clean_listings, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully processed {len(clean_listings)} listings. Saved to {output_file}")

if __name__ == "__main__":
    prepare_data()
