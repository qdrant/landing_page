```typescript
import ollama from "ollama";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "qwen3-embedding:0.6b";

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
```
