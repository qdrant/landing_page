---
title: Gemini
---

# Gemini

[Google Gemini](https://ai.google.dev/) provides embedding models that are capable of mapping text, image, video, audio, and PDFs and their interleaved combinations thereof into a single, unified vector space. Built on the Gemini architecture, it supports 100+ languages.

The following example shows how to integrate Gemini embeddings with Qdrant:

## Setup

```python
# Install the packages from PyPI
# pip install google-genai qdrant-client
```

```typescript
// Install the packages from npm
// npm install @google/genai @qdrant/js-client-rest
```

Let's see how to use the Embedding Model API to embed documents for retrieval.

The following example shows how to embed multiple documents with the `gemini-embedding-2-preview` model using the `RETRIEVAL_DOCUMENT` [task type](#supported-task-types):

## Embedding a document

```python
from google.genai import Client, types
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

gemini_client = Client()  # Needs the GEMINI_API_KEY env to be set
client = QdrantClient(url="http://localhost:6333")

texts = [
    "Qdrant is a vector database that is compatible with Gemini.",
    "Gemini is a family of natively multimodal, large language models (LLMs).",
]

result = gemini_client.models.embed_content(
    model="gemini-embedding-2-preview",
    contents=texts,
    config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
)
```

```typescript
import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";

const geminiClient = new GoogleGenAI(); // Needs the GEMINI_API_KEY env to be set
const client = new QdrantClient({ url: "http://localhost:6333" });

const texts = [
  "Qdrant is a vector database that is compatible with Gemini.",
  "Gemini is a family of natively multimodal, large language models (LLMs).",
];

const result = await geminiClient.models.embedContent({
  model: "gemini-embedding-2-preview",
  contents: texts,
  config: { taskType: "RETRIEVAL_DOCUMENT" },
});
```

## Creating Qdrant Points and Indexing documents with Qdrant

### Creating Qdrant Points

```python
points = [
    PointStruct(
        id=idx,
        vector=embedding.values,
        payload={"text": text},
    )
    for idx, (embedding, text) in enumerate(zip(result.embeddings, texts))
]
```

```typescript
const points = texts.map((text, idx) => ({
  id: idx,
  vector: result.embeddings[idx].values,
  payload: { text },
}));
```

### Create Collection

By default, `gemini-embedding-2-preview` outputs a 3072-dimensional embedding vector. You can reduce it to a smaller size (e.g., 768 or 1536) using the `output_dimensionality` configuration to save storage space. In this example, we keep the default 3072 dimensions.

```python
client.create_collection(
    collection_name="{collection_name}", 
    vectors_config=VectorParams(
        size=3072,
        distance=Distance.COSINE,
    )
)
```

```typescript
await client.createCollection("{collection_name}", {
  vectors: { size: 3072, distance: "Cosine" },
});
```

### Add these into the collection

```python
client.upsert("{collection_name}", points)
```

```typescript
await client.upsert("{collection_name}", { points });
```

### Searching for documents

Once the documents are indexed, you can search for the most relevant documents using the same model with the `RETRIEVAL_QUERY` task type:

```python
query_result = gemini_client.models.embed_content(
    model="gemini-embedding-2-preview",
    contents="Is Qdrant compatible with Gemini?",
    config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
)

client.query_points(
    collection_name="{collection_name}",
    query=query_result.embeddings[0].values,
)
```

```typescript
const queryResult = await geminiClient.models.embedContent({
  model: "gemini-embedding-2-preview",
  contents: "Is Qdrant compatible with Gemini?",
  config: { taskType: "RETRIEVAL_QUERY" },
});

const searchResult = await client.query("{collection_name}", {
  query: queryResult.embeddings[0].values,
});
```

## Embedding files

You can embed files such as PDFs directly:

```python
with open("filename.pdf", "rb") as f:
    pdf_bytes = f.read()

pdf_part = types.Part.from_bytes(
    data=pdf_bytes,
    mime_type='application/pdf',
)

gemini_client.models.embed_content(
    model="gemini-embedding-2-preview",
    contents=[pdf_part],
)
```

```typescript
import { readFileSync } from "fs";

const pdfBytes = readFileSync("filename.pdf");
const base64 = pdfBytes.toString("base64");

await geminiClient.models.embedContent({
  model: "gemini-embedding-2-preview",
  contents: [{
    parts: [{ inlineData: { mimeType: "application/pdf", data: base64 } }],
  }],
});
```

## Supported task types

You can specify the `task_type` parameter in the API call. This parameter designates the intended purpose for the embeddings, helping optimize them for the intended relationships.

The Embedding Model API supports various task types, including:

- `RETRIEVAL_DOCUMENT`: Embeddings optimized for document search. Indexing articles, books, or web pages for search.
- `RETRIEVAL_QUERY`: Embeddings optimized for general search queries. Use `RETRIEVAL_QUERY` for queries; `RETRIEVAL_DOCUMENT` for documents to be retrieved.
- `SEMANTIC_SIMILARITY`: Embeddings optimized to assess text similarity.
- `CLASSIFICATION`: Embeddings optimized to classify texts according to preset labels.
- `CLUSTERING`: Embeddings optimized to cluster texts based on their similarities.
- `CODE_RETRIEVAL_QUERY`: Embeddings optimized for retrieval of code blocks based on natural language queries.
- `QUESTION_ANSWERING`: Embeddings for questions in a question-answering system.
- `FACT_VERIFICATION`: Embeddings for statements that need to be verified.

### Further Reading

- [Gemini API Quickstart](https://ai.google.dev/gemini-api/docs)
- [Gemini Embeddings Documentation](https://ai.google.dev/gemini-api/docs/embeddings)
