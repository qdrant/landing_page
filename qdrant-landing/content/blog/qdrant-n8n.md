---
title: "Chat with a codebase using Qdrant and N8N"
draft: false
slug: qdrant-n8n
short_description: Integration demo
description: Building a RAG-based chatbot using Qdrant and N8N to chat with a codebase on GitHub
preview_image: /blog/qdrant-n8n/preview/preview.jpg
date: 2024-01-06T04:09:05+05:30
author: Anush Shetty
featured: false
tags:
  - integration
  - n8n
  - blog
---

n8n (pronounced n-eight-n) helps you connect any app with an API. You can then manipulate its data with little or no code. With the Qdrant node on n8n, you can build AI-powered workflows visually.

Let's go through the process of building a workflow. We'll build a chat with a codebase service.

## Prerequisites

- A running Qdrant instance. If you need one, use our [Quick start guide](https://qdrant.tech/documentation/quick-start/) to set it up.
- An OpenAI API Key. Retrieve your key from the [OpenAI API page](https://platform.openai.com/account/api-keys) for your account.
- A GitHub access token. If you need to generate one, start at the [GitHub Personal access tokens page](https://github.com/settings/tokens/).

## Building the App

Our workflow has two components. Refer to the [n8n quick start guide](https://docs.n8n.io/workflows/create/) to get acquainted with workflow semantics.

- A workflow to ingest a GitHub repository into Qdrant
- A workflow for a chat service with the ingested documents

#### Workflow 1: GitHub Repository Ingestion into Qdrant

![GitHub to Qdrant workflow](/blog/qdrant-n8n/load-demo.gif)

For this workflow, we'll use the following nodes:

- [Qdrant Vector Store - Insert](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/#insert-documents): Configure with [Qdrant credentials](https://docs.n8n.io/integrations/builtin/credentials/qdrant/) and a collection name. If the collection doesn't exist, it's automatically created with the appropriate configurations.

- [GitHub Document Loader](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.documentgithubloader/): Configure the GitHub access token, repository name, and branch. In this example, we'll use [qdrant/demo-food-discovery@main](https://github.com/qdrant/demo-food-discovery).

- [Embeddings OpenAI](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingsopenai/): Configure with OpenAI credentials and the embedding model options. We use the [text-embedding-ada-002](https://platform.openai.com/docs/models/embeddings) model.

- [Recursive Character Text Splitter](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.textsplitterrecursivecharactertextsplitter/): Configure the [text splitter options](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.textsplitterrecursivecharactertextsplitter/#node-parameters ). We use the defaults in this example.

Connect the workflow to a manual trigger. Click "Test Workflow" to run it. You should be able to see the progress in real-time as the data is fetched from GitHub, transformed into vectors and loaded into Qdrant.

#### Workflow 2: Chat Service with Ingested Documents

![Chat workflow](/blog/qdrant-n8n/chat.png)

The workflow use the following nodes:

- [Qdrant Vector Store - Retrieve](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/#retrieve-documents-for-agentchain): Configure with [Qdrant credentials](https://docs.n8n.io/integrations/builtin/credentials/qdrant/) and the name of the collection the data was loaded into in workflow 1.

- [Retrieval Q&A Chain](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainretrievalqa/): Configure with default values.

- [Embeddings OpenAI](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingsopenai/): Configure with OpenAI credentials and the embedding model options. We use the [text-embedding-ada-002](https://platform.openai.com/docs/models/embeddings) model.

- [OpenAI Chat Model](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/): Configure with OpenAI credentials and the chat model name. We use [gpt-3.5-turbo](https://platform.openai.com/docs/models/gpt-3-5) for the demo.

Once configured, hit the "Chat" button to initiate the chat interface and begin a conversation with your codebase.

![Chat demo](/blog/qdrant-n8n/chat-demo.png)

To embed the chat in your applications, consider using the [@n8n/chat](https://www.npmjs.com/package/@n8n/chat) package. Additionally, N8N supports scheduled workflows and can be triggered by events across various applications.

## Further reading

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Qdrant Node documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/#qdrant-vector-store)
