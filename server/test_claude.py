import asyncio
import httpx
from config import ANTHROPIC_API_KEY

async def test_haiku():
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }

    payload = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 100,
        "messages": [{"role": "user", "content": "Write a 1-sentence hello."}]
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        print("Status:", res.status_code)
        if res.status_code == 200:
            print("Response:", res.json()["content"][0]["text"])

if __name__ == "__main__":
    asyncio.run(test_haiku())
