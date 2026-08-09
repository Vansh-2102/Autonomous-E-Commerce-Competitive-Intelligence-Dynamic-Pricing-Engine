# 🛍️ Autonomous E-Commerce Competitive Intelligence & Dynamic Pricing Engine

An enterprise-grade, real-time autonomous competitive intelligence and dynamic pricing engine powered by **Next.js 14 Generative UI**, **FastAPI**, **Firebase Authentication**, **Serper Live Web Scraping**, **Groq LLaMA 3 Sentiment Reasoning**, **ChromaDB Vector Matching**, **Celery Async Task Queues**, and **Deterministic Margin Guardrails**.

---

## ✨ Key Features

- **🔐 Dual Authentication Base Login**: Secure dashboard access supporting **Google OAuth Sign-In** and **Email & Password** login/signup via Firebase Auth, complete with Next.js middleware route guarding, profile avatars, and session cookies.
- **🌐 Live Web & E-Commerce Scraping**: Scrapes real-time live prices directly from Indian e-commerce marketplaces (**Amazon.in**, **Flipkart**, **Croma**, **Reliance Digital**, etc.) via Serper Google Shopping API and Playwright.
- **🎨 Real-Time Generative UI Dashboard**: Streams dynamic UI recommendation cards over WebSockets via Redis Pub/Sub directly to a Next.js 14 App Router dashboard with zero page reloads.
- **🔎 Dynamic SKU & Product Search**: Type ANY product name or SKU (e.g. `ASUS TUF Gaming F16`, `iPhone 15 Pro`, `Sony WH-1000XM5`), whether tracked in inventory or not, to trigger live web price discovery.
- **🛡️ Strict Non-Bypassable Margin Guardrails**: Guarantees zero negative margins and strict Minimum Advertised Price (MAP) compliance through deterministic pricing bounds:
  $$\text{Price Floor} = \max\left(\text{COGS} \times (1.0 + \text{Min Margin \%}),\ \text{MAP Price}\right)$$
- **💾 Persistent Price Approvals**: One-click price change approval workflow that updates recommendations, synchronizes catalog prices in MySQL, and persists approval states across browser refreshes via `localStorage` & backend APIs.
- **📤 CSV Catalog & Sourcing Import**: Upload wholesale purchase costs (**COGS**) and inventory catalog files via CSV with instant database synchronization.
- **🇮🇳 Indian Rupee (INR / ₹) Native Support**: Full locale-specific pricing formatting (`Intl.NumberFormat('en-IN')`) across all charts, tables, and notifications.

---

## 🏗️ Architecture Diagram

```mermaid
graph TD
    Auth["Firebase Auth (Google & Email/Pass)"]
    UI["Next.js 14 Dashboard"]
    API["FastAPI REST & WebSockets"]
    Orchestrator["Pricing Orchestrator Engine"]
    Serper["Serper Google Shopping API"]
    Groq["Groq LLaMA 3 AI Sentiment Agent"]
    MySQL[("MySQL Database")]
    Redis[("Redis Pub/Sub & Celery")]
    Chroma[("ChromaDB Vector Store")]

    Auth -->|Authenticate User| UI
    UI -->|1. Trigger Price Scan / Search SKU| API
    UI -->|2. Upload CSV Catalog & COGS| API
    API -->|3. Run Pricing Pipeline| Orchestrator
    Orchestrator -->|4. Live Web Price Scrape| Serper
    Orchestrator -->|5. Demand & Sentiment Analysis| Groq
    Orchestrator -->|6. Fetch Sourcing Cost & MAP| MySQL
    Orchestrator -->|7. Semantic Title Match| Chroma
    Orchestrator -->|8. Persist Price Recommendation| MySQL
    Orchestrator -->|9. Publish Card Event| Redis
    Redis -->|10. Stream Generative UI Card| UI
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Recharts, Framer Motion | Dynamic Generative UI Component Registry & WebSocket client |
| **Authentication** | Firebase Auth (Google OAuth & Email/Pass), js-cookie | Secure session management and Next.js middleware route protection |
| **Backend API** | FastAPI, Uvicorn, Python 3.11, Pydantic v2 | High-performance async REST API & WebSocket handlers |
| **Async Tasks** | Celery 5, Redis 7 | Scheduled cron scanning background tasks & Pub/Sub broker |
| **Database** | MySQL 8.0, SQLAlchemy ORM, Alembic | Relational database mapping products, prices, and audit logs |
| **Vector DB** | ChromaDB | Semantic vector embeddings for product SKU matching |
| **AI Agents** | Groq LLaMA 3 API | Natural language sentiment & market demand reasoning |
| **Web Scrapers** | Serper Shopping API & Playwright | Real-time live market price extraction |

---

## 🚀 Quickstart & Docker Deployment

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed & running on your machine.
- Git.

### 2. Clone the Repository
```bash
git clone https://github.com/Vansh-2102/Autonomous-E-Commerce-Competitive-Intelligence-Dynamic-Pricing-Engine.git
cd Autonomous-E-Commerce-Competitive-Intelligence-Dynamic-Pricing-Engine
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your API keys in `.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
SERPER_API_KEY=your_serper_api_key_here
```

### 4. Launch the Complete Containerized Stack
Run a single Docker Compose command from the project root:
```bash
docker compose up -d --build
```

---

## 🚢 Docker Container Port Summary

| Container Name | Local URL / Port | Description |
|---|---|---|
| **`pricing_frontend`** | `http://localhost:3000` | Next.js 14 Dashboard UI & Login |
| **`pricing_fastapi`** | `http://localhost:8000` | FastAPI REST Backend (Swagger Docs: `http://localhost:8000/docs`) |
| **`pricing_mysql`** | `localhost:3307` mapped to `3306` | MySQL 8.0 Relational Database |
| **`pricing_redis`** | `localhost:6379` | Redis Cache & Pub/Sub Broker |
| **`pricing_chroma`** | `localhost:8001` mapped to `8000` | ChromaDB Vector Store |
| **`pricing_celery_worker`**| Background Service | Asynchronous task execution engine |
| **`pricing_celery_beat`**  | Background Service | Recurring cron pricing cycle scheduler |

---

## 📡 API Reference & Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Returns list of all tracked catalog products & baseline prices |
| `POST` | `/api/products` | Registers a new product into the database catalog |
| `POST` | `/api/trigger/{sku}` | Triggers live web search & streams a Generative UI card for ANY SKU |
| `POST` | `/api/approve/{sku}` | Approves latest recommended price & updates active store selling price |
| `GET` | `/api/approved-skus` | Returns all previously approved SKU price recommendations |
| `POST` | `/api/upload-catalog` | Uploads a CSV catalog file containing SKUs and wholesale COGS costs |
| `WS` | `/ws/pricing-feed` | WebSocket connection streaming real-time Generative UI card payloads |

---

## 📤 CSV Catalog Import Format

You can upload catalog items and wholesale purchase costs (**COGS**) directly via the UI upload button or API using a `.csv` file:

```csv
sku,name,cogs,min_margin_pct,map_price
IPHONE-15-PRO,iPhone 15 Pro 128GB,105000,0.15,124900
ASUS-ROG-STRIX,ASUS ROG Strix G16,120000,0.12,139990
BOSE-QC45,Bose QuietComfort 45,22000,0.18,26900
```

---

## 🧮 Pricing Engine Guardrail Logic

```python
# Pure Deterministic Margin Calculation
market_avg = sum(live_competitor_prices) / len(live_competitor_prices)
demand_multiplier = 1.0 + (sentiment_score * 0.05)
target_price = market_avg * demand_multiplier

# Non-Bypassable Floor Enforcement
margin_floor = cogs * (1.0 + min_margin_pct)
guardrail_price_floor = max(margin_floor, map_price)

final_price = max(guardrail_price_floor, target_price)
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

![alt text](image.png)