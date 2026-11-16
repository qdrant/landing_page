```typescript
import { SIEClient, denseEmbedding } from "@superlinked/sie-sdk";
import { QdrantClient } from "@qdrant/js-client-rest";

const MODEL = "BAAI/bge-m3";

const sie = new SIEClient("http://localhost:8080");
const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
```
