# backend/app/core/config.py
import os

# Load variables directly from the OS environment
DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")