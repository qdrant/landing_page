// @block-start setup
import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";

const gemini = new GoogleGenAI({});
const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "gemini-embedding-2";

await client.createCollection("{collection_name}", {
  vectors: { size: 3072, distance: "Cosine" },
});
// @block-end setup

// @block-start embed-documents
const documents = [
  "Qdrant is a vector search engine.",
  "Gemini embedding models map text, images, video, audio, and PDFs into one vector space.",
];

const response = await gemini.models.embedContent({
  model: MODEL,
  contents: documents.map((doc) => ({ parts: [{ text: `title: none | text: ${doc}` }] })),
});

await client.upsert("{collection_name}", {
  points: response.embeddings!.map((embedding, idx) => ({
    id: idx,
    vector: embedding.values!,
    payload: { text: documents[idx] },
  })),
});
// @block-end embed-documents

// @block-start embed-queries
const queryResponse = await gemini.models.embedContent({
  model: MODEL,
  contents: "task: search result | query: What is Qdrant?",
});

const queryVector = queryResponse.embeddings?.[0]?.values;
if (!queryVector) throw new Error("Gemini returned no query embedding");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});
// @block-end embed-queries

// @block-start task-types
const legacyResponse = await gemini.models.embedContent({
  model: "gemini-embedding-001",
  contents: documents,
  config: { taskType: "RETRIEVAL_DOCUMENT" },
});
// @block-end task-types

// @block-start embed-images-video-audio-and-pdfs
import { readFileSync } from "node:fs";

const pdfResponse = await gemini.models.embedContent({
  model: MODEL,
  contents: [
    { inlineData: { mimeType: "application/pdf", data: readFileSync("filename.pdf", "base64") } },
  ],
});

await client.upsert("{collection_name}", {
  points: [{ id: 100, vector: pdfResponse.embeddings![0].values!, payload: { file: "filename.pdf" } }],
});
// @block-end embed-images-video-audio-and-pdfs

// @block-start reduce-vector-size
const reduced = await gemini.models.embedContent({
  model: MODEL,
  contents: "task: search result | query: What is Qdrant?",
  config: { outputDimensionality: 768 },
});
// @block-end reduce-vector-size
