```python
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
