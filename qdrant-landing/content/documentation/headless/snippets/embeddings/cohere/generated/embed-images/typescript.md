```typescript
import { readFile } from "node:fs/promises";

const imageUrl = "data:image/png;base64," + (await readFile("diagram.png")).toString("base64");

const imageResponse = await cohere.embed({
  model: "embed-v5.0-pro",
  inputType: "search_document",
  images: [imageUrl],
  embeddingTypes: ["float"],
});

await client.upsert("{collection_name}", {
  points: [{ id: 2, vector: imageResponse.embeddings.float![0], payload: { image: "diagram.png" } }],
});
```
