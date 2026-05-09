# Cloud Run Deployment Checklist — Haraj Plus

> Quick action checklist to deploy `Haraj Plus` (FastAPI + MongoDB) to Google Cloud Run.
> For full step-by-step walkthrough see `DEPLOYMENT.md`.

---

## ✅ What this codebase already handles for you

| Concern | Status | Where |
|---|---|---|
| `$PORT` from Cloud Run | ✅ Auto | `Dockerfile` → `--port ${PORT:-8080}` |
| `--proxy-headers` for Load Balancer | ✅ Auto | `Dockerfile` → uvicorn flag |
| Trusted proxies (X-Forwarded-For) | ✅ Auto | `--forwarded-allow-ips='*'` |
| WebSocket support | ✅ | `cloudbuild.yaml` → `--session-affinity --timeout=3600` |
| Image/voice/video uploads | ✅ Cloudinary | No local files written; safe with Cloud Run scratch FS |
| Database | ✅ MongoDB (Atlas-ready) | `MONGO_URL` from secret |
| Health check tolerance (cold start) | ✅ | `--cpu-boost` enabled |

## ❌ What YOU must do once in GCP Console

### 1. Create MongoDB Atlas cluster + whitelist Cloud Run
1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → Create free M0 cluster.
2. Database Access → Add user (e.g. `haraj_app`) with `readWrite` on `haraj_plus_db`.
3. Network Access → **Allow access from anywhere** (`0.0.0.0/0`).
   - Cloud Run uses dynamic egress IPs; whitelisting specific IPs is not feasible without a [Direct VPC egress](https://cloud.google.com/run/docs/configuring/vpc-direct-vpc) or Serverless VPC Connector + Cloud NAT.
   - For production-grade IP allowlisting, set up a Serverless VPC Connector + Cloud NAT with a static IP, then whitelist that IP only.
4. Get connection string → store in Secret Manager as `MONGO_URL`.

### 2. Create all secrets in Secret Manager
Run these once (replace values):
```bash
gcloud secrets create MONGO_URL --replication-policy=automatic
echo -n "mongodb+srv://USER:PASS@cluster.mongodb.net/?retryWrites=true&w=majority" | gcloud secrets versions add MONGO_URL --data-file=-

gcloud secrets create JWT_SECRET --replication-policy=automatic
openssl rand -hex 32 | gcloud secrets versions add JWT_SECRET --data-file=-

gcloud secrets create CLOUDINARY_API_SECRET --replication-policy=automatic
echo -n "YOUR_CLOUDINARY_SECRET" | gcloud secrets versions add CLOUDINARY_API_SECRET --data-file=-

gcloud secrets create RESEND_API_KEY --replication-policy=automatic
echo -n "re_xxxxxxxxxxxx" | gcloud secrets versions add RESEND_API_KEY --data-file=-

gcloud secrets create GEMINI_API_KEY --replication-policy=automatic
echo -n "YOUR_GEMINI_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

gcloud secrets create X_CLIENT_SECRET --replication-policy=automatic
echo -n "YOUR_X_OAUTH_SECRET" | gcloud secrets versions add X_CLIENT_SECRET --data-file=-

gcloud secrets create SNAPCHAT_CLIENT_SECRET --replication-policy=automatic
echo -n "YOUR_SNAP_OAUTH_SECRET" | gcloud secrets versions add SNAPCHAT_CLIENT_SECRET --data-file=-

gcloud secrets create CRON_SECRET --replication-policy=automatic
openssl rand -hex 24 | gcloud secrets versions add CRON_SECRET --data-file=-

gcloud secrets create ADMIN_PASSWORD --replication-policy=automatic
echo -n "Admin@HarajPlus2026" | gcloud secrets versions add ADMIN_PASSWORD --data-file=-
```

Then grant Cloud Run service account access:
```bash
PROJECT=$(gcloud config get-value project)
SA="$(gcloud projects describe $PROJECT --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
for s in MONGO_URL JWT_SECRET CLOUDINARY_API_SECRET RESEND_API_KEY GEMINI_API_KEY X_CLIENT_SECRET SNAPCHAT_CLIENT_SECRET CRON_SECRET ADMIN_PASSWORD; do
  gcloud secrets add-iam-policy-binding $s --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
done
```

### 3. Update `cloudbuild.yaml` placeholders
Edit `cloudbuild.yaml` lines under `--set-env-vars` and replace:
- `CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME` → your Cloudinary cloud name
- `CLOUDINARY_API_KEY=YOUR_KEY` → your Cloudinary key
- `X_CLIENT_ID=YOUR_X_ID` → your X (Twitter) OAuth client id
- `SNAPCHAT_CLIENT_ID=YOUR_SNAP_ID` → your Snapchat OAuth client id

### 4. Deploy via Cloud Build
```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=haraj-api,_REGION=me-central1,_ARTIFACT_REPO=haraj-images
```

### 5. Set up Cloud Scheduler for cron jobs
```bash
# Get the Cloud Run URL
URL=$(gcloud run services describe haraj-api --region me-central1 --format='value(status.url)')
SECRET=$(gcloud secrets versions access latest --secret=CRON_SECRET)

# Daily digest at 8 PM Riyadh time
gcloud scheduler jobs create http haraj-daily-digest \
  --location=me-central1 \
  --schedule="0 20 * * *" \
  --time-zone="Asia/Riyadh" \
  --uri="${URL}/api/cron/daily-digest" \
  --http-method=POST \
  --headers="X-Cron-Secret=${SECRET},Content-Type=application/json" \
  --message-body='{}' \
  --attempt-deadline=540s
```

### 6. Verify
```bash
# Health check
curl -i ${URL}/api/sitemap.xml | head -5

# Listing creation flow (requires admin token)
curl -i ${URL}/api/listings?limit=5
```

---

## 🔍 Common Cloud Run gotchas (already mitigated for you)

| Issue | Mitigation in our config |
|---|---|
| Cold start timeouts | `--cpu-boost` flag added |
| WebSocket disconnects | `--session-affinity --timeout=3600` |
| Container fails to bind to port | uvicorn reads `${PORT:-8080}` (Cloud Run sets `PORT=8080`) |
| Lost uploads after restart | All media → Cloudinary (no local FS writes) |
| Forgot to grant Secret Manager access | See `for s in ...` loop above |
| `APP_ENV` / `APP_DEBUG` | Set `APP_ENV=production` in `--set-env-vars`. FastAPI has no global DEBUG flag; this is informational only. |
| Cron not firing | Cloud Run never runs cron internally — Cloud Scheduler is **mandatory**. |

---

## 📁 Frontend deployment (separate)

Frontend is a static React build deployed independently to **Firebase Hosting** or **Cloudflare Pages**. See `firebase.json` and root `DEPLOYMENT.md`.

The frontend uses `REACT_APP_BACKEND_URL` env var (set at build time) pointing to your Cloud Run URL, e.g. `https://haraj-api-xxxxxx-uc.a.run.app`.
