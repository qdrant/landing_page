```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: "https://xyz-example.eu-central.aws.cloud.qdrant.io",
  port: 6333,
  headers: {
    authorization: "Bearer your_token_here",
  },
});
```
