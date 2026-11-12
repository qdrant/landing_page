```typescript
import { readFile } from "node:fs/promises";

const NOVA_ID = "amazon.nova-2-multimodal-embeddings-v1:0";

async function novaEmbed(purpose: string, content: object): Promise<number[]> {
  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: NOVA_ID,
      contentType: "application/json",
      body: JSON.stringify({
        taskType: "SINGLE_EMBEDDING",
        singleEmbeddingParams: {
          embeddingPurpose: purpose,
          embeddingDimension: 1024,
          ...content,
        },
      }),
    })
  );
  return JSON.parse(new TextDecoder().decode(response.body)).embeddings[0].embedding;
}

await client.createCollection("{image_collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});

const image = {
  format: "jpeg",
  source: { bytes: (await readFile("photo.jpg")).toString("base64") },
};

await client.upsert("{image_collection_name}", {
  points: [
    {
      id: 1,
      vector: await novaEmbed("GENERIC_INDEX", { image }),
      payload: { file: "photo.jpg" },
    },
  ],
});

const { points: imageHits } = await client.query("{image_collection_name}", {
  query: await novaEmbed("IMAGE_RETRIEVAL", {
    text: { truncationMode: "END", value: "A dog on a beach" },
  }),
  limit: 3,
});
```
