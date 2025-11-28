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

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	  CollectionName: "{collection_name}",
	  StrictModeConfig: &qdrant.StrictModeConfig{
	    Enabled: qdrant.PtrOf(true),
	    UpsertMaxBatchsize: qdrant.PtrOf(uint64(1000)),
	  },
	})
}
