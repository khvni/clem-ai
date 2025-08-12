# backend/app/db/prisma.py
from prisma import Prisma
from app.core import config

# Initialize the client explicitly with the datasource URL
db = Prisma(
    datasource={'url': config.DATABASE_URL}
)

async def connect_db():
    if not db.is_connected():
        print("Connecting to database...")
        await db.connect()

async def disconnect_db():
    if db.is_connected():
        print("Disconnecting from database...")
        await db.disconnect()