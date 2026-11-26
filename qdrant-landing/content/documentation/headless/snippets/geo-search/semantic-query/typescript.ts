import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "https://xyz-example.qdrant.io:6333", apiKey: "<your-api-key>" }); // @hide

const results = await client.query("venues", {
    query: {
        text: "quiet café to work from",
        model: "sentence-transformers/all-minilm-l6-v2",
    },
    filter: {
        must: [
            {
                key: "location",
                geo_radius: {
                    center: { lon: 13.403683, lat: 52.520711 },
                    radius: 1500.0,
                },
            },
        ],
    },
    limit: 5,
});
