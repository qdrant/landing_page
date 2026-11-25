```python
overweighted = await rank_products(geo_weight=5.0)
print(explain_scores(overweighted, geo_weight=5.0))
assert overweighted[0].payload is not None
print("Winner's description:", overweighted[0].payload["product_description"])
```
