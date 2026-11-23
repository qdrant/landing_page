```python
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
```
