```go
import (
	"context"
	"encoding/base64"
	"fmt"
	"os"

	"github.com/qdrant/go-client/qdrant"
)

type Doc struct {
	Caption string
	Image   string
}

func imageToBase64Url(imagePath string) (string, error) {
	prefix := "data:image/png;base64"
	bytes, err := os.ReadFile(imagePath)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s,%s", prefix, base64.StdEncoding.EncodeToString(bytes)), nil
}

var documents = []Doc{
	{Caption: "An image about plane emergency safety.", Image: "images/image-1.png"},
	{Caption: "An image about airplane components.", Image: "images/image-2.png"},
	{Caption: "An image about COVID safety restrictions.", Image: "images/image-3.png"},
	{Caption: "A confidential image about UFO sightings.", Image: "images/image-4.png"},
	{Caption: "An image about unusual footprints on Aralar 2011.", Image: "images/image-5.png"},
}

client, err := qdrant.NewClient(&qdrant.Config{
	Host:   QDRANT_URL,
	APIKey: QDRANT_API_KEY,
	UseTLS: true,
})

collectionName := "multimodal-embeddings"

exists, err := client.CollectionExists(context.Background(), collectionName)
if !exists {
	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: collectionName,
		VectorsConfig: qdrant.NewVectorsConfigMap(
			map[string]*qdrant.VectorParams{
				"image": {
					Size:     512,
					Distance: qdrant.Distance_Cosine,
				},
				"text": {
					Size:     512,
					Distance: qdrant.Distance_Cosine,
				},
			},
		),
	})
}

cohereApiKey := os.Getenv("COHERE_API_KEY")
ctx := qdrant.WithHeader(context.Background(), "cohere-api-key", cohereApiKey)

points := make([]*qdrant.PointStruct, len(documents))
for idx, doc := range documents {
	imageUrl, err := imageToBase64Url(doc.Image)

	points[idx] = &qdrant.PointStruct{
		Id: qdrant.NewIDNum(uint64(idx)),
		Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
			"text": qdrant.NewVectorDocument(&qdrant.Document{
				Text:  doc.Caption,
				Model: "cohere/embed-v4.0",
				Options: qdrant.NewValueMap(map[string]any{
					"output_dimension": 512,
				}),
			}),
			"image": qdrant.NewVectorImage(&qdrant.Image{
				Image: qdrant.NewValueString(imageUrl),
				Model: "cohere/embed-v4.0",
				Options: qdrant.NewValueMap(map[string]any{
					"output_dimension": 512,
				}),
			}),
		}),
		Payload: qdrant.NewValueMap(map[string]any{
			"caption": doc.Caption,
			"image":   doc.Image,
		}),
	}
}

client.Upsert(ctx, &qdrant.UpsertPoints{
	CollectionName: collectionName,
	Points:         points,
})

results, err := client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Text:  "Plane components",
			Model: "cohere/embed-v4.0",
			Options: qdrant.NewValueMap(map[string]any{
				"output_dimension": 512,
			}),
		}),
	),
	Using:       qdrant.PtrOf("image"),
	WithPayload: qdrant.NewWithPayloadInclude("image"),
	Limit:       qdrant.PtrOf(uint64(1)),
})

fmt.Println(results[0].Payload["image"])

results, err = client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Text:  "Componenti di un aereo",
			Model: "cohere/embed-v4.0",
			Options: qdrant.NewValueMap(map[string]any{
				"output_dimension": 512,
			}),
		}),
	),
	Using:       qdrant.PtrOf("image"),
	WithPayload: qdrant.NewWithPayloadInclude("image"),
	Limit:       qdrant.PtrOf(uint64(1)),
})

fmt.Println(results[0].Payload["image"])

queryImageUrl, err := imageToBase64Url("images/image-2.png")

results, err = client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputImage(&qdrant.Image{
			Image: qdrant.NewValueString(queryImageUrl),
			Model: "cohere/embed-v4.0",
			Options: qdrant.NewValueMap(map[string]any{
				"output_dimension": 512,
			}),
		}),
	),
	Using:       qdrant.PtrOf("text"),
	WithPayload: qdrant.NewWithPayloadInclude("caption"),
	Limit:       qdrant.PtrOf(uint64(1)),
})

fmt.Println(results[0].Payload["caption"])
```
