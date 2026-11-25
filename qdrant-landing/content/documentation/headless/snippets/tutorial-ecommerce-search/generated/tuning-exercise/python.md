```python
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
