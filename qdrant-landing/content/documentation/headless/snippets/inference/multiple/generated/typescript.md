```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
    points: [
        {
            id: 1,
            vector: {
                image: {
                    image: 'https://qdrant.tech/example.png',
                    model: 'jinaai/jina-clip-v2',
                    options: {
                        'jina-api-key': '<your_jinaai_api_key>',
                        dimensions: 512,
                    },
                },
                text: {
                    text: 'Mars, the red planet',
                    model: 'sentence-transformers/all-minilm-l6-v2',
                },
                bm25: {
                    text: 'Mars, the red planet',
                    model: 'Qdrant/bm25',
                },
            },
        },
    ],
});
```
