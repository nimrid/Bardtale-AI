import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
# Load .env from server dir or root dir
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

STORAGE_DIR = BASE_DIR / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

PDF_STORAGE_DIR = STORAGE_DIR / "pdfs"
PDF_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_STORAGE_DIR = STORAGE_DIR / "images"
IMAGE_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

AUDIO_STORAGE_DIR = STORAGE_DIR / "audio"
AUDIO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = STORAGE_DIR / "app.db"

# Tier Definitions
TIERS = {
    "mini": {
        "id": "mini",
        "name": "Mini Story",
        "description": "Quick 3-page story with a custom cover illustration",
        "pages": 3,
        "illustrations": 1,  # Cover only
        "nim_amount": 500,  # 500 NIM
        "badge": "Popular for quick gifts",
        "accent": "#F6B221"
    },
    "standard": {
        "id": "standard",
        "name": "Standard Story",
        "description": "5-page illustrated journey with 3 rich artworks",
        "pages": 5,
        "illustrations": 3,  # Cover + 2 story pages
        "nim_amount": 1500,  # 1500 NIM
        "badge": "Best Value",
        "accent": "#05D3B2"
    },
    "deluxe": {
        "id": "deluxe",
        "name": "Deluxe Illustrated Book",
        "description": "Full 8-page storybook with artwork on every single page",
        "pages": 8,
        "illustrations": 8,  # One artwork per page
        "nim_amount": 3000,  # 3000 NIM
        "badge": "Ultimate Collector's Edition",
        "accent": "#8A3FFC"
    }
}

# API Keys & Config
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")  # Claude Haiku 4.5
SD35_MODEL = os.getenv("SD35_MODEL", "sd3.5-large-turbo")  # Stable Diffusion 3.5 Large Turbo
STABLE_AUDIO_MODEL = os.getenv("STABLE_AUDIO_MODEL", "stable-audio-2.5")  # Stable Audio 2.5
NIMIQ_NETWORK = os.getenv("NIMIQ_NETWORK", "testnet")  # mainnet or testnet
RECEIVER_WALLET_ADDRESS = os.getenv("RECEIVER_WALLET_ADDRESS", "NQ07 0000 0000 0000 0000 0000 0000 0000 0000")

# Prompt Art Style Modifier for Stability AI
DEFAULT_ART_STYLE = "storybook children illustration, soft warm watercolor style, detailed, dreamlike, vibrant pastel colors, clean digital art"
