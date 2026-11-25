```python
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
```
