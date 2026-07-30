import asyncio
import os
import httpx
from pathlib import Path
from config import STABILITY_API_KEY

async def test_stability():
    print(f"STABILITY_API_KEY present: {bool(STABILITY_API_KEY)}")
    if not STABILITY_API_KEY:
        print("STABILITY_API_KEY is not set in environment or .env file.")
        return

    prompt = "A cute bear in an enchanted forest, children book illustration"
    
    # Try V1 SDXL endpoint
    url_v1 = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
    headers_v1 = {
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload_v1 = {
        "text_prompts": [{"text": prompt, "weight": 1.0}],
        "cfg_scale": 7,
        "height": 1024,
        "width": 1024,
        "samples": 1,
        "steps": 30
    }
    
    print("\n--- Testing V1 SDXL Endpoint ---")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            res = await client.post(url_v1, headers=headers_v1, json=payload_v1)
            print(f"V1 Response Status: {res.status_code}")
            if res.status_code != 200:
                print(f"V1 Error Output: {res.text[:300]}")
            else:
                print("V1 Call Success!")
        except Exception as e:
            print(f"V1 Exception: {e}")

    # Try V2 Core endpoint
    url_v2 = "https://api.stability.ai/v2beta/stable-image/generate/core"
    headers_v2 = {
        "authorization": f"Bearer {STABILITY_API_KEY}",
        "accept": "image/*"
    }
    data_v2 = {
        "prompt": prompt,
        "output_format": "png",
        "aspect_ratio": "1:1"
    }
    print("\n--- Testing V2 Core Endpoint ---")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            res = await client.post(url_v2, headers=headers_v2, data=data_v2)
            print(f"V2 Response Status: {res.status_code}")
            if res.status_code != 200:
                print(f"V2 Error Output: {res.text[:300]}")
            else:
                print("V2 Call Success! (image/* returned)")
        except Exception as e:
            print(f"V2 Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_stability())
