```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

await client.createPayloadIndex("venues", {
    field_name: "location",
    field_schema: "geo",
});
```
