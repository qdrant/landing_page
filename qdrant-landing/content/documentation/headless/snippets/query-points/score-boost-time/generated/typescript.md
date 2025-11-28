```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const time_boosted = await client.query(collectionName, {
  prefetch: {
    query: [0.2, 0.8, ...], // <-- dense vector
    limit: 50
  },
   query: {
      formula: {
          sum: [ //  the final score = score + exp_decay(target_time - x_time)
              "$score",
              {
                  exp_decay: {
                      x: {
                          datetime_key: "update_time" // payload key
                      },
                      target: {
                          datetime: "YYYY-MM-DDT00:00:00Z" // current datetime
                      },
                      midpoint: 0.5,
                      scale: 86400 // 1 day in seconds
                  }
              }
          ]
      }
  }
});
```
