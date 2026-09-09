```typescript
async function checkGate() {
    // compare this pipeline's constants against what the collection records about itself
    const meta = ((await client.getCollection(COLLECTION)).config.metadata ??
        {}) as Record<string, unknown>;

    if (meta.embedding_model !== MODEL || meta.pipeline_version !== PIPELINE) {
        throw new Error(`collection was built by ${JSON.stringify(meta)}: full re-embed into a fresh collection required`);
    }
}
```
