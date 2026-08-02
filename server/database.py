import sqlite3
import json
import time
from typing import Optional, Dict, Any, List
from config import DB_PATH

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        wallet_address TEXT,
        tier TEXT NOT NULL,
        customization_fields TEXT NOT NULL,
        status TEXT NOT NULL,
        nim_amount REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        tx_hash TEXT,
        verified INTEGER NOT NULL DEFAULT 0,
        verified_at INTEGER,
        raw_data TEXT,
        FOREIGN KEY (order_id) REFERENCES orders (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT UNIQUE NOT NULL,
        story_title TEXT,
        story_json TEXT,
        image_paths TEXT,
        pdf_path TEXT,
        error_log TEXT,
        cost_log TEXT,
        FOREIGN KEY (order_id) REFERENCES orders (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS music_tracks (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        duration INTEGER NOT NULL,
        audio_path TEXT,
        status TEXT NOT NULL,
        nim_amount REAL NOT NULL,
        created_at INTEGER NOT NULL
    )
    """)

    conn.commit()
    conn.close()

# Database Helper Operations
def create_order(order_id: str, device_id: str, tier: str, customization_fields: dict, nim_amount: float) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    now = int(time.time())
    
    cursor.execute("""
    INSERT INTO orders (id, device_id, tier, customization_fields, status, nim_amount, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_id,
        device_id,
        tier,
        json.dumps(customization_fields),
        "pending_payment",
        nim_amount,
        now,
        now
    ))
    conn.commit()
    conn.close()
    return get_order(order_id)

def get_order(order_id: str) -> Optional[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    data = dict(row)
    data["customization_fields"] = json.loads(data["customization_fields"])
    return data

def get_orders_by_device(device_id: str) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE device_id = ? ORDER BY created_at DESC", (device_id,))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        d["customization_fields"] = json.loads(d["customization_fields"])
        
        # Attach generation details (story_title, pages, image_paths, pdf_path) if ready
        gen = get_generation(d["id"])
        if gen:
            d["story_title"] = gen.get("story_title")
            d["pages"] = gen.get("story_json")
            d["image_paths"] = gen.get("image_paths")
            d["pdf_path"] = gen.get("pdf_path")
            d["cost_log"] = gen.get("cost_log")
            
        results.append(d)
    return results


def update_order_status(order_id: str, status: str, wallet_address: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    now = int(time.time())
    
    if wallet_address:
        cursor.execute("""
        UPDATE orders SET status = ?, wallet_address = ?, updated_at = ? WHERE id = ?
        """, (status, wallet_address, now, order_id))
    else:
        cursor.execute("""
        UPDATE orders SET status = ?, updated_at = ? WHERE id = ?
        """, (status, now, order_id))
        
    conn.commit()
    conn.close()

def record_payment(order_id: str, tx_hash: Optional[str], raw_data: Optional[dict] = None) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    now = int(time.time())
    
    cursor.execute("""
    INSERT INTO payments (order_id, tx_hash, verified, verified_at, raw_data)
    VALUES (?, ?, 1, ?, ?)
    """, (
        order_id,
        tx_hash or "MOCK_TX_" + str(now),
        now,
        json.dumps(raw_data or {})
    ))
    conn.commit()
    conn.close()
    return True

def save_generation(order_id: str, story_title: str, story_json: list, image_paths: list, pdf_path: str, cost_log: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO generations (order_id, story_title, story_json, image_paths, pdf_path, cost_log)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(order_id) DO UPDATE SET
        story_title=excluded.story_title,
        story_json=excluded.story_json,
        image_paths=excluded.image_paths,
        pdf_path=excluded.pdf_path,
        cost_log=excluded.cost_log
    """, (
        order_id,
        story_title,
        json.dumps(story_json),
        json.dumps(image_paths),
        pdf_path,
        json.dumps(cost_log)
    ))
    conn.commit()
    conn.close()

def get_generation(order_id: str) -> Optional[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM generations WHERE order_id = ?", (order_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    data = dict(row)
    data["story_json"] = json.loads(data["story_json"]) if data["story_json"] else []
    data["image_paths"] = json.loads(data["image_paths"]) if data["image_paths"] else []
    data["cost_log"] = json.loads(data["cost_log"]) if data["cost_log"] else {}
    return data

# Music Track Operations
def create_music_track(track_id: str, device_id: str, title: str, prompt: str, duration: int, nim_amount: float = 2500.0) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    now = int(time.time())
    
    cursor.execute("""
    INSERT INTO music_tracks (id, device_id, title, prompt, duration, status, nim_amount, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        track_id,
        device_id,
        title,
        prompt,
        duration,
        "generating",
        nim_amount,
        now
    ))
    conn.commit()
    conn.close()
    return get_music_track(track_id)

def update_music_track_status(track_id: str, status: str, audio_path: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    if audio_path:
        cursor.execute("UPDATE music_tracks SET status = ?, audio_path = ? WHERE id = ?", (status, audio_path, track_id))
    else:
        cursor.execute("UPDATE music_tracks SET status = ? WHERE id = ?", (status, track_id))
    conn.commit()
    conn.close()

def get_music_track(track_id: str) -> Optional[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM music_tracks WHERE id = ?", (track_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_music_tracks_by_device(device_id: str) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM music_tracks WHERE device_id = ? ORDER BY created_at DESC", (device_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
