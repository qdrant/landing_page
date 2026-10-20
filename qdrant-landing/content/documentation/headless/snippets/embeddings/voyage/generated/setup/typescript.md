```typescript
import { VoyageAIClient } from "voyageai";
import { QdrantClient } from "@qdrant/js-client-rest";

const voyage = new VoyageAIClient();
const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
```
