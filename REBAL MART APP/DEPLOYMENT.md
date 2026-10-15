# Full-Stack Deployment Pipeline: Rebel Mart

This guide details the complete dual-hosting orchestration for deploying the Rebel Mart full-stack application using **Render** (FastAPI Backend) and **Vercel** (React Frontend).

- **GitHub Repository**: `https://github.com/thrinaadhvarmag/COASTALSEVEN_DAILY_TASKS`
- **Application Directory**: `REBAL MART APP`

---

## Architecture Overview

```mermaid
flowchart LR
    Client["Browser / Client"]
    Vercel["Vercel Static Hosting<br/>(React + Vite SPA)<br/>https://*.vercel.app"]
    Render["Render Web Service<br/>(FastAPI + Python 3.10+)<br/>https://rebel-mart-api.onrender.com"]
    DB[(SQLite / PostgreSQL)]
    WS[("WebSocket Engine<br/>wss://.../ws/*")]

    Client -->|HTTPS (Static Assets)| Vercel
    Client -->|REST API with CORS| Render
    Client -->|Real-Time WSS| WS
    Render --> DB
    WS --> Render
```

---

## Step 1: Deploy Backend to Render (Web Service)

### Option A: 1-Click Blueprint (Recommended)
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your repository: `https://github.com/thrinaadhvarmag/COASTALSEVEN_DAILY_TASKS`.
4. Render will auto-detect [`render.yaml`](./render.yaml) and prefill all build & start parameters.
5. Click **Apply**.

---

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** → **Web Service**.
2. Select **Build and deploy from a Git repository** and pick `COASTALSEVEN_DAILY_TASKS`.
3. Configure the service settings:
   - **Name**: `rebel-mart-api` (or your preferred name)
   - **Region**: Choose the closest region (e.g., Singapore, Oregon, Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `REBAL MART APP/backend` *(Crucial: isolates the Python service)*
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

4. Add **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.10.12` | Ensures Python 3.10+ runtime |
   | `DATABASE_URL` | `sqlite:///./data/rebelmart.db` | Default persistent SQLite or PostgreSQL URI |
   | `JWT_SECRET` | *(Click "Generate" or enter a 32+ char secret)* | Secret key for JWT signing |
   | `FRONTEND_URL` | `https://*.vercel.app` | Optional custom production domain override |

5. Click **Create Web Service**.
6. Wait 1–2 minutes for the build to finish. Once live, copy your assigned HTTPS service URL:
   ```text
   https://<your-service-name>.onrender.com
   ```
   *(e.g., `https://rebel-mart-api.onrender.com`)*

---

## Step 2: Deploy Frontend to Vercel (Static Hosting)

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New…** → **Project**.
3. Import your repository: `COASTALSEVEN_DAILY_TASKS`.
4. In the **Configure Project** screen:
   - **Project Name**: `rebel-mart` (or your chosen name)
   - **Framework Preset**: Auto-detected as **Vite**
   - **Root Directory**: Click **Edit** and select **`REBAL MART APP/frontend`** *(Crucial: points build to the React workspace)*
   - **Build and Output Settings**:
     - **Build Command**: `npm run build` (or leave default Vite setting)
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://<your-service-name>.onrender.com` *(paste your live Render backend URL from Step 1)* |

6. Click **Deploy**.
7. Vercel will build and deploy the application, assigning you a live production URL:
   ```text
   https://rebel-mart.vercel.app
   ```

---

## Step 3: Pipeline Integration, CORS & WebSockets

### 1. Wildcard CORS Configuration
In [`backend/app/main.py`](./backend/app/main.py), the CORS middleware dynamically authorizes all production and preview subdomains originating from Vercel:

```python
# CORS Middleware: local development, production Vercel wildcard (*.vercel.app), and custom domains
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

frontend_env = os.environ.get("FRONTEND_URL")
if frontend_env:
    for url in frontend_env.split(","):
        clean_url = url.strip().rstrip("/")
        if clean_url and clean_url not in allowed_origins:
            allowed_origins.append(clean_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- **`allow_origin_regex=r"^https:\/\/.*\.vercel\.app$"`**: Automatically accepts requests from `https://rebel-mart.vercel.app`, preview PR URLs (`https://rebel-mart-git-feat-*.vercel.app`), and staging domains without manual CORS reconfigurations.
- **`allow_credentials=True`**: Allows authentication cookies and Authorization headers to pass securely.

### 2. Automatic Secure WebSocket Protocol Upgrade
The frontend [`useOrderRealtime.ts`](./frontend/src/hooks/useOrderRealtime.ts) and [`LiveChat.jsx`](./frontend/src/components/LiveChat.jsx) automatically convert `https://` to `wss://`:

```typescript
const protocol = baseUrl.startsWith("https://") ? "wss" : "ws";
const wsUrl = `${protocol}://${baseUrl.replace(/^https?:\/\//, "")}/ws/...`;
```
When `VITE_API_URL` is set to `https://rebel-mart-api.onrender.com`, all WebSocket live orders and admin live-chat connections automatically connect securely over **`wss://rebel-mart-api.onrender.com`**.

---

## Verification Checklist

- [x] **Backend Health Check**: Open `https://<render-url>.onrender.com/health` → responds `{"status": "ok"}`
- [x] **Swagger Docs**: Open `https://<render-url>.onrender.com/docs` → interactive OpenAPI documentation
- [x] **Frontend Storefront**: Open `https://<vercel-url>.vercel.app` → renders cinematic Rebel Mart catalog
- [x] **Theme Switcher**: Toggle Dark & Favicon Crimson Light Mode
- [x] **API Connectivity**: Verify products load without CORS errors in Browser DevTools Console
- [x] **Real-time WebSockets**: Place an order or open Customer Live Chat → WebSocket handshake completes over `wss://`
