// @block-start setup
import { Mistral } from "@mistralai/mistralai";
import { QdrantClient } from "@qdrant/js-client-rest";

const mistral = new Mistral();
const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "mistral-embed";

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
// @block-end setup

// @block-start embed-documents
const documents = [
  "Qdrant is a vector search engine.",
  "Mistral embedding models turn text into dense vectors.",
];

const response = await mistral.embeddings.create({ model: MODEL, inputs: documents });

await client.upsert("{collection_name}", {
  points: response.data.map((item) => ({
    id: item.index!,
    vector: item.embedding!,
    payload: { text: documents[item.index!] },
  })),
});
// @block-end embed-documents

// @block-start embed-queries
const queryResponse = await mistral.embeddings.create({
  model: MODEL,
  inputs: ["What is Qdrant?"],
});

const queryVector = queryResponse.data[0].embedding;
if (!queryVector) throw new Error("Mistral returned no query embedding");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});
// @block-end embed-queries

// @block-start reduce-vector-size
const reduced = await mistral.embeddings.create({
  model: "codestral-embed",
  inputs: ["def add(a, b):\n    return a + b"],
  outputDimension: 512,
});
// @block-end reduce-vector-size
