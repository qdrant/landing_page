import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "https://xyz-example.qdrant.io:6333", apiKey: "<your-api-key>" }); // @hide

await client.createPayloadIndex("venues", {
    field_name: "location",
    field_schema: "geo",
});
