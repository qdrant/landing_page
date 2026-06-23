import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

await withHeaders({ 'jina-api-key': '<YOUR_JINAAI_API_KEY>' }, () =>
    client.query("{collection_name}", {
        query: {
            text: 'Mission to Mars',
            model: 'jinaai/jina-clip-v2',
            options: {
                dimensions: 512,
            },
        },
    })
);
