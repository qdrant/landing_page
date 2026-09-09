```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateShardKey(context.Background(), "{collection_name}", &qdrant.CreateShardKey{
	ShardKey: qdrant.NewShardKey("{shard_key}"),
})
```
