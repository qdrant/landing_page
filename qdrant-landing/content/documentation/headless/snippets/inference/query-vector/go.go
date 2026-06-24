package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{ // @hide
		Host: "localhost",                           // @hide
		Port: 6334,                                  // @hide
	})                                               // @hide

	if err != nil { panic(err) } // @hide

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Query:          qdrant.NewQuery(0.12, 0.34, 0.56, 0.78),
	})
}
