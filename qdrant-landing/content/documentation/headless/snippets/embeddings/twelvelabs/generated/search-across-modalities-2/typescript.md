```typescript
const imageQuery = await twelvelabs.embed.v2.create({
  inputType: "multi_input",
  modelName: MODEL,
  multiInput: {
    mediaSources: [
      {
        mediaType: "image",
        url: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
      },
    ],
  },
});

const { points: imageHits } = await client.query("{collection_name}", {
  query: imageQuery.data[0].embedding,
  filter: { must: [{ key: "embedding_option", match: { value: "visual" } }] },
  limit: 3,
});
```
