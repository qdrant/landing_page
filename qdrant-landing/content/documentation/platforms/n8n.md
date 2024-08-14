---
title: N8N
aliases: [ ../frameworks/n8n/ ]
---

# N8N

[N8N](https://n8n.io/) is an automation platform that allows you to build flexible workflows focused on deep data integration.

Qdrant is available as a vectorstore node in N8N for building AI-powered functionality within your workflows.

## Prerequisites

1. A Qdrant instance to connect to. You can get a free cloud instance at [cloud.qdrant.io](https://cloud.qdrant.io/).
2. A running N8N instance. You can learn more about using the N8N cloud or self-hosting [here](https://docs.n8n.io/choose-n8n/).

## Setting up the vectorstore

Select the Qdrant vectorstore from the list of nodes in your workflow editor.

![Qdrant n8n node](/documentation/frameworks/n8n/node.png)

You can now configure the vectorstore node according to your workflow requirements. The configuration options reference can be found [here](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/#node-parameters).

![Qdrant Config](/documentation/frameworks/n8n/config.png)

Create a connection to Qdrant using your [instance credentials](/documentation/cloud/authentication/).

![Qdrant Credentials](/documentation/frameworks/n8n/credentials.png)

The vectorstore supports the following operations:

- Get Many - Get the top-ranked documents for a query.
- Insert documents - Add documents to the vectorstore.
- Retrieve documents - Retrieve documents for use with AI nodes.

## Further Reading

- N8N vectorstore [reference](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/).
- N8N AI-based workflows [reference](https://n8n.io/integrations/basic-llm-chain/).
- [Source Code](https://github.com/n8n-io/n8n/tree/master/packages/@n8n/nodes-langchain/nodes/vector_store/VectorStoreQdrant)