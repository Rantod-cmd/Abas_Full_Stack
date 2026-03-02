# Abas Web — KasetFair Business Planning Platform

ระบบวางแผนธุรกิจสำหรับร้านค้าในงานเกษตรแฟร์ ประกอบด้วย 2 services หลัก:

- **web_kasetFair** — Next.js 16 frontend + BFF (port 3000)
- **ai_kasetFair** — FastAPI AI backend (port 8000)

```
Abas_Web/
├── docker-compose.yml
├── web_kasetFair/     # Next.js 16, Prisma, Supabase Auth
└── ai_kasetFair/      # FastAPI, OpenAI, Supabase
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker | 24+ |
| Docker Compose | v2+ |
| (Dev) Node.js | 20+ |
| (Dev) Python | 3.11+ |

---

## Quick Start (Docker)

```bash
# 1. Copy environment files
cp ai_kasetFair/.env.example  ai_kasetFair/.env
cp web_kasetFair/.env.example web_kasetFair/.env

# 2. Fill in secrets (see Environment Variables below)

# 3. Build & run
docker compose up --build
```

- Frontend: http://localhost:3000
- AI API docs: http://localhost:8000/docs

---

## Environment Variables

### `ai_kasetFair/.env`

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |

### `web_kasetFair/.env`

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | Base URL ของ app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret สำหรับ NextAuth |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `N8N_WEBHOOK_URL` | n8n webhook URL สำหรับ finance sheet |
| `PYTHON_AI_URL` | URL ของ AI service (Docker: `http://ai:8000/ai`) |
| `PYTHON_RAG_URL` | URL ของ RAG service (Docker: `http://ai:8000/rag`) |

> **หมายเหตุ:** `PYTHON_AI_URL` และ `PYTHON_RAG_URL` ถูก set ให้อัตโนมัติใน `docker-compose.yml` แล้ว ไม่ต้องระบุใน `.env` เมื่อรันผ่าน Docker

---

## Development (Local)

### AI Backend

```bash
cd ai_kasetFair
python -m venv venv && source venv/bin/activate
pip install -r requirement.txt
cp .env.example .env   # แก้ไข secrets
uvicorn main:app --reload
# http://127.0.0.1:8000/docs
```

### Web Frontend

```bash
cd web_kasetFair
npm install
cp .env.example .env   # แก้ไข secrets
npx prisma generate
npm run dev
# http://localhost:3000
```

---

## API Endpoints (AI Backend)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ai` | วิเคราะห์ร้านค้า + สร้าง financial plan |

**Request body (`POST /ai`):**

```json
{
  "name": "ร้านหมูปิ้ง",
  "theme": "street food",
  "concept": "อาหารไทยโบราณ",
  "location": "โซน A",
  "size": "3x3 m",
  "equipment": "เตาถ่าน, ตู้เย็น",
  "funding": "20000",
  "staff": "2",
  "hours": "09:00-20:00",
  "products": "หมูปิ้ง, ข้าวเหนียว",
  "store_id": "clxxx..."
}
```

**Response:**

```json
{
  "status": "success",
  "advice_markdown": "...",
  "assumptions_debug": { ... },
  "total_revenue": 45000,
  "net_profit": 12000,
  "breakeven_day": 3,
  "financial_csv": "..."
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts |
| Auth | NextAuth v4, Supabase Auth, Google OAuth |
| Database | PostgreSQL via Supabase, Prisma ORM |
| AI Backend | FastAPI, OpenAI API, Pandas, scikit-learn |
| Storage | Supabase Storage |
| Automation | n8n webhook |
| Container | Docker, Docker Compose |

---

## Useful Commands

```bash
# หยุด services
docker compose down

# ดู logs
docker compose logs -f web
docker compose logs -f ai

# Rebuild service เดียว
docker compose up --build web

# Prisma migrations (local dev)
cd web_kasetFair
npx prisma migrate dev
npx prisma studio
```
