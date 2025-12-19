---
title: Swiftide
---


# Swiftide

Swiftide is a Rust library for building LLM applications. It supports everything from simple prompt completions to fast, streaming indexing and querying pipelines, and building composable agents that use tools or call other agents.

## High level features

- Simple primitives for common LLM tasks
- Streaming indexing and querying pipelines
- Composable agents and pipelines
- Modular, extendable API with minimal abstractions
- Integrations with popular LLMs and storage providers
- Built-in pipeline transformations (or bring your own)
- Graph-like workflows with Tasks
- [Langfuse](https://langfuse.com) support

---

## Installation

Install Swiftide with Qdrant, OpenAI, and Redis support:

```console
cargo add swiftide --features=qdrant,openai,redis
```

_Note that Swiftide comes barebones by default, so you need to enable features for the integrations you want to use._

---

## Indexing Example (Step by Step)

This example indexes `.rs` files using Swiftide with Qdrant as vector storage.

```rust
use swiftide::{
    indexing,
    indexing::LanguageModelWithBackOff,
    indexing::loaders::FileLoader,
    indexing::transformers::{ChunkCode, Embed, MetadataQACode},
    integrations::{self, qdrant::Qdrant, redis::Redis},
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // 1. Set up OpenAI client for embedding and prompt models
    let openai_client = integrations::openai::OpenAI::builder()
        .default_embed_model("text-embedding-3-small")
        .default_prompt_model("gpt-3.5-turbo")
        .build()?;

    // 3. Set up Redis for caching which files/chunks are already processed
    let redis_url = std::env::var("REDIS_URL")
        .as_deref()
        .unwrap_or("redis://localhost:6379")
        .to_owned();

    indexing::Pipeline::from_loader(FileLoader::new(".").with_extensions(&["rs"]))
        // 4. Skip files/chunks already indexed (cached in Redis)
        .filter_cached(Redis::try_from_url(redis_url, "swiftide-examples")?)
        // 5. Generate metadata Q&A for code chunks, using LLM
        .then(MetadataQACode::new(openai_client.clone()))
        // 6. Split code into chunks suitable for embedding
        .then_chunk(ChunkCode::try_for_language_and_chunk_size("rust", 10..2048)?)
        // 7. Embed code+metadata in batches
        .then_in_batch(Embed::new(openai_client.clone()).with_batch_size(10))
        // 8. Store results in a Qdrant collection
        .then_store_with(
            Qdrant::builder()
                .batch_size(50)
                .vector_size(1536)
                .collection_name("swiftide-examples")
                .build()?,
        )
        // 9. Run the pipeline asynchronously
        .run()
        .await?;
    Ok(())
}
```

## Hybrid Search Example

Below is a streamlined workflow for hybrid dense/sparse search using Qdrant.

```rust
use swiftide::{
    indexing::{
        self, EmbeddedField,
        loaders::FileLoader,
        transformers::{self, ChunkCode, MetadataQACode},
    },
    integrations::{fastembed::FastEmbed, openai, qdrant::Qdrant},
    query::{self, answers, query_transformers, search_strategies::HybridSearch},
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // 1. Create fastembed (dense/sparse) clients
    let batch_size = 64;
    let fastembed_sparse = FastEmbed::try_default_sparse().unwrap().to_owned();
    let fastembed = FastEmbed::try_default().unwrap().to_owned();

    // 2. Use a compact OpenAI prompt model for metadata Q&A generation
    let openai = openai::OpenAI::builder()
        .default_prompt_model("gpt-4o-mini")
        .build()
        .unwrap();

    // 3. Set up Qdrant for both dense and sparse vectors
    let qdrant = Qdrant::builder()
        .batch_size(batch_size)
        .vector_size(384)
        .with_vector(EmbeddedField::Combined)
        .with_sparse_vector(EmbeddedField::Combined)
        .collection_name("swiftide-hybrid-example")
        .build()?;

    indexing::Pipeline::from_loader(FileLoader::new("swiftide-core/").with_extensions(&["rs"]))
        .then_chunk(ChunkCode::try_for_language_and_chunk_size("rust", 10..2048)?)
        .then(MetadataQACode::from_client(openai.clone()).build().unwrap())
        .then_in_batch(transformers::SparseEmbed::new(fastembed_sparse.clone()).with_batch_size(batch_size))
        .then_in_batch(transformers::Embed::new(fastembed.clone()).with_batch_size(batch_size))
        .then_store_with(qdrant.clone())
        .run()
        .await?;

    // 4. Run a hybrid search pipeline
    let openai = openai::OpenAI::builder()
        .default_prompt_model("gpt-4o")
        .build()
        .unwrap();

    let query_pipeline = query::Pipeline::from_search_strategy(
        HybridSearch::default()
            .with_top_n(20)
            .with_top_k(20)
            .to_owned(),
    )
    .then_transform_query(query_transformers::GenerateSubquestions::from_client(openai.clone()))
    .then_transform_query(query_transformers::Embed::from_client(fastembed.clone()))
    .then_transform_query(query_transformers::SparseEmbed::from_client(fastembed_sparse.clone()))
    .then_retrieve(qdrant.clone())
    .then_answer(answers::Simple::from_client(openai.clone()));

    let answer = query_pipeline
        .query("What are the different pipelines in Swiftide and how do they work?")
        .await
        .unwrap();

    println!("{}", answer.answer());
}
```

---

## Further reading

- [Swiftide Documentation](https://swiftide.rs)
- [Source Code](https://github.com/bosun-ai/swiftide)
