```typescript
import { readFile } from "node:fs/promises";

const VL_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2";

await client.createCollection("{image_collection_name}", {
  vectors: { size: 2048, distance: "Cosine" },
});

const imageUrl = "data:image/png;base64," + (await readFile("chart.png")).toString("base64");

const imageResponse = await nvidiaEmbed({
  model: VL_MODEL,
  input: [imageUrl],
  modality: ["image"],
  input_type: "passage",
});

await client.upsert("{image_collection_name}", {
  points: [{ id: 1, vector: imageResponse.data[0].embedding, payload: { file: "chart.png" } }],
});

const textResponse = await nvidiaEmbed({
  model: VL_MODEL,
  input: ["Which region had the highest revenue?"],
  modality: ["text"],
  input_type: "query",
});

const { points: imageHits } = await client.query("{image_collection_name}", {
  query: textResponse.data[0].embedding,
  limit: 3,
});
```
