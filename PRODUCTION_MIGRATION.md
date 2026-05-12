# Production Migration Checklist — Haraj Plus

> Last update: Feb 2026 — direct Google OAuth, no third-party auth proxy.

---

## 🌐 Production URLs

- **Frontend**: https://alhraj.online (and https://www.alhraj.online) — hosted on Vercel
- **Backend**:  https://alhrajplus.onrender.com — hosted on Render
- **Database**: MongoDB Atlas
- **Media**:    Cloudinary

---

## 🔐 Google OAuth — Final Configuration

### What's already configured in code
- ✅ Direct OAuth 2.0 flow (no Emergent/Supabase proxy)
- ✅ CSRF-protected with state token stored in MongoDB (TTL 10 min)
- ✅ Server-side callback that sets httpOnly cookies, then 302-redirects to frontend
- ✅ Auto-create user record from Google profile (email, name, picture)
- ✅ Auto-link Google when an email already has a password account

### What you must set in Google Cloud Console

Go to https://console.cloud.google.com/apis/credentials → OAuth 2.0 Client ID:

**Authorized JavaScript Origins**:
```
https://alhraj.online
https://www.alhraj.online
https://alhrajplus.vercel.app
https://haraj-plus.vercel.app
```

**Authorized Redirect URIs**:
```
https://alhrajplus.onrender.com/api/auth/google/callback
```

> ⚠️ Only ONE redirect URI is needed (backend handles all frontend redirects after callback).

---

## 🔑 Required Environment Variables on Render

### Critical (must be set, server won't auth without them)
| Key | Example | Notes |
|---|---|---|
| `MONGO_URL` | `mongodb+srv://...mongodb.net/haraj_plus_db?...` | MongoDB Atlas connection |
| `DB_NAME` | `haraj_plus_db` | |
| `JWT_SECRET` | `<random 64-char hex>` | `openssl rand -hex 32` |
| `ADMIN_EMAIL` | `admin@harajplus.com` | |
| `ADMIN_PASSWORD` | `<strong password>` | First-run admin seed |
| `FRONTEND_URL` | `https://alhraj.online` | Used in OAuth redirects |
| `CORS_ORIGINS` | (leave empty for defaults) | Optional override |

### Google OAuth
| Key | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | `1023779473075-nv3lkfjpa9ktlvj4a8njlmg08vevbknf.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `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` |
| `GOOGLE_REDIRECT_URI` | `https://alhrajplus.onrender.com/api/auth/google/callback` |

### Cloudinary (media uploads — images, videos, voice messages)
| Key | Where to get |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | https://console.cloudinary.com → Dashboard |
| `CLOUDINARY_API_KEY` | same |
| `CLOUDINARY_API_SECRET` | same |

### Email (Resend)
| Key | Where to get |
|---|---|
| `RESEND_API_KEY` | https://resend.com/api-keys |
| `RESEND_FROM` | `Haraj Plus <noreply@alhraj.online>` |

### AI (optional but recommended)
| Key | Where to get |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `EMERGENT_LLM_KEY` | (only inside Emergent platform — leave empty for Render) |

### Social Login (X & Snapchat)
| Key | Where to get |
|---|---|
| `X_CLIENT_ID` | https://developer.twitter.com → Your App |
| `X_CLIENT_SECRET` | same |
| `SNAPCHAT_CLIENT_ID` | https://kit.snapchat.com/portal |
| `SNAPCHAT_CLIENT_SECRET` | same |

### Cron / Keep-Alive
| Key | Example |
|---|---|
| `CRON_SECRET` | `<random 32-char hex>` for daily-digest endpoint |

---

## 🐦 X (Twitter) — Developer Portal Redirect URIs

Add these to your X App → User authentication settings → Callback URLs:
```
https://alhrajplus.onrender.com/api/auth/x/callback
```

(All frontend redirects after that are handled by the backend.)

---

## 👻 Snapchat — Snap Kit Portal Redirect URIs

Add to your Snap App → Settings → Redirect URIs:
```
https://alhrajplus.onrender.com/api/auth/snapchat/callback
```

---

## 🌍 DNS Configuration

### `alhraj.online` (apex / root)
Pointing to Vercel:
- Type: `A`     Name: `@`     Value: `76.76.21.21`     (Vercel's anycast)
- OR Type: `ALIAS`/`ANAME`   Name: `@`     Value: `cname.vercel-dns.com`

### `www.alhraj.online`
- Type: `CNAME`   Name: `www`   Value: `cname.vercel-dns.com`

### Verify in Vercel: Settings → Domains → add both domains and follow guided DNS steps.

---

## 🩺 Health & Monitoring

- **Backend health**: `GET https://alhrajplus.onrender.com/health` (supports HEAD too)
- **DB-aware health**: `GET https://alhrajplus.onrender.com/api/health`
- **Keep-alive**: Set up UptimeRobot or cron-job.org to GET `/health` every 5 min — prevents Render free tier sleep.

---

## ✅ Migration Status

| Task | Status |
|---|---|
| Direct Google OAuth (no Emergent proxy) | ✅ Done |
| Server-side callback with cookie set + redirect | ✅ Done |
| Session persistence (httpOnly + SameSite=None + Secure) | ✅ Done |
| CORS for alhraj.online + Vercel previews | ✅ Done |
| Cloudinary integration unaffected (no domain restriction) | ✅ Verified |
| `/health` + `/api/health` (GET + HEAD) | ✅ Done |
| `--proxy-headers --forwarded-allow-ips='*'` in start command | ✅ Done |
| X & Snapchat auth flows | ✅ Still use existing env vars |
| Removed `EMERGENT_AUTH_URL` runtime dependency | ✅ Done |
| Legacy `POST /api/auth/google` returns 410 GONE | ✅ Done |
| Auto SEO for new listings (search_blob + sitemap) | ✅ Done |
| Cron daily-digest (supports GET + POST + ?secret=) | ✅ Done |
