```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
    Host: "localhost",
    Port: 6334,
})

client.Upsert(context.Background(), &qdrant.UpsertPoints{
    CollectionName: "{collection_name}",
    Points: []*qdrant.PointStruct{
        {
            Id:      qdrant.NewIDNum(1),
            Vectors: qdrant.NewVectors(0.05, 0.61, 0.76, 0.74),
            Payload: qdrant.NewValueMap(map[string]any{
                "city": "Berlin", "price": 1.99}),
        },
        {
            Id:      qdrant.NewIDNum(2),
            Vectors: qdrant.NewVectors(0.19, 0.81, 0.75, 0.11),
            Payload: qdrant.NewValueMap(map[string]any{
                "city": []any{"Berlin", "London"}}),
        },
        {
            Id:      qdrant.NewIDNum(3),
            Vectors: qdrant.NewVectors(0.36, 0.55, 0.47, 0.94),
            Payload: qdrant.NewValueMap(map[string]any{
                "city":  []any{"Berlin", "London"},
                "price": []any{1.99, 2.99}}),
        },
    },
})
```
