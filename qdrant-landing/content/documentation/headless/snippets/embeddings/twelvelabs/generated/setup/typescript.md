```typescript
import { TwelveLabs } from "twelvelabs-js";
import { QdrantClient } from "@qdrant/js-client-rest";

const twelvelabs = new TwelveLabs({ apiKey: process.env.TWELVE_LABS_API_KEY });
const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "marengo3.5";

await client.createCollection("{collection_name}", {
  vectors: { size: 512, distance: "Cosine" },
});
```
