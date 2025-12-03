package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil { panic(err) } // @hide

	client.Get(context.Background(), &qdrant.GetPoints{
		CollectionName: "{collection_name}",
		Ids: []*qdrant.PointId{
			qdrant.NewIDNum(0), qdrant.NewIDNum(3), qdrant.NewIDNum(100),
		},
	})
}
