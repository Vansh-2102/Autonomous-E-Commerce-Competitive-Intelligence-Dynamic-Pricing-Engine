# pyrefly: ignore [missing-import]
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "pricing_engine_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "scan-all-catalog-products-every-15m": {
            "task": "app.workers.tasks.scan_all_products",
            "schedule": 900.0, # every 15 minutes
        },
    }
)
