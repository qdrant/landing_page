```python
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
```
