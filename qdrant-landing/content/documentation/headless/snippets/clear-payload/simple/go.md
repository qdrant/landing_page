```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
    Host: "localhost",
    Port: 6334,
})

client.ClearPayload(context.Background(), &qdrant.ClearPayloadPoints{
    CollectionName: "{collection_name}",
    Points: qdrant.NewPointsSelector(
        qdrant.NewIDNum(0),
        qdrant.NewIDNum(3)),
})
```
