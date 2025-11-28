```go
import "github.com/qdrant/go-client/qdrant"

qdrant.NewValuesCount("comments", &qdrant.ValuesCount{
	Gt: qdrant.PtrOf(uint64(2)),
})
```
