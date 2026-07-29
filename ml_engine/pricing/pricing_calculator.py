from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class MarginConfig(BaseModel):
    cogs: float = Field(..., gt=0, description="Cost of Goods Sold")
    min_margin_pct: float = Field(..., ge=0.0, description="Minimum required margin percentage e.g. 0.15 for 15%")
    map_price: Optional[float] = Field(default=None, description="Minimum Advertised Price (MAP)")

class PricingCalculationResult(BaseModel):
    floor_price: float
    demand_multiplier: float
    calculated_target: float
    final_price: float
    is_floor_enforced: bool
    justification: str

def calculate_optimal_price(
    config: MarginConfig,
    market_avg: float,
    sentiment_score: float
) -> float:
    """
    Pure deterministic pricing engine with strict mathematical margin guardrails.
    No LLM call can bypass or override floor_price.
    """
    # 1. Calculate absolute non-negotiable floor price
    margin_floor = config.cogs * (1.0 + config.min_margin_pct)
    if config.map_price is not None:
        floor_price = max(margin_floor, config.map_price)
    else:
        floor_price = margin_floor

    # 2. Compute demand multiplier based on sentiment score in range [-1.0, 1.0]
    clamped_sentiment = max(-1.0, min(1.0, sentiment_score))
    demand_multiplier = 1.0 + (clamped_sentiment * 0.05)

    # 3. Calculate target price from market average
    calculated_target = market_avg * demand_multiplier

    # 4. Enforce floor price safety constraint
    final_price = max(floor_price, calculated_target)

    return round(final_price, 2)

def calculate_optimal_price_detailed(
    config: MarginConfig,
    market_avg: float,
    sentiment_score: float
) -> PricingCalculationResult:
    """
    Detailed pricing calculator returning calculation breakdown and human-readable explanation tool wrapper.
    """
    margin_floor = config.cogs * (1.0 + config.min_margin_pct)
    if config.map_price is not None:
        floor_price = max(margin_floor, config.map_price)
    else:
        floor_price = margin_floor

    clamped_sentiment = max(-1.0, min(1.0, sentiment_score))
    demand_multiplier = 1.0 + (clamped_sentiment * 0.05)
    calculated_target = market_avg * demand_multiplier
    
    is_floor_enforced = calculated_target < floor_price
    final_price = round(max(floor_price, calculated_target), 2)

    # Generate transparent justification text
    if is_floor_enforced:
        justification = (
            f"Calculated target of ₹{calculated_target:.2f} was below mandatory floor. "
            f"Enforced guardrail floor price of ₹{final_price:.2f} (COGS ₹{config.cogs:.2f} + {config.min_margin_pct*100:.1f}% margin / MAP ₹{config.map_price or 0:.2f})."
        )
    else:
        justification = (
            f"Recommended price of ₹{final_price:.2f} calculated from market average ₹{market_avg:.2f} "
            f"with demand multiplier {demand_multiplier:.4f} (sentiment: {clamped_sentiment:+.2f})."
        )

    return PricingCalculationResult(
        floor_price=round(floor_price, 2),
        demand_multiplier=round(demand_multiplier, 4),
        calculated_target=round(calculated_target, 2),
        final_price=final_price,
        is_floor_enforced=is_floor_enforced,
        justification=justification
    )
