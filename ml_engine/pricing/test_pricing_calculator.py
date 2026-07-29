import pytest
from ml_engine.pricing.pricing_calculator import (
    MarginConfig,
    calculate_optimal_price,
    calculate_optimal_price_detailed
)

def test_normal_case():
    # COGS $100, min margin 20% ($120 floor), MAP $110. Market avg $150, sentiment +0.5 (+2.5% demand) -> $153.75
    config = MarginConfig(cogs=100.0, min_margin_pct=0.20, map_price=110.0)
    price = calculate_optimal_price(config, market_avg=150.0, sentiment_score=0.5)
    assert price == 153.75

def test_negative_sentiment():
    # Market avg $100, sentiment -0.8 (-4% demand) -> $96.00. Floor is COGS $80 + 10% = $88.0.
    config = MarginConfig(cogs=80.0, min_margin_pct=0.10, map_price=85.0)
    price = calculate_optimal_price(config, market_avg=100.0, sentiment_score=-0.8)
    assert price == 96.00

def test_forced_floor():
    # Market avg $50 (very low competitor crash). COGS $100, min margin 15% ($115 floor), MAP $120.
    # Target would be ~$50, but floor is max($115, $120) = $120.00.
    config = MarginConfig(cogs=100.0, min_margin_pct=0.15, map_price=120.0)
    result = calculate_optimal_price_detailed(config, market_avg=50.0, sentiment_score=-0.5)
    assert result.final_price == 120.00
    assert result.is_floor_enforced is True

def test_missing_map():
    # MAP is None. COGS $200, min margin 25% ($250 floor). Market avg $300, sentiment 0.0 -> $300.00.
    config = MarginConfig(cogs=200.0, min_margin_pct=0.25, map_price=None)
    price = calculate_optimal_price(config, market_avg=300.0, sentiment_score=0.0)
    assert price == 300.00
    assert calculate_optimal_price(config, market_avg=200.0, sentiment_score=-1.0) == 250.00
