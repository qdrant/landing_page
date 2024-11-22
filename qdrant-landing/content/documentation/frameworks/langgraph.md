---
title: LangGraph
aliases: [ ../integrations/autogen/ ]
---

# LangGraph

[LangGraph](https://github.com/langchain-ai/langgraph) is a library for building stateful, multi-actor applications, ideal for creating agentic workflows. It provides fine-grained control over both the flow and state of your application, crucial for creating reliable agents.

You can define flows that involve cycles, essential for most agentic architectures, differentiating it from DAG-based solutions. Additionally, LangGraph includes built-in persistence, enabling advanced human-in-the-loop and memory features.

LangGraph works seamlessly with all the components of LangChain. This means we can utilize Qdrant's [Langchain integration](/documentation/frameworks/langchain/) to create retrieval nodes in LangGraph, available in both Python and Javascript!

## Usage

- Install the required dependencies

```python
$ pip install langgraph langchain_community langchain_qdrant fastembed
```

```typescript
$ npm install @langchain/langgraph langchain @langchain/qdrant @langchain/openai
```

- Create a retriever tool to add to the LangGraph workflow.

```python

from langchain.tools.retriever import create_retriever_tool
from langchain_community.embeddings import FastEmbedEmbeddings

from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode

# We'll set up Qdrant to retrieve documents using Hybrid search.
# Learn more at https://qdrant.tech/articles/hybrid-search/
retriever = QdrantVectorStore.from_texts(
    url="http://localhost:6333/",
    collection_name="langgraph-collection",
    embedding=FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5"),
    sparse_embedding=FastEmbedSparse(model_name="Qdrant/bm25"),
    retrieval_mode=RetrievalMode.HYBRID,
    texts=["<SOME_KNOWLEDGE_TEXT>", "<SOME_OTHER_TEXT>", ...]
).as_retriever()

retriever_tool = create_retriever_tool(
    retriever,
    "retrieve_my_texts",
    "Retrieve texts stored in the Qdrant collection",
)
```

```typescript
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createRetrieverTool } from "langchain/tools/retriever";

const vectorStore = await QdrantVectorStore.fromTexts(
    ["<SOME_KNOWLEDGE_TEXT>", "<SOME_OTHER_TEXT>"],
    [{ id: 2 }, { id: 1 }],
    new OpenAIEmbeddings(),
    {
        url: "http://localhost:6333/",
        collectionName: "goldel_escher_bach",
    }
);

const retriever = vectorStore.asRetriever();

const tool = createRetrieverTool(
  retriever,
  {
    name: "retrieve_my_texts",
    description:
      "Retrieve texts stored in the Qdrant collection",
  },
);
```

- Add the retriever tool as a node in LangGraph

```python
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode

workflow = StateGraph()

# Define other the nodes which we'll cycle between.
workflow.add_node("retrieve_qdrant", ToolNode([retriever_tool]))

graph = workflow.compile()
```

```typescript
import { StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// Define the graph
const workflow = new StateGraph(SomeGraphState)
  // Define the nodes which we'll cycle between.
  .addNode("retrieve", new ToolNode([tool]));

const graph = workflow.compile();
```

## Further Reading

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangGraph End-to-End Guides](https://langchain-ai.github.io/langgraph/tutorials/)
