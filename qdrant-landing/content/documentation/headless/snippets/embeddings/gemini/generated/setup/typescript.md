```typescript
import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";

const gemini = new GoogleGenAI({});
const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "gemini-embedding-2";

await client.createCollection("{collection_name}", {
  vectors: { size: 3072, distance: "Cosine" },
});
```
