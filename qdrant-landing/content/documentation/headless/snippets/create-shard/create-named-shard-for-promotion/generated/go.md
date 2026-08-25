```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateShardKey(
	context.Background(),
	"{collection_name}",
	&qdrant.CreateShardKey{
		ShardKey:          qdrant.NewShardKey("default"),
		ShardsNumber:      qdrant.PtrOf(uint32(1)),
		ReplicationFactor: qdrant.PtrOf(uint32(1)),
		InitialState:      qdrant.PtrOf(qdrant.ReplicaState_Partial),
	},
)
```
