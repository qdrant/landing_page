import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
    points: [
        {
            id: 1,
            vector: {
                text: 'Recipe for baking chocolate chip cookies',
                model: 'openrouter/mistralai/mistral-embed-2312',
                options: {
                    'openrouter-api-key': '<your_openrouter_api_key>',
                },
            },
        },
    ],
});
