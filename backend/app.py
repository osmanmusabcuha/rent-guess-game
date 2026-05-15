import os
import json
import sqlite3
import random
import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext

# --- CONFIG & CONSTANTS ---
DB_PATH = "game.db"
SECRET_KEY = "SUPER_SECRET_CHANGE_ME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Rent Guess Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STATIC FILES ---
app.mount("/data", StaticFiles(directory="backend/data" if os.path.exists("backend/data") else "data"), name="data")
app.mount("/images", StaticFiles(directory="backend/data/images" if os.path.exists("backend/data/images") else "data/images"), name="images")

# --- DATABASE INIT ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Existing tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE NULL,
            created_at TEXT NOT NULL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            location TEXT NOT NULL,
            rent INTEGER NOT NULL,
            images TEXT NOT NULL,
            specs TEXT NOT NULL,
            source_url TEXT NULL,
            created_at TEXT NOT NULL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            accuracy REAL NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    # --- ROOMS TABLES ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rooms (
            room_code TEXT PRIMARY KEY,
            host_user_id INTEGER NULL,
            host_guest_id TEXT NULL,
            listing_ids TEXT NOT NULL,
            settings TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'waiting',
            time_limit INTEGER DEFAULT 20,
            started_at TEXT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS room_players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_code TEXT NOT NULL,
            user_id INTEGER NULL,
            guest_id TEXT NULL,
            display_name TEXT NOT NULL,
            current_score INTEGER NOT NULL DEFAULT 0,
            is_ready INTEGER NOT NULL DEFAULT 0,
            is_host INTEGER NOT NULL DEFAULT 0,
            joined_at TEXT NOT NULL
        )
    """)

    # --- RETENTION TABLES ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_challenges (
            challenge_date TEXT PRIMARY KEY,
            listing_ids TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_date TEXT NOT NULL,
            user_id INTEGER NULL,
            guest_id TEXT NULL,
            display_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            accuracy REAL NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(challenge_date, user_id),
            UNIQUE(challenge_date, guest_id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS match_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NULL,
            guest_id TEXT NULL,
            mode TEXT NOT NULL,
            score INTEGER NOT NULL,
            accuracy REAL NOT NULL,
            is_daily INTEGER DEFAULT 0,
            is_room INTEGER DEFAULT 0,
            room_code TEXT NULL,
            placement INTEGER NULL,
            created_at TEXT NOT NULL
        )
    """)
    
    # Migrations
    try:
        cursor.execute("ALTER TABLE rooms ADD COLUMN time_limit INTEGER DEFAULT 20")
    except: pass
    try:
        cursor.execute("ALTER TABLE rooms ADD COLUMN started_at TEXT")
    except: pass
    try:
        cursor.execute("ALTER TABLE room_players ADD COLUMN current_score INTEGER DEFAULT 0")
    except: pass

    conn.commit()
    conn.close()

init_db()

# --- AUTH UTILS ---
def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_optional_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"id": payload.get("id"), "username": payload.get("sub")}
    except:
        return None

# --- MODELS ---
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class GuessSubmit(BaseModel):
    listing_id: int
    guess: Optional[int] = None
    remaining_time: Optional[int] = None
    total_time: Optional[int] = None
    reason: str = "guess" # "guess" or "timeout"

def calculate_score(actual, guess, remaining_time=None, total_time=None, reason="guess"):
    if reason == "timeout" or guess is None or guess <= 0:
        return {
            "base_score": 0,
            "speed_bonus": 0,
            "penalty": -150,
            "final_score": -150,
            "accuracy": 0,
            "error_rate": 1.0,
            "reason": "timeout" if reason == "timeout" else "invalid"
        }
    
    error_rate = abs(guess - actual) / actual
    accuracy = max(0, 1 - error_rate)
    
    # Exponential scoring: score = round(1000 * Math.exp(-3.2 * errorRate))
    base_score = round(1000 * math.exp(-3.2 * error_rate))
    
    speed_bonus = 0
    if remaining_time is not None and total_time is not None and total_time > 0:
        if accuracy >= 0.5:
            remaining_ratio = remaining_time / total_time
            speed_bonus = round(100 * remaining_ratio)
            
    final_score = base_score + speed_bonus
    
    return {
        "base_score": base_score,
        "speed_bonus": speed_bonus,
        "penalty": 0,
        "final_score": final_score,
        "accuracy": round(accuracy * 100, 1),
        "error_rate": round(error_rate, 3),
        "reason": "guess"
    }

class RoomCreate(BaseModel):
    round_count: int = 10
    mode: str = "Standard"
    difficulty: str = "Normal"
    time_limit: int = 60
    location: Optional[str] = None
    guest_nickname: Optional[str] = None
    guest_id: Optional[str] = None

class RoomJoin(BaseModel):
    guest_nickname: str
    guest_id: str

class RoomReady(BaseModel):
    guest_id: str
    is_ready: bool

class RoomScoreSubmit(BaseModel):
    total_score: int
    guest_nickname: str
    guest_id: str

class DailySubmit(BaseModel):
    score: int
    accuracy: float
    guest_id: Optional[str] = None
    guest_nickname: Optional[str] = None

# --- ENDPOINTS ---

@app.post("/auth/register")
async def register(req: UserRegister):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ?", (req.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username taken")
    
    hashed = pwd_context.hash(req.password)
    cursor.execute(
        "INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)",
        (req.username, hashed, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return {"message": "User created"}

@app.post("/auth/login")
async def login(req: UserLogin):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (req.username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not pwd_context.verify(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["username"], "id": user["id"]})
    return {"token": token, "username": user["username"]}

@app.get("/me")
async def get_me(user = Depends(get_optional_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    return user

@app.get("/listings/random")
async def get_random_listings(limit: int = 10, location: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM listings"
    params = []
    if location:
        query += " WHERE city = ?"
        params.append(location)
    
    query += " ORDER BY RANDOM() LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for row in rows:
        d = dict(row)
        # Hide actual rent for the quiz
        d.pop("rent", None)
        try:
            d["images"] = json.loads(d["images"]) if d.get("images") else []
        except:
            d["images"] = []
        results.append(d)
    return results

@app.post("/guess")
async def submit_guess(req: GuessSubmit):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT rent FROM listings WHERE id = ?", (req.listing_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    actual = row["rent"]
    result = calculate_score(
        actual, 
        req.guess, 
        req.remaining_time, 
        req.total_time, 
        req.reason
    )
    
    return {
        "actual_rent": actual,
        "score": result["final_score"],
        "accuracy": result["accuracy"],
        "base_score": result["base_score"],
        "speed_bonus": result["speed_bonus"],
        "penalty": result["penalty"],
        "error_rate": result["error_rate"],
        "reason": result["reason"]
    }

@app.get("/leaderboard")
async def get_leaderboard():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT users.username, MAX(scores.score) as score, scores.accuracy
        FROM scores
        JOIN users ON users.id = scores.user_id
        GROUP BY users.id
        ORDER BY score DESC
        LIMIT 10
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/locations")
async def get_locations():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT city as name, COUNT(*) as count FROM listings GROUP BY city ORDER BY count DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# --- ROOM ENDPOINTS ---

@app.post("/rooms")
async def create_room(req: RoomCreate, current_user: Optional[dict] = Depends(get_optional_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    room_code = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", k=6))
    
    # Get random listings for the room
    query = "SELECT id FROM listings"
    params = []
    if req.location and req.location != "Tüm Şehirler":
        query += " WHERE city = ?"
        params.append(req.location)
    
    query += " ORDER BY RANDOM() LIMIT ?"
    params.append(req.round_count)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    listing_ids = [row["id"] for row in rows]
    
    user_id = current_user["id"] if current_user else None
    guest_id = req.guest_id if not current_user else None
    
    cursor.execute(
        "INSERT INTO rooms (room_code, host_user_id, host_guest_id, listing_ids, settings, time_limit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (room_code, user_id, guest_id, json.dumps(listing_ids), json.dumps(req.model_dump()), req.time_limit, datetime.now().isoformat())
    )
    
    # Add host to players
    display_name = current_user["username"] if current_user else (req.guest_nickname or "Host")
    cursor.execute(
        "INSERT INTO room_players (room_code, user_id, guest_id, display_name, is_host, joined_at) VALUES (?, ?, ?, ?, ?, ?)",
        (room_code, user_id, guest_id, display_name, 1, datetime.now().isoformat())
    )
    
    conn.commit()
    conn.close()
    return {"room_code": room_code}

@app.get("/rooms/{room_code}/state")
async def get_room_state(room_code: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms WHERE room_code = ?", (room_code,))
    room = cursor.fetchone()
    if not room:
        conn.close()
        raise HTTPException(status_code=404, detail="Room not found")
        
    cursor.execute("SELECT display_name, guest_id, is_ready, is_host, current_score FROM room_players WHERE room_code = ?", (room_code,))
    players = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return {
        "room_code": room_code,
        "status": room["status"],
        "settings": json.loads(room["settings"]),
        "started_at": room["started_at"],
        "players": players
    }

@app.post("/rooms/{room_code}/join")
async def join_room(room_code: str, req: RoomJoin, current_user: Optional[dict] = Depends(get_optional_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM rooms WHERE room_code = ?", (room_code,))
    room = cursor.fetchone()
    if not room:
        conn.close()
        raise HTTPException(status_code=404, detail="Room not found")
    if room["status"] != "waiting":
        conn.close()
        raise HTTPException(status_code=400, detail="Room already started or finished")
        
    user_id = current_user["id"] if current_user else None
    cursor.execute(
        "INSERT INTO room_players (room_code, user_id, guest_id, display_name, joined_at) VALUES (?, ?, ?, ?, ?)",
        (room_code, user_id, req.guest_id, req.guest_nickname, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return {"ok": True}

@app.post("/rooms/{room_code}/ready")
async def toggle_ready(room_code: str, req: RoomReady, current_user: Optional[dict] = Depends(get_optional_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM rooms WHERE room_code = ?", (room_code,))
    room = cursor.fetchone()
    if not room or room["status"] != "waiting":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot change ready status now")

    user_id = current_user["id"] if current_user else None
    if current_user:
        cursor.execute("UPDATE room_players SET is_ready = ? WHERE room_code = ? AND user_id = ?", (1 if req.is_ready else 0, room_code, user_id))
    else:
        cursor.execute("UPDATE room_players SET is_ready = ? WHERE room_code = ? AND guest_id = ?", (1 if req.is_ready else 0, room_code, req.guest_id))
        
    conn.commit()
    conn.close()
    return {"ok": True}

@app.post("/rooms/{room_code}/start")
async def start_room_game(room_code: str, guest_id: Optional[str] = None, current_user: Optional[dict] = Depends(get_optional_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT host_user_id, host_guest_id, status FROM rooms WHERE room_code = ?", (room_code,))
    room = cursor.fetchone()
    
    if not room:
        conn.close()
        raise HTTPException(status_code=404, detail="Room not found")
    
    is_host = False
    if current_user and room["host_user_id"] == current_user["id"]: is_host = True
    elif guest_id and room["host_guest_id"] == guest_id: is_host = True
    
    if not is_host or room["status"] != "waiting":
        conn.close()
        raise HTTPException(status_code=403, detail="Forbidden")
        
    started_at = datetime.now().isoformat()
    cursor.execute("UPDATE rooms SET status = 'playing', started_at = ? WHERE room_code = ?", (started_at, room_code))
    conn.commit()
    conn.close()
    return {"ok": True, "started_at": started_at}

@app.post("/rooms/{room_code}/score")
async def update_room_current_score(room_code: str, score: int, guest_id: Optional[str] = None, current_user: Optional[dict] = Depends(get_optional_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    if current_user:
        cursor.execute("UPDATE room_players SET current_score = ? WHERE room_code = ? AND user_id = ?", (score, room_code, current_user["id"]))
    else:
        cursor.execute("UPDATE room_players SET current_score = ? WHERE room_code = ? AND guest_id = ?", (score, room_code, guest_id))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.get("/rooms/{room_code}")
async def get_room(room_code: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms WHERE room_code = ?", (room_code,))
    room = cursor.fetchone()
    if not room:
        conn.close()
        raise HTTPException(status_code=404, detail="Room not found")
        
    listing_ids = json.loads(room["listing_ids"])
    placeholders = ",".join(["?"] * len(listing_ids))
    cursor.execute(f"SELECT * FROM listings WHERE id IN ({placeholders})", listing_ids)
    rows = cursor.fetchall()
    
    listings_map = {row["id"]: dict(row) for row in rows}
    ordered_listings = []
    for lid in listing_ids:
        if lid in listings_map:
            item = listings_map[lid]
            item.pop("rent", None)
            try:
                item["images"] = json.loads(item["images"]) if item.get("images") else []
            except:
                item["images"] = []
            ordered_listings.append(item)
    cursor.execute("SELECT guest_id, display_name as nickname, current_score as score, is_ready FROM room_players WHERE room_code = ?", (room_code,))
    players = [dict(row) for row in cursor.fetchall()]
            
    conn.close()
    return {
        "room_code": room_code,
        "settings": json.loads(room["settings"]),
        "listings": ordered_listings,
        "players": players,
        "status": room["status"],
        "started_at": room["started_at"]
    }

@app.post("/rooms/{room_code}/submit")
async def submit_room_score(room_code: str, req: RoomScoreSubmit, current_user: Optional[dict] = Depends(get_optional_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    user_id = current_user["id"] if current_user else None
    
    cursor.execute(
        "INSERT INTO room_scores (room_code, user_id, guest_nickname, guest_id, total_score, completed_at) VALUES (?, ?, ?, ?, ?, ?)",
        (room_code, user_id, req.guest_nickname, req.guest_id, req.total_score, datetime.now().isoformat())
    )
    
    # Add to match history
    cursor.execute(
        "INSERT INTO match_history (user_id, guest_id, mode, score, accuracy, is_room, room_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (user_id, req.guest_id, "Room", req.total_score, 0, 1, room_code, datetime.now().isoformat())
    )
    
    conn.commit()
    conn.close()
    return {"ok": True}

@app.get("/rooms/{room_code}/leaderboard")
async def get_room_leaderboard(room_code: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COALESCE(users.username, guest_nickname) as display_name, guest_id, total_score
        FROM room_scores
        LEFT JOIN users ON users.id = room_scores.user_id
        WHERE room_code = ?
        ORDER BY total_score DESC
    """, (room_code,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# --- RETENTION SYSTEM ENDPOINTS ---

@app.get("/daily-challenge")
async def get_daily_challenge():
    today = date.today().isoformat()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM daily_challenges WHERE challenge_date = ?", (today,))
    challenge = cursor.fetchone()
    
    if not challenge:
        cursor.execute("SELECT id FROM listings ORDER BY RANDOM() LIMIT 5")
        rows = cursor.fetchall()
        listing_ids = [row["id"] for row in rows]
        cursor.execute("INSERT INTO daily_challenges (challenge_date, listing_ids, created_at) VALUES (?, ?, ?)", (today, json.dumps(listing_ids), datetime.now().isoformat()))
        conn.commit()
        lid_final = listing_ids
    else:
        lid_final = json.loads(challenge["listing_ids"])
        
    placeholders = ",".join(["?"] * len(lid_final))
    cursor.execute(f"SELECT * FROM listings WHERE id IN ({placeholders})", lid_final)
    rows = cursor.fetchall()
    listings_map = {row["id"]: dict(row) for row in rows}
    ordered = []
    for lid in lid_final:
        if lid in listings_map:
            item = listings_map[lid]
            item.pop("rent", None)
            item["images"] = json.loads(item["images"])
            ordered.append(item)
            
    cursor.execute("SELECT COUNT(*) as count FROM daily_scores WHERE challenge_date = ?", (today,))
    play_count = cursor.fetchone()["count"]
    cursor.execute("SELECT MAX(score) as max_score FROM daily_scores WHERE challenge_date = ?", (today,))
    max_score = cursor.fetchone()["max_score"] or 0
    conn.close()
    return {"challenge_date": today, "listings": ordered, "play_count": play_count, "max_score": max_score}

@app.post("/daily-challenge/submit")
async def submit_daily(req: DailySubmit, current_user: Optional[dict] = Depends(get_optional_current_user)):
    today = date.today().isoformat()
    conn = get_db()
    cursor = conn.cursor()
    user_id = current_user["id"] if current_user else None
    guest_id = req.guest_id if not current_user else None
    
    check_query = "SELECT id FROM daily_scores WHERE challenge_date = ? AND " + ("user_id = ?" if current_user else "guest_id = ?")
    cursor.execute(check_query, (today, user_id if current_user else guest_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Already played")
        
    display_name = current_user["username"] if current_user else (req.guest_nickname or "Guest")
    now = datetime.now().isoformat()
    cursor.execute("INSERT INTO daily_scores (challenge_date, user_id, guest_id, display_name, score, accuracy, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", (today, user_id, guest_id, display_name, req.score, req.accuracy, now))
    cursor.execute("INSERT INTO match_history (user_id, guest_id, mode, score, accuracy, is_daily, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", (user_id, guest_id, "Daily", req.score, req.accuracy, 1, now))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.get("/daily-challenge/leaderboard")
async def get_daily_lb():
    today = date.today().isoformat()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT display_name, score, accuracy FROM daily_scores WHERE challenge_date = ? ORDER BY score DESC LIMIT 10", (today,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/profile/stats")
async def get_stats(guest_id: Optional[str] = None, current_user: Optional[dict] = Depends(get_optional_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    if current_user: cursor.execute("SELECT * FROM match_history WHERE user_id = ?", (current_user["id"],))
    else: cursor.execute("SELECT * FROM match_history WHERE guest_id = ?", (guest_id,))
    history = [dict(row) for row in cursor.fetchall()]
    if not history:
        conn.close()
        return {"total_games": 0, "avg_score": 0, "avg_accuracy": 0, "room_wins": 0, "daily_count": 0}
    
    total = len(history)
    avg_s = int(sum(h["score"] for h in history) / total)
    avg_a = round(sum(h["accuracy"] for h in history) / total, 1)
    daily_c = sum(1 for h in history if h["is_daily"])
    conn.close()
    return {"total_games": total, "avg_score": avg_s, "avg_accuracy": avg_a, "daily_count": daily_c, "username": current_user["username"] if current_user else "Misafir"}

@app.get("/profile/history")
async def get_history(guest_id: Optional[str] = None, current_user: Optional[dict] = Depends(get_optional_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    if current_user: cursor.execute("SELECT * FROM match_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", (current_user["id"],))
    else: cursor.execute("SELECT * FROM match_history WHERE guest_id = ? ORDER BY created_at DESC LIMIT 20", (guest_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
