import json
import logging
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

REDIS_CHANNEL = "pricing_updates"

def publish_price_update(card: dict):
    """
    Publishes Generative UI JSON card to Redis Pub/Sub channel 'pricing_updates'.
    WebSockets subscribe to this channel and stream payloads directly to frontend clients.
    """
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        message = json.dumps(card)
        r.publish(REDIS_CHANNEL, message)
        logger.info(f"Published pricing card update for SKU {card.get('props', {}).get('sku')} to Redis channel '{REDIS_CHANNEL}'")
    except Exception as e:
        logger.error(f"Failed to publish pricing card update to Redis: {e}")
