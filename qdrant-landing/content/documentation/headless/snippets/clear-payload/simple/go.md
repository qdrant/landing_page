```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client.ClearPayload(context.Background(), &qdrant.ClearPayloadPoints{
    CollectionName: "{collection_name}",
    Points: qdrant.NewPointsSelector(
        qdrant.NewIDNum(0),
        qdrant.NewIDNum(3)),
})
```
