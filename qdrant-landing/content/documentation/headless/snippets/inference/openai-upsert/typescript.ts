import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

await withHeaders({ 'openai-api-key': '<YOUR_OPENAI_API_KEY>' }, () =>
    client.upsert("{collection_name}", {
        points: [
            {
                id: 1,
                vector: {
                    text: 'Recipe for baking chocolate chip cookies',
                    model: 'openai/text-embedding-3-large',
                    options: {
                        dimensions: 512,
                    },
                },
            },
        ],
    })
);
