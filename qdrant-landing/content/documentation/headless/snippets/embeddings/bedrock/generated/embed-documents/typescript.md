```typescript
const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "Amazon Bedrock serves embedding models through the AWS SDKs.",
];

await client.upsert("{collection_name}", {
  points: await Promise.all(
    documents.map(async (doc, idx) => ({
      id: idx,
      vector: await embed(doc),
      payload: { text: doc },
    }))
  ),
});
```
