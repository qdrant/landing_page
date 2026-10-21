```typescript
import { readFile } from "node:fs/promises";

await client.createCollection("{image_collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});

const imageBase64 = "data:image/png;base64," + (await readFile("diagram.png")).toString("base64");

const imageResponse = await voyage.multimodalEmbed({
  inputs: [{ content: [{ type: "image_base64", imageBase64 }] }],
  model: "voyage-multimodal-3.5",
  inputType: "document",
});

await client.upsert("{image_collection_name}", {
  points: [{ id: 0, vector: imageResponse.data![0].embedding!, payload: { image: "diagram.png" } }],
});

const imageQuery = await voyage.multimodalEmbed({
  inputs: [{ content: [{ type: "text", text: "How is Qdrant deployed?" }] }],
  model: "voyage-multimodal-3.5",
  inputType: "query",
});

const imageQueryVector = imageQuery.data?.[0]?.embedding;
if (!imageQueryVector) throw new Error("Voyage AI returned no query embedding");

const { points: imageHits } = await client.query("{image_collection_name}", {
  query: imageQueryVector,
  limit: 3,
});
```
