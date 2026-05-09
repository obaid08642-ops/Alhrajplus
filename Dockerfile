# Multi-stage build for FastAPI backend on Google Cloud Run
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

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
# For external deployment (Cloud Run), AI features fall back to direct
# provider SDKs via GEMINI_API_KEY / OPENAI_API_KEY env vars.
RUN pip install --no-cache-dir emergentintegrations \
    --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ || true

# Copy application code
COPY backend/ ./backend/

# Cloud Run injects PORT env var (default 8080). EXPOSE is informational.
EXPOSE 8080

# IMPORTANT: do NOT hardcode the port. Cloud Run sets PORT=8080 at runtime.
# Single worker is recommended on Cloud Run (it scales by replicas, not workers),
# and async FastAPI handles concurrency via the event loop.
CMD exec uvicorn backend.server:app \
    --host 0.0.0.0 \
    --port ${PORT:-8080} \
    --workers 1 \
    --proxy-headers \
    --forwarded-allow-ips='*'
