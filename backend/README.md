# Clem AI Backend Service

## Overview

This backend service is the core of the Clem AI application. It's a FastAPI application that handles incoming insurance claims, processes them using a sophisticated AI agent built with LangGraph and Google's Gemini model, and manages claim data in a PostgreSQL database via Prisma.

The service exposes a REST API for creating and retrieving claims and uses WebSockets (via Socket.IO) to provide real-time updates to the frontend as the AI agent processes a claim.

## Local Environment Setup

Follow these instructions to get the backend server running on your local machine for development and testing purposes.

### 1. Create a Virtual Environment

It's highly recommended to use a virtual environment to manage project dependencies and avoid conflicts with other Python projects.

Navigate to the `backend` directory and run the following commands:

```bash
# Create a new virtual environment named 'venv'
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

Once your virtual environment is activated, install all the required Python packages from the `requirements.txt` file.

```bash
pip install -r requirements.txt
```

This will install FastAPI, Uvicorn, Prisma, LangChain, and all other necessary libraries.

## Configuration

The application requires certain environment variables to be set to connect to the database and the Google AI services.

1.  **Create a `.env` file:** In the root of the `backend` directory, create a new file named `.env`.

2.  **Add Environment Variables:** Add the following key-value pairs to your `.env` file, replacing the placeholder values with your actual credentials.

    ```env
    # .env

    # The connection string for your PostgreSQL database.
    # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
    DATABASE_URL="postgresql://your_user:your_password@localhost:5432/clem_ai_db"

    # Your API key for the Google AI (Gemini) API.
    GOOGLE_API_KEY="your_google_api_key_here"
    ```

## Running the Server

With the environment set up and configured, you can now run the FastAPI server.

The application uses `uvicorn` as the ASGI server. The `--reload` flag enables hot-reloading, which automatically restarts the server whenever you make changes to the code.

From the `backend` directory, run the following command:

```bash
uvicorn app.main:sio_app --host 0.0.0.0 --port 8000 --reload
```

You should see output indicating that the server is running and listening on `http://0.0.0.0:8000`. You can now access the API documentation at `http://localhost:8000/docs`.
