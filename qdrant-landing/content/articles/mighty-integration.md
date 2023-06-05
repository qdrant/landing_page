---
title: "Semantic Search with Mighty and Qdrant"
short_description: "Mighty offers a speedy scalable embedding, a perfect fit for the speedy scalable Qdrant search. Let's combine them!"
description: "We combine Mighty and Qdrant to create a semantic search service in Rust with just a few lines of code."
social_preview_image: /articles_data/mighty-integration/social_preview.png
small_preview_image: /articles_data/mighty-integration/preview/preview.jpg
preview_dir: /articles_data/mighty-integration/preview
weight: 6
author: Andre Bogus
author_link: https://llogiq.github.io
date: 2023-06-01T11:24:20+01:00
draft: false
keywords:
  - vector search
  - embeddings
  - mighty
  - rust
  - semantic search
---

We're always on the lookout for interesting services to combine with Qdrant to create something bigger than the sum of its parts. So when we found [mighty](https://max.io/) inference server, much like Qdrant written in Rust and promising to offer low latency and high scalability, we saw an opportunity to combine the two for a small demo. For me, it was also a chance to check out AWS lambda, because our simple demo should run within that service to make it a) very cheap, b) I wanted to test the Rust API for some time and c) see how the combined latency fares.

## Setting up Mighty & Qdrant

![max.io logo](/articles_data/mighty-integration/maxio-logo.svg)

For mighty, we start up a [docker container](https://hub.docker.com/layers/maxdotio/mighty-sentence-transformers/0.9.9/images/sha256-0d92a89fbdc2c211d927f193c2d0d34470ecd963e8179798d8d391a4053f6caf?context=explore) with an open port 5050. Just loading the port in a window shows the following:

```
{
      "name": "sentence-transformers/all-MiniLM-L6-v2",
      "architectures": [
        "BertModel"
      ],
      "model_type": "bert",
      "max_position_embeddings": 512,
      "labels": null,
      "named_entities": null,
      "image_size": null,
      "source": "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2"
    }
}
```

We note that this uses huggingface's MiniLM-L6 v2 model. If we look at huggingface's site, we find that the model "maps sentences & paragraphs to a 384 dimensional dense vector space and can be used for tasks like clustering or semantic search". Below, it tells us that the distance measure to use is cosine similarity.

We can check that it works by calling `curl https://<address>:5050/sentence-transformer?q=hello+mighty`. This will give us a result like (formatted via `jq`):

```json
{
    "outputs": [
        [
            -0.05019686743617058,
            0.051746174693107605,
            0.048117730766534805,
            ... (381 values skipped)
        ]
    ],
    "shape": [
        1,
        384
    ],
    "texts": [
        "Hello mighty"
    ],
    "took": 77
}
```

For qdrant, we simply spin up a [free tier](https://cloud.qdrant.io/) (click on the "start free" button, log in with google or github and follow the instructions). Note the qdrant address and API key.

## The Pen is Mightier than the Sword

Mighty offers a variety of model APIs which will download and cache the model on first use. Here we'll use the `sentence-transformer` API. Basically the
Rust code to make the call is:

```rust
use anyhow::anyhow;
use reqwest::Client;
use serde::Deserialize;

#[derive(Deserialize)]
struct EmbeddingsResponse {
    pub outputs: Vec<Vec<f32>>,
}

pub async fn get_mighty_embedding(
    client: &Client,
    url: &str,
    text: &str
) -> anyhow::Result<Vec<f32>> {
    let response = client.get(url).query(&[("text", text)]).send().await?;

    if !response.status().is_success() {
        return Err(anyhow!(
            "Mighty API returned status code {}",
            response.status()
        ));
    }

    let embeddings: Result<EmbeddingsResponse, _> = response.json().await?;
    Ok(embeddings[0]) // we ignore multiple embeddings at the moment
}
```

We can use this code to create embeddings both for insertion and search. On the Qdrant side, we can take the embedding and run a query:

```rust
use anyhow::anyhow;
use qdrant_client::prelude::*;
use qdrant_client::qdrant::value::Kind;
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const SEARCH_LIMIT: usize = 5;
pub const TEXT_LIMIT: usize = 80;
const COLLECTION_NAME: &str = "site-mighty";

#[derive(Deserialize, Serialize, Debug)]
pub struct SearchResponseHit {
    pub payload: HashMap<String, Value>,
    pub score: Option<f32>,
    pub highlight: String,
}

pub async fn qdrant_search_embeddings(
    qdrant_client: &QdrantClient,
    vector: Vec<f32>,
    section: Option<&str>,
    tags: &[&str],
) -> anyhow::Result<Vec<SearchResponseHit>> {
    let search_request = SearchPoints {
        collection_name: COLLECTION_NAME.to_string(),
        vector,
        filter: Some(get_qdrant_filters(section, tags)),
        limit: SEARCH_LIMIT as u64,
        with_payload: Some(true.into()),
        ..Default::default()
    };

    let res = qdrant_client
        .search_points(&search_request)
        .await
        .map_err(|err| anyhow!("Failed to search Qdrant: {}", err))?;

    let hits = res
        .result
        .into_iter()
        .map(|point| {
            let highlight = match point.payload.get("text") {
                None => "".to_string(),
                Some(val) => match &val.kind {
                    Some(Kind::StringValue(s)) => s.to_string(),
                    _ => "".to_string(),
                },
            };

            SearchResponseHit {
                payload: point
                    .payload
                    .into_iter()
                    .map(|(key, val)| (key, qdrant_value_to_json(val)))
                    .collect(),
                score: Some(point.score),
                highlight: highlight_with_bold(
                    text,
                    &limit_text(highlight, TEXT_LIMIT)
                ),
            }
        })
        .collect();

    Ok(hits)
}
```

I have omitted some functions for brevity (e.g. `qdrant_value_to_json`, which I
am in the process of rolling into the client (via a `From<Value>` implementation
for `serde_json::Value`)) besides some other simplifications.

### A Small Diversion

So instead of that `match`ing on `highlight`, we soon can simply write:

```rust
let highlight = point.get("text").as_string().unwrap_or_default();
```

and as our `Value` now displays as compact JSON, we can simply avoid `serde_json::Value`
completely. Should we need a `serde_json::Value` anyway, we can still use `into()`.

I think we should go further and provide streamlined builders for common
requests, but that's beside the point of this article. Stay tuned!

## Putting It All Together

Anyway, putting those together into a lambda service just requires running both
functions in sequence:

```rust
async fn function_handler(
    event: Request,
    client: &Client,
    qdrant_client: &QdrantClient,
) -> Result<Response<Body>, Error> {
    let query = match event.query_string_parameters().first("q") {
        None => return Ok(error_response(400, "Missing query string parameter `q`")),
        Some(q) => q.to_string(),
    };
    let params = event.query_string_parameters();
    let section = params.first("section");

    let prefix_search_future = query_qdrant_text(
        qdrant_client,
        &query,
        section,
        &["h1", "h2", "h3", "h4", "h5", "h6"],
    );
    let full_search_future = if query.chars().nth(3).is_some() {
        qdrant_search_embeddings(
            client,
            qdrant_client,
            &query,
            section,
            &[]
        )
    } else {
        query_qdrant_text(
            qdrant_client,
            &query,
            section,
            &[]
        )
    };
    let (prefix_results, full_results) = try_join!(
        prefix_search_future,
        full_search_future
    );

    let search_results: Vec<_> = prefix_results
        .into_iter()
        .chain(full_results)
        .take(SEARCH_LIMIT)
        .collect();

    let response_body = serde_json::to_string(&search_results).unwrap();

    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(response_body.into())
        .map_err(Box::new)?)
}
```

## Setting It Up

We can build the whole project with
[`cargo-lambda`](https://www.cargo-lambda.info/), as in:

```sh
cargo install cargo-lambda
cargo lambda build --release --arm64 --output-format zip
```

Now we can either use the web interface to upload our function or call the AWS
cli to do it:

```sh
# Deploy to AWS Lambda
aws lambda create-function --function-name $LAMBDA_FUNCTION_NAME \
  --handler bootstrap \
  --architectures arm64 \
  --zip-file fileb://./target/lambda/page-search/bootstrap.zip \
  --runtime provided.al2 \
  --region $LAMBDA_REGION \
  --role $LAMBDA_ROLE \
  --environment "Variables={QDRANT_URI=$QDRANT_URI,QDRANT_API_KEY=$QDRANT_API_KEY,MIGHTY_URI=$MIGHTY_URI}" \
  --tracing-config Mode=Active

# Grant public access to the function
# https://docs.amazonaws.cn/en_us/lambda/latest/dg/urls-tutorial.html
aws lambda add-permission \
    --function-name $LAMBDA_FUNCTION_NAME \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type "NONE" \
    --region $LAMBDA_REGION \
    --statement-id url

# Assign URL to the function
# https://docs.aws.amazon.com/de_de/cli/latest/reference/lambda/create-function-url-config.html
aws lambda create-function-url-config \
  --function-name $LAMBDA_FUNCTION_NAME \
  --region $LAMBDA_REGION \
  --cors "AllowOrigins=*,AllowMethods=*,AllowHeaders=*" \
  --auth-type NONE
```

## Networking Troubles

Ok, here is the point where I'm going to admit that I messed up the setup. When
I deployed the mighty docker container, I chose the Europe zone, thinking that
I'd get the lowest latency, and only later I understood that the demo should be
otherwise free-tier only, which in Qdrant's case means US-East-1. So to let you
have a laugh at my expense, here's a small diagram to show the network traffic:

![sequence diagram](/articles_data/mighty-integration/network-sequence.svg)

## Results

In my tests, the first request always has some 2+ seconds latency due to lambda
startup. Subsequent requests run in a matter of 200-300ms factoring in two
roundtrips from Europe to US-East and back. Shaving off another
transcontinental round trip will probably easily win some 50-100ms.

So given that I'm on the free tier for both Lambda and Qdrant *and* screwed up
the config, that isn't half bad. If you find that your traffic is high enough
to matter, you'll be able to get Qdrant and mighty hosted for a fair price; if
you're interested, feel free to
[ask us](https://discord.com/channels/907569970500743200/1047555268499755152)!
