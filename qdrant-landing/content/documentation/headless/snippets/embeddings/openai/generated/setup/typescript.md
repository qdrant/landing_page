```typescript
import OpenAI from "openai";
import { QdrantClient } from "@qdrant/js-client-rest";

const openai = new OpenAI();
const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "text-embedding-3-small";

await client.createCollection("{collection_name}", {
  vectors: { size: 1536, distance: "Cosine" },
});
```
