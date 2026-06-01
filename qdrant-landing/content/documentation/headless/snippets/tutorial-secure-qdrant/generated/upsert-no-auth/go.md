```go
import (
	"context"
	"fmt"

	"github.com/qdrant/go-client/qdrant"
)

client, err = qdrant.NewClient(&qdrant.Config{
	Host:   "localhost",
	Port:   6334,
	UseTLS: true,
})
if err != nil {
	panic(err)
}

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "my_collection",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     4,
		Distance: qdrant.Distance_Cosine,
	}),
})

_, err = client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "my_collection",
	Points: []*qdrant.PointStruct{
		{
			Id:      qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectors(0.1, 0.2, 0.3, 0.4),
		},
	},
})
if err != nil {
	fmt.Println(err) // Unauthenticated
}
```
