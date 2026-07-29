import re
import logging
from typing import Optional, Dict
from bs4 import BeautifulSoup
from ml_engine.scrapers.models import ScrapeResult

logger = logging.getLogger(__name__)

# Default CSS selector map per competitor
DEFAULT_COMPETITOR_SELECTORS: Dict[str, Dict[str, str]] = {
    "amazon": {
        "price": ".a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice",
        "in_stock": "#availability .a-color-success, #availability .a-color-price",
        "promo": "#regularprice_savings, .savingsPercentage",
    },
    "bestbuy": {
        "price": ".priceView-hero-price span, .pricing-price__regular-price",
        "in_stock": ".fulfillment-add-to-cart-button button",
        "promo": ".pricing-price__savings",
    },
    "bhphoto": {
        "price": "[data-selenium='pricingPrice']",
        "in_stock": "[data-selenium='stockStatus']",
        "promo": "[data-selenium='promoSavings']",
    },
    "default": {
        "price": ".price, #price, [data-price], .product-price",
        "in_stock": ".in-stock, #availability, .stock-status",
        "promo": ".badge, .promo, .discount",
    }
}

class SelectorScraper:
    def __init__(self, competitor_selectors: Optional[Dict[str, Dict[str, str]]] = None):
        self.selectors = competitor_selectors or DEFAULT_COMPETITOR_SELECTORS

    def extract_from_html(self, html_content: str, competitor_name: str = "default") -> ScrapeResult:
        """
        Parses raw HTML content using BeautifulSoup and per-competitor CSS selector maps.
        Returns ScrapeResult with None fields if selector fails, so fallback vision scraper can trigger.
        """
        soup = BeautifulSoup(html_content, "html.parser")
        comp_key = competitor_name.lower()
        sel = self.selectors.get(comp_key, self.selectors["default"])

        # 1. Price extraction
        price: Optional[float] = None
        price_elem = soup.select_one(sel["price"])
        if price_elem:
            raw_text = price_elem.get_text(strip=True)
            # Find dollar amount with optional decimals
            match = re.search(r"\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)", raw_text)
            if match:
                clean_num = match.group(1).replace(",", "")
                try:
                    price = float(clean_num)
                except ValueError:
                    price = None

        # 2. Stock extraction
        in_stock: Optional[bool] = None
        stock_elem = soup.select_one(sel["in_stock"])
        if stock_elem:
            stock_text = stock_elem.get_text(strip=True).lower()
            if any(term in stock_text for term in ["out of stock", "sold out", "currently unavailable"]):
                in_stock = False
            elif any(term in stock_text for term in ["in stock", "add to cart", "available"]):
                in_stock = True

        # 3. Promo text extraction
        promo_text: Optional[str] = None
        promo_elem = soup.select_one(sel["promo"])
        if promo_elem:
            promo_text = promo_elem.get_text(strip=True)

        return ScrapeResult(
            price=price,
            in_stock=in_stock if in_stock is not None else True,
            promo_text=promo_text,
            extraction_method="selector",
            confidence=1.0 if price is not None else 0.0
        )
