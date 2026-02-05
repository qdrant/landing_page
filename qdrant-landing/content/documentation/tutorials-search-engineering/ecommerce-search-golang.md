---
title: E-commerce Search with Go
weight: 190
social_preview_image: /documentation/examples/ecommerce-search-golang/social_preview.png
---

# Build an E-commerce Search Engine with Go and Qdrant

| Time: 20 min | Level: Intermediate | Output: [GitHub](https://github.com/qdrant/examples/tree/master/ecommerce-search-golang) |
| --- | ----------- | ----------- |

E-commerce search needs to handle high throughput, low latencies, and capture user intent beyond simple keyword matching. This tutorial shows you how to build a high-performance product search API using **Go**, **Qdrant**, and [**Qdrant Cloud Inference**](https://qdrant.tech/cloud-inference/).

You'll create a backend service that lets users search through 105,000 H&M fashion products using natural language queries like "comfortable summer dress" or "warm winter jacket for hiking."

## Overview

In this tutorial, you will:

1. Set up a Qdrant Cloud cluster with Inference enabled.
2. Stream the H&M e-commerce dataset from Hugging Face using DuckDB.
3. Load product data into Qdrant using OpenAI embeddings via Cloud Inference.
4. Build a Go HTTP server with Gin that exposes search endpoints.
5. Test the search API with curl.

#### Architecture:

![architecture](/documentation/examples/ecommerce-search-golang/architecture.svg)

The system has two main components:

**Data Ingestion (top)**: DuckDB streams parquet data directly from Hugging Face over HTTP. Products are batched and upserted into Qdrant, with embeddings generated via OpenAI through Qdrant's inference proxy.

**Search API (bottom)**: A Gin HTTP server accepts search queries, uses the same OpenAI model via Qdrant to embed the query text, and returns matching products.

---

## Prerequisites

Before starting, ensure you have:

- Go 1.21 or later installed
- A [Qdrant Cloud](https://cloud.qdrant.io) account (free tier works)
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Set Up Qdrant Cloud

Create a free cluster at [cloud.qdrant.io](https://cloud.qdrant.io). Once your cluster is ready, note down:

- **Cluster URL**: `xyz-example.region.cloud.qdrant.io`
- **API Key**: Generated when creating the cluster

Qdrant Cloud can proxy requests to external embedding providers like OpenAI. This means you can send text directly to Qdrant, and it will handle the embedding generation using your OpenAI API key. No separate embedding service required.

## The Dataset

We'll use the [Qdrant/hm_ecommerce_products](https://huggingface.co/datasets/Qdrant/hm_ecommerce_products) dataset from Hugging Face. It contains 105,000 H&M fashion products with:

| Field | Description |
|-------|-------------|
| `article_id` | Unique product identifier |
| `prod_name` | Product name (e.g., "Strap top") |
| `product_type_name` | Category (e.g., "Vest top") |
| `colour_group_name` | Color (e.g., "Black") |
| `detail_desc` | Full product description |
| `image_url` | Product image URL |

## Project Structure

We provide a complete example on [GitHub](https://github.com/qdrant/examples/tree/master/ecommerce-search-golang). Here's how to set up your Go project.

```bash
mkdir ecommerce-search && cd ecommerce-search
go mod init ecommerce-search
```

Install dependencies:

```bash
go get github.com/gin-gonic/gin
go get github.com/qdrant/go-client/qdrant@v1.16.2
go get github.com/duckdb/duckdb-go/v2
go get github.com/schollz/progressbar/v3
```

Your project will have this structure:

```
ecommerce-search/
├── cmd/
│   ├── ingest/
│   │   └── main.go      # Data loading script
│   └── server/
│       └── main.go      # HTTP server
├── go.mod
└── go.sum
```

You can quickly make this the following script:
```bash
mkdir -p cmd/ingest cmd/server
touch cmd/ingest/main.go cmd/server/main.go
```

---

## Part 1: Data Ingestion with DuckDB

The ingestion script uses DuckDB to stream parquet data directly from Hugging Face—no need to download files first. DuckDB's `httpfs` extension handles HTTP range requests efficiently, only fetching the data we need.

We'll use parallel workers to speed up the upsert process, with a progress bar to track ingestion.

Create `cmd/ingest/main.go`:

```go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"sync"

	_ "github.com/duckdb/duckdb-go/v2"
	"github.com/qdrant/go-client/qdrant"
	"github.com/schollz/progressbar/v3"
)

const (
	collectionName    = "products"
	batchSize         = 100
	defaultNumWorkers = 4
	datasetURL        = "https://huggingface.co/api/datasets/Qdrant/hm_ecommerce_products/parquet/default/train/0.parquet"
)

func main() {
	qdrantHost := os.Getenv("QDRANT_HOST")
	qdrantAPIKey := os.Getenv("QDRANT_API_KEY")
	openaiAPIKey := os.Getenv("OPENAI_API_KEY")

	if qdrantHost == "" || qdrantAPIKey == "" || openaiAPIKey == "" {
		log.Fatal("QDRANT_HOST, QDRANT_API_KEY, and OPENAI_API_KEY environment variables must be set")
	}

	numWorkers := defaultNumWorkers
	if nw := os.Getenv("NUM_WORKERS"); nw != "" {
		if n, err := strconv.Atoi(nw); err == nil && n > 0 {
			numWorkers = n
		}
	}
	log.Printf("Using %d workers", numWorkers)

	ctx := context.Background()

	// Connect to Qdrant
	log.Println("Connecting to Qdrant...")
	qdrantClient, err := qdrant.NewClient(&qdrant.Config{
		Host:   qdrantHost,
		APIKey: qdrantAPIKey,
		Port:   6334,
		UseTLS: true,
	})
	if err != nil {
		log.Fatalf("Failed to connect to Qdrant: %v", err)
	}
	defer qdrantClient.Close()

	// Create collection
	if err := createCollection(ctx, qdrantClient); err != nil {
		log.Fatalf("Failed to create collection: %v", err)
	}

	// Open DuckDB (in-memory)
	log.Println("Opening DuckDB...")
	db, err := sql.Open("duckdb", "")
	if err != nil {
		log.Fatalf("Failed to open DuckDB: %v", err)
	}
	defer db.Close()

	// Install and load httpfs extension for HTTP parquet access
	log.Println("Installing and loading httpfs extension...")
	if _, err := db.Exec("INSTALL httpfs; LOAD httpfs;"); err != nil {
		log.Fatalf("Failed to load httpfs extension: %v", err)
	}

	// Stream products from Hugging Face and upsert to Qdrant
	if err := streamAndUpsert(ctx, db, qdrantClient, openaiAPIKey, numWorkers); err != nil {
		log.Fatalf("Failed to ingest data: %v", err)
	}

	fmt.Println("\nData ingestion complete!")
}

func createCollection(ctx context.Context, client *qdrant.Client) error {
	exists, err := client.CollectionExists(ctx, collectionName)
	if err != nil {
		return err
	}

	if exists {
		log.Printf("Collection '%s' already exists, skipping creation", collectionName)
		return nil
	}

	// OpenAI text-embedding-3-small produces 1536-dimensional vectors
	err = client.CreateCollection(ctx, &qdrant.CreateCollection{
		CollectionName: collectionName,
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     1536,
			Distance: qdrant.Distance_Cosine,
		}),
	})
	if err != nil {
		return err
	}

	log.Printf("Created collection: %s", collectionName)
	return nil
}

func streamAndUpsert(ctx context.Context, db *sql.DB, qdrantClient *qdrant.Client, openaiAPIKey string, numWorkers int) error {
	// Get total count for progress bar
	log.Println("Getting total row count...")
	var totalRows int
	countQuery := `SELECT COUNT(*) FROM read_parquet('` + datasetURL + `')`
	if err := db.QueryRow(countQuery).Scan(&totalRows); err != nil {
		return fmt.Errorf("failed to get row count: %w", err)
	}
	log.Printf("Total products to ingest: %d", totalRows)

	// Query parquet directly from Hugging Face URL
	query := `
		SELECT
			article_id,
			prod_name,
			product_type_name,
			colour_group_name,
			detail_desc,
			image_url
		FROM read_parquet('` + datasetURL + `')
	`

	rows, err := db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	// Create progress bar
	bar := progressbar.NewOptions(totalRows,
		progressbar.OptionSetDescription("Ingesting products"),
		progressbar.OptionSetTheme(progressbar.Theme{
			Saucer:        "=",
			SaucerHead:    ">",
			SaucerPadding: " ",
			BarStart:      "[",
			BarEnd:        "]",
		}),
		progressbar.OptionShowCount(),
		progressbar.OptionShowIts(),
		progressbar.OptionSetWidth(40),
	)

	// Channel for batches to upsert
	batchChan := make(chan []*qdrant.PointStruct, numWorkers*2)
	errChan := make(chan error, 1)
	var wg sync.WaitGroup

	// Start worker goroutines
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for batch := range batchChan {
				if _, err := qdrantClient.GetPointsClient().Upsert(ctx, &qdrant.UpsertPoints{
					CollectionName: collectionName,
					Points:         batch,
				}); err != nil {
					select {
					case errChan <- err:
					default:
					}
					return
				}
				bar.Add(len(batch))
			}
		}()
	}

	var points []*qdrant.PointStruct
	var totalCount int

	for rows.Next() {
		// Check for worker errors
		select {
		case err := <-errChan:
			close(batchChan)
			return err
		default:
		}

		var (
			articleID       string
			prodName        string
			productTypeName string
			colourGroupName string
			detailDesc      string
			imageURL        string
		)

		err := rows.Scan(
			&articleID,
			&prodName,
			&productTypeName,
			&colourGroupName,
			&detailDesc,
			&imageURL,
		)
		if err != nil {
			continue
		}

		// Create text for embedding: combine name, type, and description
		text := fmt.Sprintf("%s - %s - %s", prodName, productTypeName, detailDesc)

		totalCount++
		point := &qdrant.PointStruct{
			Id: qdrant.NewIDNum(uint64(totalCount)),
			// Use Qdrant's inference proxy to generate embeddings via OpenAI
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
				Text:  text,
				Model: "openai/text-embedding-3-small",
				Options: map[string]*qdrant.Value{
					"openai-api-key": qdrant.NewValueString(openaiAPIKey),
				},
			}),
			Payload: qdrant.NewValueMap(map[string]any{
				"article_id":        articleID,
				"prod_name":         prodName,
				"product_type_name": productTypeName,
				"colour_group_name": colourGroupName,
				"detail_desc":       detailDesc,
				"image_url":         imageURL,
			}),
		}
		points = append(points, point)

		// Send batch to workers
		if len(points) >= batchSize {
			batchChan <- points
			points = make([]*qdrant.PointStruct, 0, batchSize)
		}
	}

	// Send remaining points
	if len(points) > 0 {
		batchChan <- points
	}

	// Close channel and wait for workers
	close(batchChan)
	wg.Wait()

	// Check for any final errors
	select {
	case err := <-errChan:
		return err
	default:
	}

	return rows.Err()
}
```

The key part is how we use Qdrant's inference proxy to generate embeddings:

```go
Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
    Text:  text,
    Model: "openai/text-embedding-3-small",
    Options: map[string]*qdrant.Value{
        "openai-api-key": qdrant.NewValueString(openaiAPIKey),
    },
}),
```

By prefixing the model name with `openai/`, Qdrant automatically routes the embedding request to OpenAI's API. The embeddings are generated server-side, and Qdrant stores the resulting vectors. Your OpenAI API key is passed per-request and never stored by Qdrant.

### Running the Ingestion

Set your environment variables and run:

```bash
export QDRANT_HOST="xyz-example.region.cloud.qdrant.io"
export QDRANT_API_KEY="your-qdrant-api-key"
export OPENAI_API_KEY="your-openai-api-key"
export NUM_WORKERS=8  # Optional: increase for faster ingestion

go run cmd/ingest/main.go
```

You'll see a progress bar as products are ingested:

```
Using 8 workers
Connecting to Qdrant...
Created collection: products
Opening DuckDB...
Installing and loading httpfs extension...
Getting total row count...
Total products to ingest: 105542
Ingesting products [===================>                    ] 52771/105542 [12.3/s]
```

---

## Part 2: Search API with Gin

Now let's build the HTTP server using Gin. The server exposes a `/search` endpoint that uses the same OpenAI model via Qdrant's inference proxy to embed query text at search time.

Create `cmd/server/main.go`:

```go
package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/qdrant/go-client/qdrant"
)

const (
	collectionName = "products"
	version        = "1.0.0"
)

var (
	qdrantClient *qdrant.Client
	openaiAPIKey string
)

func main() {
	qdrantHost := os.Getenv("QDRANT_HOST")
	qdrantAPIKey := os.Getenv("QDRANT_API_KEY")
	openaiAPIKey = os.Getenv("OPENAI_API_KEY")

	if qdrantHost == "" || qdrantAPIKey == "" || openaiAPIKey == "" {
		log.Fatal("QDRANT_HOST, QDRANT_API_KEY, and OPENAI_API_KEY environment variables must be set")
	}

	// Connect to Qdrant
	var err error
	qdrantClient, err = qdrant.NewClient(&qdrant.Config{
		Host:   qdrantHost,
		APIKey: qdrantAPIKey,
		Port:   6334,
		UseTLS: true,
	})
	if err != nil {
		log.Fatalf("Failed to connect to Qdrant: %v", err)
	}
	defer qdrantClient.Close()

	// Setup Gin router
	r := gin.Default()

	r.GET("/health", healthHandler)
	r.POST("/search", searchHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"version": version,
	})
}

type SearchRequest struct {
	Query string `json:"query" binding:"required"`
	TopK  int    `json:"top_k"`
}

type ProductPayload struct {
	ArticleID       string `json:"article_id"`
	ProdName        string `json:"prod_name"`
	ProductTypeName string `json:"product_type_name"`
	ColourGroupName string `json:"colour_group_name"`
	DetailDesc      string `json:"detail_desc"`
	ImageURL        string `json:"image_url"`
}

type SearchPoint struct {
	ID      uint64         `json:"id"`
	Payload ProductPayload `json:"payload"`
	Score   float32        `json:"score"`
}

func searchHandler(c *gin.Context) {
	var req SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query field is required"})
		return
	}

	topK := req.TopK
	if topK <= 0 {
		topK = 10
	}
	if topK > 100 {
		topK = 100
	}

	ctx := context.Background()

	// Query Qdrant using document-based vector (inference proxy)
	points, err := qdrantClient.Query(ctx, &qdrant.QueryPoints{
		CollectionName: collectionName,
		Query: qdrant.NewQueryNearest(
			qdrant.NewVectorInputDocument(&qdrant.Document{
				Text:  req.Query,
				Model: "openai/text-embedding-3-small",
				Options: map[string]*qdrant.Value{
					"openai-api-key": qdrant.NewValueString(openaiAPIKey),
				},
			}),
		),
		Limit:       qdrant.PtrOf(uint64(topK)),
		WithPayload: qdrant.NewWithPayload(true),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Transform results
	searchPoints := make([]SearchPoint, 0, len(points))
	for _, point := range points {
		payload := point.Payload
		searchPoints = append(searchPoints, SearchPoint{
			ID: point.Id.GetNum(),
			Payload: ProductPayload{
				ArticleID:       getStringPayload(payload, "article_id"),
				ProdName:        getStringPayload(payload, "prod_name"),
				ProductTypeName: getStringPayload(payload, "product_type_name"),
				ColourGroupName: getStringPayload(payload, "colour_group_name"),
				DetailDesc:      getStringPayload(payload, "detail_desc"),
				ImageURL:        getStringPayload(payload, "image_url"),
			},
			Score: point.Score,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"query": req.Query,
		"results": gin.H{
			"points": searchPoints,
		},
	})
}

func getStringPayload(payload map[string]*qdrant.Value, key string) string {
	if v, ok := payload[key]; ok {
		return v.GetStringValue()
	}
	return ""
}
```

The search query uses the same inference proxy pattern:

```go
Query: qdrant.NewQueryNearest(
    qdrant.NewVectorInputDocument(&qdrant.Document{
        Text:  req.Query,
        Model: "openai/text-embedding-3-small",
        Options: map[string]*qdrant.Value{
            "openai-api-key": qdrant.NewValueString(openaiAPIKey),
        },
    }),
),
```

This sends the query text to Qdrant, which generates the embedding via OpenAI and performs the vector search—all in a single round trip.

---

## Running the Server

Start the server:

```bash
export QDRANT_HOST="xyz-example.region.cloud.qdrant.io"
export QDRANT_API_KEY="your-qdrant-api-key"
export OPENAI_API_KEY="your-openai-api-key"

go run cmd/server/main.go
```

Output:

```
Server starting on port 8080
```

## Testing the API

Check health:

```bash
curl http://localhost:8080/health
```

```json
{"status":"ok","version":"1.0.0"}
```

Search for products:

```bash
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"query": "comfortable summer dress", "top_k": 3}'
```

```json
{
  "query": "comfortable summer dress",
  "results": {
    "points": [
      {
        "id": 45672,
        "payload": {
          "article_id": "0456372003",
          "prod_name": "Jersey dress",
          "product_type_name": "Dress",
          "colour_group_name": "Light Blue",
          "detail_desc": "Short dress in soft cotton jersey with a round neckline...",
          "image_url": "https://..."
        },
        "score": 0.82
      },
      {
        "id": 52311,
        "payload": {
          "article_id": "0523117001",
          "prod_name": "Cotton dress",
          "product_type_name": "Dress",
          "colour_group_name": "White",
          "detail_desc": "Sleeveless dress in woven cotton fabric...",
          "image_url": "https://..."
        },
        "score": 0.79
      }
    ]
  }
}
```

Try different queries:

```bash
# Search for winter clothing
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"query": "warm winter jacket", "top_k": 5}'

# Search by style
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"query": "casual office wear for men", "top_k": 5}'
```

---

## Docker Deployment

For production, you can containerize the application. Here's the Docker setup:

**Dockerfile.server**:

```dockerfile
FROM golang:1.23-alpine AS builder

WORKDIR /app
RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 go build -o server ./cmd/server

FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]
```

**Dockerfile.ingest**:

```dockerfile
FROM golang:1.23-alpine AS builder

WORKDIR /app
RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 go build -o ingest ./cmd/ingest

FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/ingest .

ENV NUM_WORKERS="4"
CMD ["./ingest"]
```

**docker-compose.yml**:

```yaml
services:
  server:
    build:
      context: .
      dockerfile: Dockerfile.server
    ports:
      - "8080:8080"
    environment:
      - QDRANT_HOST=${QDRANT_HOST}
      - QDRANT_API_KEY=${QDRANT_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - PORT=8080
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - BACKEND_URL=http://server:8080
    ports:
      - "3000:3000"
    environment:
      - BACKEND_URL=http://server:8080
    depends_on:
      - server
    restart: unless-stopped
```

Create a `.env` file:

```bash
QDRANT_HOST=xyz-example.region.cloud.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
OPENAI_API_KEY=your-openai-api-key
```

Run with Docker Compose:

```bash
docker-compose up
```

---

## Next Steps

You now have a working e-commerce search API. Here are some ways to extend it:

- **Add filters**: Filter by color, category, or price range using Qdrant's [filtering](/documentation/concepts/filtering/)
- **Hybrid search**: Combine dense vectors with [BM25 sparse vectors](/documentation/guides/text-search/) for better keyword matching
- **Image search**: Use a multimodal model like CLIP to enable search-by-image
- **Recommendations**: Implement "similar products" using point-based queries

## Full Example

The complete implementation with a React frontend is available on GitHub:

**[qdrant/examples/ecommerce-search-golang](https://github.com/qdrant/examples/tree/master/ecommerce-search-golang)**

```bash
git clone https://github.com/qdrant/examples.git
cd examples/ecommerce-search-golang
docker-compose up
```

This spins up the Go backend and a React frontend with product images at `http://localhost:3000`.