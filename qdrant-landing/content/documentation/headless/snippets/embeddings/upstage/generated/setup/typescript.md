```typescript
import OpenAI from "openai";
import { QdrantClient } from "@qdrant/js-client-rest";

const upstage = new OpenAI({
  apiKey: process.env.UPSTAGE_API_KEY,
  baseURL: "https://api.upstage.ai/v1",
});
const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
```
