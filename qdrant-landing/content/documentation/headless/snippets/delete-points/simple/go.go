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

	client.Delete(context.Background(), &qdrant.DeletePoints{
		CollectionName: "{collection_name}",
		Points: qdrant.NewPointsSelector(
			qdrant.NewIDNum(0), qdrant.NewIDNum(3), qdrant.NewIDNum(100),
		),
	})
}
