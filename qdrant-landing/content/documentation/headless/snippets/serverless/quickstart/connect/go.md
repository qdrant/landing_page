```go
import (
	"github.com/qdrant/go-client/qdrant"
	"github.com/qdrant/go-client/qdrant/serverless"
)

client, err := serverless.NewClient(&qdrant.Config{
	Host:   "serverless.<region>.cloud.qdrant.io",
	APIKey: "<your-api-key>",
})
if err != nil {
	panic(err)
}
```
