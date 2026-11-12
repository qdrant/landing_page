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
```
