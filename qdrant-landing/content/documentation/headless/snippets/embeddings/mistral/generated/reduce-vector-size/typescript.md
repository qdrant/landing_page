```typescript
const reduced = await mistral.embeddings.create({
  model: "codestral-embed",
  inputs: ["def add(a, b):\n    return a + b"],
  outputDimension: 512,
});
```
