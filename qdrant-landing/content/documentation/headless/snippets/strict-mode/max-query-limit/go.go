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

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	  CollectionName: "{collection_name}",
	  StrictModeConfig: &qdrant.StrictModeConfig{
	    Enabled: qdrant.PtrOf(true),
	    MaxQueryLimit: qdrant.PtrOf(uint32(10)),
	  },
	})
}
