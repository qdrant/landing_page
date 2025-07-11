```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQueryNearestWithMmr(&qdrant.NearestInputWithMmr {
		Nearest: qdrant.NewVectorInput(0.01, 0.45, 0.67), // search vector
		Mmr: &qdrant.Mmr{
			Diversity: 0.5, // 0.0 - relevance; 1.0 - diversity
			CandidatesLimit: qdrant.PtrOf(uint64(100)) // num of candidates to preselect
		},
	}),
	Limit: qdrant.PtrOf(uint64(10))
})
```
