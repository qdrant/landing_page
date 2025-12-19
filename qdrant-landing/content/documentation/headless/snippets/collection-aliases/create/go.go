package snippet

import "context"
import "github.com/qdrant/go-client/qdrant" // @hide

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
	    Host: "localhost",
	    Port: 6334,
	})
	if err != nil { panic(err) }
	// @hide-end

	client.CreateAlias(context.Background(), "production_collection", "example_collection")
}
