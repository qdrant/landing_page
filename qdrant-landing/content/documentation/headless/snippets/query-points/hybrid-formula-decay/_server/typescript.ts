import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

await client.query("{collection_name}", {
    prefetch: {
        prefetch: [
            {
                query: {
                    values: [0.22, 0.8],
                    indices: [1, 42],
                },
                using: "sparse",
                limit: 100,
            },
            {
                query: [0.01, 0.45, 0.67], // <-- dense vector
                using: "dense",
                limit: 100,
            },
        ],
        query: { rrf: {} },
        limit: 100,
    },
    query: {
        formula: {
            sum: [
                "$score", // the fused score from the RRF prefetch
                {
                    mult: [
                        0.1, // caps decay contribution; un-weighted decay [0, 1] would otherwise crowd out small RRF scores
                        {
                            exp_decay: {
                                x: { datetime_key: "published_at" },
                                target: { datetime: "YYYY-MM-DDT00:00:00Z" },
                                scale: 86400 * 180, // 180 days in seconds
                                midpoint: 0.5,
                            },
                        },
                    ],
                },
            ],
        },
    },
    limit: 10,
});
