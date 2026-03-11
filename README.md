# Artlist Task — AI Content Generation App

Full-stack app for generating AI content (text and images) via prompts. Built with Next.js, Express, MongoDB, and OpenAI.

---

## Setup instructions

### Prerequisites

- **Node.js** 18+ (20+ recommended) and **npm**
- **Docker** and **Docker Compose** (only for Docker-based setup)
- **MongoDB** :
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier is enough)
- **OpenAI API key** — [Create one](https://platform.openai.com/api-keys) for generation and prompt enhancement
- **Google OAuth** (optional) — [Google Cloud Console](https://console.cloud.google.com/) credentials for “Sign in with Google”

---

### Environment variables

Variables used by the app:

| Variable | Used by | Description |
|----------|---------|-------------|
| `PORT` | Backend | Server port (default `4000`) |
| `MONGODB_URI` | Backend | MongoDB connection string |
| `OPENAI_API_KEY` | Backend | OpenAI API key for generations and prompt enhancement |
| `NEXTAUTH_SECRET` | Backend, Frontend | Shared secret for JWT/session (use a long random string) |
| `NEXTAUTH_URL` | Backend, Frontend | Full URL of the Next.js app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API URL **as seen by the browser** (e.g. `http://localhost:4000/api`) |
| `NEXT_PUBLIC_INTERNAL_API_URL` | Frontend | Backend API URL for **server-side** calls (e.g. NextAuth). Same as backend origin. |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend | WebSocket (Socket.IO) URL **as seen by the browser** (e.g. `http://localhost:4000`) |
| `GOOGLE_CLIENT_ID` | Frontend | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Frontend | Google OAuth client secret |

For **Docker**, set these in a single `.env` file in the **repository root**. Compose will substitute them into the containers.

For **non-Docker** runs, set them per app:

- **Backend:** `backend/.env` (see `backend/.env.example`)
- **Frontend:** `frontend/.env.local` or `frontend/.env` (see `frontend/.env.example`)

Generate a secure `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`).

---

### 1. Development with Docker

Runs backend and frontend in containers with hot reload. Uses the `dev` profile.

1. **Create root `.env`** (copy from `.env.example` and fill in):

   ```bash
   cp .env.example .env
   # Edit .env: set MONGODB_URI, OPENAI_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL,
   # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_INTERNAL_API_URL, NEXT_PUBLIC_SOCKET_URL,
   # GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   ```

   For local Docker, typical values:

   - `NEXTAUTH_URL=http://localhost:3000`
   - `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
   - `NEXT_PUBLIC_INTERNAL_API_URL=http://backend:4000/api` (backend service name in Docker network)
   - `NEXT_PUBLIC_SOCKET_URL=http://localhost:4000`

2. **Start dev stack:**

   ```bash
   docker compose --profile dev up --build
   ```

   - Backend: http://localhost:4000  
   - Frontend: http://localhost:3000  

3. **Stop:**

   ```bash
   docker compose --profile dev down
   ```

**Note:** MongoDB is not defined in `docker-compose.yml`. Use a local MongoDB or Atlas and set `MONGODB_URI` in `.env` accordingly.

---

### 2. Production with Docker

Builds and runs backend and frontend in production mode. Uses the `prod` profile.

1. **Use the same root `.env`** as in dev (with production values for `NEXTAUTH_URL`, `MONGODB_URI`, etc.).

2. **Build and run:**

   ```bash
   docker compose --profile prod up --build
   ```

   - Backend serves on port `4000`, frontend on `3000`.
   - Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to the **public** backend URL (e.g. `https://api.yourdomain.com/api` and `https://api.yourdomain.com`) so the browser can reach the API and Socket.IO.

3. **Run in background:**

   ```bash
   docker compose --profile prod up --build -d
   ```

4. **Stop:**

   ```bash
   docker compose --profile prod down
   ```

---

### 3. Development without Docker (npm only)

Run backend and frontend on the host with hot reload. Best for local debugging.

1. **Backend**

   - Create `backend/.env` from `backend/.env.example`:

     ```bash
     cd backend
     cp .env.example .env
     ```

   - Set at least: `PORT=4000`, `MONGODB_URI`, `OPENAI_API_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (e.g. `http://localhost:3000`).

   - Install and run:

     ```bash
     npm install
     npm run dev
     ```

   - API: http://localhost:4000

2. **Frontend** (second terminal)

   - Create `frontend/.env.local` from `frontend/.env.example`:

     ```bash
     cd frontend
     cp .env.example .env.local
     ```

   - Set:

     - `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
     - `NEXT_PUBLIC_INTERNAL_API_URL=http://localhost:4000/api` (same when backend is on localhost)
     - `NEXT_PUBLIC_SOCKET_URL=http://localhost:4000`
     - `NEXTAUTH_URL=http://localhost:3000`
     - `NEXTAUTH_SECRET` (same as backend)
     - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` if using Google sign-in

   - Install and run:

     ```bash
     npm install
     npm run dev
     ```

   - App: http://localhost:3000

3. **Order:** Start backend first, then frontend. Frontend will call backend at `localhost:4000`.

---

### 4. Production without Docker (npm only)

Build and run backend and frontend as Node processes (e.g. on a VPS or VM).

1. **Backend**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with production values (MONGODB_URI, NEXTAUTH_URL, etc.)
   npm ci
   npm run build
   npm start
   ```

   - Ensure `PORT` (default 4000) is open and that `NEXTAUTH_URL` points to the **frontend** URL (e.g. `https://app.yourdomain.com`).

2. **Frontend**

   ```bash
   cd frontend
   cp .env.example .env.local   # or .env.production
   # Set NEXT_PUBLIC_* and NEXTAUTH_* for production (public URLs the browser can reach)
   npm ci
   npm run build
   npm start
   ```

   - Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to the **public** backend URL (e.g. `https://api.yourdomain.com/api` and `https://api.yourdomain.com`).
   - Set `NEXT_PUBLIC_INTERNAL_API_URL` to the URL the Next.js **server** uses to call the backend (can be internal, e.g. `http://localhost:4000/api` if both run on the same host).

3. **Process manager (recommended):** Use `pm2`, `systemd`, or your platform’s process manager to keep backend and frontend running and to restart on failure.

---

### Quick reference

| Mode | Backend | Frontend |
|------|---------|----------|
| **Dev (Docker)** | `docker compose --profile dev up` → :4000 | Same stack → :3000 |
| **Prod (Docker)** | `docker compose --profile prod up` → :4000 | Same stack → :3000 |
| **Dev (npm)** | `cd backend && npm run dev` → :4000 | `cd frontend && npm run dev` → :3000 |
| **Prod (npm)** | `cd backend && npm run build && npm start` | `cd frontend && npm run build && npm start` |

Use one `.env` at repo root for Docker; use `backend/.env` and `frontend/.env.local` (or `.env`) for npm runs. Keep `NEXTAUTH_SECRET` and auth-related URLs in sync between backend and frontend.

---

## Tech choices rationale

- **MongoDB**: Backed by MongoDB Atlas, easy to provision and scale, and works naturally with document-shaped data. It is a good fit for storing flexible generation payloads and large blobs such as base64-encoded images without complex schema migrations.
- **Socket.IO**: Simple, battle-tested WebSocket abstraction that interoperates well with this stack. It provides bi-directional, event-based communication between server and browser, which is ideal for live job status updates and streaming generation results.
- **shadcn/ui**: Component system that offers high-quality, accessible primitives with a modern design language. It accelerates UI development by providing ready-made React components that are easy to customize and keep the interface visually consistent.
- **OpenAI API**: Official SDK is straightforward to integrate and supports both text and image generation through a unified client. This allows us to implement multiple generation types and prompt enhancement with minimal boilerplate.
- **NextAuth**: High-level authentication library with built-in support for OAuth providers (e.g. Google) and credentials-based login. It handles sessions, tokens, and security concerns out of the box, reducing custom auth code and improving reliability.
- **Zustand**: Lightweight global state manager with a very small API surface. It is well suited for managing shared UI and real-time data (generations, gallery, history) without the complexity of heavier state management solutions.
- **Docker & Docker Compose**: Containerization makes it easy to run frontend and backend from a single repository with consistent configuration. Profiles for development and production simplify switching environments and ensure that collaborators can start the full stack with a single command.

---