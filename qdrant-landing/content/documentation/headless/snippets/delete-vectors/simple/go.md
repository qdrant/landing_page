```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.DeleteVectors(context.Background(), &qdrant.DeletePointVectors{
	CollectionName: "{collection_name}",
	PointsSelector: qdrant.NewPointsSelector(
		qdrant.NewIDNum(0), qdrant.NewIDNum(3), qdrant.NewIDNum(10)),
	Vectors: &qdrant.VectorsSelector{
		Names: []string{"text", "image"},
	},
})
```
