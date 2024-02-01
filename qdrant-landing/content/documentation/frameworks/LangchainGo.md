---
title: Langchain Go
weight: 2200
---

# Langchain Go

[Langchain Go](https://tmc.github.io/langchaingo/docs/) is a framework for developing data-aware applications powered by language models in Go.

You can use Qdrant as a vector store in Langchain Go.

## Setup

Install the `langchain-go` project dependency

```bash
go get -u github.com/tmc/langchaingo
```

## Usage

```go
import (
        "fmt"
        "log"

        "github.com/tmc/langchaingo/embeddings"
        "github.com/tmc/langchaingo/llms/openai"
        "github.com/tmc/langchaingo/vectorstores"
        "github.com/tmc/langchaingo/vectorstores/qdrant"
)

 llm, err := openai.New()
 if err != nil {
  log.Fatal(err)
 }

 e, err := embeddings.NewEmbedder(llm)
 if err != nil {
  log.Fatal(err)
 }

 url, err := url.Parse("YOUR_QDRANT_REST_URL")
 if err != nil {
  log.Fatal(err)
 }

 store, err := qdrant.New(
  qdrant.WithURL(*url),
  qdrant.WithCollectionName("YOUR_COLLECTION_NAME"),
  qdrant.WithEmbedder(e),
 )
 if err != nil {
  log.Fatal(err)
 }
```

## Further Reading

- You can find usage examples of Langchain Go [here](https://github.com/tmc/langchaingo/tree/main/examples).
