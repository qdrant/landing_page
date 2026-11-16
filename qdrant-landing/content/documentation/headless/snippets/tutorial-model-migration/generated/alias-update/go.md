```go
err = client.UpdateAliases(context.Background(), []*qdrant.AliasOperations{
	qdrant.NewAliasDelete("prod"),
	qdrant.NewAliasCreate("prod", NEW_COLLECTION),
})
```
