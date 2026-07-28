```go
import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
)

// The Go client takes a host and port rather than a URL, so only the API key is read
// from the environment. Replace the host with your own from https://cloud.qdrant.io
client, err := qdrant.NewClient(&qdrant.Config{
	Host:   "xyz-example.qdrant.io",
	APIKey: os.Getenv("QDRANT_API_KEY"),
	UseTLS: true,
})

type Chunk struct {
	URL         string
	Anchor      string
	ChunkNum    int
	Text        string
	SectionURL  string // derived in prepare
	ContentHash string // derived in prepare
	PointID     string // derived in prepare
}

CHUNKS := []Chunk{
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "prerequisites",
		ChunkNum: 0,
		Text:     "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...",
	},
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "step-2-enable-tls",
		ChunkNum: 0,
		Text:     "Step 2: Enable TLS. Generate a local self-signed certificate and point Qdrant at it ...",
	},
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "step-3-enable-an-admin-api-key",
		ChunkNum: 0,
		Text:     "Step 3: Enable an Admin API Key. Without authentication, anyone with network access ...",
	},
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

// Attach the derived values every later step depends on.
prepare := func(chunks []Chunk) []Chunk {
	out := make([]Chunk, 0, len(chunks))
	for _, c := range chunks {
		// Run c.Text through your normalization pass before hashing it.
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

const N_BUCKETS = 16 // use something much larger in production
const GROUP_SIZE = 4 // bucket digests packed per summary point; 16 / 4 = 4 groups

bucket := func(pid string) int {
	sum := sha256.Sum256([]byte(pid))
	full := new(big.Int).SetBytes(sum[:]) // the whole 256-bit hash as one number
	return int(full.Mod(full, big.NewInt(N_BUCKETS)).Int64())
}

for _, c := range prepare(CHUNKS) {
	fmt.Println(bucket(c.PointID), c.PointID, c.SectionURL)
}

chunkDigest := func(pid, chash string) uint64 {
	// First 15 hex digits of the combined hash = a 60-bit number.
	// 60 bits fits Qdrant's signed 64-bit integer payload, so digests store as plain integers.
	sum := sha256.Sum256([]byte(pid + chash))
	combined := hex.EncodeToString(sum[:])
	digest, err := strconv.ParseUint(combined[:15], 16, 64)
	return digest
}

computeDigests := func(chunks []Chunk) []uint64 {
	digests := make([]uint64, N_BUCKETS)
	for _, c := range chunks {
		b := bucket(c.PointID)
		digests[b] ^= chunkDigest(c.PointID, c.ContentHash)
	}
	return digests
}

computeDigests(prepare(CHUNKS))

MAIN := "docs-sync-scale"
MODEL := "sentence-transformers/all-MiniLM-L6-v2"

mainExists, err := client.CollectionExists(context.Background(), MAIN)
if !mainExists {
	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: MAIN,
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     384,
			Distance: qdrant.Distance_Cosine,
		}),
		Metadata: qdrant.NewValueMap(map[string]any{
			"embedding_model":  MODEL,
			"pipeline_version": "1",
		}),
	})
	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: MAIN,
		FieldName:      "sync_bucket",
		FieldType:      qdrant.FieldType_FieldTypeInteger.Enum(),
	})
}

payload := func(c Chunk) map[string]any {
	return map[string]any{
		"url":          c.URL,
		"anchor":       c.Anchor,
		"chunk_num":    c.ChunkNum,
		"section_url":  c.SectionURL,
		"text":         c.Text,
		"content_hash": c.ContentHash,
		"sync_bucket":  bucket(c.PointID),
	}
}

asPoints := func(chunks []Chunk) []*qdrant.PointStruct {
	points := make([]*qdrant.PointStruct, 0, len(chunks))
	for _, c := range chunks {
		points = append(points, &qdrant.PointStruct{
			Id: qdrant.NewID(c.PointID),
			// embedded by Qdrant Cloud Inference
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{Text: c.Text, Model: MODEL}),
			Payload: qdrant.NewValueMap(payload(c)),
		})
	}
	return points
}

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: MAIN,
	Points:         asPoints(prepare(CHUNKS)),
	Wait:           qdrant.PtrOf(true),
})

META := "docs-sync-digests"
N_META := N_BUCKETS / GROUP_SIZE

metaExists, err := client.CollectionExists(context.Background(), META)
if !metaExists {
	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: META,
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     1,
			Distance: qdrant.Distance_Cosine,
		}),
	})
}

// Store bucket digests in the summary collection, one point per group.
// digests: the full list of N_BUCKETS digests.
// groups:  which group points to rewrite; nil rewrites all of them.
writeMeta := func(digests []uint64, groups []int) {
	if groups == nil {
		for g := 0; g < N_META; g++ {
			groups = append(groups, g)
		}
	}

	points := make([]*qdrant.PointStruct, 0, len(groups))
	for _, g := range groups {
		// group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
		start := g * GROUP_SIZE
		groupDigests := make([]any, 0, GROUP_SIZE)
		for _, digest := range digests[start : start+GROUP_SIZE] {
			groupDigests = append(groupDigests, digest)
		}
		points = append(points, &qdrant.PointStruct{
			Id:      qdrant.NewIDNum(uint64(g)),
			Vectors: qdrant.NewVectors(1.0), // dummy: this collection is never searched
			Payload: qdrant.NewValueMap(map[string]any{"group": g, "digests": groupDigests}),
		})
	}
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: META,
		Points:         points,
		Wait:           qdrant.PtrOf(true),
	})
}

// Read the summary back as a flat list of N_BUCKETS digests.
readMeta := func() []uint64 {
	digests := make([]uint64, N_BUCKETS)
	ids := make([]*qdrant.PointId, 0, N_META)
	for g := 0; g < N_META; g++ {
		ids = append(ids, qdrant.NewIDNum(uint64(g)))
	}

	points, err := client.Get(context.Background(), &qdrant.GetPoints{
		CollectionName: META,
		Ids:            ids,
		WithPayload:    qdrant.NewWithPayload(true),
	})

	for _, point := range points {
		g := int(point.GetPayload()["group"].GetIntegerValue())
		for slot, digest := range point.GetPayload()["digests"].GetListValue().GetValues() {
			digests[g*GROUP_SIZE+slot] = uint64(digest.GetIntegerValue())
		}
	}
	return digests
}

writeMeta(computeDigests(prepare(CHUNKS)), nil)
readMeta()

LATEST := []Chunk{
	// unchanged
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "prerequisites",
		ChunkNum: 0,
		Text:     "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...",
	},
	// edited text
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "step-2-enable-tls",
		ChunkNum: 0,
		Text:     "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ...",
	},
	// step-3 removed; new step-4 added
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "step-4-restrict-access",
		ChunkNum: 0,
		Text:     "Step 4: Restrict access with read-only API keys for untrusted clients ...",
	},
}

latest := prepare(LATEST)
source := computeDigests(latest) // digests of the edited source
stored := readMeta()             // digests Qdrant currently holds

var changedBuckets []int
for b := 0; b < N_BUCKETS; b++ {
	if source[b] != stored[b] {
		changedBuckets = append(changedBuckets, b)
	}
}

fmt.Println(changedBuckets)

// Return a map of point ID to content hash for every chunk stored in bucket b.
// Pages through the results so nothing is missed in a large bucket.
readBucket := func(b int) map[string]string {
	stored := make(map[string]string)
	var offset *qdrant.PointId
	for {
		points, next, err := client.ScrollAndOffset(context.Background(), &qdrant.ScrollPoints{
			CollectionName: MAIN,
			Filter: &qdrant.Filter{
				Must: []*qdrant.Condition{qdrant.NewMatchInt("sync_bucket", int64(b))},
			},
			WithPayload: qdrant.NewWithPayloadInclude("content_hash"),
			WithVectors: qdrant.NewWithVectors(false),
			Limit:       qdrant.PtrOf(uint32(1000)),
			Offset:      offset,
		})

		for _, point := range points {
			stored[point.GetId().GetUuid()] = point.GetPayload()["content_hash"].GetStringValue()
		}
		if next == nil {
			return stored
		}
		offset = next
	}
}

// Make bucket b in Qdrant match sourceChunks. Returns (added, reEmbedded, deleted).
reconcileBucket := func(b int, sourceChunks map[string]Chunk) (int, int, int) {
	stored := readBucket(b) // point ID -> content hash currently in Qdrant

	var toWrite []Chunk // new or content-changed chunks: embed and upsert
	added, reEmbedded := 0, 0
	for pid, chunk := range sourceChunks {
		storedHash, found := stored[pid]
		if !found {
			toWrite = append(toWrite, chunk) // new chunk in this bucket
			added++
		} else if storedHash != chunk.ContentHash {
			toWrite = append(toWrite, chunk) // same chunk, changed text
			reEmbedded++
		}
	}

	var toDelete []*qdrant.PointId // chunks Qdrant has but the source no longer does
	for pid := range stored {
		if _, found := sourceChunks[pid]; !found {
			toDelete = append(toDelete, qdrant.NewID(pid))
		}
	}

	if len(toWrite) > 0 {
		client.Upsert(context.Background(), &qdrant.UpsertPoints{
			CollectionName: MAIN,
			Points:         asPoints(toWrite),
			Wait:           qdrant.PtrOf(true),
		})
	}
	if len(toDelete) > 0 {
		client.Delete(context.Background(), &qdrant.DeletePoints{
			CollectionName: MAIN,
			Points:         qdrant.NewPointsSelectorIDs(toDelete),
			Wait:           qdrant.PtrOf(true),
		})
	}

	return added, reEmbedded, len(toDelete)
}

sync := func(latestChunks []Chunk) map[string]any {
	latest := prepare(latestChunks)

	// group the source chunks by bucket once
	sourceByBucket := make(map[int]map[string]Chunk)
	for _, c := range latest {
		b := bucket(c.PointID)
		if sourceByBucket[b] == nil {
			sourceByBucket[b] = make(map[string]Chunk)
		}
		sourceByBucket[b][c.PointID] = c
	}

	// steps 1-3: which buckets changed
	source := computeDigests(latest)
	stored := readMeta()
	changed := make([]int, 0) // non-nil: an empty list must not mean "rewrite every group"
	for b := 0; b < N_BUCKETS; b++ {
		if source[b] != stored[b] {
			changed = append(changed, b)
		}
	}

	// step 4: reconcile each changed bucket
	added, reEmbedded, deleted := 0, 0, 0
	for _, b := range changed {
		a, r, d := reconcileBucket(b, sourceByBucket[b])
		added += a
		reEmbedded += r
		deleted += d
	}

	// step 5: rewrite only the changed groups of the summary, after the data writes
	changedGroups := make([]int, 0)
	seen := make(map[int]bool)
	for _, b := range changed {
		g := b / GROUP_SIZE
		if !seen[g] {
			seen[g] = true
			changedGroups = append(changedGroups, g)
		}
	}
	writeMeta(source, changedGroups)

	return map[string]any{
		"changed_buckets": changed,
		"added":           added,
		"re_embedded":     reEmbedded,
		"deleted":         deleted,
	}
}

fmt.Println(sync(LATEST))
```
