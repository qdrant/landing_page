```go
import (
	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host:   "xyz-example.eu-central.aws.cloud.qdrant.io",
	Port:   6334,
	APIKey: "your_api_key_here",
	UseTLS: true,
})
```
