package snippet

// @hide-start
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)
// @hide-end


func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
	    Host: "localhost",
	    Port: 6334,
	})
	if err != nil { panic(err) }
	// @hide-end

	res, err := client.Facet(context.Background(), &qdrant.FacetCounts{
	    CollectionName: "{collection_name}",
	    Key:            "key",
	    Exact:          qdrant.PtrOf(true),
	})

	if err != nil { panic(err) } // @hide
	_ = res // @hide
}
