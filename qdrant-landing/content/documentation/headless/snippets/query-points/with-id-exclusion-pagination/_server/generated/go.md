```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

seenIds := []uint64{83461, 19284, 57392, 44017, 91825} // IDs returned on previous pages

pointIds := make([]*qdrant.PointId, len(seenIds))
for i, id := range seenIds {
	pointIds[i] = qdrant.NewIDNum(id)
}

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
	Filter: &qdrant.Filter{
		MustNot: []*qdrant.Condition{
			qdrant.NewHasID(pointIds...),
		},
	},
	Limit: qdrant.PtrOf(uint64(5)),
})
```
