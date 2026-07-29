import logging
from app.workers.celery_app import celery_app
from app.services.orchestrator import run_pricing_cycle
from app.core.database import SessionLocal
from app.models.product import Product

logger = logging.getLogger(__name__)

@celery_app.task(name="app.workers.tasks.scan_product")
def scan_product(sku: str):
    """
    Celery task wrapper scanning competitor prices, sentiment, and generating dynamic pricing recommendations for a specific SKU.
    """
    logger.info(f"[Celery Worker] Starting automated scan task for SKU: {sku}")
    result = run_pricing_cycle(sku)
    logger.info(f"[Celery Worker] Completed scan for SKU {sku}. Result status: {result.get('status')}")
    return result

@celery_app.task(name="app.workers.tasks.scan_all_products")
def scan_all_products():
    """
    Celery Beat scheduled task executing scan_product for all registered catalog items.
    """
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        logger.info(f"[Celery Beat] Dispatching scan_product tasks for {len(products)} active products.")
        for p in products:
            scan_product.delay(p.sku)
        return {"status": "success", "count": len(products)}
    finally:
        db.close()
