```typescript
const reduced = await gemini.models.embedContent({
  model: MODEL,
  contents: "task: search result | query: What is Qdrant?",
  config: { outputDimensionality: 768 },
});
```
