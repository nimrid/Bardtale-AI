import os
import logging
import httpx
import base64
from pathlib import Path
from typing import Dict, Any, List
from config import STABILITY_API_KEY, IMAGE_STORAGE_DIR, DEFAULT_ART_STYLE, SD35_MODEL

logger = logging.getLogger(__name__)

async def generate_page_illustrations(order_id: str, pages: List[Dict[str, Any]], illustration_count: int) -> List[str]:
    """Generates illustrations for pages according to illustration_count (1, 3, or 8)."""
    image_paths = []
    
    order_img_dir = IMAGE_STORAGE_DIR / order_id
    order_img_dir.mkdir(parents=True, exist_ok=True)
    
    total_pages = len(pages)
    
    # Determine exact 0-based page indices that get AI illustrations
    if illustration_count <= 1:
        target_indices = {0}  # Page 1 (Cover illustration)
    elif illustration_count >= total_pages:
        target_indices = set(range(total_pages))  # All pages
    elif illustration_count == 3 and total_pages >= 5:
        target_indices = {0, 2, 4}  # Pages 1, 3, 5
    else:
        step = max(1, total_pages // illustration_count)
        target_indices = {i * step for i in range(illustration_count) if i * step < total_pages}

    for idx, page in enumerate(pages):
        if idx in target_indices:
            page_num = page["page_number"]
            file_path = order_img_dir / f"page_{page_num}.png"
            raw_prompt = page["illustration_prompt"]
            full_prompt = f"{raw_prompt}, {DEFAULT_ART_STYLE}"
            
            if STABILITY_API_KEY:
                try:
                    await _call_stability_api(full_prompt, file_path)
                except Exception as e:
                    logger.error(f"Stability SD 3.5 API call failed for page {page_num}: {e}. Using artistic fallback.")
                    _generate_artwork_fallback(file_path, page_num, raw_prompt)
            else:
                logger.info(f"No STABILITY_API_KEY set. Generating aesthetic fallback artwork for page {page_num}.")
                _generate_artwork_fallback(file_path, page_num, raw_prompt)
                
            image_paths.append(str(file_path))
            
    return image_paths

async def _call_stability_api(prompt: str, output_path: Path):
    """Calls official Stable Diffusion 3.5 API endpoint."""
    url = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
    headers = {
        "authorization": f"Bearer {STABILITY_API_KEY}",
        "accept": "image/*"
    }

    files = {
        "prompt": (None, prompt),
        "model": (None, SD35_MODEL),
        "aspect_ratio": (None, "1:1"),
        "output_format": (None, "png"),
        "style_preset": (None, "digital-art")
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        res = await client.post(url, headers=headers, files=files)
        if res.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(res.content)
            logger.info(f"Successfully generated image via SD 3.5 ({SD35_MODEL}) for {output_path.name}")
        else:
            logger.error(f"SD 3.5 API returned status {res.status_code}: {res.text[:300]}")
            res.raise_for_status()

def _generate_artwork_fallback(output_path: Path, page_num: int, prompt_summary: str):
    """Generates an aesthetic PNG illustration for ReportLab PDF assembly and browser display."""
    colors = [
        ("#FF9A9E", "#3A3897"),
        ("#a1c4fd", "#1b2a4a"),
        ("#ff9a9e", "#4b134f"),
        ("#84fab0", "#0a3d62"),
        ("#fccb90", "#2d132c"),
        ("#e0c3fc", "#1a2a3a"),
        ("#f093fb", "#3c1053"),
        ("#4facfe", "#0b2545"),
    ]
    c1, text_col = colors[(page_num - 1) % len(colors)]
    
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (800, 800), color=c1)
        draw = ImageDraw.Draw(img)
        
        # Soft concentric circles
        for r in range(400, 0, -20):
            factor = r / 400.0
            draw.ellipse([400 - r, 400 - r, 400 + r, 400 + r], outline=None, fill=(
                int(240 - 80 * factor),
                int(180 + 60 * factor),
                int(220 + 35 * factor)
            ))
            
        draw.rounded_rectangle([60, 60, 740, 740], radius=30, outline="#FFFFFF", width=6)
        draw.rounded_rectangle([80, 80, 720, 720], radius=20, outline="#FFFFFF", width=2)
        
        label = "COVER ARTWORK" if page_num == 1 else f"STORY ARTWORK PAGE {page_num}"
        draw.text((400, 360), label, fill="#FFFFFF", anchor="mm")
        
        short_prompt = prompt_summary[:55] + "..." if len(prompt_summary) > 55 else prompt_summary
        draw.text((400, 440), f'"{short_prompt}"', fill="#F0F8FF", anchor="mm")
        
        img.save(output_path, "PNG")
    except ImportError:
        _write_raw_png(output_path, page_num, c1)

def _write_raw_png(output_path: Path, page_num: int, bg_hex: str):
    import zlib, struct
    width, height = 400, 400
    bg_hex = bg_hex.lstrip('#')
    if len(bg_hex) == 6:
        r, g, b = int(bg_hex[0:2], 16), int(bg_hex[2:4], 16), int(bg_hex[4:6], 16)
    else:
        r, g, b = 240, 180, 200

    raw_data = bytearray()
    for _ in range(height):
        raw_data.append(0)
        for _ in range(width):
            raw_data.extend([r, g, b])

    compressed = zlib.compress(raw_data)
    
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)

    png = b"\x89PNG\r\n\x1a\n" + \
          chunk(b"IHDR", struct.pack(">IIBBEEE", width, height, 8, 2, 0, 0, 0)) + \
          chunk(b"IDAT", compressed) + \
          chunk(b"IEND", b"")

    with open(output_path, "wb") as f:
        f.write(png)
