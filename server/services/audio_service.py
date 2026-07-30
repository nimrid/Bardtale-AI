import os
import logging
import httpx
import math
import struct
import wave
from pathlib import Path
from config import STABILITY_API_KEY, AUDIO_STORAGE_DIR, STABLE_AUDIO_MODEL

logger = logging.getLogger(__name__)

async def generate_music_track(track_id: str, prompt: str, duration: int = 30, model: str = "stable-audio-2.5") -> str:
    """Generates a music track using Stability AI's Stable Audio 2.5 API."""
    output_path = AUDIO_STORAGE_DIR / f"{track_id}.mp3"
    
    if STABILITY_API_KEY:
        try:
            logger.info(f"Calling Stable Audio API for track {track_id} with prompt: '{prompt}'")
            await _call_stable_audio_api(prompt, output_path, duration=duration, model=model)
            return str(output_path)
        except Exception as e:
            logger.error(f"Stable Audio API call failed for track {track_id}: {e}. Using bardic audio fallback.")
            _generate_bardic_synth_audio(output_path, duration=duration)
            return str(output_path)
    else:
        logger.info(f"No STABILITY_API_KEY set. Generating bardic audio fallback for track {track_id}.")
        _generate_bardic_synth_audio(output_path, duration=duration)
        return str(output_path)

async def _call_stable_audio_api(prompt: str, output_path: Path, duration: int = 30, model: str = "stable-audio-2.5"):
    """Calls official Stable Audio 2.5 API endpoint."""
    url = "https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio"
    headers = {
        "authorization": f"Bearer {STABILITY_API_KEY}",
        "accept": "audio/*"
    }

    files = {
        "prompt": (None, prompt),
        "model": (None, model),
        "output_format": (None, "mp3"),
        "duration": (None, str(duration)),
        "steps": (None, "8" if "2.5" in model else "50")
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(url, headers=headers, files=files)
        if res.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(res.content)
            logger.info(f"Successfully generated music via Stable Audio API ({model}) for {output_path.name}")
        else:
            logger.error(f"Stable Audio API returned status {res.status_code}: {res.text[:300]}")
            res.raise_for_status()

def _generate_bardic_synth_audio(output_path: Path, duration: int = 15):
    """Generates a pleasant 44.1kHz acoustic lute synth audio as a fallback when offline."""
    sample_rate = 44100
    total_samples = sample_rate * min(duration, 15)  # Max 15s for synth demo
    
    # Simple lute chord arpeggio frequencies (A minor / D minor bardic tavern progression)
    # A3, C4, E4, A4, G4, F4, E4, D4
    notes = [220.0, 261.63, 329.63, 440.0, 392.0, 349.23, 329.63, 293.66]
    
    audio_frames = bytearray()
    
    for i in range(total_samples):
        t = i / float(sample_rate)
        # Change note every 0.35 seconds
        note_idx = int(t / 0.35) % len(notes)
        freq = notes[note_idx]
        
        # Plucked lute envelope (exponential decay per note)
        note_t = math.fmod(t, 0.35)
        envelope = math.exp(-6.0 * note_t)
        
        # Fundamental tone + warm harmonics for acoustic lute feel
        val = (
            0.6 * math.sin(2 * math.pi * freq * t) +
            0.3 * math.sin(2 * math.pi * (freq * 2) * t) +
            0.1 * math.sin(2 * math.pi * (freq * 3) * t)
        ) * envelope
        
        # Add subtle warm drone bass (A2 = 110Hz)
        drone = 0.15 * math.sin(2 * math.pi * 110.0 * t)
        
        sample = int((val + drone) * 12000)
        sample = max(-32768, min(32767, sample))
        audio_frames.extend(struct.pack("<h", sample))

    # Save as WAV file (browsers play WAV files directly via <audio> tags as well)
    wav_path = output_path.with_suffix(".wav")
    with wave.open(str(wav_path), "wb") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_frames)
        
    # Also write bytes to mp3 path for fallback safety
    with open(output_path, "wb") as f:
        with wave.open(str(wav_path), "rb") as r:
            f.write(r.readframes(r.getnframes()))
