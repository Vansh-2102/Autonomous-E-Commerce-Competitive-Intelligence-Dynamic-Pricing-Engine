from datetime import datetime
from pydantic import BaseModel, ConfigDict

class PriceRecommendationResponse(BaseModel):
    id: int
    product_id: int
    recommended_price: float
    sentiment_score: float
    market_avg: float
    timestamp: datetime
    approved: bool

    model_config = ConfigDict(from_attributes=True)
