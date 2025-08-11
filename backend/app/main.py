# backend/app/main.py

from pathlib import Path
from dotenv import load_dotenv

# Load env from the backend root (one level above `app/`), override any existing values
BASE_DIR = Path(__file__).resolve().parents[1]
dotenv_file = BASE_DIR / ".env"
load_dotenv(dotenv_file, override=True)

import socketio
import uvicorn
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.agent import agent_runnable
# --- Import our new DB client and manager functions ---
from app.db.prisma import db, connect_db, disconnect_db


# --- Pydantic Models ---
class ClaimCreate(BaseModel):
    policyNumber: str
    claimantName: str
    incidentDate: datetime
    incidentDescription: str

# --- FastAPI App & Socket.IO Initialization ---
app = FastAPI(title="Clem AI API", version="0.1.0")

# --- Add Lifespan Events to connect/disconnect DB ---
@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
sio_app = socketio.ASGIApp(socketio_server=sio, other_asgi_app=app)


# --- Background Task to Run the Agent (Now with DB operations) ---
async def run_agent_and_notify(claim_id: str, claim_data: dict):
    initial_payload = {"id": claim_id, "status": "IN_REVIEW", **claim_data}
    await sio.emit("new_claim", data=initial_payload)
    print(f"Emitted 'new_claim' for {claim_id}")

    agent_input = {"claim_data": claim_data}
    final_state = await agent_runnable.ainvoke(agent_input)
    print(f"Agent finished for {claim_id}. Final state: {final_state}")
    
    recommendation = final_state.get("recommendation", {})
    
    # --- UPDATE the claim in the database with the AI's results ---
    updated_claim = await db.claim.update(
        where={"id": claim_id},
        data={
            "status": "AWAITING_APPROVAL",
            "aiRecommendation": recommendation,
            "aiReasoning": recommendation.get("reason", "No reason provided.")
        }
    )

    await sio.emit("claim_updated", data=updated_claim.dict())
    print(f"Emitted 'claim_updated' for {claim_id}")

# --- API Endpoints ---
@app.get("/")
async def read_root():
    return {"message": "Clem AI Backend is running!"}

# --- NEW: Endpoint to fetch all claims ---
@app.get("/api/v1/claims")
async def get_all_claims():
    """Fetches all claims from the database."""
    all_claims = await db.claim.find_many(order={"createdAt": "desc"})
    return all_claims

@app.post("/api/v1/claims", status_code=202)
async def create_claim(claim: ClaimCreate):
    claim_dict = claim.dict()
    
    # --- CREATE the initial claim record in the database ---
    new_claim = await db.claim.create(
        data={
            # Generate a unique claim number for simplicity
            "claimNumber": f"CLM-{uuid.uuid4().hex[:8].upper()}",
            "status": "PENDING",
            **claim_dict,
        }
    )
    print(f"Saved new claim to DB with ID: {new_claim.id}")

    await sio.start_background_task(run_agent_and_notify, new_claim.id, claim_dict)

    return {"message": "Claim received and is being processed", "claim_id": new_claim.id}


# --- Socket.IO Event Handlers (Unchanged) ---
@sio.event
async def connect(sid, environ):
    print(f"✅ Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"❌ Client disconnected: {sid}")