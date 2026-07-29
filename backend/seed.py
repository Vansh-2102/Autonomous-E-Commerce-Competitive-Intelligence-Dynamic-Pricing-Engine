from app.core.database import engine, SessionLocal, Base
from app.models.product import Product
from app.models.competitor import Competitor
from app.models.scraped_price import ScrapedPrice
from app.models.recommendation import PriceRecommendation

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Product).count() > 0:
            print("Database already contains product data. Re-seeding with INR values...")
            db.query(PriceRecommendation).delete()
            db.query(ScrapedPrice).delete()
            db.query(Product).delete()
            db.query(Competitor).delete()
            db.commit()

        print("Seeding database with sample products and competitors in INR...")

        # 1. Competitors
        competitors_data = [
            {"name": "Amazon India", "base_url": "https://www.amazon.in"},
            {"name": "Flipkart", "base_url": "https://www.flipkart.com"},
            {"name": "Reliance Digital", "base_url": "https://www.reliancedigital.in"},
            {"name": "Croma", "base_url": "https://www.croma.com"},
        ]
        competitors = []
        for c in competitors_data:
            comp = Competitor(**c)
            db.add(comp)
            competitors.append(comp)
        db.commit()

        # 2. Products (Values in INR ₹)
        products_data = [
            {
                "sku": "SONY-WH1000XM5",
                "name": "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
                "cogs": 20000.00,
                "min_margin_pct": 0.15,
                "map_price": 24999.00,
            },
            {
                "sku": "DELL-XPS15",
                "name": "Dell XPS 15 Intel Core i9 Laptop",
                "cogs": 110000.00,
                "min_margin_pct": 0.12,
                "map_price": 129990.00,
            },
            {
                "sku": "MACBOOK-AIR-M3",
                "name": "Apple MacBook Air 15-inch M3 Chip",
                "cogs": 90000.00,
                "min_margin_pct": 0.10,
                "map_price": 104900.00,
            },
            {
                "sku": "LOGI-MXMASTER3S",
                "name": "Logitech MX Master 3S Performance Wireless Mouse",
                "cogs": 4500.00,
                "min_margin_pct": 0.20,
                "map_price": 7995.00,
            },
            {
                "sku": "SAMSUNG-ODYSSEY-G9",
                "name": "Samsung Odyssey G9 49-inch Curved Gaming Monitor",
                "cogs": 75000.00,
                "min_margin_pct": 0.15,
                "map_price": 94990.00,
            },
        ]

        products = []
        for p in products_data:
            prod = Product(**p)
            db.add(prod)
            products.append(prod)
        db.commit()

        # 3. Seed initial scraped prices & recommendations in INR
        sample_scrapes = [
            {"product_id": products[0].id, "competitor_id": competitors[0].id, "price": 28990.00, "in_stock": True, "promo_flag": None},
            {"product_id": products[0].id, "competitor_id": competitors[1].id, "price": 29490.00, "in_stock": True, "promo_flag": "Festive Offer"},
            {"product_id": products[0].id, "competitor_id": competitors[2].id, "price": 29990.00, "in_stock": False, "promo_flag": None},
            
            {"product_id": products[1].id, "competitor_id": competitors[0].id, "price": 142990.00, "in_stock": True, "promo_flag": None},
            {"product_id": products[1].id, "competitor_id": competitors[3].id, "price": 144990.00, "in_stock": True, "promo_flag": "Save ₹5,000"},
            
            {"product_id": products[2].id, "competitor_id": competitors[0].id, "price": 114900.00, "in_stock": True, "promo_flag": None},
            {"product_id": products[2].id, "competitor_id": competitors[1].id, "price": 112990.00, "in_stock": True, "promo_flag": None},
            
            {"product_id": products[3].id, "competitor_id": competitors[0].id, "price": 8495.00, "in_stock": True, "promo_flag": None},
            {"product_id": products[3].id, "competitor_id": competitors[3].id, "price": 8990.00, "in_stock": True, "promo_flag": None},
            
            {"product_id": products[4].id, "competitor_id": competitors[0].id, "price": 104990.00, "in_stock": True, "promo_flag": None},
            {"product_id": products[4].id, "competitor_id": competitors[2].id, "price": 109900.00, "in_stock": False, "promo_flag": None},
        ]
        for sp in sample_scrapes:
            db.add(ScrapedPrice(**sp))
        db.commit()

        # Seed initial recommendations in INR
        sample_recs = [
            {"product_id": products[0].id, "recommended_price": 28499.00, "sentiment_score": 0.45, "market_avg": 29490.00, "approved": False},
            {"product_id": products[1].id, "recommended_price": 139990.00, "sentiment_score": 0.20, "market_avg": 143990.00, "approved": False},
            {"product_id": products[2].id, "recommended_price": 111990.00, "sentiment_score": 0.60, "market_avg": 113945.00, "approved": False},
            {"product_id": products[3].id, "recommended_price": 8250.00, "sentiment_score": 0.10, "market_avg": 8742.50, "approved": False},
            {"product_id": products[4].id, "recommended_price": 102990.00, "sentiment_score": 0.35, "market_avg": 107445.00, "approved": False},
        ]
        for rec in sample_recs:
            db.add(PriceRecommendation(**rec))
        db.commit()

        print("Database successfully seeded with 5 sample products, competitors, scraped prices, and initial recommendations in INR!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
