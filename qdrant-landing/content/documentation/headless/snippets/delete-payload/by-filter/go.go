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

	client.DeletePayload(context.Background(), &qdrant.DeletePayloadPoints{
	    CollectionName: "{collection_name}",
	    Keys:           []string{"color", "price"},
	    PointsSelector: qdrant.NewPointsSelectorFilter(
	        &qdrant.Filter{
	            Must: []*qdrant.Condition{qdrant.NewMatch("color", "red")},
	        },
	    ),
	})
}
