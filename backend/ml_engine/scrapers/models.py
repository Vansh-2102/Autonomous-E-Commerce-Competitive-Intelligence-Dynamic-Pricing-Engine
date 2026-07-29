from typing import Optional, Literal
from pydantic import BaseModel, Field

class ScrapeResult(BaseModel):
    price: Optional[float] = Field(default=None, description="Extracted numerical product price")
    in_stock: Optional[bool] = Field(default=True, description="Stock availability status")
    promo_text: Optional[str] = Field(default=None, description="Active promotional badge text")
    extraction_method: Literal["selector", "vision_fallback", "failed"] = Field(
        default="selector", description="Extraction strategy utilized"
    )
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Extraction confidence score")
