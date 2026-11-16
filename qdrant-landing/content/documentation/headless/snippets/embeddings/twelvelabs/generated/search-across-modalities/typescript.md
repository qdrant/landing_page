```typescript
const audioQuery = await twelvelabs.embed.v2.create({
  inputType: "multi_input",
  modelName: MODEL,
  multiInput: {
    mediaSources: [
      {
        mediaType: "audio",
        url: "https://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3",
      },
    ],
  },
});

const { points: audioHits } = await client.query("{collection_name}", {
  query: audioQuery.data[0].embedding,
  filter: { must: [{ key: "embedding_option", match: { value: "audio" } }] },
  limit: 3,
});
```
