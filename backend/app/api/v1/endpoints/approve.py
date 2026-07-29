from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.models.recommendation import PriceRecommendation
from app.schemas.recommendation import PriceRecommendationResponse

router = APIRouter(tags=["approval"])

@router.post("/approve/{sku}", response_model=PriceRecommendationResponse)
def approve_recommendation(sku: str, db: Session = Depends(get_db)):
    """Mark the latest PriceRecommendation for a SKU as approved."""
    product = db.query(Product).filter(Product.sku == sku).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with SKU '{sku}' not found")

    latest_rec = db.query(PriceRecommendation).filter(
        PriceRecommendation.product_id == product.id
    ).order_by(PriceRecommendation.timestamp.desc()).first()

    if not latest_rec:
        raise HTTPException(status_code=404, detail=f"No price recommendation found for SKU '{sku}'")

    latest_rec.approved = True
    db.commit()
    db.refresh(latest_rec)
    return latest_rec
