import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: {
        text: 'Mission to Mars',
        model: 'jinaai/jina-clip-v2',
        options: {
            'jina-api-key': '<your_jinaai_api_key>',
            dimensions: 512,
        },
    },
});
