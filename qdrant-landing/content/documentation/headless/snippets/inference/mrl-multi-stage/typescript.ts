import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: {
        query: {
            text: "How to bake cookies?",
            model: "openai/text-embedding-3-small",
            options: {
                "openai-api-key": "<YOUR_OPENAI_API_KEY>",
                mrl: 64,
            }
        },
        using: 'small',
        limit: 1000,
    },
    query: {
        text: "How to bake cookies?",
        model: "openai/text-embedding-3-small",
        options: {
            "openai-api-key": "<YOUR_OPENAI_API_KEY>"
        }
    },
    using: 'large',
    limit: 10,
});
