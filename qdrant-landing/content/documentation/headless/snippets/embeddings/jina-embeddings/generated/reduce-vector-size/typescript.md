```typescript
const reduced = await jinaEmbed({
  model: MODEL,
  task: "retrieval.passage",
  input: documents,
  dimensions: 256,
});
```
