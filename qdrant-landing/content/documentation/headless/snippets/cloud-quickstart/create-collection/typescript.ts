import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "https://xyz-example.qdrant.io:6333", apiKey: "<your-api-key>" }); // @hide

await client.createCollection("items", {
    vectors: { size: 384, distance: "Cosine" },
});
