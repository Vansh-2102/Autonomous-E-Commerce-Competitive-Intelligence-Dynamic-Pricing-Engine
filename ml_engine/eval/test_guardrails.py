import random
import pytest
from ml_engine.pricing.pricing_calculator import MarginConfig, calculate_optimal_price
from ml_engine.scrapers.vision_scraper import VisionFallbackScraper
from ml_engine.sentiment.sentiment_agent import SentimentAgent

def test_pricing_calculator_100_randomized_floor_guardrails():
    """
    Step 3.6 Test 1: Verify calculate_optimal_price NEVER returns below floor_price across 100 randomized input combinations.
    """
    random.seed(42)
    for _ in range(100):
        cogs = round(random.uniform(10.0, 2000.0), 2)
        min_margin_pct = round(random.uniform(0.05, 0.40), 2)
        map_price = round(random.uniform(cogs, cogs * 2.0), 2) if random.choice([True, False]) else None
        
        margin_floor = cogs * (1.0 + min_margin_pct)
        expected_floor = max(margin_floor, map_price) if map_price else margin_floor

        market_avg = round(random.uniform(5.0, 3000.0), 2)
        sentiment_score = round(random.uniform(-2.0, 2.0), 2) # Include extreme sentiment values

        final_price = calculate_optimal_price(
            config=MarginConfig(cogs=cogs, min_margin_pct=min_margin_pct, map_price=map_price),
            market_avg=market_avg,
            sentiment_score=sentiment_score
        )

        assert final_price >= round(expected_floor, 2) - 0.01, (
            f"FLOOR PRICE VIOLATION! final_price={final_price} < floor={expected_floor} "
            f"for COGS={cogs}, margin={min_margin_pct}, map={map_price}, mkt={market_avg}, sent={sentiment_score}"
        )

def test_vision_llm_fallback_schema_validity():
    """
    Step 3.6 Test 2: Vision-LLM fallback returns schema-valid result for a batch of sample inputs.
    """
    scraper = VisionFallbackScraper()
    test_titles = [
        "Sony WH-1000XM5 Wireless Headphones $399.99",
        "Dell XPS 15 Intel i9 Laptop Sale $1599",
        "Generic Product Without Numbers",
        "",
    ]
    for title in test_titles:
        result = scraper.extract_from_screenshot(b"fake_image_bytes", page_title=title)
        assert result.extraction_method in ["vision_fallback", "failed"]
        assert 0.0 <= result.confidence <= 1.0
        if result.price is not None:
            assert result.price > 0.0

def test_sentiment_agent_bounds_and_empty_inputs():
    """
    Step 3.6 Test 3: Sentiment agent returns score in [-1.0, 1.0] and handles empty search results gracefully.
    """
    agent = SentimentAgent(redis_client=None)
    
    res1 = agent.get_product_sentiment("Sony WH-1000XM5")
    assert -1.0 <= res1.score <= 1.0
    assert res1.sample_size >= 0

    res_empty = agent.get_product_sentiment("")
    assert -1.0 <= res_empty.score <= 1.0
    assert isinstance(res_empty.summary, str)
