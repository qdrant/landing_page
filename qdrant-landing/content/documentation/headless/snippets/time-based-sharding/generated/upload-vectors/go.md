```go
csvUrl := "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv"

shardKeyDescriptions, err := client.ListShardKeys(context.Background(), collectionName)

existingShardKeys := make(map[string]bool)
for _, desc := range shardKeyDescriptions {
	existingShardKeys[desc.Key.GetKeyword()] = true
}

denseModel := "sentence-transformers/all-MiniLM-L6-v2"
batchSize := 100
var currentDate string
var buffer []*qdrant.PointStruct

resp, err := http.Get(csvUrl)
defer resp.Body.Close()

csvReader := csv.NewReader(resp.Body)
headers, err := csvReader.Read()

for {
	row, err := csvReader.Read()
	if err == io.EOF {
		break
	}

	text := row[textIdx]
	datetime := row[datetimeIdx]
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
}

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
```
