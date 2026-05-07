# Multi-stage build for FastAPI backend on Google Cloud Run
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8001

WORKDIR /app

# System deps for cryptography, image libs, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (cached layer)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install emergentintegrations (Emergent's universal LLM key wrapper).
# NOTE: emergentintegrations only works inside Emergent platform.
# For external deployment (Cloud Run), the AI features will use direct
# Gemini API via GEMINI_API_KEY env var (see code fallback paths).
RUN pip install --no-cache-dir emergentintegrations \
    --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ || true

# Copy application code
COPY backend/ ./backend/

# Cloud Run injects PORT env var
EXPOSE 8001

# Use $PORT from Cloud Run, fallback to 8001 for local
CMD exec uvicorn backend.server:app --host 0.0.0.0 --port ${PORT:-8001} --workers 2
