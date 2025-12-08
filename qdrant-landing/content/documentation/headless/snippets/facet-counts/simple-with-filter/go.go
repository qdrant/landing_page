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

	res, err := client.Facet(context.Background(), &qdrant.FacetCounts{
	    CollectionName: "{collection_name}",
	    Key:            "size",
	        Filter: &qdrant.Filter{
	        Must: []*qdrant.Condition{
	            qdrant.NewMatch("color", "red"),
	        },
	    },
	})

	if err != nil { panic(err) } // @hide
	_ = res // @hide
}
