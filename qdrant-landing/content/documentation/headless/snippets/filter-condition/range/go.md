```go
import "github.com/qdrant/go-client/qdrant"

qdrant.NewRange("price", &qdrant.Range{
	Gte: qdrant.PtrOf(100.0),
	Lte: qdrant.PtrOf(450.0),
})

```
