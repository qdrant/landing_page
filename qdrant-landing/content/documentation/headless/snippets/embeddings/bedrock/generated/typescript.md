```typescript
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { QdrantClient } from "@qdrant/js-client-rest";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL_ID = "amazon.titan-embed-text-v2:0";

async function embed(text: string): Promise<number[]> {
  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      body: JSON.stringify({ inputText: text, dimensions: 1024, normalize: true }),
    })
  );
  return JSON.parse(new TextDecoder().decode(response.body)).embedding;
}

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});

const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "Amazon Bedrock serves embedding models through the AWS SDKs.",
];

await client.upsert("{collection_name}", {
  points: await Promise.all(
    documents.map(async (doc, idx) => ({
      id: idx,
      vector: await embed(doc),
      payload: { text: doc },
    }))
  ),
});

const { points: hits } = await client.query("{collection_name}", {
  query: await embed("What is Qdrant?"),
  limit: 3,
});

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
