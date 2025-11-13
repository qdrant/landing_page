```go

TODO!

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	OptimizersConfig: &qdrant.OptimizersConfigDiff{
		IndexingThreshold: qdrant.PtrOf(uint64(10000)),
	},
	Metadata: qdrant.NewValueMap(map[string]any{
		"my-metadata-field": map[string]any{
			"key-a": "value-a",
			"key-b": 42,
		},
	}),
})
```
