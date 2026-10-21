```typescript
const reduced = await cohere.embed({
  model: "embed-v5.0-pro",
  inputType: "search_document",
  texts: documents,
  outputDimension: 512,
  embeddingTypes: ["float"],
});
```
