---
title: VoltAgent
---

# VoltAgent

[VoltAgent](https://github.com/VoltAgent/voltagent) is a TypeScript-based open-source framework designed for developing AI agents that support modular tool integration, LLM coordination, and adaptable multi-agent architectures. The framework includes an integrated observability dashboard similar to n8n, enabling visual monitoring of agent operations, action tracking, and streamlined debugging capabilities.

## Installation

Create a new VoltAgent project with Qdrant integration:

```bash
npm create voltagent-app@latest -- --example with-qdrant
cd with-qdrant
```

This command generates a fully configured project combining VoltAgent and Qdrant, including example data and two distinct agent implementation patterns.

Install the dependencies:

```bash
npm install
```

## Environment Setup

Create a `.env` file with your configuration:

```env
# Qdrant URL
# docker run -p 6333:6333 qdrant/qdrant
QDRANT_URL=http://localhost:6333

# Qdrant API key (Optional)
QDRANT_API_KEY=your-qdrant-api-key-here

# OpenAI API key for embeddings and LLM
OPENAI_API_KEY=your-openai-api-key-here
```

Start your VoltAgent application:

```bash
npm run dev
```

Refer to source code of example [here](https://github.com/VoltAgent/voltagent/tree/main/examples/with-qdrant).

## How It Works

The sections below demonstrate the construction of this example and provide guidance on adapting it to your needs.

### Create the Qdrant Retriever

Create `src/retriever/index.ts`:

```typescript
import { BaseRetriever, type BaseMessage, type RetrieveOptions } from "@voltagent/core";
import { QdrantClient } from "@qdrant/js-client-rest";

// Initialize Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
});

const collectionName = "voltagent-knowledge-base";
```

**Key Components Explained**:

- **Qdrant Client**: Connects to Qdrant's REST API
- **Collection**: A named container for your vectors in Qdrant
- **Open Source & Cloud**: Use locally or as a managed service

### Initialize Collection and Sample Data

The provided example handles automatic creation and initialization of your Qdrant collection with data:

```typescript
async function initializeCollection() {
  try {
    // Check if collection exists
    let exists = false;
    try {
      await qdrant.getCollection(collectionName);
      exists = true;
      console.log(`📋 Collection "${collectionName}" already exists`);
    } catch (error) {
      console.log(`📋 Creating new collection "${collectionName}"...`);
    }

    // Create collection if it doesn't exist
    if (!exists) {
      await qdrant.createCollection(collectionName, {
        vectors: { size: 1536, distance: "Cosine" },
      });
      console.log(`✅ Collection "${collectionName}" created successfully`);
    }

    // Check if we need to populate with sample data
    const stats = await qdrant.count(collectionName);
    if (stats.count === 0) {
      console.log("📚 Populating collection with sample documents...");
      // Generate embeddings for sample documents using OpenAI
      const OpenAI = await import("openai");
      const openai = new OpenAI.default({
        apiKey: process.env.OPENAI_API_KEY!,
      });
      const points = [];
      for (const record of sampleRecords) {
        try {
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: record.payload.text,
          });
          points.push({
            id: record.id,
            vector: embeddingResponse.data[0].embedding,
            payload: record.payload,
          });
        } catch (error) {
          console.error(`Error generating embedding for ${record.id}:`, error);
        }
      }
      if (points.length > 0) {
        await qdrant.upsert(collectionName, { points });
        console.log(`✅ Successfully upserted ${points.length} documents to collection`);
      }
    } else {
      console.log(`📊 Collection already contains ${stats.count} documents`);
    }
  } catch (error) {
    console.error("Error initializing Qdrant collection:", error);
  }
}
```

**What This Does**:

- Creates a Qdrant collection with cosine similarity
- Generates embeddings using OpenAI's API
- Adds the embeddings and payloads to Qdrant

### Implement the Retriever Class

Implement the primary retriever class for vector search functionality:

```typescript
// Retriever function
async function retrieveDocuments(query: string, topK = 3) {
  try {
    // Generate embedding for the query
    const OpenAI = await import("openai");
    const openai = new OpenAI.default({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const queryVector = embeddingResponse.data[0].embedding;
    // Perform search in Qdrant
    const searchResults = (
      await qdrant.query(collectionName, {
        query: queryVector,
        limit: topK,
        with_payload: true,
      })
    ).points;
    // Format results
    return (
      searchResults.map((match: any) => ({
        content: match.payload?.text || "",
        metadata: match.payload || {},
        score: match.score || 0,
        id: match.id,
      })) || []
    );
  } catch (error) {
    console.error("Error retrieving documents from Qdrant:", error);
    return [];
  }
}

/**
 * Qdrant-based retriever implementation for VoltAgent
 */
export class QdrantRetriever extends BaseRetriever {
  /**
   * Retrieve documents from Qdrant based on semantic similarity
   * @param input - The input to use for retrieval (string or BaseMessage[])
   * @param options - Configuration and context for the retrieval
   * @returns Promise resolving to a formatted context string
   */
  async retrieve(input: string | BaseMessage[], options: RetrieveOptions): Promise<string> {
    // Convert input to searchable string
    let searchText = "";
    if (typeof input === "string") {
      searchText = input;
    } else if (Array.isArray(input) && input.length > 0) {
      const lastMessage = input[input.length - 1];
      if (Array.isArray(lastMessage.content)) {
        const textParts = lastMessage.content
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text);
        searchText = textParts.join(" ");
      } else {
        searchText = lastMessage.content as string;
      }
    }
    // Perform semantic search using Qdrant
    const results = await retrieveDocuments(searchText, 3);
    // Add references to userContext if available
    if (options.userContext && results.length > 0) {
      const references = results.map((doc: any, index: number) => ({
        id: doc.id,
        title: doc.metadata.topic || `Document ${index + 1}`,
        source: "Qdrant Knowledge Base",
        score: doc.score,
        category: doc.metadata.category,
      }));
      options.userContext.set("references", references);
    }
    // Return the concatenated content for the LLM
    if (results.length === 0) {
      return "No relevant documents found in the knowledge base.";
    }
    return results
      .map(
        (doc: any, index: number) =>
          `Document ${index + 1} (ID: ${doc.id}, Score: ${doc.score.toFixed(4)}, Category: ${doc.metadata.category}):\n${doc.content}`
      )
      .join("\n\n---\n\n");
  }
}

// Create retriever instance
export const retriever = new QdrantRetriever();
```

### Create Your Agents

Configure agents with various retrieval strategies in `src/index.ts`:

```typescript
import { openai } from "@ai-sdk/openai";
import { Agent, VoltAgent } from "@voltagent/core";
import { createPinoLogger } from "@voltagent/logger";
import { VercelAIProvider } from "@voltagent/vercel-ai";

import { retriever } from "./retriever/index.js";

// Agent 1: Using retriever directly
const agentWithRetriever = new Agent({
  name: "Assistant with Retriever",
  description:
    "A helpful assistant that can retrieve information from the Qdrant knowledge base using semantic search to provide better answers. I automatically search for relevant information when needed.",
  llm: new VercelAIProvider(),
  model: openai("gpt-4o-mini"),
  retriever: retriever,
});

// Agent 2: Using retriever as tool
const agentWithTools = new Agent({
  name: "Assistant with Tools",
  description:
    "A helpful assistant that can search the Qdrant knowledge base using tools. The agent will decide when to search for information based on user questions.",
  llm: new VercelAIProvider(),
  model: openai("gpt-4o-mini"),
  tools: [retriever.tool],
});

// Create logger
const logger = createPinoLogger({
  name: "with-qdrant",
  level: "info",
});

new VoltAgent({
  agents: {
    agentWithRetriever,
    agentWithTools,
  },
  logger,
});
```

## Further Reading

- [VoltAgent Documentation](https://voltagent.dev/docs/)
- [VoltAgent Examples](https://github.com/VoltAgent/voltagent/tree/main/examples)
- [VoltAgent Qdrant Official Docs](https://voltagent.dev/docs/rag/qdrant/)