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

	client.DeleteVectors(context.Background(), &qdrant.DeletePointVectors{
		CollectionName: "{collection_name}",
		PointsSelector: qdrant.NewPointsSelector(
			qdrant.NewIDNum(0), qdrant.NewIDNum(3), qdrant.NewIDNum(10)),
		Vectors: &qdrant.VectorsSelector{
			Names: []string{"text", "image"},
		},
	})
}
