```typescript
import {QdrantClient} from "@qdrant/js-client-rest";

const client = new QdrantClient({
    url: 'https://xyz-example.qdrant.io:6333',
    apiKey: '<paste-your-api-key-here>',
});

const points = [
  {
    id: 1,
    payload: { topic: "cooking", type: "dessert" },
    vector: {
        text: "Recipe for baking chocolate chip cookies",
        model: "<the-model-to-use>"
      }
  }
];

await client.upsert("<your-collection>", { wait: true, points });

const result = await client.query(
    "<your-collection>",
    {
      query: {
          text: "How to bake cookies?",
          model: "<the-model-to-use>"
      },
    }
)

console.log(result);
```
