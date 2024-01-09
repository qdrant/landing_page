---
title: "Chat with a codebase using Qdrant and N8N"
draft: false
slug: qdrant-n8n
short_description: Integration demo
description: Building a RAG-based chatbot using Qdrant and N8N to chat with a codebase on GitHub
date: 2024-01-06T04:09:05+05:30
author: Anush Shetty
featured: false
tags:
  - integration
  - n8n
  - blog
---

n8n (pronounced n-eight-n) helps you connect any app with an API with any other and manipulate its data with little or no code. With the Qdrant node now available on n8n, you can now build AI-powered workflows visually.

We'll do a quick walkthrough of what building a workflow would look like by building a chat with your codebase service in under 5 minutes.

## Prerequisites

- A running Qdrant instance. Follow the steps [here](https://qdrant.tech/documentation/quick-start/) to set it up.
- OpenAI API Key. Retrieve your key from [this link](https://platform.openai.com/account/api-keys).
- GitHub access token. Generate one [here](https://github.com/settings/tokens/new).

## Building the App

Our workflow will consist of two main parts. Refer to the [n8n quick start guide](https://docs.n8n.io/workflows/create/) to get acquainted with workflow semantics.

- A workflow to ingest a GitHub repository into Qdrant
- A workflow for a chat service with the ingested documents

#### Workflow 1: GitHub Repository Ingestion into Qdrant

![GitHub to Qdrant workflow](/blog/qdrant-n8n/load-demo.gif)

For this workflow, we'll use the following nodes.

- [Qdrant Vector Store - Insert](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/#insert-documents): Configure with API key and collection name. If the collection doesn't exist, it's automatically created with the appropriate configurations.

- [GitHub Document Loader](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.documentgithubloader/): Configure the GitHub access token, repository name, and branch. In this example, we'll use [qdrant/demo-food-discovery@main](https://github.com/qdrant/demo-food-discovery).

- [Embeddings OpenAI](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingsopenai/): Configure with OpenAI credentials and the embedding model options. We use the [text-embedding-ada-002](https://platform.openai.com/docs/models/embeddings) model.

- [Recursive Character Text Splitter](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.textsplitterrecursivecharactertextsplitter/): Configure the [text splitter options](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.textsplitterrecursivecharactertextsplitter/#node-parameters ). We use the defaults in this example.

Connect the workflow to a manual trigger. Click "Test Workflow" to run it. You should be able to see the progress in real-time as the data is fetched from GitHub, transformed into vectors and loaded into Qdrant.

#### Workflow 2: Chat Service with Ingested Documents

![Chat workflow](/blog/qdrant-n8n/chat.png)

The workflow use the following nodes

- [Qdrant Vector Store - Retrieve](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/#retrieve-documents-for-agentchain): Configure with the API key and the name of the collection the data was loaded into.

- [Retrieval Q&A Chain](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainretrievalqa/): Configure with default values.

- [Embeddings OpenAI](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingsopenai/): Configure with OpenAI credentials and the embedding model options. We use the [text-embedding-ada-002](https://platform.openai.com/docs/models/embeddings) model.

- [OpenAI Chat Model](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/): Configure with OpenAI credentials and the chat model name. We use [gpt-3.5-turbo](https://platform.openai.com/docs/models/gpt-3-5) for the demo.

Once configured, hit the "Chat" button to initiate the chat interface and begin a conversation with your codebase.

![Chat demo](/blog/qdrant-n8n/chat-demo.png)

To embed the chat in your applications, consider using the [@n8n/chat](https://www.npmjs.com/package/@n8n/chat) package. Additionally, N8N supports scheduled workflows and can be triggered by events across various applications.

## Further reading

- [N8N Reference](https://docs.n8n.io/)
- [Qdrant Node documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/#qdrant-vector-store)
