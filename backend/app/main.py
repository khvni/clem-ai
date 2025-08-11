# backend/app/main.py

import socketio
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime

# --- Pydantic Models for Data Validation ---
# This defines the structure of the data we expect for a new claim.
# FastAPI will automatically validate incoming data against this model.
class ClaimCreate(BaseModel):
    policyNumber: str
    claimantName: str
    incidentDate: datetime

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Clem AI API",
    version="0.1.0",
)

# --- CORS (Cross-Origin Resource Sharing) Middleware ---
# This is crucial for allowing our Next.js frontend (running on a different domain)
# to communicate with this backend. We allow all origins for now for easy development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Socket.IO Server Initialization ---
# We create a Socket.IO server instance. The 'async_mode="asgi"' is essential
# for it to work with FastAPI.
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

# This is the magic that combines our FastAPI app and Socket.IO server.
# The `sio_app` becomes the main application that Uvicorn will run.
sio_app = socketio.ASGIApp(socketio_server=sio, other_asgi_app=app)


# --- API Endpoints ---
@app.get("/")
async def read_root():
    """A simple health check endpoint."""
    return {"message": "Clem AI Backend is running!"}


@app.post("/api/v1/claims", status_code=201)
async def create_claim(claim: ClaimCreate):
    """
    Receives a new claim, validates it, and will eventually trigger
    the AI agent processing.
    """
    print(f"Received new claim: {claim.dict()}")
    # In the next steps, we will:
    # 1. Save the claim to the database.
    # 2. Trigger the LangGraph agent.
    # 3. Emit a 'new_claim' event via Socket.IO.
    return {"message": "Claim received successfully", "data": claim.dict()}


# --- Socket.IO Event Handlers ---
@sio.event
async def connect(sid, environ):
    """Handles a new client connection."""
    print(f"✅ Client connected: {sid}")

@sio.event
async def disconnect(sid):
    """Handles a client disconnection."""
    print(f"❌ Client disconnected: {sid}")

# --- Main entry point for Uvicorn ---
# This block allows running the server directly with `python app/main.py`
# but we will use the `uvicorn` command for development.
if __name__ == "__main__":
    uvicorn.run(sio_app, host="0.0.0.0", port=8000)