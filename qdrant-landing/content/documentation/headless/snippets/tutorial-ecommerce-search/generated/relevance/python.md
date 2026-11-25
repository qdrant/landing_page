```python
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
```
