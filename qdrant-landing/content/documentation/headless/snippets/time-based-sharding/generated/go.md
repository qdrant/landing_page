```go
import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
)

type CSVRow struct {
	Text     string
	Datetime string
}

func parseCSV(url string, fn func(CSVRow)) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	csvReader := csv.NewReader(resp.Body)
	headers, err := csvReader.Read()
	if err != nil {
		return err
	}

	textIdx, datetimeIdx := -1, -1
	for i, h := range headers {
		switch h {
		case "text":
			textIdx = i
		case "datetime":
			datetimeIdx = i
		}
	}

	for {
		row, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		fn(CSVRow{Text: row[textIdx], Datetime: row[datetimeIdx]})
	}
	return nil
}

client, err := qdrant.NewClient(&qdrant.Config{
	Host:   QDRANT_URL,
	APIKey: QDRANT_API_KEY,
	UseTLS: true,
})

collectionName := "my_collection"

exists, err := client.CollectionExists(context.Background(), collectionName)
if exists {
	client.DeleteCollection(context.Background(), collectionName)
}

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: collectionName,
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"dense_vector": {
				Size:     384,
				Distance: qdrant.Distance_Cosine,
			},
		},
	),
	ShardingMethod: qdrant.ShardingMethod_Custom.Enum(),
})

csvUrl := "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv"

shardKeyDescriptions, err := client.ListShardKeys(context.Background(), collectionName)

// Retrieve a list of existing shard keys in the collection
existingShardKeys := make(map[string]bool)
for _, desc := range shardKeyDescriptions {
	existingShardKeys[desc.Key.GetKeyword()] = true
}

denseModel := "sentence-transformers/all-MiniLM-L6-v2"
batchSize := 100
var currentDate string
var buffer []*qdrant.PointStruct

err = parseCSV(csvUrl, func(row CSVRow) {
	text := row.Text
	datetime := row.Datetime
	shardDate := datetime[:10] // Extract YYYY-MM-DD

	if shardDate != currentDate {
		// Flush buffer for the previous date before switching
		if len(buffer) > 0 {
			client.Upsert(context.Background(), &qdrant.UpsertPoints{
				CollectionName: collectionName,
				Points:         buffer,
				ShardKeySelector: &qdrant.ShardKeySelector{
					ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey(currentDate)},
				},
			})
			buffer = nil
		}

		// Create shard for the new date if it doesn't exist yet
		if !existingShardKeys[shardDate] {
			client.CreateShardKey(context.Background(), collectionName, &qdrant.CreateShardKey{
				ShardKey: qdrant.NewShardKey(shardDate),
			})
			existingShardKeys[shardDate] = true
		}

		currentDate = shardDate
	}

	// Add point to buffer
	buffer = append(buffer, &qdrant.PointStruct{
		Id: qdrant.NewID(uuid.New().String()),
		Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
			"dense_vector": qdrant.NewVectorDocument(&qdrant.Document{
				Text:  text,
				Model: denseModel,
			}),
		}),
		Payload: qdrant.NewValueMap(map[string]any{
			"text":     text,
			"datetime": datetime,
		}),
	})

	// Flush batch if buffer size exceeds batch size
	if len(buffer) >= batchSize {
		client.Upsert(context.Background(), &qdrant.UpsertPoints{
			CollectionName: collectionName,
			Points:         buffer,
			ShardKeySelector: &qdrant.ShardKeySelector{
				ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey(currentDate)},
			},
		})
		buffer = nil
	}
})

// Flush remaining partial batch
if len(buffer) > 0 {
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: collectionName,
		Points:         buffer,
		ShardKeySelector: &qdrant.ShardKeySelector{
			ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey(currentDate)},
		},
	})
}

queryText := "coffee"

result, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: queryText, Model: denseModel}),
	Using:          qdrant.PtrOf("dense_vector"),
	Limit:          qdrant.PtrOf(uint64(5)),
	ShardKeySelector: &qdrant.ShardKeySelector{
		ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey("2026-04-07")},
	},
})

for _, hit := range result {
	fmt.Println(hit)
}

result, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: queryText, Model: denseModel}),
	Using:          qdrant.PtrOf("dense_vector"),
	Limit:          qdrant.PtrOf(uint64(5)),
	ShardKeySelector: &qdrant.ShardKeySelector{
		ShardKeys: []*qdrant.ShardKey{
			qdrant.NewShardKey("2026-04-06"),
			qdrant.NewShardKey("2026-04-07"),
		},
	},
})

for _, hit := range result {
	fmt.Println(hit)
}

result, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: queryText, Model: denseModel}),
	Using:          qdrant.PtrOf("dense_vector"),
	Limit:          qdrant.PtrOf(uint64(5)),
})

for _, hit := range result {
	fmt.Println(hit)
}

today := "2026-04-08"
t, _ := time.Parse("2006-01-02", today)
oldestShardKey := t.AddDate(0, 0, -7).Format("2006-01-02")

client.CreateShardKey(context.Background(), collectionName, &qdrant.CreateShardKey{
	ShardKey: qdrant.NewShardKey(today),
})
client.DeleteShardKey(context.Background(), collectionName, &qdrant.DeleteShardKey{
	ShardKey: qdrant.NewShardKey(oldestShardKey),
})

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: collectionName,
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewID(uuid.New().String()),
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				"dense_vector": qdrant.NewVectorDocument(&qdrant.Document{
					Text:  "The best way to start a Wednesday is with a cup of coffee",
					Model: denseModel,
				}),
			}),
			Payload: qdrant.NewValueMap(map[string]any{
				"text":     "The best way to start a Wednesday is with a cup of coffee",
				"datetime": "2026-04-08T07:57:47",
			}),
		},
	},
	ShardKeySelector: &qdrant.ShardKeySelector{
		ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey(today)},
	},
})
```
