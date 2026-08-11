import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.endpoints import products, approve, websocket, chatbot

import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database tables with retry logic
def init_db(max_retries=10, delay=3):
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to database (attempt {attempt}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables initialized successfully.")

            # Auto-seed sample catalog if database is empty
            try:
                from seed import seed_db
                from app.core.database import SessionLocal
                from app.models.product import Product
                db = SessionLocal()
                if db.query(Product).count() == 0:
                    logger.info("Empty database detected. Seeding sample catalog data...")
                    seed_db()
                db.close()
            except Exception as se:
                logger.warning(f"Auto-seed check skipped: {se}")

            return
        except Exception as e:
            if attempt == max_retries:
                logger.error(f"Failed to connect to database after {max_retries} attempts.")
                raise e
            logger.warning(f"Database connection failed: {e}. Retrying in {delay} seconds...")
            time.sleep(delay)

init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Autonomous E-Commerce Competitive Intelligence & Dynamic Pricing Engine API",
    version="1.0.0",
)

# CORS middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(approve.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router)
app.include_router(chatbot.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "ws_feed": "/ws/pricing-feed"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
