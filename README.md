# Autonomous E-Commerce Competitive Intelligence & Dynamic Pricing Engine

An end-to-end autonomous competitive intelligence and dynamic pricing engine featuring a real-time Next.js 14 Generative UI dashboard, FastAPI streaming backend, Celery task queue, ChromaDB vector catalog matcher, multi-modal scraping engine (Playwright + Vision LLM fallback), Groq LLM sentiment agent, and deterministic pricing margin floor guardrails.

---

## 🏗️ Architecture Stack

- **Frontend Container**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Framer Motion, WebSockets, Dynamic Component Registry (Generative UI).
- **Backend Container**: FastAPI, SQLAlchemy, Alembic, Celery, Redis Pub/Sub, WebSockets, MySQL.
- **ML Engine & Agents**: Playwright multi-modal scraper, Vision-LLM fallback parser, ChromaDB semantic title matcher, Groq LLM sentiment agent, Deterministic margin floor pricing engine, DeepEval guardrail test suite.

---

## ⚡ How to Run the Complete Stack with Docker

Run this **single command** from the project root:

```bash
docker-compose up -d --build
```

### 🚢 Docker Container Port Summary:
| Service | URL / Port | Description |
|---|---|---|
| **Frontend Dashboard** | `http://localhost:3000/dashboard` | Next.js 14 Generative UI Dashboard |
| **FastAPI Backend** | `http://localhost:8000` | REST API & WebSockets (Docs: `/docs`) |
| **MySQL Database** | `localhost:3306` | Relational Database |
| **Redis Cache** | `localhost:6379` | Cache & Pub/Sub Stream Broker |
| **ChromaDB Vector Store**| `localhost:8001` | Semantic Product Matcher Vector DB |
| **Celery Worker & Beat**| Background | Scheduled Background Scanning Tasks |

---

## 🎯 Dashboard Interaction & Testing

1. Open **`http://localhost:3000/dashboard`** in your browser.
2. Click any of the SKU test buttons (`SONY-WH1000XM5`, `DELL-XPS15`, `MACBOOK-AIR-M3`) at the top of the dashboard to trigger an on-demand pricing cycle and watch the Generative UI card update in real-time.
3. Click **"Approve Price Change"** on any card to issue a `POST /api/approve/{sku}` call.
