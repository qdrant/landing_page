```typescript
import { QdrantClient, Schemas } from "@qdrant/js-client-rest";

// Replace url and apiKey with your own from https://cloud.qdrant.io
const client = new QdrantClient({
    url: "https://xyz-example.qdrant.io:6333",
    apiKey: "<your-api-key>",
});
```
