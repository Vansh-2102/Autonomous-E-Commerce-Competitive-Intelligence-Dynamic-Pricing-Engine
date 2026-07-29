from sqlalchemy import Column, Integer, Float, Boolean, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class ScrapedPrice(Base):
    __tablename__ = "scraped_prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    competitor_id = Column(Integer, ForeignKey("competitors.id"), nullable=False)
    price = Column(Float, nullable=False)
    in_stock = Column(Boolean, default=True, nullable=False)
    promo_flag = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="scraped_prices")
    competitor = relationship("Competitor", back_populates="scraped_prices")
