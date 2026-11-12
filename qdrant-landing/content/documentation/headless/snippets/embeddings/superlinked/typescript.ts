// @block-start setup
import { SIEClient, denseEmbedding } from "@superlinked/sie-sdk";
import { QdrantClient } from "@qdrant/js-client-rest";

const MODEL = "BAAI/bge-m3";

const sie = new SIEClient("http://localhost:8080");
const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
// @block-end setup

// @block-start embed-documents
const documents = [
  "Qdrant is a vector search engine.",
  "SIE serves open embedding models from one endpoint.",
];

const results = await sie.encode(
  MODEL,
  documents.map((text) => ({ text })),
);

await client.upsert("{collection_name}", {
  points: results.map((result, idx) => ({
    id: idx,
    vector: denseEmbedding(result),
    payload: { text: documents[idx] },
  })),
});
// @block-end embed-documents

// @block-start embed-queries
const queryResult = await sie.encode(
  MODEL,
  { text: "What is Qdrant?" },
  { isQuery: true },
);

const { points: hits } = await client.query("{collection_name}", {
  query: denseEmbedding(queryResult),
  limit: 3,
});
// @block-end embed-queries

// @block-start hybrid-search-with-dense-and-sparse-vectors
import { sparseEmbedding } from "@superlinked/sie-sdk";

await client.createCollection("{hybrid_collection_name}", {
  vectors: { dense: { size: 1024, distance: "Cosine" } },
  sparse_vectors: { sparse: {} },
});

const hybridResults = await sie.encode(
  "BAAI/bge-m3",
  documents.map((text) => ({ text })),
  { outputTypes: ["dense", "sparse"] },
);

await client.upsert("{hybrid_collection_name}", {
  points: hybridResults.map((result, idx) => ({
    id: idx,
    vector: {
      dense: denseEmbedding(result),
      sparse: sparseEmbedding(result),
    },
    payload: { text: documents[idx] },
  })),
});
// @block-end hybrid-search-with-dense-and-sparse-vectors

// @block-start hybrid-search-with-dense-and-sparse-vectors-2
const hybridQuery = await sie.encode(
  "BAAI/bge-m3",
  { text: "What is Qdrant?" },
  { outputTypes: ["dense", "sparse"], isQuery: true },
);

const { points: hybridHits } = await client.query("{hybrid_collection_name}", {
  prefetch: [
    { query: denseEmbedding(hybridQuery), using: "dense", limit: 20 },
    { query: sparseEmbedding(hybridQuery), using: "sparse", limit: 20 },
  ],
  query: { fusion: "rrf" },
  limit: 3,
});
// @block-end hybrid-search-with-dense-and-sparse-vectors-2

// @block-start colbert-multivectors
import { multivectorEmbedding } from "@superlinked/sie-sdk";

await client.createCollection("{colbert_collection_name}", {
  vectors: {
    colbert: {
      size: 128,
      distance: "Cosine",
      multivector_config: { comparator: "max_sim" },
    },
  },
});

const colbertResults = await sie.encode(
  "jinaai/jina-colbert-v2",
  documents.map((text) => ({ text })),
  { outputTypes: ["multivector"] },
);

await client.upsert("{colbert_collection_name}", {
  points: colbertResults.map((result, idx) => {
    if (!result.multivector) throw new Error("SIE returned no multivector");
    return {
      id: idx,
      vector: { colbert: multivectorEmbedding(result.multivector) },
      payload: { text: documents[idx] },
    };
  }),
});

const colbertQuery = await sie.encode(
  "jinaai/jina-colbert-v2",
  { text: "What is Qdrant?" },
  { outputTypes: ["multivector"], isQuery: true },
);

if (!colbertQuery.multivector) throw new Error("SIE returned no query multivector");

const { points: colbertHits } = await client.query("{colbert_collection_name}", {
  query: multivectorEmbedding(colbertQuery.multivector),
  using: "colbert",
  limit: 3,
});
// @block-end colbert-multivectors
