import sqlite3
import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = BASE_DIR / "rent_guess.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create listings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        title TEXT,
        city TEXT,
        district TEXT,
        neighbourhood TEXT,
        rooms TEXT,
        area_m2 INTEGER,
        building_age TEXT,
        floor TEXT,
        furnished TEXT,
        rent INTEGER,
        images TEXT, -- JSON string of list
        heating TEXT,
        bathrooms TEXT,
        property_type TEXT,
        total_floors TEXT,
        usage_status TEXT,
        facade TEXT,
        deposit TEXT,
        dues TEXT,
        updated_at TEXT
    )
    ''')
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT,
        total_score INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create scores table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        score INTEGER,
        accuracy REAL,
        listing_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    conn.commit()
    return conn

def migrate():
    conn = init_db()
    cursor = conn.cursor()
    
    main_file = DATA_DIR / "listings_clean.json"
    if not main_file.exists():
        print("Main file not found!")
        return

    # Load main listings
    listings = []
    for enc in ["utf-8-sig", "utf-8", "iso-8859-9", "cp1254"]:
        try:
            with open(main_file, "r", encoding=enc, errors="replace") as f:
                listings = json.load(f)
            print(f"Loaded {len(listings)} listings with {enc}")
            break
        except:
            continue

    count = 0
    for item in listings:
        l_id = str(item.get("id"))
        # Try to get detailed info
        detail_path = DATA_DIR / "details" / f"{l_id}.json"
        details = {}
        if detail_path.exists():
            for enc in ["utf-8", "iso-8859-9", "cp1254"]:
                try:
                    with open(detail_path, "r", encoding=enc, errors="replace") as df:
                        details = json.load(df)
                    break
                except:
                    continue
        
        # Prepare data
        images_json = json.dumps(item.get("images", []))
        
        def safe_strip(val):
            return str(val).strip() if val is not None else ""
            
        cursor.execute('''
        INSERT OR REPLACE INTO listings (
            id, title, city, district, neighbourhood, rooms, area_m2, 
            building_age, floor, furnished, rent, images,
            heating, bathrooms, property_type, total_floors, 
            usage_status, facade, deposit, dues, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            l_id,
            item.get("title"),
            item.get("city"),
            item.get("district"),
            item.get("neighbourhood"),
            item.get("rooms"),
            item.get("area_m2"),
            item.get("building_age"),
            item.get("floor"),
            item.get("furnished"),
            item.get("rent"),
            images_json,
            safe_strip(details.get("isinma_tipi")),
            safe_strip(details.get("banyo_sayisi")),
            safe_strip(details.get("konut_tipi")),
            safe_strip(details.get("kat_sayisi")),
            safe_strip(details.get("kullanim_durumu")),
            safe_strip(details.get("cephe")),
            safe_strip(details.get("depozito")),
            safe_strip(details.get("aidat")),
            safe_strip(details.get("son_guncelleme"))
        ))
        
        count += 1
        if count % 500 == 0:
            print(f"Migrated {count} listings...")

    conn.commit()
    print(f"Successfully migrated {count} listings to SQLite!")
    conn.close()

if __name__ == "__main__":
    migrate()
