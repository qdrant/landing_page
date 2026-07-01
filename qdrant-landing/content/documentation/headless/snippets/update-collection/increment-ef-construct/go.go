package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})
	if err != nil { panic(err) }
	// @hide-end

	// @block-start get-current-value
	collectionInfo, err := client.GetCollectionInfo(context.Background(), "{collection_name}")
	if err != nil { panic(err) }
	baseEf := *collectionInfo.Config.HnswConfig.EfConstruct
	// @block-end get-current-value

	// @block-start update-collection
	client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
		CollectionName: "{collection_name}",
		HnswConfig: &qdrant.HnswConfigDiff{
			EfConstruct: qdrant.PtrOf(baseEf + 1),
		},
	})
	// @block-end update-collection
}
