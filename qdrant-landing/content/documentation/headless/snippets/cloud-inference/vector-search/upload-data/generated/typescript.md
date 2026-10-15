```typescript
import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "crypto";

const denseModel = "sentence-transformers/all-minilm-l6-v2";
// NOTE: loadDataset is a user-defined function.
// Implement it to handle dataset loading as needed.
const dataset = loadDataset("miriad/miriad-4.4M", "train[0:100]");

const points = dataset.map((item) => {
  const passage = item.passage_text;

  return {
    id: randomUUID().toString(),
    vector: {
      dense_vector: {
        text: passage,
        model: denseModel,
      },
    },
    payload: {
      passage_text: passage, // used for BM25
    },
  };
});

await client.upsert("{collection_name}", { points });
```
