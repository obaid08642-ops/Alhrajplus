"""One-shot production-safe cleanup for legacy demo/360 records.

Run explicitly after reviewing the target database:
    python -m backend.cleanup_legacy_demo_360

The script never deletes ordinary listings. It removes only records explicitly
marked is_demo=true and unsets the retired custom_fields.is_360 flag from all
remaining listings. It reports counts and does not touch media files; media
cleanup must use the existing admin media cleanup workflow after confirming
which Cloudinary resources are orphaned.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient


async def main():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        raise SystemExit("MONGO_URL and DB_NAME are required")
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=8000)
    db = client[db_name]
    await client.admin.command("ping")

    demo_count = await db.listings.count_documents({"is_demo": True})
    print(f"demo listings matched: {demo_count}")
    if demo_count:
        result = await db.listings.delete_many({"is_demo": True})
        print(f"demo listings deleted: {result.deleted_count}")

    result = await db.listings.update_many(
        {"custom_fields.is_360": {"$exists": True}},
        {"$unset": {"custom_fields.is_360": ""}},
    )
    print(f"retired 360 flags removed: {result.modified_count}")
    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
