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

	client.UpdateClusterCollectionSetup(context.Background(), qdrant.NewUpdateCollectionClusterReplicatePoints(
		"{collection_name}", &qdrant.ReplicatePoints{
			FromShardKey: qdrant.NewShardKey("default"),
			ToShardKey:   qdrant.NewShardKey("user_1"),
			Filter: &qdrant.Filter{
				Must: []*qdrant.Condition{
					qdrant.NewMatch("group_id", "user_1"),
				},
			},
		},
	))
}
