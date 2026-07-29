from typing import List, Literal
from pydantic import BaseModel

class CompetitorPriceItem(BaseModel):
    name: str
    price: float
    inStock: bool

class ChartDataItem(BaseModel):
    day: str
    ourPrice: float
    marketAvg: float

class PricingRecommendationCardProps(BaseModel):
    sku: str
    currentPrice: float
    recommendedPrice: float
    expectedMarginDelta: str
    competitorPrices: List[CompetitorPriceItem]
    chartData: List[ChartDataItem]

class PricingRecommendationCardSchema(BaseModel):
    component: Literal["PricingRecommendationCard"] = "PricingRecommendationCard"
    props: PricingRecommendationCardProps
