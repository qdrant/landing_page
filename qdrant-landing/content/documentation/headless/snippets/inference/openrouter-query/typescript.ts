import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

await withHeaders({ 'openrouter-api-key': '<YOUR_OPENROUTER_API_KEY>' }, () =>
    client.query("{collection_name}", {
        query: {
            text: 'How to bake cookies?',
            model: 'openrouter/mistralai/mistral-embed-2312',
        },
    })
);
