```python
NEW_ORIGIN = models.GeoPoint(lat=52.310, lon=21.040)
moved = await rank_products(origin=NEW_ORIGIN)
if not moved:
    print("No eligible products near this shopper. Try another origin or radius.")
else:
    print(explain_scores(moved, origin=NEW_ORIGIN))
    print("Original winner:", name_of(combined[0]))
    print("New-origin winner:", name_of(moved[0]))
    if [p.id for p in moved] == [p.id for p in combined]:
        print("The ranking is unchanged; inspect the distance contributions.")
```
