import json
import logging
import httpx
from typing import Dict, Any, List
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL

logger = logging.getLogger(__name__)

async def generate_story_text(customization: Dict[str, Any], page_count: int) -> Dict[str, Any]:
    character_name = customization.get("character_name", "Hero")
    theme = customization.get("theme", "Enchanted Forest")
    tone = customization.get("tone", "Whimsical & Heartwarming")
    special_detail = customization.get("special_detail", "A glowing magical compass")

    if ANTHROPIC_API_KEY:
        try:
            return await _call_anthropic_api(character_name, theme, tone, special_detail, page_count)
        except Exception as e:
            logger.error(f"Claude API call failed: {e}. Falling back to high-quality fallback generator.")

    return _generate_fallback_story(character_name, theme, tone, special_detail, page_count)

async def _call_anthropic_api(character_name: str, theme: str, tone: str, special_detail: str, page_count: int) -> Dict[str, Any]:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }

    system_prompt = (
        "You are an expert children's storybook author. Write engaging, warm, and creative stories for kids and young readers. "
        "Output ONLY valid JSON matching the specified JSON schema without markdown formatting or code blocks."
    )

    user_prompt = f"""
Write an illustrated children's storybook with EXACTLY {page_count} pages.

Details:
- Main Character Name: {character_name}
- Theme / Setting: {theme}
- Story Tone: {tone}
- Key Detail / Inside Joke: {special_detail}

Format Requirements:
Return a single JSON object with this exact key structure:
{{
  "title": "Story Title Here",
  "pages": [
    {{
      "page_number": 1,
      "text": "Page 1 narrative text (2-4 sentences)...",
      "illustration_prompt": "Detailed description of the scene image for page 1..."
    }},
    ...
  ]
}}
Ensure there are exactly {page_count} page objects.
    """

    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": 2000,
        "system": system_prompt,
        "messages": [
            {"role": "user", "content": user_prompt}
        ]
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        content = data["content"][0]["text"].strip()
        # Clean markdown wrappers if present
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        parsed = json.loads(content.strip())
        return parsed

def _generate_fallback_story(character_name: str, theme: str, tone: str, special_detail: str, page_count: int) -> Dict[str, Any]:
    """Provides a charming, dynamic storybook fallback when API key is unconfigured."""
    title = f"{character_name} and the Quest for the {special_detail.title()}"
    
    story_templates = [
        (
            f"Far away in the magical realm of {theme}, lived a brave young explorer named {character_name}. Every morning, {character_name} set out with a bright smile and a heart full of curiosity.",
            f"{character_name} standing on a vibrant meadow in {theme}, holding a map, colorful flowers around"
        ),
        (
            f"One sunny afternoon, {character_name} discovered something extraordinary hidden under ancient leaves: {special_detail}! It shimmered with soft rainbow light.",
            f"{character_name} kneeling down discovering a glowing {special_detail} surrounded by gentle sparkles"
        ),
        (
            f"With a soft hum, {special_detail} lit up a secret path through {theme}. {character_name} stepped forward bravely, ready for an unforgettable adventure.",
            f"{character_name} walking down a magical luminous pathway through a lush enchanted forest"
        ),
        (
            f"Along the way, friendly woodland creatures gathered to welcome {character_name}. A wise old owl perched on a low branch and hooted a gentle melody of encouragement.",
            f"A cute fluffy owl and friendly woodland animals gathered around {character_name} in a warm forest glade"
        ),
        (
            f"Together, they solved riddles left by ancient stargazers and followed the sparkling trail left by {special_detail}.",
            f"{character_name} looking at ancient starry symbols carved into a magical stone archway"
        ),
        (
            f"At the highest peak overlooking {theme}, a breathtaking view unfolded. Clouds parted to reveal a sky painted in shades of gold and violet.",
            f"{character_name} standing at a hilltop peak overlooking a magical sparkling kingdom under a golden sunset"
        ),
        (
            f"{character_name} held {special_detail} high into the air, and its light merged with the evening stars, granting peace across the entire realm.",
            f"{character_name} raising glowing {special_detail} into a starry night sky with gentle constellations"
        ),
        (
            f"With a feeling of accomplishment and warmth, {character_name} returned home, knowing that the greatest magic was courage and friendship.",
            f"{character_name} cozy inside a warm cottage drinking cocoa with woodland animal friends by the fireplace"
        )
    ]
    
    selected_pages = story_templates[:page_count]
    pages = []
    for idx, (text, prompt) in enumerate(selected_pages, 1):
        pages.append({
            "page_number": idx,
            "text": text,
            "illustration_prompt": prompt
        })
        
    return {
        "title": title,
        "pages": pages
    }
