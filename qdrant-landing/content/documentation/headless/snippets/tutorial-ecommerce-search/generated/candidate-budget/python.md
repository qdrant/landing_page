```python
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
```
