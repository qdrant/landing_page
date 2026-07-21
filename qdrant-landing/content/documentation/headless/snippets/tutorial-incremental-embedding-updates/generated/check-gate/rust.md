```rust
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
```
