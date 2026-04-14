```go
import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host:   QDRANT_URL,
	APIKey: QDRANT_API_KEY,
	UseTLS: true,
})

denseEmbeddingModel := "sentence-transformers/all-MiniLM-L6-v2"
sparseEmbeddingModel := "qdrant/bm25"
lateInteractionEmbeddingModel := "answerdotai/answerai-colbert-small-v1"

collectionName := "hybrid-search"

exists, err := client.CollectionExists(context.Background(), collectionName)
if exists {
	client.DeleteCollection(context.Background(), collectionName)
}

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: collectionName,
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"dense": {
				Size:     384,
				Distance: qdrant.Distance_Cosine,
			},
			"multi": {
				Size:     96,
				Distance: qdrant.Distance_Cosine,
				MultivectorConfig: &qdrant.MultiVectorConfig{
					Comparator: qdrant.MultiVectorComparator_MaxSim,
				},
				HnswConfig: &qdrant.HnswConfigDiff{M: qdrant.PtrOf(uint64(0))}, // Disable HNSW for reranking
			},
		},
	),
	SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
		map[string]*qdrant.SparseVectorParams{
			"sparse": {Modifier: qdrant.Modifier_Idf.Enum()},
		},
	),
})

csvUrl := "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv"

resp, err := http.Get(csvUrl)
defer resp.Body.Close()

csvReader := csv.NewReader(resp.Body)

batchSize := 25
var idx uint64
var buffer []*qdrant.PointStruct

for {
	row, err := csvReader.Read()
	if err == io.EOF {
		break
	}

	title := row[0]
	author := row[1]
	description := row[3]

	buffer = append(buffer, &qdrant.PointStruct{
		Id: qdrant.NewIDNum(idx),
		Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
			"dense":  qdrant.NewVectorDocument(&qdrant.Document{Text: description, Model: denseEmbeddingModel}),
			"sparse": qdrant.NewVectorDocument(&qdrant.Document{Text: description, Model: sparseEmbeddingModel}),
			"multi":  qdrant.NewVectorDocument(&qdrant.Document{Text: description, Model: lateInteractionEmbeddingModel}),
		}),
		Payload: qdrant.NewValueMap(map[string]any{
			"title":       title,
			"author":      author,
			"description": description,
		}),
	})
	idx++

	if len(buffer) >= batchSize {
		client.Upsert(context.Background(), &qdrant.UpsertPoints{
			CollectionName: collectionName,
			Points:         buffer,
		})
		buffer = nil
	}
}

if len(buffer) > 0 {
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: collectionName,
		Points:         buffer,
	})
}

query := "time travel"

results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  query,
		Model: denseEmbeddingModel,
	}),
	Using: qdrant.PtrOf("dense"),
	Limit: qdrant.PtrOf(uint64(10)),
})

for _, result := range results {
	fmt.Println(result)
}

results, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  query,
		Model: sparseEmbeddingModel,
	}),
	Using: qdrant.PtrOf("sparse"),
	Limit: qdrant.PtrOf(uint64(10)),
})

for _, result := range results {
	fmt.Println(result)
}

results, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  query,
				Model: denseEmbeddingModel,
			}),
			Using: qdrant.PtrOf("dense"),
			Limit: qdrant.PtrOf(uint64(20)),
		},
		{
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  query,
				Model: sparseEmbeddingModel,
			}),
			Using: qdrant.PtrOf("sparse"),
			Limit: qdrant.PtrOf(uint64(20)),
		},
	},
	Query:       qdrant.NewQueryFusion(qdrant.Fusion_RRF),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})

for _, result := range results {
	fmt.Println(result)
}

results, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  query,
				Model: denseEmbeddingModel,
			}),
			Using: qdrant.PtrOf("dense"),
			Limit: qdrant.PtrOf(uint64(20)),
		},
		{
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  query,
				Model: sparseEmbeddingModel,
			}),
			Using: qdrant.PtrOf("sparse"),
			Limit: qdrant.PtrOf(uint64(20)),
		},
	},
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  query,
		Model: lateInteractionEmbeddingModel,
	}),
	Using:       qdrant.PtrOf("multi"),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})

for _, result := range results {
	fmt.Println(result)
}
```
