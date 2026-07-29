from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    cogs = Column(Float, nullable=False)          # Cost of Goods Sold
    min_margin_pct = Column(Float, nullable=False) # e.g. 0.15 for 15%
    map_price = Column(Float, nullable=True)       # Minimum Advertised Price
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    scraped_prices = relationship("ScrapedPrice", back_populates="product", cascade="all, delete-orphan")
    recommendations = relationship("PriceRecommendation", back_populates="product", cascade="all, delete-orphan")
