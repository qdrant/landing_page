```go
import (
	"time"

	"github.com/qdrant/go-client/qdrant"
	"google.golang.org/protobuf/types/known/timestamppb"
)

qdrant.NewDatetimeRange("date", &qdrant.DatetimeRange{
	Gt:  timestamppb.New(time.Date(2023, 2, 8, 10, 49, 0, 0, time.UTC)),
	Lte: timestamppb.New(time.Date(2024, 1, 31, 10, 14, 31, 0, time.UTC)),
})
```
