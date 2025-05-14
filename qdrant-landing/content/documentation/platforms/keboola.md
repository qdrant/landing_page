---
title: Keboola
---

# Keboola

[Keboola](https://www.keboola.com/) is a data operations platform that integrates data engineering, analytics, and machine learning tools into a single environment. It helps businesses unify their data sources, transform data, and deploy ML models to production.

## Prerequisites

1. A Qdrant instance to connect to. You can get a free cloud instance at [cloud.qdrant.io](https://cloud.qdrant.io/).
2. A [Keboola](https://www.keboola.com/) account to develop your data workflows.

## Setting Up

- In your Keboola platform, navigate to the Components section.
- Find and add the Qdrant component from the component marketplace.
- Configure the connection to your Qdrant instance using your URL and API key.

## Using Qdrant in Keboola

With Keboola's Qdrant integration, you can:

- **Data Pipeline Integration**: Extract data from any source in Keboola, transform it, and load vector embeddings into Qdrant for semantic search capabilities.

- **Vector Database Management**: Create, manage, and update collections in Qdrant directly from your Keboola workflows.

- **Orchestration**: Schedule and automate your vector database operations as part of your data pipeline.

- **ML Operations**: Combine your machine learning models with vector search capabilities for advanced AI applications.

## Example Use Case

A common use case is to build a RAG (Retrieval Augmented Generation) system where:

1. Data is extracted from multiple sources in Keboola
2. Text is processed and transformed in Keboola's transformation engine
3. Embeddings are generated and stored in Qdrant
4. Applications query the Qdrant vectors for semantic search capabilities

## Further Reading

- [Keboola Documentation](https://help.keboola.com/)
- [Keboola Academy](https://academy.keboola.com/)
- [Data Operations with Keboola](https://www.keboola.com/blog/data-operations)
