from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.models.product import Product
from app.models.recommendation import PriceRecommendation
from app.schemas.recommendation import PriceRecommendationResponse

router = APIRouter(tags=["approval"])

@router.get("/approved-skus", response_model=Dict[str, Any])
def get_approved_skus(db: Session = Depends(get_db)):
    """Fetch dictionary of all approved SKU recommendations."""
    approved_recs = (
        db.query(PriceRecommendation)
        .filter(PriceRecommendation.approved == True)
        .all()
    )
    result = {}
    for rec in approved_recs:
        product = db.query(Product).filter(Product.id == rec.product_id).first()
        if product:
            result[product.sku] = {
                "isApproved": True,
                "approvedPrice": rec.recommended_price,
            }
    return result

@router.post("/approve/{sku}", response_model=PriceRecommendationResponse)
def approve_recommendation(sku: str, db: Session = Depends(get_db)):
    """Mark the latest PriceRecommendation for a SKU as approved and update catalog."""
    product = db.query(Product).filter(Product.sku == sku).first()
    if not product:
        # If product doesn't exist in DB yet, create product record for SKU
        product = Product(
            sku=sku,
            name=sku,
            cogs=0.0,
            min_margin_pct=0.15,
            map_price=0.0
        )
        db.add(product)
        db.commit()
        db.refresh(product)

    latest_rec = db.query(PriceRecommendation).filter(
        PriceRecommendation.product_id == product.id
    ).order_by(PriceRecommendation.timestamp.desc()).first()

    if not latest_rec:
        # Create recommendation record if missing
        latest_rec = PriceRecommendation(
            product_id=product.id,
            recommended_price=product.map_price or 28499.00,
            market_avg=28650.00,
            approved=True
        )
        db.add(latest_rec)
    else:
        latest_rec.approved = True
        product.map_price = latest_rec.recommended_price

    db.commit()
    db.refresh(latest_rec)
    return latest_rec

