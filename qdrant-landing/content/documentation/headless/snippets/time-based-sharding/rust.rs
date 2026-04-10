use std::collections::{HashMap, HashSet};

use chrono::NaiveDate;
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, CreateShardKeyBuilder, CreateShardKeyRequestBuilder,
    DeleteShardKeyRequestBuilder, Distance, Document, DocumentBuilder,
    PointStruct, Query, QueryPointsBuilder, ShardKeySelector, ShardingMethod,
    UpsertPointsBuilder, VectorParamsBuilder, VectorsConfigBuilder, shard_key,
};

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let QDRANT_URL = "";
    let QDRANT_API_KEY = "";
    // @hide-end

    // @block-start initialize-client
    let client = Qdrant::from_url(QDRANT_URL)
        .api_key(QDRANT_API_KEY)
        .build()?;
    // @block-end initialize-client

    // @block-start create-collection
    let collection_name = "my_collection";

    if client.collection_exists(collection_name).await? {
        client.delete_collection(collection_name).await?;
    }

    let mut vectors_config = VectorsConfigBuilder::default();
    vectors_config.add_named_vector_params(
        "dense_vector",
        VectorParamsBuilder::new(384, Distance::Cosine),
    );

    client
        .create_collection(
            CreateCollectionBuilder::new(collection_name)
                .vectors_config(vectors_config)
                .sharding_method(ShardingMethod::Custom.into()),
        )
        .await?;
    // @block-end create-collection

    // @block-start upload-vectors
    let csv_url = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

    let response = client.list_shard_keys(collection_name).await?;
    let mut existing_shard_keys: HashSet<String> = response
        .shard_keys
        .into_iter()
        .filter_map(|d| {
            d.key?.key.and_then(|k| match k {
                shard_key::Key::Keyword(s) => Some(s),
                _ => None,
            })
        })
        .collect();

    let dense_model = "sentence-transformers/all-MiniLM-L6-v2";
    let batch_size = 100;
    let mut current_date = String::new();
    let mut buffer: Vec<PointStruct> = Vec::new();

    let bytes = reqwest::get(csv_url).await?.bytes().await?;
    let mut rdr = csv::Reader::from_reader(bytes.as_ref());
    let headers = rdr.headers()?.clone();
    let text_idx = headers.iter().position(|h| h == "text").unwrap();
    let datetime_idx = headers.iter().position(|h| h == "datetime").unwrap();

    for result in rdr.records() {
        let record = result?;
        let text = record[text_idx].to_string();
        let datetime = record[datetime_idx].to_string();
        let shard_date = datetime[..10].to_string(); // Extract YYYY-MM-DD

        if shard_date != current_date {
            // Flush buffer for the previous date before switching
            if !buffer.is_empty() {
                client
                    .upsert_points(
                        UpsertPointsBuilder::new(
                            collection_name,
                            std::mem::take(&mut buffer),
                        )
                        .shard_key_selector(current_date.clone()),
                    )
                    .await?;
            }

            // Create shard for the new date if it doesn't exist yet
            if !existing_shard_keys.contains(&shard_date) {
                client
                    .create_shard_key(
                        CreateShardKeyRequestBuilder::new(collection_name).request(
                            CreateShardKeyBuilder::default().shard_key(shard_date.clone()),
                        ),
                    )
                    .await?;
                existing_shard_keys.insert(shard_date.clone());
            }

            current_date = shard_date;
        }

        buffer.push(PointStruct::new(
            uuid::Uuid::new_v4().to_string(),
            HashMap::from([(
                "dense_vector".to_string(),
                DocumentBuilder::new(&text, dense_model).build(),
            )]),
            [("text", text.into()), ("datetime", datetime.into())],
        ));

        if buffer.len() >= batch_size {
            client
                .upsert_points(
                    UpsertPointsBuilder::new(collection_name, std::mem::take(&mut buffer))
                        .shard_key_selector(current_date.clone()),
                )
                .await?;
        }
    }

    // Flush remaining partial batch
    if !buffer.is_empty() {
        client
            .upsert_points(
                UpsertPointsBuilder::new(collection_name, buffer)
                    .shard_key_selector(current_date.clone()),
            )
            .await?;
    }
    // @block-end upload-vectors

    // @block-start search-single-shard
    let query_text = "coffee";

    let result = client
        .query(
            QueryPointsBuilder::new(collection_name)
                .query(Query::new_nearest(Document::new(query_text, dense_model)))
                .using("dense_vector")
                .limit(5)
                .shard_key_selector("2026-04-07".to_string()),
        )
        .await?;

    for hit in result.result {
        println!("{:?}", hit);
    }
    // @block-end search-single-shard

    // @block-start search-multiple-shards
    let result = client
        .query(
            QueryPointsBuilder::new(collection_name)
                .query(Query::new_nearest(Document::new(query_text, dense_model)))
                .using("dense_vector")
                .limit(5)
                .shard_key_selector(ShardKeySelector {
                    shard_keys: vec![
                        "2026-04-06".to_string().into(),
                        "2026-04-07".to_string().into(),
                    ],
                    fallback: None,
                }),
        )
        .await?;

    for hit in result.result {
        println!("{:?}", hit);
    }
    // @block-end search-multiple-shards

    // @block-start search-all-shards
    let result = client
        .query(
            QueryPointsBuilder::new(collection_name)
                .query(Query::new_nearest(Document::new(query_text, dense_model)))
                .using("dense_vector")
                .limit(5),
        )
        .await?;

    for hit in result.result {
        println!("{:?}", hit);
    }
    // @block-end search-all-shards

    // @block-start pruning-shards
    let today = "2026-04-08";
    let oldest_shard_key = (NaiveDate::parse_from_str(today, "%Y-%m-%d")?
        - chrono::Duration::days(7))
    .to_string();

    client
        .create_shard_key(
            CreateShardKeyRequestBuilder::new(collection_name)
                .request(CreateShardKeyBuilder::default().shard_key(today.to_string())),
        )
        .await?;

    client
        .delete_shard_key(
            DeleteShardKeyRequestBuilder::new(collection_name)
                .key(shard_key::Key::Keyword(oldest_shard_key)),
        )
        .await?;
    // @block-end pruning-shards

    // @block-start ingest-new-data
    client
        .upsert_points(
            UpsertPointsBuilder::new(
                collection_name,
                vec![PointStruct::new(
                    uuid::Uuid::new_v4().to_string(),
                    HashMap::from([(
                        "dense_vector".to_string(),
                        DocumentBuilder::new(
                            "The best way to start a Wednesday is with a cup of coffee",
                            dense_model,
                        )
                        .build(),
                    )]),
                    [
                        ("text", "The best way to start a Wednesday is with a cup of coffee".into()),
                        ("datetime", "2026-04-08T07:57:47".into()),
                    ],
                )],
            )
            .shard_key_selector(today.to_string()),
        )
        .await?;
    // @block-end ingest-new-data

    Ok(())
}
