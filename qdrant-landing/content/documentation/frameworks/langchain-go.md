---
title: Langchain Go
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

Before you use the following code sample, customize the following values for your configuration:

- `YOUR_QDRANT_REST_URL`: If you've set up Qdrant using the [Quick Start](/documentation/quick-start/) guide,
  set this value to `http://localhost:6333`.
- `YOUR_COLLECTION_NAME`: Use our [Collections](/documentation/concepts/collections/) guide to create or
  list collections.

```go
package main

import (
    "log"
    "net/url"

    "github.com/tmc/langchaingo/embeddings"
    "github.com/tmc/langchaingo/llms/openai"
    "github.com/tmc/langchaingo/vectorstores/qdrant"
)

func main() {
    llm, err: = openai.New()
    if err != nil {
        log.Fatal(err)
    }

    e, err: = embeddings.NewEmbedder(llm)
    if err != nil {
        log.Fatal(err)
    }

    url, err: = url.Parse("YOUR_QDRANT_REST_URL")
    if err != nil {
        log.Fatal(err)
    }

    store, err: = qdrant.New(
        qdrant.WithURL( * url),
        qdrant.WithCollectionName("YOUR_COLLECTION_NAME"),
        qdrant.WithEmbedder(e),
    )
    if err != nil {
        log.Fatal(err)
    }
}
```

## Further Reading

- You can find usage examples of Langchain Go [here](https://github.com/tmc/langchaingo/tree/main/examples).

- [Source Code](https://github.com/tmc/langchaingo/tree/main/vectorstores/qdrant)
