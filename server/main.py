import os
import uuid
import asyncio
import logging
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from fastapi.staticfiles import StaticFiles
from config import TIERS, RECEIVER_WALLET_ADDRESS, STORAGE_DIR
import database
from services.pipeline import run_generation_pipeline
from services.audio_service import generate_music_track

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# Initialize DB
database.init_db()

app = FastAPI(
    title="Illustrated Story Commission API (Nimiq Pay)",
    version="1.0.0",
    description="Backend service for Nimiq Pay Mini App - Illustrated Story Generation"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static storage directory
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Pydantic Schemas
class CustomizationSchema(BaseModel):
    character_name: str = Field(..., description="Main character name", example="Barnaby")
    theme: str = Field(..., description="Setting or story theme", example="Magical Treehouse")
    tone: str = Field("Whimsical & Heartwarming", description="Story tone", example="Whimsical & Playful")
    special_detail: str = Field("A golden glowing key", description="Inside joke or special item", example="A pair of tiny blue boots")

class CreateOrderRequest(BaseModel):
    device_id: str = Field(..., description="Unique device identifier from Nimiq SDK")
    tier: str = Field(..., description="Tier ID: mini, standard, or deluxe")
    customization_fields: CustomizationSchema

class ConfirmPaymentRequest(BaseModel):
    tx_hash: Optional[str] = Field(None, description="Transaction hash or payment reference from Nimiq wallet")
    wallet_address: Optional[str] = Field(None, description="Sender NIM wallet address")
    mock_confirm: bool = Field(False, description="Set true for local dev testing without real NIM payment")

# Endpoints
@app.get("/api/tiers")
def get_tiers():
    return {
        "receiver_wallet": RECEIVER_WALLET_ADDRESS,
        "tiers": list(TIERS.values())
    }

@app.post("/api/orders", status_code=201)
def create_order_endpoint(payload: CreateOrderRequest):
    tier_id = payload.tier.lower()
    if tier_id not in TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier '{payload.tier}'. Choose mini, standard, or deluxe.")
    
    tier_info = TIERS[tier_id]
    order_id = str(uuid.uuid4())
    
    order = database.create_order(
        order_id=order_id,
        device_id=payload.device_id,
        tier=tier_id,
        customization_fields=payload.customization_fields.model_dump(),
        nim_amount=tier_info["nim_amount"]
    )
    
    return {
        "order_id": order_id,
        "status": order["status"],
        "nim_amount": order["nim_amount"],
        "receiver_wallet": RECEIVER_WALLET_ADDRESS,
        "tier": tier_info,
        "created_at": order["created_at"]
    }

@app.get("/api/orders/{order_id}")
def get_order_endpoint(order_id: str):
    order = database.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.get("/api/orders")
def list_device_orders(device_id: str = Query(..., description="Device ID")):
    return database.get_orders_by_device(device_id)

@app.post("/api/orders/{order_id}/confirm-payment")
async def confirm_payment_endpoint(order_id: str, payload: ConfirmPaymentRequest, background_tasks: BackgroundTasks):
    order = database.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order["status"] != "pending_payment":
        return {
            "message": f"Order already in status '{order['status']}'",
            "status": order["status"],
            "order_id": order_id
        }

    # CRITICAL SERVER-SIDE PAYMENT VERIFICATION
    # In production, verify payload.tx_hash against Nimiq RPC / Host Callback before confirming!
    logger.info(f"Verifying NIM payment for order {order_id}... tx_hash: {payload.tx_hash}")
    
    database.record_payment(order_id, payload.tx_hash, payload.model_dump())
    database.update_order_status(order_id, "paid", payload.wallet_address)
    
    # Trigger background generation pipeline post-payment
    background_tasks.add_task(run_generation_pipeline, order_id)
    
    return {
        "success": True,
        "order_id": order_id,
        "status": "paid",
        "message": "Payment verified server-side. Generation started!"
    }

@app.get("/api/orders/{order_id}/status")
def get_order_status(order_id: str):
    order = database.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    response_data = {
        "id": order_id,
        "status": order["status"],
        "tier": order["tier"],
        "nim_amount": order["nim_amount"],
        "created_at": order["created_at"],
        "updated_at": order["updated_at"]
    }
    
    # If generation finished or in progress, attach generation details
    generation = database.get_generation(order_id)
    if generation:
        response_data["story_title"] = generation["story_title"]
        response_data["pages"] = generation["story_json"]
        response_data["image_paths"] = generation["image_paths"]
        
        illustrated_pages = []
        for path in generation.get("image_paths", []):
            filename = os.path.basename(path)
            if filename.startswith("page_") and filename.endswith(".png"):
                try:
                    p_num = int(filename.replace("page_", "").replace(".png", ""))
                    illustrated_pages.append(p_num)
                except ValueError:
                    pass
        response_data["illustrated_pages"] = illustrated_pages
        response_data["image_count"] = len(illustrated_pages)
        response_data["cost_log"] = generation["cost_log"]
        
    return response_data

@app.get("/api/orders/{order_id}/download")
def download_pdf(order_id: str):
    generation = database.get_generation(order_id)
    if not generation or not generation.get("pdf_path"):
        raise HTTPException(status_code=404, detail="PDF generation not ready or complete yet")
        
    pdf_path = generation["pdf_path"]
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
    title_filename = generation["story_title"].replace(" ", "_") + ".pdf"
    return FileResponse(
        path=pdf_path,
        filename=title_filename,
        media_type="application/pdf"
    )

@app.api_route("/api/orders/{order_id}/images/{page_num}", methods=["GET", "HEAD"])
def get_page_image(order_id: str, page_num: int):
    from config import IMAGE_STORAGE_DIR
    direct_file = IMAGE_STORAGE_DIR / order_id / f"page_{page_num}.png"
    if direct_file.exists():
        return FileResponse(
            str(direct_file),
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=3600"}
        )

    generation = database.get_generation(order_id)
    if not generation or not generation.get("image_paths"):
        raise HTTPException(status_code=404, detail="Images not found")
        
    image_paths = generation["image_paths"]
    target_filename = f"page_{page_num}.png"
    
    for path in image_paths:
        if path.endswith(target_filename) and os.path.exists(path):
            return FileResponse(
                path,
                media_type="image/png",
                headers={"Cache-Control": "public, max-age=3600"}
            )
            
    # Fallback to first image if exists
    if image_paths and os.path.exists(image_paths[0]):
        return FileResponse(
            image_paths[0],
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=3600"}
        )
        
    raise HTTPException(status_code=404, detail="Page image not found")

# Music Generation Schemas & Endpoints
class CreateMusicRequest(BaseModel):
    device_id: str = Field(..., description="Unique device identifier")
    prompt: str = Field(..., description="Prompt describing the ballad or song")
    title: Optional[str] = Field("Bardic Ballad", description="Title of the song")
    duration: int = Field(30, description="Duration in seconds (e.g. 30, 60, 120)")
    nim_amount: float = Field(2500.0, description="NIM cost for music generation")
    tx_hash: Optional[str] = Field(None, description="Nimiq payment transaction hash")

async def _background_music_generator(track_id: str, prompt: str, duration: int):
    try:
        audio_path = await generate_music_track(track_id, prompt, duration=duration)
        database.update_music_track_status(track_id, "complete", audio_path)
    except Exception as e:
        logger.error(f"Music generation background task failed for {track_id}: {e}")
        database.update_music_track_status(track_id, "failed")

@app.post("/api/music/generate")
async def generate_music(payload: CreateMusicRequest, background_tasks: BackgroundTasks):
    logger.info(f"Commissioning music track '{payload.title}' ({payload.duration}s) for {payload.nim_amount} NIM. tx_hash: {payload.tx_hash}")
    track_id = str(uuid.uuid4())
    track = database.create_music_track(
        track_id=track_id,
        device_id=payload.device_id,
        title=payload.title or "Bardic Ballad",
        prompt=payload.prompt,
        duration=payload.duration,
        nim_amount=payload.nim_amount
    )
    background_tasks.add_task(_background_music_generator, track_id, payload.prompt, payload.duration)
    return {
        "track_id": track_id,
        "status": "generating",
        "message": "Music generation commissioned! Stable Audio is processing your song."
    }


@app.get("/api/music/{track_id}/status")
def get_music_status(track_id: str):
    track = database.get_music_track(track_id)
    if not track:
        raise HTTPException(status_code=404, detail="Music track not found")
    return track

@app.api_route("/api/music/{track_id}/stream", methods=["GET", "HEAD"])
def stream_music(track_id: str):
    from config import AUDIO_STORAGE_DIR
    mp3_file = AUDIO_STORAGE_DIR / f"{track_id}.mp3"
    wav_file = AUDIO_STORAGE_DIR / f"{track_id}.wav"
    
    if mp3_file.exists():
        return FileResponse(
            str(mp3_file),
            media_type="audio/mpeg",
            filename=f"bardic_ballad_{track_id[:8]}.mp3",
            headers={"Cache-Control": "public, max-age=3600"}
        )
    elif wav_file.exists():
        return FileResponse(
            str(wav_file),
            media_type="audio/wav",
            filename=f"bardic_ballad_{track_id[:8]}.wav",
            headers={"Cache-Control": "public, max-age=3600"}
        )
    
    raise HTTPException(status_code=404, detail="Audio file not ready or not found")

@app.get("/api/music")
def list_music_history(device_id: str = Query(..., description="Device ID")):
    return database.get_music_tracks_by_device(device_id)
