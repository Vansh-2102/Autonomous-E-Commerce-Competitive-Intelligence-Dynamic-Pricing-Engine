from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class PriceRecommendation(Base):
    __tablename__ = "price_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    recommended_price = Column(Float, nullable=False)
    sentiment_score = Column(Float, default=0.0)
    market_avg = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    approved = Column(Boolean, default=False, nullable=False)

    product = relationship("Product", back_populates="recommendations")
