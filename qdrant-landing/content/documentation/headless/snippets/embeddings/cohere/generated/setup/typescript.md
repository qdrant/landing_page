```typescript
import { CohereClientV2 } from "cohere-ai";
import { QdrantClient } from "@qdrant/js-client-rest";

const cohere = new CohereClientV2({});
const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 2048, distance: "Cosine" },
});
```
