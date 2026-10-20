// @block-start setup
import { VoyageAIClient } from "voyageai";
import { QdrantClient } from "@qdrant/js-client-rest";

const voyage = new VoyageAIClient();
const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
// @block-end setup

// @block-start embed-documents
const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "Voyage AI embedding models turn text into dense vectors.",
];

const response = await voyage.embed({
  input: documents,
  model: "voyage-4-large",
  inputType: "document",
});

await client.upsert("{collection_name}", {
  points: response.data!.map((item) => ({
    id: item.index!,
    vector: item.embedding!,
    payload: { text: documents[item.index!] },
  })),
});
// @block-end embed-documents

// @block-start embed-queries
const queryResponse = await voyage.embed({
  input: ["What is Qdrant?"],
  model: "voyage-4-large",
  inputType: "query",
});

const queryVector = queryResponse.data?.[0]?.embedding;
if (!queryVector) throw new Error("Voyage AI returned no query embedding");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});
// @block-end embed-queries

// @block-start reduce-vector-size
const reduced = await voyage.embed({
  input: documents,
  model: "voyage-4-large",
  inputType: "document",
  outputDimension: 512,
});
// @block-end reduce-vector-size

// @block-start embed-images
import { readFile } from "node:fs/promises";

await client.createCollection("{image_collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});

const imageBase64 = "data:image/png;base64," + (await readFile("diagram.png")).toString("base64");

const imageResponse = await voyage.multimodalEmbed({
  inputs: [{ content: [{ type: "image_base64", imageBase64 }] }],
  model: "voyage-multimodal-3.5",
  inputType: "document",
});

await client.upsert("{image_collection_name}", {
  points: [{ id: 0, vector: imageResponse.data![0].embedding!, payload: { image: "diagram.png" } }],
});

const imageQuery = await voyage.multimodalEmbed({
  inputs: [{ content: [{ type: "text", text: "How is Qdrant deployed?" }] }],
  model: "voyage-multimodal-3.5",
  inputType: "query",
});

const imageQueryVector = imageQuery.data?.[0]?.embedding;
if (!imageQueryVector) throw new Error("Voyage AI returned no query embedding");

const { points: imageHits } = await client.query("{image_collection_name}", {
  query: imageQueryVector,
  limit: 3,
});
// @block-end embed-images
