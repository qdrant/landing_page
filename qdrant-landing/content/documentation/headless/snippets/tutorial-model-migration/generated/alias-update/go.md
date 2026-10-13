```go
err = client.UpdateAliases(context.Background(), []*qdrant.AliasOperations{
	{Action: &qdrant.AliasOperations_DeleteAlias{
		DeleteAlias: &qdrant.DeleteAlias{AliasName: "prod"},
	}},
	{Action: &qdrant.AliasOperations_CreateAlias{
		CreateAlias: &qdrant.CreateAlias{
			AliasName: "prod", CollectionName: NEW_COLLECTION,
		},
	}},
})
```
