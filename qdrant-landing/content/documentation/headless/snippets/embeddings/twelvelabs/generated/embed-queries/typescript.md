```typescript
const response = await twelvelabs.embed.v2.create({
  inputType: "multi_input",
  modelName: MODEL,
  multiInput: { inputText: "A big rabbit wakes up in a forest" },
});

const { points: hits } = await client.query("{collection_name}", {
  query: response.data[0].embedding,
  limit: 3,
});
```
