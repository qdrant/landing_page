```go
res, err := client.Facet(context.Background(), &qdrant.FacetCounts{
    CollectionName: "{collection_name}",
    Key:            "key",
    Exact:          qdrant.PtrOf(true),
})
```
