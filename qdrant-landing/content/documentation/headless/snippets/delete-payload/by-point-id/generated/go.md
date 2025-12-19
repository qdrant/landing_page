```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
    Host: "localhost",
    Port: 6334,
})

client.DeletePayload(context.Background(), &qdrant.DeletePayloadPoints{
    CollectionName: "{collection_name}",
    Keys:           []string{"color", "price"},
    PointsSelector: qdrant.NewPointsSelector(
        qdrant.NewIDNum(0),
        qdrant.NewIDNum(3)),
})
```
