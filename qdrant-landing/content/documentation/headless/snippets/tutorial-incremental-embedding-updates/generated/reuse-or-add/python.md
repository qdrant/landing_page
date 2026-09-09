```python
def reuse_or_add(unknown_ids):
    """Reuse an existing embedding when the same text is already stored; embed only what is new."""
    reused, added = 0, 0

    for c in unknown_ids:
        same_text = models.Filter(must=[
            models.FieldCondition(
                key="content_hash",
                match=models.MatchValue(value=c["content_hash"]),
            )
        ])
        hits, _ = client.scroll(
            COLLECTION,
            scroll_filter=same_text,
            limit=1,
            with_payload=["last_updated"],
            with_vectors=True,
        )

        if hits:  # same text, new address: copy the vector, keep its last_updated
            point = models.PointStruct(
                id=c["point_id"],
                vector=hits[0].vector,
                payload=payload(c, hits[0].payload["last_updated"]),
            )
            reused += 1
        else:     # genuinely new content: embed and insert
            point = models.PointStruct(
                id=c["point_id"],
                vector=models.Document(text=c["text"], model=MODEL),
                payload=payload(c),
            )
            added += 1

        client.upsert(COLLECTION, points=[point], wait=True)

    return reused, added
```
