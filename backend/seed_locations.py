"""seed_locations.py — one-shot importer for Geonames country dumps.

Usage (manual, from inside /app/backend):
    python seed_locations.py EG /app/data/EG.txt
    python seed_locations.py SA /app/data/geonames_SA.txt

Or via the admin HTTP endpoint:
    POST /api/locations/admin/import?country=EG  (multipart file)

Idempotent: re-running for a country REPLACES all rows of that country.
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from locations import parse_geonames_file, link_parents


async def main(country: str, path: str):
    mongo = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = mongo[os.environ.get("DB_NAME", "haraj_plus")]
    cc = country.upper()
    print(f"[seed] reading {path} for {cc}…")
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        raw = fh.read()
    records = parse_geonames_file(raw, cc)
    print(f"[seed] parsed {len(records)} records")
    link_parents(records)
    print(f"[seed] wiping existing rows for {cc}…")
    await db.locations.delete_many({"country": cc})
    if records:
        # Bulk insert (chunked) to keep memory bounded.
        CHUNK = 2000
        for i in range(0, len(records), CHUNK):
            await db.locations.insert_many(records[i:i + CHUNK], ordered=False)
        print(f"[seed] inserted {len(records)} rows")
    await db.locations.create_index([("country", 1), ("level", 1)])
    await db.locations.create_index([("parent_id", 1)])
    await db.locations.create_index([("country", 1), ("name", 1)])
    print(f"[seed] ✓ done for {cc}")
    mongo.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    asyncio.run(main(sys.argv[1], sys.argv[2]))
