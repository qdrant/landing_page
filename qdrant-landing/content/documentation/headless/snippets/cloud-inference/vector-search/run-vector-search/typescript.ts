// @hide-start
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const queryText = "{query_text}";
const denseModel = "{dense_model_name}";
const bm25Model = "{bm25_model_name}";
// @hide-end

const results = await client.query("{collection_name}", {
    prefetch: [
        {
            query: {
                text: queryText,
                model: denseModel,
            },
            using: "dense_vector",
        },
        {
            query: {
                text: queryText,
                model: bm25Model,
            },
            using: "bm25_sparse_vector",
        },
    ],
    query: {
        fusion: "rrf",
    },
});
