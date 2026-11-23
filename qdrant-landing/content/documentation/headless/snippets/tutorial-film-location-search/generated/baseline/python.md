```python
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
```
