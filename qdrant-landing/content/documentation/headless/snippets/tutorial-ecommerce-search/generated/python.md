```python
#!/usr/bin/env -S uv run --script
#
# /// script
# requires-python = ">=3.12"
# dependencies = ["qdrant-client==1.20.0", "fastembed==0.8.0", "pandas==2.3.3", "huggingface-hub==1.33.0", "httpx==0.28.1", "ipython>=8"]
# ///

# Query blocks mirror the companion ecommerce-search notebook.
import atexit
import asyncio
import hashlib
import platform
import shutil
import socket
import subprocess
import tarfile
import tempfile
from pathlib import Path
import httpx
from qdrant_client import AsyncQdrantClient, models
import io
from typing import NotRequired, TypedDict
import pandas as pd  # type: ignore[import-untyped]
from fastembed import TextEmbedding
from huggingface_hub import snapshot_download
import math

async def main() -> None:

    SHOPPER_LOCATION = models.GeoPoint(lat=52.2297, lon=21.0122)
    CANDIDATE_LIMIT = len(products)
    TOP_K = 5
    EXACT = models.SearchParams(exact=True)

    baseline = (
        await client.query_points(
            collection_name=COLLECTION,
            query=query_vector,
            search_params=EXACT,
            limit=CANDIDATE_LIMIT,
            with_payload=True,
        )
    ).points
    semantic_scores = {point.id: point.score for point in baseline}
    print(show_hits(baseline[:TOP_K]))
    for point in baseline[:2]:
        assert point.payload is not None
        print(name_of(point), "| WANDS:", label_by_id[point.id])
        print(point.payload["product_description"], "\n")

    MAX_DISTANCE_M = 15_000.0

    def make_eligibility_filter(origin: models.GeoPoint) -> models.Filter:
        return models.Filter(
            must=[
                models.FieldCondition(
                    key="in_stock", match=models.MatchValue(value=True)
                ),
                models.FieldCondition(
                    key="pickup_location",
                    geo_radius=models.GeoRadius(center=origin, radius=MAX_DISTANCE_M),
                ),
            ]
        )

    eligibility_filter = make_eligibility_filter(SHOPPER_LOCATION)
    filtered = (
        await client.query_points(
            collection_name=COLLECTION,
            query=query_vector,
            query_filter=eligibility_filter,
            search_params=EXACT,
            limit=CANDIDATE_LIMIT,
            with_payload=True,
        )
    ).points
    print(show_hits(filtered[:TOP_K]))
    print(f"Eligible candidates: {len(filtered)} / {len(products)}")
    assert all(isinstance(point.id, int) and point.id % 37 != 0 for point in filtered)

    RETURNS_WEIGHT = 0.08
    returns_condition = models.FieldCondition(
        key="free_returns", match=models.MatchValue(value=True)
    )
    returns_bonus = models.MultExpression(mult=[RETURNS_WEIGHT, returns_condition])

    returns_boost = (
        await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector,
                filter=eligibility_filter,
                params=EXACT,
                limit=CANDIDATE_LIMIT,
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(sum=["$score", returns_bonus])
            ),
            limit=TOP_K,
            with_payload=True,
        )
    ).points
    print(show_hits(returns_boost))

    GEO_WEIGHT = 0.15
    DISTANCE_SCALE_M = 5_000.0

    def make_proximity(origin: models.GeoPoint) -> models.GaussDecayExpression:
        return models.GaussDecayExpression(
            gauss_decay=models.DecayParamsExpression(
                x=models.GeoDistance(
                    geo_distance=models.GeoDistanceParams(
                        origin=origin, to="pickup_location"
                    )
                ),
                target=0.0,
                scale=DISTANCE_SCALE_M,
                midpoint=0.5,
            )
        )

    proximity = make_proximity(SHOPPER_LOCATION)
    proximity_boost = (
        await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector,
                filter=eligibility_filter,
                params=EXACT,
                limit=CANDIDATE_LIMIT,
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(
                    sum=[
                        "$score",
                        models.MultExpression(mult=[GEO_WEIGHT, proximity]),
                    ]
                )
            ),
            limit=TOP_K,
            with_payload=True,
        )
    ).points
    print(show_hits(proximity_boost))

    async def rank_products(
        origin: models.GeoPoint = SHOPPER_LOCATION,
        returns_weight: float = RETURNS_WEIGHT,
        geo_weight: float = GEO_WEIGHT,
        candidate_limit: int = CANDIDATE_LIMIT,
        limit: int = TOP_K,
    ) -> list[models.ScoredPoint]:
        response = await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector,
                filter=make_eligibility_filter(origin),
                params=EXACT,
                limit=candidate_limit,
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(
                    sum=[
                        "$score",
                        models.MultExpression(mult=[returns_weight, returns_condition]),
                        models.MultExpression(
                            mult=[geo_weight, make_proximity(origin)]
                        ),
                    ]
                )
            ),
            limit=limit,
            with_payload=True,
        )
        return response.points

    combined = await rank_products()
    print(show_hits(combined))

    def explain_scores(
        points: list[models.ScoredPoint],
        origin: models.GeoPoint = SHOPPER_LOCATION,
        returns_weight: float = RETURNS_WEIGHT,
        geo_weight: float = GEO_WEIGHT,
    ) -> pd.DataFrame:
        rows = []
        for point in points:
            payload = point.payload or {}
            distance = distance_m(origin, payload["pickup_location"])
            geo_bonus = geo_weight * math.exp(
                math.log(0.5) * (distance / DISTANCE_SCALE_M) ** 2
            )
            returns_bonus = returns_weight * float(payload["free_returns"])
            reconstructed = semantic_scores[point.id] + returns_bonus + geo_bonus
            assert math.isclose(reconstructed, point.score, abs_tol=2e-5)
            rows.append(
                {
                    "id": point.id,
                    "product_name": str(payload["product_name"])[:60],
                    "label": label_by_id[point.id],
                    "semantic": semantic_scores[point.id],
                    "distance_km": distance / 1000,
                    "returns_bonus": returns_bonus,
                    "geo_bonus": geo_bonus,
                    "final_score": point.score,
                }
            )
        return pd.DataFrame(rows).round(4)

    print(explain_scores(combined))
    comparison = pd.DataFrame(
        {
            "rank": range(1, TOP_K + 1),
            "semantic + eligibility": [name_of(p) for p in filtered[:TOP_K]],
            "returns bonus": [name_of(p) for p in returns_boost],
            "geo bonus": [name_of(p) for p in proximity_boost],
            "combined": [name_of(p) for p in combined],
        }
    )
    print(comparison)

    without_bonuses = await rank_products(
        returns_weight=0.0, geo_weight=0.0, limit=CANDIDATE_LIMIT
    )
    expected_scores = {point.id: point.score for point in filtered}
    assert {point.id for point in without_bonuses} == set(expected_scores)
    for point in without_bonuses:
        assert math.isclose(point.score, expected_scores[point.id], abs_tol=1e-6)
    assert all(
        first.score >= second.score
        for first, second in zip(without_bonuses, without_bonuses[1:])
    )
    for point in await rank_products(limit=CANDIDATE_LIMIT):
        payload = point.payload or {}
        assert payload["in_stock"] is True
        assert (
            distance_m(SHOPPER_LOCATION, payload["pickup_location"]) <= MAX_DISTANCE_M
        )
        assert isinstance(point.id, int) and point.id % 37 != 0
    empty_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="pickup_location",
                geo_radius=models.GeoRadius(center=SHOPPER_LOCATION, radius=1.0),
            )
        ]
    )
    empty = (
        await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector, filter=empty_filter, limit=CANDIDATE_LIMIT
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(sum=["$score", returns_bonus])
            ),
            limit=TOP_K,
        )
    ).points
    assert empty == []
    print(
        "Passed: zero bonuses, eligibility, missing coordinates, score arithmetic, and empty result"
    )

    overweighted = await rank_products(geo_weight=5.0)
    print(explain_scores(overweighted, geo_weight=5.0))
    assert overweighted[0].payload is not None
    print("Winner's description:", overweighted[0].payload["product_description"])

    narrow = await rank_products(candidate_limit=3, limit=3)
    wide = await rank_products(candidate_limit=CANDIDATE_LIMIT, limit=3)
    print(
        pd.DataFrame(
            {
                "rank": [1, 2, 3],
                "prefetch limit 3": [name_of(p) for p in narrow],
                f"prefetch limit {CANDIDATE_LIMIT}": [name_of(p) for p in wide],
            }
        )
    )
    omitted = [
        name_of(p) for p in wide if p.id not in {candidate.id for candidate in narrow}
    ]
    print("Promoted products the narrow retrieval missed:", omitted)
    if not omitted:
        print("Both candidate budgets returned the same top results for this request.")

    GRADE = {"Exact": 2, "Partial": 1, "Irrelevant": 0}

    def dcg(grades: list[int]) -> float:
        return sum(
            (2**grade - 1) / math.log2(rank + 2) for rank, grade in enumerate(grades)
        )

    eligible_grades = sorted(
        (GRADE[label_by_id[point.id]] for point in filtered), reverse=True
    )
    ideal_dcg = dcg(eligible_grades[:TOP_K])
    audit_rows = []
    for policy, hits in [
        ("semantic + eligibility", filtered[:TOP_K]),
        ("combined", combined),
        ("proximity weight 5", overweighted),
    ]:
        grades = [GRADE[label_by_id[point.id]] for point in hits]
        audit_rows.append(
            {
                "policy": policy,
                "NDCG@5 (eligible judged pool)": dcg(grades) / ideal_dcg
                if ideal_dcg
                else None,
                "labels in rank order": [label_by_id[point.id] for point in hits],
            }
        )
    print(pd.DataFrame(audit_rows).round(4))

    NEW_ORIGIN = models.GeoPoint(lat=52.310, lon=21.040)
    moved = await rank_products(origin=NEW_ORIGIN)
    if not moved:
        print("No eligible products near this shopper. Try another origin or radius.")
    else:
        print(explain_scores(moved, origin=NEW_ORIGIN))
        print("Original winner:", name_of(combined[0]))
        print("New-origin winner:", name_of(moved[0]))
        if [p.id for p in moved] == [p.id for p in combined]:
            print("The ranking is unchanged; inspect the distance contributions.")

    trial_returns_weight = 0.05
    trial_geo_weight = 0.10
    trial = await rank_products(
        returns_weight=trial_returns_weight,
        geo_weight=trial_geo_weight,
    )
    print(
        explain_scores(
            trial,
            returns_weight=trial_returns_weight,
            geo_weight=trial_geo_weight,
        )
    )
```
