# AssetTracker

A full-stack asset tracking application inspired by Itemit.

## Architecture

| Layer    | Stack                                      |
|----------|--------------------------------------------|
| Backend  | Python · FastAPI · SQLAlchemy · Alembic · Supabase (PostgreSQL) |
| Web      | Next.js 14 · TypeScript · Tailwind CSS · React Query |
| Mobile   | Expo SDK 51 · React Native · Expo Router   |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A [Supabase](https://supabase.com) project

---

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in your Supabase credentials and a SECRET_KEY

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### 2. Web (Next.js)

```bash
cd web

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start the dev server
npm run dev
```

Open: http://localhost:3000

---

### 3. Mobile (Expo)

```bash
cd mobile

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your backend URL
# For physical device use your machine's LAN IP, e.g. http://192.168.1.5:8000

# Start Expo
npm start
```

Scan the QR code with the Expo Go app, or press `a` for Android / `i` for iOS simulator.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (from Supabase) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `SECRET_KEY` | JWT signing secret (min 32 chars) |
| `ALGORITHM` | JWT algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL (default: 30) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

### Web (`web/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

### Mobile (`mobile/.env`)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |

---

## Database Migrations

```bash
cd backend

# Create a new migration after changing models
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

---

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/assets` | List assets (with search/filter) |
| POST | `/api/v1/assets` | Create asset (auto-generates QR code) |
| GET | `/api/v1/assets/{id}` | Get asset detail |
| PUT | `/api/v1/assets/{id}` | Update asset |
| DELETE | `/api/v1/assets/{id}` | Delete asset |
| GET | `/api/v1/assets/{id}/qrcode` | Download QR PNG |
| GET | `/api/v1/assets/scan/{qr_data}` | Look up asset by QR scan |
| GET/POST/PUT/DELETE | `/api/v1/categories` | Category CRUD |
| GET/POST/PUT/DELETE | `/api/v1/locations` | Location CRUD |
| GET/PUT | `/api/v1/users/me` | Current user profile |

---

## Project Structure

```
assetsapp/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # FastAPI route handlers
│   │   ├── core/              # Config, DB, security, deps
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   └── main.py            # App entry point
│   ├── alembic/               # Database migrations
│   ├── requirements.txt
│   └── .env.example
├── web/
│   └── src/
│       ├── app/               # Next.js App Router pages
│       ├── components/        # Reusable UI components
│       ├── hooks/             # React Query hooks
│       ├── lib/               # API client, auth helpers
│       └── types/             # TypeScript types
├── mobile/
│   ├── app/                   # Expo Router screens
│   └── src/
│       ├── components/        # React Native components
│       ├── hooks/             # React Query hooks
│       ├── lib/               # API client, auth helpers
│       └── types/             # TypeScript types
├── .gitignore
└── README.md
```
