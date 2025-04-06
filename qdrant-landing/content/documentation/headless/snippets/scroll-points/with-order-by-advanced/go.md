```go
import "github.com/qdrant/go-client/qdrant"

qdrant.OrderBy{
	Key:       "timestamp",
	Direction: qdrant.Direction_Desc.Enum(),
	StartFrom: qdrant.NewStartFromInt(123),
}
```
