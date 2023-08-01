---
title: Semantic Search As You Type
short_description: "A demo that does what the title says"
description: To show off Qdrant's performance, we show how to do a quick search-as-you-type that will come back within a few milliseconds.
social_preview_image: /articles_data/sayt/preview/social_preview.jpg
preview_dir: /articles_data/sayt/preview
weight: 10
author: Andre Bogus
author_link: https://llogiq.github.io
date: 2023-08-01T10:00:00+01:00
draft: false
keywords: search, semantic, vector, llm, integration, benchmark, recommend, performance
---

Qdrant is one of the fastest vector search engines out there, so while looking for a demo to show off, we came upon the idea to do a search-as-you-type box with a semantic search backend. Now we already have a semantic/keyword hybrid search on our website. But that one is written in Python, which incurs some overhead for the interpreter. Naturally, I wanted to see how fast I could go using Rust.

Since Qdrant doesn't embed by itself, I had to decide on an embedding model. The prior version used the [SentenceTransformers](https://www.sbert.net/) package, which in turn employs Huggingface's Bert-based [All-MiniLM-L6-V2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/tree/main) model. This model is battle-tested and delivers fair results at speed, so not experimenting on this front I took an [ONNX version](https://huggingface.co/optimum/all-MiniLM-L6-v2/tree/main) and put it directly into the actix-web service via the [ort crate](https://docs.rs/ort) to avoid the network latency of calling an embedding service. For tokenization, I used the [rust-tokenizers](https://docs.rs/rust_tokenizers) crate, because Huggingface's [tokenizers](https://docs.rs/tokenizers) needs PCRE and is thus harder to build on some platforms.

The workflow looks like this:

![Search Qdrant by Embedding](/articles_data/sayt/Qdrant_Search_by_Embedding.png)

Unlike with some other libraries, the ort crate's `Session` type is `Send` and `Sync`, which makes it easy to preload the model and calculate the embeddings directly in the request handler. Wrapping the tokenizer, session and Qdrant client in an Actix `Data`, which works like an `Arc`, is sufficient to have everything in place for the search. Using Actix' built-in JSON deserialization makes getting the search parameters a breeze.

The request handler looks roughly like the following:

```rust
#[derive(Deserialize)]
struct Search {
    q: String,
    #[serde(default)]
    section: String,
}

#[get("/search")]
async fn query(
    context: Data<(BertTokenizer, Session, QdrantClient)>,
    search: Query<Search>,
) -> impl Responder {
    let Search { q, section } = search.into_inner();
    let (tokenizer, session, qdrant) = context.get_ref();
    let (token_ids, attention, type_ids) = tokenize(tokenizer, q);
    let vector = embed(session, token_ids, attention, type_ids);
    let filter = section.is_empty().not().then(
        || Filter::all(Condition::matches("sections", section)));
    match qdrant
        .search_points(&SearchPoints {
            collection_name: COLLECTION_NAME.to_string(),
            vector,
            filter,
            limit: 5,
            with_payload: Some(true.into()),
            ..Default::default,
        }).await
    {
        Ok(SearchResponse { result, .. }) => Ok(result_json(result)),
        Err(e) => Err(InternalError::new(e, StatusCode::BAD_GATEWAY)),
    }
}
```

Even with avoiding a network roundtrip, the embedding still takes some time. As always in optimization, if you cannot do the work faster, a good solution is to avoid work altogether (please don't tell my employer). This can be done by pre-computing common prefixes and calculating embeddings for them, then storing them in a `prefix_cache` collection. With the [`recommend`](https://docs.rs/qdrant-client/latest/qdrant_client/client/struct.QdrantClient.html#method.recommend) API method, we can now find the best matches without doing any embedding. For now, I use short (up to and including 5 letters) prefixes, but we can also parse the logs to get the most common search terms and add them to the cache, too.

![Qdrant Recommendation](/articles_data/sayt/Qdrant_Recommendation.png)

The code path for this one is simply:

```rust
match qdrant
    .recommend(&RecommendPoints {
        collection_name: COLLECTION_NAME.to_string(),
        positive: vec![prefix_to_id(q)],
        limit: 5,
        with_payload: Some(true.into()),
        lookup_from: Some(LookupLocation {
            collection_name: "prefix_cache".to_string(),
            vector_name: None,
        }),
        ..Default::default()
    })
    .await
{
    Ok(RecommendResponse { result, .. }) => return Ok(result_json(result)),
    Err(e) => (), // go on to normal semantic search
}
```

To make that work, we need to set up the `prefix_cache` collection with points that have the prefix as their `point_id` and the embedding as their `vector`, which lets us do the lookup with no search or index. The `prefix_to_id` function currently uses the `u64` variant of `PointId`, which can hold 8 bytes, enough for this use:

```rust
fn prefix_to_id(prefix: &str) -> PointId {
    let len = prefix.len();
    PointId::from(u64::from_le_bytes(if len < 8 {
        let mut result = [0_u8; 8];
        result[..len].copy_from_slice(prefix.as_bytes());
        result
    } else {
        prefix.as_bytes()[..8].try_into().unwrap()
    }))
}
```

If the need arises, one could instead encode the names as UUID, which needs to time-consumingly hash the input, so I decided against this for now.

Now we have, in the best Rust tradition, a blazingly fast semantic search.

To demo it, I used our [Qdrant documentation website](https://qdrant.tech/documentation)'s page search, replacing our previous Python implementation. So in order to not just spew empty words, here is a benchmark, showing different queries that exercise different code paths.

Since the operations themselves are far faster than the network whose fickle nature would have swamped most measurable differences, I benchmarked both the Python and Rust services locally. Note that with search terms of up to 3 characters, the Python version merely does a text search, not a semantic search, while the Rust version always does a more complex semantic search. I'm measuring both versions on the same AMD Ryzen 9 5900HX with 16GB RAM running Linux. The table shows the average time and error bound in milliseconds. I only measured up to a thousand concurrent requests. None of the services showed any slowdown with more requests in that range. I do not expect our service to become DDOS'd, so I didn't benchmark with more load. Without further ado, here are the results:

| query     | `io`       | `ring`    | `io_uring` |
|-----------|------------|-----------|------------|
| Python 🐍 | 4½ ± ½ ms* | 16 ± 4 ms | 16 ± 4 ms  |
| Rust   🦀 | 1½ ± ½ ms  | 1½ ± ½ ms |  5 ± 1 ms  |

\* full-text search only

The Rust version consistently beats the Python version in terms of speed and offers a semantic search even on few-character queries. If the prefix cache is hit (as in the "ring" measurement), the semantic search can even get more than ten times faster than the Python version. The general speedup is due to both the relatively lower overhead of Rust + Actix Web compared to Python + FastAPI (even if that already performs admirably), as well as using ONNX Runtime instead of SentenceTransformers for the embedding. The prefix cache gives the Rust version a real boost by doing a semantic search without doing any embedding work.
