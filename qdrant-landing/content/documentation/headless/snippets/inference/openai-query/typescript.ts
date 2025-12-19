import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: {
        text: 'How to bake cookies?',
        model: 'openai/text-embedding-3-large',
        options: {
            'openai-api-key': '<your_openai_api_key>',
            dimensions: 512,
        },
    },
});
