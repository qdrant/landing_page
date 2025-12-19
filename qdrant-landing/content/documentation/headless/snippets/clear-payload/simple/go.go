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

	client.ClearPayload(context.Background(), &qdrant.ClearPayloadPoints{
	    CollectionName: "{collection_name}",
	    Points: qdrant.NewPointsSelector(
	        qdrant.NewIDNum(0),
	        qdrant.NewIDNum(3)),
	})
}
