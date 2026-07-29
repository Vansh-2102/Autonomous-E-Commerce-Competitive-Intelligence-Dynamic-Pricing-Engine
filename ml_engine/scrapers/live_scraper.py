import os
import re
import logging
import httpx
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class LiveMarketScraper:
    def __init__(self, serper_api_key: str = None):
        self.serper_api_key = serper_api_key or os.getenv("SERPER_API_KEY", "7058df552634d2e3129078e4fe79a9f355fad612")

    def fetch_live_market_prices(self, product_name: str) -> List[Dict[str, Any]]:
        """
        Fetches live real-time price data from Google Shopping / Serper API
        for live competitors in India (Amazon India, Flipkart, Croma, Reliance Digital, etc.)
        """
        if not self.serper_api_key:
            logger.warning("SERPER_API_KEY not set. Cannot fetch live web search results.")
            return []

        try:
            url = "https://google.serper.dev/shopping"
            headers = {
                "X-API-KEY": self.serper_api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "q": f"{product_name} buy online price India",
                "gl": "in"
            }
            
            with httpx.Client(timeout=10.0) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Serper API failed with status {response.status_code}")
                    return []
                
                data = response.json()
                shopping_items = data.get("shopping", [])
                
                results = []
                for item in shopping_items:
                    source = item.get("source", "Marketplace")
                    raw_price = item.get("price", "")
                    clean_price = re.sub(r"[^\d.]", "", raw_price.replace(",", ""))
                    if clean_price:
                        try:
                            price_val = float(clean_price)
                            results.append({
                                "name": source,
                                "price": price_val,
                                "inStock": True
                            })
                        except ValueError:
                            continue
                return results
        except Exception as e:
            logger.error(f"Error fetching live market prices: {e}")
            return []
