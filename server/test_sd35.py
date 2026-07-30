import asyncio
import httpx
from pathlib import Path
from config import STABILITY_API_KEY

async def test_sd35():
    print(f"STABILITY_API_KEY present: {bool(STABILITY_API_KEY)}")
    if not STABILITY_API_KEY:
        print("STABILITY_API_KEY is not set.")
        return

    url = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
    headers = {
        "authorization": f"Bearer {STABILITY_API_KEY}",
        "accept": "image/*"
    }

    # Test with SD 3.5 Large Turbo or SD 3.5 Medium
    models_to_test = ["sd3.5-large-turbo", "sd3.5-medium", "sd3.5-flash", "sd3.5-large"]

    prompt = "A cheerful blue dog holding a treasure map on a tropical beach, children storybook illustration, soft warm watercolor style"

    for model in models_to_test:
        print(f"\n--- Testing SD 3.5 Model: {model} ---")
        files = {
            "prompt": (None, prompt),
            "model": (None, model),
            "aspect_ratio": (None, "1:1"),
            "output_format": (None, "png"),
            "style_preset": (None, "digital-art")
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(url, headers=headers, files=files)
                print(f"Status Code: {res.status_code}")
                if res.status_code == 200:
                    out_file = Path(f"test_{model}.png")
                    with open(out_file, "wb") as f:
                        f.write(res.content)
                    print(f"SUCCESS! Image written to {out_file} ({len(res.content)} bytes)")
                    return model
                else:
                    print(f"Error output: {res.text[:300]}")
            except Exception as e:
                print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_sd35())
