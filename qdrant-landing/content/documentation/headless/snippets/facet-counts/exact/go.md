```go
res, err := client.Facet(ctx, &qdrant.FacetCounts{
    CollectionName: "{collection_name}",
    Key:            "key",
    Exact:          true,
})
```
