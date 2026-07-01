import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

await withHeaders({ 'openai-api-key': '<YOUR_OPENAI_API_KEY>' }, () =>
    client.query("{collection_name}", {
        prefetch: {
            query: {
                text: "How to bake cookies?",
                model: "openai/text-embedding-3-small",
                options: {
                    mrl: 64,
                }
            },
            using: 'small',
            limit: 1000,
        },
        query: {
            text: "How to bake cookies?",
            model: "openai/text-embedding-3-small",
        },
        using: 'large',
        limit: 10,
    })
);
