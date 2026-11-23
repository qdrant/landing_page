```python
#!/usr/bin/env -S uv run --script
#
# /// script
# requires-python = ">=3.12"
# dependencies = ["qdrant-client==1.20.0", "fastembed==0.8.0", "pandas==2.3.3", "huggingface-hub==1.33.0", "httpx==0.28.1", "ipython>=8"]
# ///

# Query blocks mirror the companion film-location-search notebook.
import asyncio
import atexit
import hashlib
import json
import platform
import shutil
import socket
import subprocess
import tarfile
import tempfile
from pathlib import Path

import httpx
from fastembed import TextEmbedding
from huggingface_hub import snapshot_download
from qdrant_client import AsyncQdrantClient, models

async def main() -> None:

    import math

    import pandas as pd  # type: ignore[import-untyped]

    BASE_LOCATION = models.GeoPoint(lat=52.2297, lon=21.0122)
    CANDIDATE_LIMIT = len(locations)
    TOP_K = 5
    EXACT = models.SearchParams(exact=True)

    def distance_m(origin: models.GeoPoint, destination: dict[str, float]) -> float:
        lat1, lat2 = math.radians(origin.lat), math.radians(destination["lat"])
        dlat = lat2 - lat1
        dlon = math.radians(destination["lon"] - origin.lon)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        )
        return 6_371_000 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def name_of(point: models.ScoredPoint) -> str:
        assert point.payload is not None
        return str(point.payload["name"])

    def show_hits(
        points: list[models.ScoredPoint], origin: models.GeoPoint = BASE_LOCATION
    ) -> pd.DataFrame:
        rows = []
        for point in points:
            payload = point.payload or {}
            location = payload.get("location")
            rows.append(
                {
                    "id": point.id,
                    "name": payload["name"],
                    "score": point.score,
                    "distance_km": distance_m(origin, location) / 1000
                    if location
                    else None,
                    "permission": payload["permission_available"],
                    "power": payload["power_available"],
                }
            )
        return pd.DataFrame(rows).round(4)

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

    MAX_DISTANCE_M = 15_000.0

    def make_eligibility_filter(origin: models.GeoPoint) -> models.Filter:
        return models.Filter(
            must=[
                models.FieldCondition(
                    key="permission_available", match=models.MatchValue(value=True)
                ),
                models.FieldCondition(
                    key="location",
                    geo_radius=models.GeoRadius(center=origin, radius=MAX_DISTANCE_M),
                ),
            ]
        )

    eligibility_filter = make_eligibility_filter(BASE_LOCATION)
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
    print(f"Eligible candidates: {len(filtered)} / {len(locations)}")
    assert {1, 11, 40}.isdisjoint(point.id for point in filtered)

    FACILITY_WEIGHT = 0.08
    power_condition = models.FieldCondition(
        key="power_available", match=models.MatchValue(value=True)
    )
    facility_bonus = models.MultExpression(mult=[FACILITY_WEIGHT, power_condition])

    facility_boost = (
        await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector,
                filter=eligibility_filter,
                params=EXACT,
                limit=CANDIDATE_LIMIT,
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(sum=["$score", facility_bonus])
            ),
            limit=TOP_K,
            with_payload=True,
        )
    ).points
    print(show_hits(facility_boost))

    GEO_WEIGHT = 0.15
    DISTANCE_SCALE_M = 5_000.0

    def make_proximity(origin: models.GeoPoint) -> models.GaussDecayExpression:
        return models.GaussDecayExpression(
            gauss_decay=models.DecayParamsExpression(
                x=models.GeoDistance(
                    geo_distance=models.GeoDistanceParams(origin=origin, to="location")
                ),
                target=0.0,
                scale=DISTANCE_SCALE_M,
                midpoint=0.5,
            )
        )

    proximity = make_proximity(BASE_LOCATION)
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

    async def rank_locations(
        origin: models.GeoPoint = BASE_LOCATION,
        facility_weight: float = FACILITY_WEIGHT,
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
                        models.MultExpression(mult=[facility_weight, power_condition]),
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

    combined = await rank_locations()
    print(show_hits(combined))

    def explain_scores(
        points: list[models.ScoredPoint],
        origin: models.GeoPoint = BASE_LOCATION,
        facility_weight: float = FACILITY_WEIGHT,
        geo_weight: float = GEO_WEIGHT,
    ) -> pd.DataFrame:
        rows = []
        for point in points:
            payload = point.payload or {}
            distance = distance_m(origin, payload["location"])
            geo_bonus = geo_weight * math.exp(
                math.log(0.5) * (distance / DISTANCE_SCALE_M) ** 2
            )
            power_bonus = facility_weight * float(payload["power_available"])
            reconstructed = semantic_scores[point.id] + power_bonus + geo_bonus
            assert math.isclose(reconstructed, point.score, abs_tol=2e-5)
            rows.append(
                {
                    "name": payload["name"],
                    "semantic": semantic_scores[point.id],
                    "distance_km": distance / 1000,
                    "power_bonus": power_bonus,
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
            "power bonus": [name_of(p) for p in facility_boost],
            "geo bonus": [name_of(p) for p in proximity_boost],
            "combined": [name_of(p) for p in combined],
        }
    )
    print(comparison)

    without_bonuses = await rank_locations(
        facility_weight=0.0, geo_weight=0.0, limit=CANDIDATE_LIMIT
    )
    assert [p.id for p in without_bonuses] == [p.id for p in filtered]
    for actual, expected in zip(without_bonuses, filtered, strict=True):
        assert math.isclose(actual.score, expected.score, abs_tol=1e-6)
    for point in await rank_locations(limit=CANDIDATE_LIMIT):
        payload = point.payload or {}
        assert payload["permission_available"] is True
        assert distance_m(BASE_LOCATION, payload["location"]) <= MAX_DISTANCE_M
        assert point.id not in {1, 11, 40}
    empty_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="location",
                geo_radius=models.GeoRadius(center=BASE_LOCATION, radius=1.0),
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
                formula=models.SumExpression(sum=["$score", facility_bonus])
            ),
            limit=TOP_K,
        )
    ).points
    assert empty == []
    print(
        "Passed: zero bonuses, eligibility, missing coordinates, score arithmetic, and empty result"
    )

    overweighted = await rank_locations(geo_weight=5.0)
    print(explain_scores(overweighted, geo_weight=5.0))
    assert overweighted[0].payload is not None
    print("Winner's description:", overweighted[0].payload["description"])

    narrow = await rank_locations(candidate_limit=3, limit=3)
    wide = await rank_locations(candidate_limit=CANDIDATE_LIMIT, limit=3)
    print(
        pd.DataFrame(
            {
                "rank": [1, 2, 3],
                "prefetch limit 3": [name_of(p) for p in narrow],
                "prefetch limit 40": [name_of(p) for p in wide],
            }
        )
    )
    omitted = [
        name_of(p) for p in wide if p.id not in {candidate.id for candidate in narrow}
    ]
    print("Promoted locations the narrow retrieval missed:", omitted)
    if not omitted:
        print("Both candidate budgets returned the same top results for this request.")

    NEW_BASE = models.GeoPoint(lat=52.310, lon=21.040)
    moved = await rank_locations(origin=NEW_BASE)
    if not moved:
        print("No eligible locations near this base. Try another origin or radius.")
    else:
        print(explain_scores(moved, origin=NEW_BASE))
        print("Original winner:", name_of(combined[0]))
        print("New-base winner:", name_of(moved[0]))
        if [p.id for p in moved] == [p.id for p in combined]:
            print("The ranking is unchanged; inspect the distance contributions.")

    trial_facility_weight = 0.05
    trial_geo_weight = 0.10
    trial = await rank_locations(
        facility_weight=trial_facility_weight,
        geo_weight=trial_geo_weight,
    )
    print(
        explain_scores(
            trial,
            facility_weight=trial_facility_weight,
            geo_weight=trial_geo_weight,
        )
    )
```
