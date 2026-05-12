# 🚀 Production Environment Variables — Haraj Plus

> Complete reference for Render (backend) and Vercel (frontend).
> Last update: Feb 2026

---

## 🔴 Render — Backend (https://alhrajplus.onrender.com)

Open **Render Dashboard → Service → Environment → Add Environment Variable** and add each row:

### Critical (server fails without these)
| Key | Value |
|---|---|
| `MONGO_URL` | `mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/haraj_plus_db?retryWrites=true&w=majority` |
| `DB_NAME` | `haraj_plus_db` |
| `JWT_SECRET` | `<any random 64+ character string — generate at generate-secret.vercel.app/64>` |
| `ADMIN_EMAIL` | `admin@alhraj.online` |
| `ADMIN_PASSWORD` | `<strong password — you can change anytime>` |
| `FRONTEND_URL` | `https://alhraj.online` |

### Google OAuth (use your OWN regenerated values — old ones leaked via earlier commit)
| Key | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | `<from Google Cloud Console → Credentials>` |
| `GOOGLE_CLIENT_SECRET` | `<reset secret in Google Cloud Console first!>` |
| `GOOGLE_REDIRECT_URI` | `https://alhrajplus.onrender.com/api/auth/google/callback` |

### Cloudinary (media)
| Key | Where |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | console.cloudinary.com → Dashboard |
| `CLOUDINARY_API_KEY` | same |
| `CLOUDINARY_API_SECRET` | same (regenerate if leaked) |

### Resend (email)
| Key | Where |
|---|---|
| `RESEND_API_KEY` | resend.com/api-keys |
| `SENDER_EMAIL` | `noreply@alhraj.online` |

### AI (optional)
| Key | Where |
|---|---|
| `GEMINI_API_KEY` | aistudio.google.com/app/apikey |

### X (Twitter) OAuth (optional)
| Key | Where |
|---|---|
| `X_CLIENT_ID` | developer.twitter.com → Your App |
| `X_CLIENT_SECRET` | same (regenerate if leaked) |

### Snapchat OAuth (optional)
| Key | Where |
|---|---|
| `SNAPCHAT_CLIENT_ID` | kit.snapchat.com/portal |
| `SNAPCHAT_CONFIDENTIAL_CLIENT_ID` | (usually same as above) |
| `SNAPCHAT_CLIENT_SECRET` | same (regenerate if leaked) |

### Cron / Keep-Alive
| Key | Value |
|---|---|
| `CRON_SECRET` | `<any random 32 char string — used to authenticate cron-job.org pings>` |

### CORS (optional override)
| Key | Value |
|---|---|
| `CORS_ORIGINS` | leave blank (defaults already include alhraj.online + vercel.app) |

---

## 🟢 Vercel — Frontend (https://alhraj.online)

Open **Vercel Dashboard → Project → Settings → Environment Variables**:

| Key | Value | Environments |
|---|---|---|
| `REACT_APP_BACKEND_URL` | `https://alhrajplus.onrender.com` | Production, Preview, Development |
| `GENERATE_SOURCEMAP` | `false` | Production |

> 💡 The `frontend/.env.production` file already contains these as fallback. The Vercel UI value takes precedence.

---

## 🔑 Provider Console Setup (Manual Steps)

### Google Cloud Console
1. https://console.cloud.google.com/apis/credentials → OAuth 2.0 Client
2. **Authorized JavaScript Origins**:
   ```
   https://alhraj.online
   https://www.alhraj.online
   ```
3. **Authorized Redirect URIs**:
   ```
   https://alhrajplus.onrender.com/api/auth/google/callback
   ```
4. **RESET SECRET** (since old one leaked via the GitHub commit) → use new value as `GOOGLE_CLIENT_SECRET`

### X (Twitter) Developer Portal
1. https://developer.twitter.com → Your App → User authentication settings
2. **Callback URL**: `https://alhrajplus.onrender.com/api/auth/x/callback`
3. **Website URL**: `https://alhraj.online`

### Snapchat — Snap Kit Portal
1. https://kit.snapchat.com/portal → Your App → Settings
2. **Redirect URIs**: `https://alhrajplus.onrender.com/api/auth/snapchat/callback`

### MongoDB Atlas
1. Database Access → user with `readWrite` on `haraj_plus_db`
2. Network Access → `0.0.0.0/0` (Render uses dynamic IPs)

---

## 🩺 Keep-Alive (recommended)

Render Free Tier sleeps after 15 min of inactivity. Set up at https://cron-job.org (free):

| Setting | Value |
|---|---|
| URL | `https://alhrajplus.onrender.com/health` |
| Schedule | Every 5 minutes |
| HTTP method | GET (or HEAD) |
| Notifications | Email on failure |

---

## ✅ Final Verification After Deploying

```bash
# 1. Backend alive
curl -I https://alhrajplus.onrender.com/health

# 2. DB connection
curl https://alhrajplus.onrender.com/api/health
# Expected: {"status":"ok","db":"up"}

# 3. CORS works for alhraj.online
curl -I -H "Origin: https://alhraj.online" https://alhrajplus.onrender.com/api/listings
# Look for: access-control-allow-origin: https://alhraj.online
#           access-control-allow-credentials: true

# 4. Google OAuth start works
curl https://alhrajplus.onrender.com/api/auth/google/start
# Expected: {"auth_url":"https://accounts.google.com/o/oauth2/v2/auth?..."}

# 5. Login + Bearer token works
curl -X POST https://alhrajplus.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alhraj.online","password":"YOUR_PASSWORD"}'
# Expected: {"user":{...},"access_token":"eyJ...","refresh_token":"eyJ..."}
```
