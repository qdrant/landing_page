```typescript
import { Mistral } from "@mistralai/mistralai";
import { QdrantClient } from "@qdrant/js-client-rest";

const mistral = new Mistral();
const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "mistral-embed";

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
```
