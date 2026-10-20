```typescript
const reducedTask = await twelvelabs.embed.v2.tasks.create({
  inputType: "video",
  modelName: MODEL,
  embeddingDimension: 256,
  video: { mediaSource: { url: VIDEO_URL } },
});

const reducedQuery = await twelvelabs.embed.v2.create({
  inputType: "multi_input",
  modelName: MODEL,
  embeddingDimension: 256,
  multiInput: { inputText: "A big rabbit wakes up in a forest" },
});
```
