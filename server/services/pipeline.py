import asyncio
import logging
import time
from typing import Dict, Any
from config import TIERS
import database
from services.story_service import generate_story_text
from services.image_service import generate_page_illustrations
from services.pdf_service import assemble_pdf

logger = logging.getLogger(__name__)

async def run_generation_pipeline(order_id: str):
    """Asynchronously generates story, images, and compiles PDF for a confirmed order."""
    order = database.get_order(order_id)
    if not order:
        logger.error(f"Order {order_id} not found for generation pipeline.")
        return

    tier_key = order["tier"]
    tier_info = TIERS.get(tier_key, TIERS["mini"])
    page_count = tier_info["pages"]
    illustration_count = tier_info["illustrations"]
    customization = order["customization_fields"]

    start_time = time.time()
    cost_log = {"llm_tokens": 0, "image_credits": 0, "est_cost_usd": 0.0}

    try:
        # Step 1: Text Generation
        logger.info(f"[{order_id}] Step 1: Generating story text...")
        database.update_order_status(order_id, "generating_text")
        story_data = await generate_story_text(customization, page_count)
        cost_log["llm_tokens"] += page_count * 150

        # Step 2: Image Generation
        logger.info(f"[{order_id}] Step 2: Generating illustrations...")
        database.update_order_status(order_id, "generating_images")
        image_paths = await generate_page_illustrations(order_id, story_data.get("pages", []), illustration_count)
        cost_log["image_credits"] += illustration_count

        # Step 3: PDF Assembly
        logger.info(f"[{order_id}] Step 3: Assembling PDF...")
        database.update_order_status(order_id, "assembling_pdf")
        pdf_path = assemble_pdf(order_id, story_data, image_paths, tier_info["name"])

        # Step 4: Mark Complete
        cost_log["elapsed_seconds"] = round(time.time() - start_time, 2)
        database.save_generation(
            order_id=order_id,
            story_title=story_data.get("title", "Illustrated Story"),
            story_json=story_data.get("pages", []),
            image_paths=image_paths,
            pdf_path=pdf_path,
            cost_log=cost_log
        )
        database.update_order_status(order_id, "complete")
        logger.info(f"[{order_id}] Generation completed successfully in {cost_log['elapsed_seconds']}s")

    except Exception as e:
        logger.error(f"[{order_id}] Pipeline failed: {e}", exc_info=True)
        database.update_order_status(order_id, "failed")
