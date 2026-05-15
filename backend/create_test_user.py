import sqlite3
from passlib.context import CryptContext
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "rent_guess.db"

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_user(username, email, password):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        print(f"User '{username}' already exists.")
        conn.close()
        return

    hashed_password = get_password_hash(password)
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, total_score, games_played) VALUES (?, ?, ?, ?, ?)",
        (username, email, hashed_password, 2500, 10) # Give them some initial stats
    )
    
    # Add some dummy scores for the test user to see analytics
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user_id = cursor.fetchone()[0]
    
    # Add dummy scores
    dummy_scores = [
        (user_id, 800, 85.0, "100071"),
        (user_id, 900, 92.5, "100124"),
        (user_id, 400, 45.0, "100500"),
        (user_id, 750, 78.0, "100800")
    ]
    cursor.executemany(
        "INSERT INTO scores (user_id, score, accuracy, listing_id) VALUES (?, ?, ?, ?)",
        dummy_scores
    )
    
    conn.commit()
    conn.close()
    print(f"Test user '{username}' created successfully with password '{password}'")

if __name__ == "__main__":
    create_user("test", "test@example.com", "test123")
