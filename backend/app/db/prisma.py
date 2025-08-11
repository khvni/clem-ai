import os
from pathlib import Path
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv
from prisma import Prisma

# Ensure the backend `.env` is loaded regardless of CWD, and override any exported vars
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env", override=True)

# Create a single, reusable instance of the Prisma client, explicitly passing URL if available
database_url = os.getenv("DATABASE_URL")
if database_url:
    # Normalize host to avoid localhost vs 127.0.0.1 discrepancies on macOS
    try:
        parsed = urlparse(database_url)
        host = parsed.hostname or ""
        if host == "localhost":
            normalized = parsed._replace(netloc=database_url.split("@")[1].replace("localhost", "127.0.0.1"))
            database_url = urlunparse(normalized)
    except Exception:
        pass

db = Prisma(datasource={"url": database_url}) if database_url else Prisma()

async def connect_db():
    """Connects to the Prisma database."""
    if not db.is_connected():
        print("Connecting to database...")
        await db.connect()

async def disconnect_db():
    """Disconnects from the Prisma database."""
    if db.is_connected():
        print("Disconnecting from database...")
        await db.disconnect()