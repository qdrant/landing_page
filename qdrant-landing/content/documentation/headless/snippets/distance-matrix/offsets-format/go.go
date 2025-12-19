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

	sample := uint64(10)
	limit := uint64(2)
	res, err := client.SearchMatrixOffsets(context.Background(), &qdrant.SearchMatrixPoints{
	    CollectionName: "{collection_name}",
	    Sample:         &sample,
	    Limit:          &limit,
	    Filter: &qdrant.Filter{
	        Must: []*qdrant.Condition{
	            qdrant.NewMatch("color", "red"),
	        },
	    },
	})

	if err != nil { panic(err) } // @hide
	_ = res // @hide
}
