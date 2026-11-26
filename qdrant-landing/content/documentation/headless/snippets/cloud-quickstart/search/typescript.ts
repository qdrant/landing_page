import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "https://xyz-example.qdrant.io:6333", apiKey: "<your-api-key>" }); // @hide

const queryText = "vegetarian dishes";

const results = await client.query("items", {
    query: {
        text: queryText,
        model: "sentence-transformers/all-MiniLM-L6-v2",
    },
    with_payload: true,
    limit: 5,
});

for (const result of results.points) {
    console.log(`Item: ${result.payload?.item_name || "N/A"}`);
    console.log(`Score: ${result.score}`);
    console.log(`Description: ${result.payload?.description || "N/A"}`);
    console.log(`Price: ${result.payload?.price || "N/A"}`);
    console.log("---");
}
