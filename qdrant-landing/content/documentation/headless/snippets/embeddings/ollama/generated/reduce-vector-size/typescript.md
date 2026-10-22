```typescript
const reduced = await ollama.embed({
  model: MODEL,
  input: documents,
  dimensions: 256,
});
```
