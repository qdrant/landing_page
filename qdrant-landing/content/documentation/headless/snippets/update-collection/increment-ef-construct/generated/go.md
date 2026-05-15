```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

collectionInfo, err := client.GetCollectionInfo(context.Background(), "{collection_name}")
if err != nil { panic(err) }
baseEf := *collectionInfo.Config.HnswConfig.EfConstruct

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	HnswConfig: &qdrant.HnswConfigDiff{
		EfConstruct: qdrant.PtrOf(baseEf + 1),
	},
})
```
