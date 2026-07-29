import csv
import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.models.recommendation import PriceRecommendation
from app.schemas.product import ProductCreate, ProductResponse
from app.schemas.recommendation import PriceRecommendationResponse
from app.services.orchestrator import run_pricing_cycle

router = APIRouter(tags=["products"])

@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    """List all tracked catalog products."""
    return db.query(Product).all()

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """Add a new product to track in the competitive intelligence engine."""
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Product with SKU '{product_in.sku}' already exists."
        )
    
    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.post("/upload-catalog")
async def upload_catalog_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload CSV file containing catalog products and COGS costs."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")
    
    contents = await file.read()
    decoded = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    imported_count = 0
    for row in csv_reader:
        sku = row.get("sku", "").strip()
        name = row.get("name", "").strip()
        cogs_str = row.get("cogs", "0").strip()
        min_margin_str = row.get("min_margin_pct", "0.15").strip()
        map_price_str = row.get("map_price", "0").strip()

        if not sku or not name:
            continue

        cogs = float(cogs_str) if cogs_str else 0.0
        min_margin = float(min_margin_str) if min_margin_str else 0.15
        map_price = float(map_price_str) if map_price_str else cogs * 1.10

        existing = db.query(Product).filter(Product.sku == sku).first()
        if existing:
            existing.name = name
            existing.cogs = cogs
            existing.min_margin_pct = min_margin
            existing.map_price = map_price
        else:
            new_prod = Product(
                sku=sku,
                name=name,
                cogs=cogs,
                min_margin_pct=min_margin,
                map_price=map_price
            )
            db.add(new_prod)
        imported_count += 1

    db.commit()
    return {"status": "success", "imported_count": imported_count}

@router.get("/products/{sku}/recommendations", response_model=List[PriceRecommendationResponse])
def get_product_recommendations(sku: str, db: Session = Depends(get_db)):
    """Fetch recommendation history for a given SKU."""
    product = db.query(Product).filter(Product.sku == sku).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with SKU '{sku}' not found")
    
    return db.query(PriceRecommendation).filter(
        PriceRecommendation.product_id == product.id
    ).order_by(PriceRecommendation.timestamp.desc()).all()

@router.post("/trigger/{sku}")
def trigger_pricing_scan(sku: str):
    """On-demand trigger for scanning and generating a pricing recommendation card for ANY product or SKU."""
    result = run_pricing_cycle(sku)
    return result
