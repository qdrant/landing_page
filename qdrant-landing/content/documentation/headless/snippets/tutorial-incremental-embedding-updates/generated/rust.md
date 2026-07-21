```rust
use serde_json::{json, Value};
use std::collections::HashMap;

use qdrant_client::qdrant::{
    point_id::PointIdOptions, vector_output, vectors_output, Condition, CountPointsBuilder,
    CreateCollectionBuilder, CreateFieldIndexCollectionBuilder, DeletePointsBuilder, Distance,
    Document, FieldType, Filter, GetPointsBuilder, PayloadIncludeSelector, PointId, PointStruct,
    Query, QueryPointsBuilder, ScrollPointsBuilder, UpsertPointsBuilder, VectorParamsBuilder,
};
use qdrant_client::{Payload, Qdrant};
use sha2::{Digest, Sha256};

// Replace the URL and API key with your own from https://cloud.qdrant.io
let client = Qdrant::from_url("https://xyz-example.qdrant.io:6334")
    .api_key("<your-api-key>")
    .build()?;

const MODEL: &str = "sentence-transformers/all-MiniLM-L6-v2";
const PIPELINE: &str = "docs-prep-pipeline-v1";
const COLLECTION: &str = "docs-sync-tutorial";

let mut metadata: HashMap<String, Value> = HashMap::new();
metadata.insert("embedding_model".to_string(), json!(MODEL));
metadata.insert("pipeline_version".to_string(), json!(PIPELINE));

client
    .create_collection(
        CreateCollectionBuilder::new(COLLECTION)
            .vectors_config(VectorParamsBuilder::new(
                384, // all-MiniLM-L6-v2 output dimension
                Distance::Cosine,
            ))
            .metadata(metadata),
    )
    .await?;

async fn check_gate(client: &Qdrant) -> anyhow::Result<()> {
    // compare this pipeline's constants against what the collection records about itself
    let meta = client
        .collection_info(COLLECTION)
        .await?
        .result
        .and_then(|info| info.config)
        .map(|config| config.metadata)
        .unwrap_or_default();

    if meta.get("embedding_model").and_then(|v| v.as_str()).map(String::as_str) != Some(MODEL)
        || meta.get("pipeline_version").and_then(|v| v.as_str()).map(String::as_str)
            != Some(PIPELINE)
    {
        anyhow::bail!(
            "collection was built by {meta:?}: full re-embed into a fresh collection required"
        );
    }
    Ok(())
}

fn content_hash(text: &str) -> String {
    Sha256::digest(text.as_bytes())
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn point_id(url: &str, anchor: &str, num: u32) -> String {
    // NAMESPACE_URL is a fixed constant uuid5 requires; it marks the input as a URL-like name
    uuid::Uuid::new_v5(
        &uuid::Uuid::NAMESPACE_URL,
        format!("{url}#{anchor}::{num}").as_bytes(),
    )
    .to_string()
}

/// Derive both values (and the section address) for every raw chunk.
fn prepare_chunks_for_sync(chunks: &[Chunk]) -> Vec<Chunk> {
    chunks
        .iter()
        .map(|c| {
            let text = normalize(&c.text);
            Chunk {
                text: text.clone(),
                section_url: if c.anchor.is_empty() {
                    c.url.clone()
                } else {
                    format!("{}#{}", c.url, c.anchor)
                },
                content_hash: content_hash(&text),
                point_id: point_id(&c.url, &c.anchor, c.chunk_num),
                ..c.clone()
            }
        })
        .collect()
}

fn payload(chunk: &Chunk, last_updated: Option<String>) -> anyhow::Result<Payload> {
    let last_updated = last_updated.unwrap_or_else(|| {
        chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, false)
    });
    Ok(Payload::try_from(serde_json::json!({
        "url": chunk.url,
        "anchor": chunk.anchor,
        "chunk_num": chunk.chunk_num,
        "section_url": chunk.section_url,
        "text": chunk.text,
        "content_hash": chunk.content_hash,
        "last_updated": last_updated,
    }))?)
}

for field in ["content_hash", "url", "section_url"] {
    client
        .create_field_index(CreateFieldIndexCollectionBuilder::new(
            COLLECTION,
            field,
            FieldType::Keyword,
        ))
        .await?;
}

let points: Vec<PointStruct> = prepare_chunks_for_sync(&chunks)
    .iter()
    .map(|c| {
        Ok(PointStruct::new(
            c.point_id.clone(),
            Document::new(&c.text, MODEL),
            payload(c, None)?,
        ))
    })
    .collect::<anyhow::Result<_>>()?;

client
    .upsert_points(UpsertPointsBuilder::new(COLLECTION, points).wait(true))
    .await?;

const QUERY: &str = "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?";

client
    .query(
        QueryPointsBuilder::new(COLLECTION)
            .query(Query::new_nearest(Document::new(QUERY, MODEL)))
            .limit(3)
            .with_payload(PayloadIncludeSelector::new(vec![
                "section_url".to_string(),
                "text".to_string(),
            ])),
    )
    .await?;

/// Compare the incoming chunk list to the collection: who is unchanged, changed, or unknown.
async fn split_by_state(
    client: &Qdrant,
    latest_chunks: &[Chunk],
) -> anyhow::Result<(HashMap<String, Chunk>, Vec<Chunk>, Vec<Chunk>, Vec<Chunk>)> {
    let incoming: HashMap<String, Chunk> = latest_chunks
        .iter()
        .map(|c| (c.point_id.clone(), c.clone()))
        .collect();

    let ids: Vec<PointId> = incoming.keys().map(|id| id.as_str().into()).collect();
    let points = client
        .get_points(
            GetPointsBuilder::new(COLLECTION, ids)
                .with_payload(PayloadIncludeSelector::new(vec!["content_hash".to_string()]))
                .with_vectors(false),
        )
        .await?;

    let mut stored: HashMap<String, String> = HashMap::new();
    for p in points.result {
        let hash = p.get("content_hash").as_str().cloned();
        if let (Some(PointIdOptions::Uuid(id)), Some(hash)) =
            (p.id.and_then(|i| i.point_id_options), hash)
        {
            stored.insert(id, hash);
        }
    }

    let (mut unchanged, mut content_changed, mut unknown_ids) =
        (Vec::new(), Vec::new(), Vec::new());
    for (pid, c) in &incoming {
        if stored.get(pid) == Some(&c.content_hash) {
            unchanged.push(c.clone());
        } else if stored.contains_key(pid) {
            content_changed.push(c.clone());
        } else {
            unknown_ids.push(c.clone());
        }
    }

    Ok((incoming, unchanged, content_changed, unknown_ids))
}

let (incoming_ids, unchanged, content_changed, unknown_ids) =
    split_by_state(&client, &latest_chunks).await?;

async fn re_embed_changed(client: &Qdrant, content_changed: &[Chunk]) -> anyhow::Result<()> {
    if content_changed.is_empty() {
        return Ok(());
    }
    let points: Vec<PointStruct> = content_changed
        .iter()
        .map(|c| {
            Ok(PointStruct::new(
                c.point_id.clone(),
                Document::new(&c.text, MODEL),
                payload(c, None)?,
            ))
        })
        .collect::<anyhow::Result<_>>()?;

    client
        .upsert_points(UpsertPointsBuilder::new(COLLECTION, points).wait(true))
        .await?;
    Ok(())
}

/// Reuse an existing embedding when the same text is already stored; embed only what is new.
async fn reuse_or_add(client: &Qdrant, unknown_ids: &[Chunk]) -> anyhow::Result<(usize, usize)> {
    let (mut reused, mut added) = (0, 0);

    for c in unknown_ids {
        let same_text =
            Filter::must([Condition::matches("content_hash", c.content_hash.clone())]);
        let hits = client
            .scroll(
                ScrollPointsBuilder::new(COLLECTION)
                    .filter(same_text)
                    .limit(1)
                    .with_payload(PayloadIncludeSelector::new(vec![
                        "last_updated".to_string()
                    ]))
                    .with_vectors(true),
            )
            .await?
            .result;

        let point = if let Some(hit) = hits.into_iter().next() {
            // same text, new address: copy the vector, keep its last_updated
            let last_updated = hit.get("last_updated").as_str().cloned();
            let vector: Vec<f32> = match hit.vectors.and_then(|v| v.vectors_options) {
                Some(vectors_output::VectorsOptions::Vector(v)) => match v.vector {
                    Some(vector_output::Vector::Dense(dense)) => dense.data,
                    _ => anyhow::bail!("expected a dense vector on the stored point"),
                },
                _ => anyhow::bail!("expected a dense vector on the stored point"),
            };
            reused += 1;
            PointStruct::new(c.point_id.clone(), vector, payload(c, last_updated)?)
        } else {
            // genuinely new content: embed and insert
            added += 1;
            PointStruct::new(
                c.point_id.clone(),
                Document::new(&c.text, MODEL),
                payload(c, None)?,
            )
        };

        client
            .upsert_points(UpsertPointsBuilder::new(COLLECTION, vec![point]).wait(true))
            .await?;
    }

    Ok((reused, added))
}

/// Remove every point the current crawl no longer contains. Returns how many.
async fn delete_gone(
    client: &Qdrant,
    incoming_ids: &HashMap<String, Chunk>,
) -> anyhow::Result<u64> {
    if incoming_ids.is_empty() {
        anyhow::bail!("Refusing to delete from an empty source snapshot.");
    }

    let stale = Filter::must_not([Condition::has_id(
        incoming_ids.keys().map(|id| PointId::from(id.as_str())),
    )]);

    let to_delete = client
        .count(CountPointsBuilder::new(COLLECTION).filter(stale.clone()))
        .await?
        .result
        .map(|r| r.count)
        .unwrap_or(0);

    // potential check against a threshold to avoid accidental mass deletion could be added here
    client
        .delete_points(DeletePointsBuilder::new(COLLECTION).points(stale).wait(true))
        .await?;
    Ok(to_delete)
}

async fn sync(
    client: &Qdrant,
    latest_chunks: &[Chunk],
) -> anyhow::Result<HashMap<&'static str, usize>> {
    check_gate(client).await?; // refuse to mix embedding models or pipeline versions

    let chunks = prepare_chunks_for_sync(latest_chunks);
    let (incoming_ids, unchanged, content_changed, unknown_ids) =
        split_by_state(client, &chunks).await?;

    re_embed_changed(client, &content_changed).await?;
    let (reused, added) = reuse_or_add(client, &unknown_ids).await?;
    let deleted = delete_gone(client, &incoming_ids).await?;

    Ok(HashMap::from([
        ("unchanged", unchanged.len()),
        ("re-embedded", content_changed.len()),
        ("reused_embedding", reused),
        ("added", added),
        ("deleted", deleted as usize),
    ]))
}

let run = sync(&client, &latest_chunks).await?;
println!("{run:?}");
```
