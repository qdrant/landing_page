---
title: Serverless Semantic Search
short_description: "Need to setup a server to offer semantic search? Think again!"
description: "A short how-to from zero to semantic search using Qdrant & AWS lambda"
social_preview_image: /articles_data/serverless/preview/social_preview.jpg
preview_dir: /articles_data/serverless/preview
weight: 10
author: Andre Bogus
author_link: https://llogiq.github.io
date: 2023-06-28T10:00:00+01:00
draft: false
keywords: rust, serverless, lambda, semantic, search
---

You want to allow people to semantically search your site, but don't want to rent a server? Look no further, here's youtr recipe!

## Ingredients

* A [Rust](https://rust-lang.org) toolchain
* [cargo lambda](cargo-lambda.info) (install via package manager, [download](https://github.com/cargo-lambda/cargo-lambda/releases) binary or `cargo install cargo-lambda`)
* The [aws CLI](https://aws.amazon.com/cli)
* Qdrant instance ([free tier](https://cloud.qdrant.tech) available)
* An embedding provider service of your choice (see our [integration docs](https://qdrant.tech/documentation/integrations))
* AWS lambda account (12-month free tier available)

Have all ingredients? You're good to go!

## What you're going to build

You'll combine the embedding provider and the Qdrant instance to a neat semantic search, calling both services from a small lambda function.

![lambda integration diagram](/articles_data/serverless/lambda_integration.svg)

Now lets look at how to work with each ingredient before connecting them.

## Rust and cargo-lambda

You want our function to be quick, lean and safe, so using Rust is a no-brainer. To compile Rust code for use within Lambda functions, the `cargo-lambda` subcommand has been built. `cargo-lambda` can put your Rust code in a zip file that AWS lambda can then deploy on a no-frills `provided.al2` runtime.

To interface with AWS lambda, you will need the following dependencies in your `Cargo.toml`:

```toml
[dependencies]
tokio = { version = "1", features = ["macros"] }
lambda_http = { version = "0.8", default-features = false, features = ["apigw_http"] }
lambda_runtime = "0.8"
```

This gives us an interface consisting of an entry point to start the lambda runtime and a way to register our handler for HTTP calls:

```rust
use lambda_http::{run, service_fn, Body, Error, Request, RequestExt, Response};

/// This is our callback function for responding to requests at our URL
async fn function_handler(_req: Request) -> Result<Response<Body>, Error> {
    Response::from_text("Hello, lambda!")
}

#[tokio::main]
async fn main() {
    run(service_fn(function_handler))
    .await
}
```

You can also use a closure to bind other arguments to your function handler (the `service_fn` call then becomes `service_fn(|req| function_handler(req, ...))`). Also if you want to extract parameters from our request, you can do so using the [Request](https://docs.rs/lambda_http/latest/lambda_http/type.Request.html) methods (e.g. `query_string_parameters` or `query_string_parameters_ref`).

On the AWS side, you need to setup a lambda and an IAM role to use with our function.

![create lambda web page](/articles_data/serverless/create_lambda.png)

Choose your function name, select "Provide your own bootstrap on Amazon Linux 2". As architecture, we will use `arm64`. We will also activate a function URL. Here it is up to you if you want to protect it via IAM or leave it open, but be aware that open end points can be accessed by anyone, potentially costing money if there is too much traffic.

By default, this will also create a basic role. To look up the role, you can go into the Function overview:

![function overview](/articles_data/serverless/lambda_overview.png)

Click on the "Info" link near the "▸ Function overview" heading, and select the "Permissions" tab on the left.

You will find the "Role name" directly under *Execution role*. Note it down for later.

![function overview](/articles_data/serverless/lambda_role.png)

To test that our "Hello, lambda" service works, we can compile and upload the function:

```bash
$ export LAMBDA_FUNCTION_NAME=hello
$ export LAMBDA_ROLE=<role name from lambda web ui>
$ export LAMBDA_REGION=us-east-1
$ cargo lambda build --release --arm --output-format zip
  Downloaded libc v0.2.137
# [..] output omitted for brevity
    Finished release [optimized] target(s) in 1m 27s
$ # Upload the function
$ aws lambda create-function --function-name $LAMBDA_FUNCTION_NAME \
    --handler bootstrap \
    --architectures arm64 \
    --zip-file fileb://./target/lambda/page-search/bootstrap.zip \
    --runtime provided.al2 \
    --region $LAMBDA_REGION \
    --role $LAMBDA_ROLE \
    --tracing-config Mode=Active
$ # Add the function URL
$ aws lambda add-permission \
    --function-name $LAMBDA_FUNCTION_NAME \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type "NONE" \
    --region $LAMBDA_REGION \
    --statement-id url
$ # Here for simplicity unauthenticated URL access. Beware!
$ aws lambda create-function-url-config \
    --function-name $LAMBDA_FUNCTION_NAME \
    --region $LAMBDA_REGION \
    --cors "AllowOrigins=*,AllowMethods=*,AllowHeaders=*" \
    --auth-type NONE
```

Now you can go to your *Function Overview* and click on the Function URL. This should show something like the following:

```text
Hello, lambda!
```

Congratulations! You have set up a lambda function in Rust. On to the next ingredient:

## Embedding

Most providers supply a simple https GET or POST interface we can use. Most will have an API key, which you have to supply in an authentication header. Let's use OpenAI as an example, which is one of the more complex APIs. We need to extend our dependencies with `reqwest` and also add `anyhow` for easier error handling:

```toml
anyhow = "1.0"
reqwest =  { version = "0.11.18", default-features = false, features = ["json", "rustls-tls"] }
serde = "1.0"
```

Now given an API key, you can make a call to get the embedding vector:

```rust
use anyhow::Result;
use serde::Deserialize;
use reqwest::Client;

#[derive(Deserialize)]
struct OpenaiResponse { data: OpenaiData }

#[derive(Deserialize)]
struct OpanaiData { embedding: Vec<f32> }

pub async fn embed(client: &Client, text: &str, api_key: &str) -> Result<Vec<f32>> {
    let OpenaiResponse { data: OpenaiData { embedding } = client
        .post("https://api.openai.com/v1/embedding")
        .header("Authorization", &format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .body(format!("{{\"input\":\"{text}\",\"model\":\"text-embedding-ada-002\"}}"))
        .send()
        .await?
        .json()?;
    Ok(embedding)
}
```

You should note that OpenAI's ada-002 model emits 1536-dimensioned vectors.

Other providers have similar interfaces. Consult our [integration docs](https://qdrant.tech/documentation/integrations) for further information. See how little code it took to get the embedding? Also with [AI Grant](https://aigrant.org/), you can apply for free credits that allow for a lot of searches before you'll have to spend a dime.

While we're at it, it's a good idea to write a small test:

```rust
#[tokio::test]
async fn check_embedding() {
    // ignore this test if API_KEY isn't set
    if let Ok(api_key) = &std::env::var("API_KEY") {
        let embedding = crate::embed("What is semantic search?", api_key).unwrap();
        // OpenAI text-embedding-ada-002 has 1536 output dimensions
        assert_eq!(1536, embedding.len());
    }
}
```

Run this while setting the `API_KEY` environment variable to check if the embedding works.

## Qdrant search

Now that we have embeddings, it's time to put them into our Qdrant. We could of course use `curl` or `python` to set up our collection and upload the points, but as we already have Rust including some code to obtain the embeddings, we can stay in Rust. So let's add `qdrant-client` to the mix.

```rust
use anyhow::Result;
use qdrant_client::prelude::*;
use std::collections::HashMap;

fn setup<'i>(
    embed_client: &reqwest::Client,
    embed_api_key: &str,
    qdrant_url: &str,
    api_key: Option<&str>,
    collection_name: &str,
    data: impl Iterator<Item = (&'i str, HashMap<String, Value>)>,
) -> Result<()> {
    let mut config = QdrantClientConfig::from_url(qdrant_url);
    config.api_key = api_key;
    let client = QdrantClient::new(Some(config))?;

    // create the collections
    if !client.has_collection(COLLECTION_NAME).await? {
        client
            .create_collection(&CreateCollection {
                collection_name: collection_name.into(),
                vectors_config: Some(VectorsConfig {
                    config: Some(Config::Params(VectorParams {
                        size: 1536, // our output dimensions from above
                        distance: Distance::Cosine as i32,
                        ..Default::default()
                    })),
                }),
                ..Default::default()
            })
            .await?;
    }
    let mut id_counter = 0_u64;
    let points = data.map(|(text, payload)| {
        let id = std::mem::replace(&mut id_counter, *id_counter + 1);
        let vectors = Some(embed(embed_client, text, embed_api_key).unwrap());
        PointStruct { id, vectors, payload }
    }).collect();
    client.upsert_points(collection_name, points, None).await?;
    Ok(())
}
```

Depending on whether you want to efficiently filter the data, you can also add some indexes. We leave this out for brevity, but have [example code](https://github.com/qdrant/examples/tree/master/lambda-search) containing this operation. Also this does not implement chunking (splitting the data to upsert in multiple requests).

Add a suitable `main` method and you can run this code to insert the points (or just use the binary from the example).

Now that you have the points inserted, you can search them by embedding:

```rust
use anyhow::Result;
use qdrant_client::prelude::*;
pub async fn search(
    text: &str,
    collection_name: String,
    client: &Client,
    api_key: &str,
    qdrant: &QdrantClient,
) -> Result<Vec<ScoredPoint>> {
    Ok(qdrant.search_points(&SearchPoints {
        collection_name,
        limit: 5, // use what fits your use case here
        with_payload: Some(true.into()),
        vector: embed(client, text, api_key)?,
        ..Default::default()
    }).await?.result)
}
```

And that's it. Obviously, you can also filter by adding a `filter: ...` field to the `SearchPoints`, and you will likely want to process the result further, but the example code already does that, so feel free to start from there in case you need this functionality.

## Putting it all together

Now that you have all the parts, it's time to join them up. Now copying and wiring up the snippets above is left as an exercise to the reader. Impatient minds can peruse the [example repo](https://github.com/qdrant/examples/tree/master/lambda-search) instead.

You'll want to extend the `main` method a bit to connect with the Client once at the start, also get API keys from the environment so you don't need to compile them into the code. To do that, you can get them with `std::env::var(_)` from the rust code and set the environment from the AWS console.

```bash
$ aws lambda update-function-configuration \
    --function-name $LAMBDA_FUNCTION_NAME \
    --environment "Variables={QDRANT_URI=$QDRANT_URI,QDRANT_API_KEY=$QDRANT_API_KEY,OPENAI_API_KEY=$OPENAI_API_KEY}"`
```

In any event, you will arrive at one command line program to insert your data and one lambda function. The former can just be `cargo run` to set up the collection. For the latter, you can again call `cargo lambda` and the AWS console:

```bash
$ export LAMBDA_FUNCTION_NAME=search
$ export LAMBDA_REGION=us-east-1
$ cargo lambda build --release --arm --output-format zip
  Downloaded libc v0.2.137
# [..] output omitted for brevity
    Finished release [optimized] target(s) in 1m 27s
$ # Update the function
$ aws lambda update-function-code --function-name $LAMBDA_FUNCTION_NAME \
     --zip-file fileb://./target/lambda/page-search/bootstrap.zip \
     --region $LAMBDA_REGION
```

## Discussion

Lambda works by spinning up your function once the URL is called, so they don't need to keep the compute on hand unless it is actually used. This means that the first call will be burdened by some 1-2 seconds of latency for loading the function, later calls will resolve faster. Of course, there is also the latency for calling the embeddings provider and Qdrant. On the other hand, the free tier doesn't cost a thing, so you certainly get what you pay for. And for many use cases, a result within a few seconds is acceptable.

Rust minimizes the overhead for the function, both in terms of file size and runtime. Using an embedding service means you don't need to care about the details. Knowing the URL, API key and embedding size is sufficient. Finally, with free tiers for both lambda and Qdrant as well as free credits for embedding provider, the only cost is your time to set everything up. Who could argue with free?
