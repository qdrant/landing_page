```python
def delete_gone(incoming_ids):
    """Remove every point the current crawl no longer contains. Returns how many."""
    if not incoming_ids:
        raise ValueError("Refusing to delete from an empty source snapshot.")

    stale = models.Filter(must_not=[models.HasIdCondition(has_id=list(incoming_ids))])

    to_delete = client.count(COLLECTION, count_filter=stale).count

    # potential check against a threshold to avoid accidental mass deletion could be added here
    client.delete(COLLECTION, points_selector=models.FilterSelector(filter=stale), wait=True)
    return to_delete
```
