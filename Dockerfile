# Dockerfile for Haraj Plus FastAPI backend on Google Cloud Run
#
# Why WORKDIR=/app/backend (not /app)?
#   server.py uses bare imports like `from seed_data import ...` and
#   `from search_engine import ...`. Python finds these only when
#   /app/backend is in sys.path — which happens when WORKDIR is set to
#   /app/backend and the entry command is `uvicorn server:app`.
#   This matches the local supervisor setup exactly, so behaviour
#   on Cloud Run mirrors local dev.

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System deps required by some Python packages (bcrypt, pillow, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 1. Install dependencies (cached layer)
WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# 2. Install emergentintegrations from Emergent's public CloudFront index.
#    `|| true` so the build never fails if the index is unreachable —
#    AI endpoints will return 503 in that case but the server still runs.
RUN pip install --no-cache-dir emergentintegrations \
    --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ || true

# 3. Copy application code
COPY backend/ /app/backend/

# 4. Switch to the backend directory so Python imports resolve
#    exactly like in local dev (sys.path includes /app/backend).
WORKDIR /app/backend

# Cloud Run injects PORT=8080. EXPOSE is purely informational.
EXPOSE 8080

# Use shell form via `sh -c` to expand ${PORT}. `exec` makes uvicorn
# PID 1 inside the shell, so it receives SIGTERM cleanly on revision
# replacement (Cloud Run sends SIGTERM with a 10s grace period).
CMD ["sh", "-c", "exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
