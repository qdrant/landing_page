```go
import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
)

QDRANT_URL := os.Getenv("QDRANT_URL")
QDRANT_API_KEY := os.Getenv("QDRANT_API_KEY")

client, err := qdrant.NewClient(&qdrant.Config{
	Host:   QDRANT_URL,
	APIKey: QDRANT_API_KEY,
	UseTLS: true,
})

MODEL := "sentence-transformers/all-MiniLM-L6-v2"
PIPELINE := "docs-prep-pipeline-v1"
COLLECTION := "docs-sync-tutorial"

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: COLLECTION,
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     384, // all-MiniLM-L6-v2 output dimension
		Distance: qdrant.Distance_Cosine,
	}),
	Metadata: qdrant.NewValueMap(map[string]any{
		"embedding_model":  MODEL,
		"pipeline_version": PIPELINE,
	}),
})

checkGate := func() {
	// compare this pipeline's constants against what the collection records about itself
	info, err := client.GetCollectionInfo(context.Background(), COLLECTION)
	meta := info.GetConfig().GetMetadata()

	if meta["embedding_model"].GetStringValue() != MODEL || meta["pipeline_version"].GetStringValue() != PIPELINE {
		panic(fmt.Sprintf("collection was built by %v: full re-embed into a fresh collection required", meta))
	}
}

contentHash := func(text string) string {
	sum := sha256.Sum256([]byte(text))
	return hex.EncodeToString(sum[:])
}

pointID := func(url, anchor string, num int) string {
	// NewSHA1 with a namespace is UUIDv5; NameSpaceURL is a fixed constant it requires,
	// marking the input as a URL-like name
	return uuid.NewSHA1(uuid.NameSpaceURL, []byte(fmt.Sprintf("%s#%s::%d", url, anchor, num))).String()
}

// derive both values (and the section address) for every raw chunk
prepareChunksForSync := func(chunks []Chunk) []Chunk {
	out := make([]Chunk, 0, len(chunks))
	for _, c := range chunks {
		c.Text = normalize(c.Text)
		c.SectionURL = c.URL
		if c.Anchor != "" {
			c.SectionURL = c.URL + "#" + c.Anchor
		}
		c.ContentHash = contentHash(c.Text)
		c.PointID = pointID(c.URL, c.Anchor, c.ChunkNum)
		out = append(out, c)
	}
	return out
}

payload := func(c Chunk, lastUpdated string) map[string]any {
	if lastUpdated == "" {
		lastUpdated = time.Now().UTC().Format(time.RFC3339)
	}
	return map[string]any{
		"url":          c.URL,
		"anchor":       c.Anchor,
		"chunk_num":    c.ChunkNum,
		"section_url":  c.SectionURL,
		"text":         c.Text,
		"content_hash": c.ContentHash,
		"last_updated": lastUpdated,
	}
}

for _, field := range []string{"content_hash", "url", "section_url"} {
	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: COLLECTION,
		FieldName:      field,
		FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
	})
}

var points []*qdrant.PointStruct
for _, c := range prepareChunksForSync(CHUNKS) {
	points = append(points, &qdrant.PointStruct{
		Id: qdrant.NewID(c.PointID),

		Vectors: qdrant.NewVectorsDocument(&qdrant.Document{Text: c.Text, Model: MODEL}),
		Payload: qdrant.NewValueMap(payload(c, "")),
	})
}
client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: COLLECTION,
	Points:         points,
	Wait:           qdrant.PtrOf(true),
})

QUERY := "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?"

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: COLLECTION,
	Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: QUERY, Model: MODEL}),
	Limit:          qdrant.PtrOf(uint64(3)),
	WithPayload:    qdrant.NewWithPayloadInclude("section_url", "text"),
})

// compare the incoming chunk list to the collection: who is unchanged, changed, or unknown
splitByState := func(latestChunks []Chunk) (map[string]Chunk, []Chunk, []Chunk, []Chunk) {
	incoming := make(map[string]Chunk, len(latestChunks))
	ids := make([]*qdrant.PointId, 0, len(latestChunks))
	for _, c := range latestChunks {
		incoming[c.PointID] = c
		ids = append(ids, qdrant.NewID(c.PointID))
	}

	retrieved, err := client.Get(context.Background(), &qdrant.GetPoints{
		CollectionName: COLLECTION,
		Ids:            ids,
		WithPayload:    qdrant.NewWithPayloadInclude("content_hash"),
		WithVectors:    qdrant.NewWithVectors(false),
	})
	stored := make(map[string]string, len(retrieved))
	for _, p := range retrieved {
		stored[p.GetId().GetUuid()] = p.GetPayload()["content_hash"].GetStringValue()
	}

	var unchanged, contentChanged, unknownIDs []Chunk
	for pid, c := range incoming {
		storedHash, found := stored[pid]
		switch {
		case found && storedHash == c.ContentHash:
			unchanged = append(unchanged, c)
		case found:
			contentChanged = append(contentChanged, c)
		default:
			unknownIDs = append(unknownIDs, c)
		}
	}

	return incoming, unchanged, contentChanged, unknownIDs
}

incomingIDs, unchanged, contentChanged, unknownIDs := splitByState(LATEST_CHUNKS)

reEmbedChanged := func(contentChanged []Chunk) {
	if len(contentChanged) == 0 {
		return
	}
	points := make([]*qdrant.PointStruct, 0, len(contentChanged))
	for _, c := range contentChanged {
		points = append(points, &qdrant.PointStruct{
			Id:      qdrant.NewID(c.PointID),
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{Text: c.Text, Model: MODEL}),
			Payload: qdrant.NewValueMap(payload(c, "")),
		})
	}
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: COLLECTION,
		Points:         points,
		Wait:           qdrant.PtrOf(true),
	})
}

// reuse an existing embedding when the same text is already stored; embed only what is new
reuseOrAdd := func(unknownIDs []Chunk) (int, int) {
	reused, added := 0, 0

	for _, c := range unknownIDs {
		sameText := &qdrant.Filter{
			Must: []*qdrant.Condition{
				qdrant.NewMatch("content_hash", c.ContentHash),
			},
		}
		hits, err := client.Scroll(context.Background(), &qdrant.ScrollPoints{
			CollectionName: COLLECTION,
			Filter:         sameText,
			Limit:          qdrant.PtrOf(uint32(1)),
			WithPayload:    qdrant.NewWithPayloadInclude("last_updated"),
			WithVectors:    qdrant.NewWithVectors(true),
		})

		var point *qdrant.PointStruct
		if len(hits) > 0 { // same text, new address: copy the vector, keep its last_updated
			point = &qdrant.PointStruct{
				Id:      qdrant.NewID(c.PointID),
				Vectors: qdrant.NewVectors(hits[0].GetVectors().GetVector().GetData()...),
				Payload: qdrant.NewValueMap(payload(c, hits[0].GetPayload()["last_updated"].GetStringValue())),
			}
			reused++
		} else { // genuinely new content: embed and insert
			point = &qdrant.PointStruct{
				Id:      qdrant.NewID(c.PointID),
				Vectors: qdrant.NewVectorsDocument(&qdrant.Document{Text: c.Text, Model: MODEL}),
				Payload: qdrant.NewValueMap(payload(c, "")),
			}
			added++
		}

		client.Upsert(context.Background(), &qdrant.UpsertPoints{
			CollectionName: COLLECTION,
			Points:         []*qdrant.PointStruct{point},
			Wait:           qdrant.PtrOf(true),
		})
	}

	return reused, added
}

// remove every point the current crawl no longer contains, return how many
deleteGone := func(incomingIDs map[string]Chunk) int {
	if len(incomingIDs) == 0 {
		panic("Refusing to delete from an empty source snapshot.")
	}

	ids := make([]*qdrant.PointId, 0, len(incomingIDs))
	for pid := range incomingIDs {
		ids = append(ids, qdrant.NewID(pid))
	}
	stale := &qdrant.Filter{
		MustNot: []*qdrant.Condition{qdrant.NewHasID(ids...)},
	}

	toDelete, err := client.Count(context.Background(), &qdrant.CountPoints{
		CollectionName: COLLECTION,
		Filter:         stale,
	})

	// potential check against a threshold to avoid accidental mass deletion could be added here
	client.Delete(context.Background(), &qdrant.DeletePoints{
		CollectionName: COLLECTION,
		Points:         qdrant.NewPointsSelectorFilter(stale),
		Wait:           qdrant.PtrOf(true),
	})
	return int(toDelete)
}

sync := func(latestChunks []Chunk) map[string]int {
	checkGate() // refuse to mix embedding models or pipeline versions

	chunks := prepareChunksForSync(latestChunks)
	incomingIDs, unchanged, contentChanged, unknownIDs := splitByState(chunks)

	reEmbedChanged(contentChanged)
	reused, added := reuseOrAdd(unknownIDs)
	deleted := deleteGone(incomingIDs)

	return map[string]int{
		"unchanged":        len(unchanged),
		"re-embedded":      len(contentChanged),
		"reused_embedding": reused,
		"added":            added,
		"deleted":          deleted,
	}
}

run := sync(LATEST_CHUNKS)
fmt.Println(run)
```
