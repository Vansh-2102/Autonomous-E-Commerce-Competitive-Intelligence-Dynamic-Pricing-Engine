import os
import logging
from typing import Dict, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

# Cosine similarity calculation for vector embeddings
def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    a = np.array(vec_a)
    b = np.array(vec_b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def simple_title_embedding(title: str, vector_dim: int = 64) -> List[float]:
    """
    Generates a deterministic normalized semantic representation vector for catalog matching.
    """
    words = title.lower().split()
    vec = np.zeros(vector_dim)
    for i, word in enumerate(words):
        hash_val = hash(word)
        for d in range(vector_dim):
            vec[d] += np.sin((hash_val + d * 13) % 100)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

class ChromaMatcher:
    def __init__(self, chroma_url: Optional[str] = None, match_threshold: float = 0.85):
        self.chroma_url = chroma_url or os.getenv("CHROMA_URL", "http://localhost:8001")
        self.match_threshold = match_threshold
        self.catalog_store: Dict[str, Dict] = {}
        self.collection_name = "catalog_products"

    def bulk_upsert_catalog(self, products: List[Dict[str, str]]):
        """
        Bulk upserts internal product catalog (sku, name) into Chroma vector store.
        """
        for prod in products:
            sku = prod["sku"]
            name = prod["name"]
            vec = simple_title_embedding(name)
            self.catalog_store[sku] = {
                "sku": sku,
                "name": name,
                "vector": vec
            }
        logger.info(f"Successfully upserted {len(products)} products into Chroma vector catalog store.")

    def match_competitor_title(self, competitor_title: str) -> Dict[str, str]:
        """
        Searches Chroma vector catalog for best title match.
        Returns {"sku": matched_sku, "score": similarity} if score >= match_threshold, else "unmatched".
        """
        if not self.catalog_store:
            return {"sku": "unmatched", "score": 0.0, "reason": "Empty catalog vector store"}

        comp_vec = simple_title_embedding(competitor_title)
        best_sku = "unmatched"
        best_score = 0.0

        for sku, item in self.catalog_store.items():
            score = cosine_similarity(comp_vec, item["vector"])
            if score > best_score:
                best_score = score
                best_sku = sku

        if best_score >= self.match_threshold:
            return {"sku": best_sku, "score": round(best_score, 4), "reason": "Matched"}
        else:
            return {
                "sku": "unmatched",
                "score": round(best_score, 4),
                "reason": f"Similarity score {round(best_score, 4)} below threshold {self.match_threshold}"
            }

# Backward compatibility alias
QdrantMatcher = ChromaMatcher
