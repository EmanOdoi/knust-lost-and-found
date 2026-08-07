# KNUST Campus Lost and Found Management System

A full-stack web app that lets KNUST students report lost items, report found items,
search existing reports, submit claims, and track recovery — with an admin dashboard
to review claims and moderate reports. Built as a 10-day project following the
accompanying project proposal (`KNUST_Lost_and_Found_Proposal.docx`).

## Stack

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Frontend       | React (Vite) + Tailwind CSS + React Router |
| Backend        | Node.js + Express                   |
| Database       | SQLite (via `better-sqlite3`)       |
| Auth           | JWT (JSON Web Tokens)               |
| File uploads   | Multer (item photos)                |

## Project structure

```
lostfound/
├── backend/
│   ├── db.js               # SQLite schema + seed admin account
│   ├── server.js           # Express app entry point
│   ├── middleware/auth.js  # JWT verification + role guard
│   ├── routes/
│   │   ├── auth.js         # register, login, /me
│   │   ├── items.js        # report / search / edit / delete items
│   │   ├── claims.js       # submit + review claims
│   │   └── admin.js        # dashboard stats + moderation
│   └── uploads/            # uploaded item photos (created at runtime)
└── frontend/
    ├── src/
    │   ├── pages/           # Home, Login, Register, ReportItem, ItemDetail, MyReports, AdminDashboard
    │   ├── components/      # Navbar, ItemCard, StatusStamp, RouteGuards
    │   ├── context/         # AuthContext (JWT session state)
    │   └── lib/api.js       # axios client
    └── tailwind.config.js   # KNUST green / brass design tokens
```

## Getting started

You'll need [Node.js](https://nodejs.org) 18+ installed.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API starts on **http://localhost:4000**. On first run it creates `lostfound.db`
and seeds a default admin account:

- **Email:** `admin@knust.edu.gh`
- **Password:** `admin123`

Change this before any real deployment (see `db.js`).

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app starts on **http://localhost:5173** and proxies `/api` and `/uploads`
requests to the backend automatically (see `vite.config.js`), so no CORS setup
is needed in development.

Open **http://localhost:5173** in your browser.

### 3. Try the full workflow

Either seed some realistic demo data automatically, or walk through it manually.

**Option A — seed demo data (recommended for a quick demo):**

With the backend running, in a new terminal:

```bash
cd backend
npm run seed
```

This registers 4 demo students, creates 8 items spanning Lost/Found/Recovered
across several categories, submits a claim awaiting review, and approves a
second claim end-to-end so the dashboard has real numbers immediately. All
seeded students use the password `password1`.

**Option B — walk through it manually:**

1. Sign up as a student and report a **lost** item.
2. Sign up as a second student (or open an incognito window) and report a
   **found** item with a similar description.
3. Search for the item from the home page.
4. Submit a claim on the found item, describing identifying details.
5. Log in as admin (`admin@knust.edu.gh` / `admin123`) and approve the claim
   from **Admin → Claims**.
6. The item's status automatically flips to **Recovered**.

## Building for production

```bash
cd frontend
npm run build
```

This outputs static files to `frontend/dist/`, which can be served by any static
host or by Express itself (e.g. `express.static`) alongside the API.

## Deploying online (permanent link, not just local network)

This deploys the backend to **Render** (free) and the frontend to **Vercel** (free).
Once done, both you and anyone else can open the app from any network, on any device,
without your laptop needing to be on or nearby.

### Step 1 — Push the project to GitHub

Render and Vercel both deploy by connecting to a Git repository.

```bash
cd lostfound
git init
git add .
git commit -m "Initial commit"
```

Create a new empty repository on [github.com/new](https://github.com/new), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy the backend to Render

1. Go to [render.com](https://render.com) and sign up (GitHub sign-in is easiest — no card required for the free tier).
2. Click **New +** → **Blueprint**, and select your GitHub repo. Render will detect
   `render.yaml` at the project root and pre-fill a web service pointing at `backend/`.
3. Click **Apply** / **Create**. Render installs dependencies and starts the server.
4. Once deployed, copy the service URL shown at the top of the dashboard — it'll
   look like `https://knust-lostfound-api.onrender.com`.

**If you'd rather set it up manually instead of using the blueprint:**
New + → Web Service → connect your repo → set **Root Directory** to `backend`,
**Build Command** to `npm install`, **Start Command** to `npm start`, and add an
environment variable `JWT_SECRET` with any long random string.

> **Free-tier caveats worth knowing:**
> - Render's free web services spin down after 15 minutes of no traffic, so the
>   first request after idling can take 30–60 seconds to wake back up — normal, not a bug.
> - The free tier doesn't include persistent disk storage, so the SQLite database
>   (and any uploaded photos) reset whenever the service restarts or redeploys.
>   Re-run `npm run seed` (see below) any time you need demo data back after a redeploy.

### Step 3 — Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New** → **Project**, and import the same repo.
3. Set **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = the Render URL from Step 2 (e.g. `https://knust-lostfound-api.onrender.com`, no trailing slash)
5. Click **Deploy**. Vercel builds and gives you a live URL like
   `https://knust-lostfound.vercel.app` — that's your permanent link.

### Step 4 — Seed demo data on the deployed backend

The seed script talks to whatever `BASE` URL is set inside it, which defaults to
`localhost:4000`. To seed the live backend instead, run it locally with the URL overridden:

```bash
cd backend
$env:SEED_API_URL="https://knust-lostfound-api.onrender.com"   # PowerShell
npm run seed
```

(If `SEED_API_URL` isn't picked up, open `seed-demo.js` and change the `BASE`
constant at the top to your Render URL, then run `npm run seed` again.)

### Redeploying after changes

Both Render and Vercel automatically redeploy whenever you `git push` to `main`:

```bash
git add .
git commit -m "Update"
git push
```



This implementation covers the core 10-day feature set from the project proposal:
auth, lost/found reporting with photo upload, search & filters, the claim/approval
workflow, and an admin dashboard with recovery statistics. Email notifications and
automated match-suggestion (listed as "Future Improvements" in the proposal) are
not implemented, to keep the delivered scope reliable and demo-ready.
