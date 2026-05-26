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

client, err = qdrant.NewClient(&qdrant.Config{
	Host:   "localhost",
	Port:   6334,
	APIKey: "my-admin-key",
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

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "my_collection",
	Points: []*qdrant.PointStruct{
		{
			Id:      qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectors(0.1, 0.2, 0.3, 0.4),
		},
	},
})

client, err = qdrant.NewClient(&qdrant.Config{
	Host:   "localhost",
	Port:   6334,
	APIKey: "my-read-only-key",
	UseTLS: true,
})
if err != nil {
	panic(err)
}

_, err = client.Delete(context.Background(), &qdrant.DeletePoints{
	CollectionName: "my_collection",
	Points:         qdrant.NewPointsSelector(qdrant.NewIDNum(1)),
})
if err != nil {
	fmt.Println(err) // PermissionDenied
}

client, err = qdrant.NewClient(&qdrant.Config{
	Host:   "localhost",
	Port:   6334,
	APIKey: "<your-jwt>",
	UseTLS: true,
})
if err != nil {
	panic(err)
}

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "my_collection",
	Points: []*qdrant.PointStruct{
		{
			Id:      qdrant.NewIDNum(2),
			Vectors: qdrant.NewVectors(0.5, 0.6, 0.7, 0.8),
		},
	},
})

client, err = qdrant.NewClient(&qdrant.Config{
	Host:   "localhost",
	Port:   6334,
	APIKey: "<your-jwt>",
	UseTLS: true,
})
if err != nil {
	panic(err)
}

_, err = client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "other_collection",
	Points: []*qdrant.PointStruct{
		{
			Id:      qdrant.NewIDNum(2),
			Vectors: qdrant.NewVectors(0.5, 0.6, 0.7, 0.8),
		},
	},
})
if err != nil {
	fmt.Println(err) // PermissionDenied
}
```
