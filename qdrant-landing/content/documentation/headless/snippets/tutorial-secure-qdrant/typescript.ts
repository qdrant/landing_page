// @block-start upsert-no-auth
import { QdrantClient } from "@qdrant/js-client-rest";

// @hide-start
let client: QdrantClient;
// @hide-end

client = new QdrantClient({ url: "https://localhost:6333" });

try {
    await client.createCollection("my_collection", {
        vectors: { size: 4, distance: "Cosine" },
    });

    await client.upsert("my_collection", {
        points: [{ id: 1, vector: [0.1, 0.2, 0.3, 0.4] }],
    });
} catch (e: any) {
    console.error(e.message); // 401 Unauthorized
}
// @block-end upsert-no-auth

// @block-start upsert-admin-key
client = new QdrantClient({ url: "https://localhost:6333", apiKey: "my-admin-key" });

await client.createCollection("my_collection", {
    vectors: { size: 4, distance: "Cosine" },
});

await client.upsert("my_collection", {
    points: [{ id: 1, vector: [0.1, 0.2, 0.3, 0.4] }],
});
// @block-end upsert-admin-key

// @block-start delete-read-only-key
client = new QdrantClient({ url: "https://localhost:6333", apiKey: "my-read-only-key" });

try {
    await client.delete("my_collection", { points: [1] });
} catch (e: any) {
    console.error(e.message); // 403 Forbidden
}
// @block-end delete-read-only-key

// @block-start upsert-jwt-rw-collection
client = new QdrantClient({ url: "https://localhost:6333", apiKey: "<your-jwt>" });

await client.upsert("my_collection", {
    points: [{ id: 2, vector: [0.5, 0.6, 0.7, 0.8] }],
});
// @block-end upsert-jwt-rw-collection

// @block-start upsert-jwt-ro-collection
client = new QdrantClient({ url: "https://localhost:6333", apiKey: "<your-jwt>" });

try {
    await client.upsert("other_collection", {
        points: [{ id: 2, vector: [0.5, 0.6, 0.7, 0.8] }],
    });
} catch (e: any) {
    console.error(e.message); // 403 Forbidden
}
// @block-end upsert-jwt-ro-collection
