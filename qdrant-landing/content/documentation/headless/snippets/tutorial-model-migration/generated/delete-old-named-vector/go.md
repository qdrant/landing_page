```go
client.DeleteVectorName(context.Background(), &qdrant.DeleteVectorNameRequest{
	CollectionName: COLLECTION,
	VectorName:     OLD_VECTOR,
})
```
