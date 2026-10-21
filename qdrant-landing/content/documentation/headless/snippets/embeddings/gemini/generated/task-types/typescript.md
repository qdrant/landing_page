```typescript
const legacyResponse = await gemini.models.embedContent({
  model: "gemini-embedding-001",
  contents: documents,
  config: { taskType: "RETRIEVAL_DOCUMENT" },
});
```
