import asyncio
import os
import time
import database
from services.pipeline import run_generation_pipeline
from config import TIERS

async def main():
    database.init_db()
    order_id = f"test_order_{int(time.time())}"
    device_id = "dev_test_device_123"
    tier = "mini"
    customization = {
        "character_name": "Barnaby the Bear",
        "theme": "Enchanted Pines",
        "tone": "Whimsical",
        "special_detail": "Golden glowing compass"
    }

    print("Creating test order...")
    database.create_order(order_id, device_id, tier, customization, 100.0)

    print("Simulating server-side payment confirmation...")
    database.record_payment(order_id, "TX_TEST_12345")
    database.update_order_status(order_id, "paid", "NQ07_TEST_WALLET")

    print("Running background generation pipeline...")
    await run_generation_pipeline(order_id)

    status = database.get_order(order_id)
    print("Final Order Status:", status["status"])

    gen = database.get_generation(order_id)
    if gen:
        print("Story Title:", gen["story_title"])
        print("Generated PDF path:", gen["pdf_path"])
        print("PDF exists:", os.path.exists(gen["pdf_path"]))
        print("Cost Log:", gen["cost_log"])

if __name__ == "__main__":
    asyncio.run(main())
