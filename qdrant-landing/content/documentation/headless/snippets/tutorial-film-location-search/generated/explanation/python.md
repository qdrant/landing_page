```python
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
```
