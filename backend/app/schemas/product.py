from typing import Optional
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    sku: str
    name: str
    cogs: float
    min_margin_pct: float
    map_price: Optional[float] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
