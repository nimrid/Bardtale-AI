import asyncio
import os
from services.audio_service import generate_music_track

async def main():
    print("Testing Stable Audio 2.5 Music Generation...")
    prompt = "A song in the 3/4 time signature that features cheerful acoustic lute, live recorded drums, and rhythmic claps, The mood is happy and up-lifting."
    track_id = "test_ballad_123"
    path = await generate_music_track(track_id, prompt, duration=15)
    print(f"Generated track saved at: {path}")
    print(f"File exists: {os.path.exists(path)}")

if __name__ == "__main__":
    asyncio.run(main())
