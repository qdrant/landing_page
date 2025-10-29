---
title: "Integrating with Haystack"
description: Learn how Qdrant and Haystack combine to deliver end-to-end search and recommendation systems with hybrid retrieval, semantic filtering, and agentic AI orchestration. 
weight: 2
---

{{< date >}} Day 7 {{< /date >}}

# Integrating with Haystack

Build end-to-end agentic pipelines with Qdrant.

{{< youtube "lMinhPZufTc" >}}

## What You'll Learn

- Haystack pipeline integration
- Document processing workflows
- Question answering systems
- Search and retrieval optimization
- Sparse vector search and metadata filtering
- LLM-based agent development
- Movie recommendation system architecture

## Haystack Movie Recommendation Assistant

Haystack provides a powerful framework for building sophisticated recommendation systems that combine multiple search strategies. The movie recommendation assistant demonstrates how to leverage sparse vector search, metadata filtering, and LLM-based agents to handle complex natural language queries like "find me a highly-rated action movie about car racing" or "recommend five Japanese thrillers."

### Core Architecture

The Haystack recommendation system uses a multi-layered approach to deliver accurate and relevant results:

- **Sparse Vector Search**: Utilizes sparse embeddings to capture keyword-based relevance and semantic meaning
- **Metadata Filtering**: Enables precise filtering by movie attributes like genre, rating, year, and language
- **LLM-Based Agents**: Intelligent agents that can interpret complex queries and dynamically choose between search strategies
- **Qdrant Integration**: Seamless storage and retrieval of both dense and sparse vector representations

### Implementation Workflow

The movie recommendation system follows these key steps:

1. **Data Preparation**: 
   - Convert movie data into Haystack documents with rich metadata
   - Structure information including title, genre, rating, year, language, and plot descriptions

2. **Sparse Embedding Creation**:
   - Generate sparse embeddings that capture both semantic and keyword-based relevance
   - Optimize embeddings for movie recommendation use cases

3. **Qdrant Cloud Integration**:
   - Write sparse embeddings and metadata to Qdrant Cloud
   - Configure collections for optimal retrieval performance
   - Set up proper indexing for fast metadata filtering

4. **Query Pipeline Development**:
   - Build retrieval pipelines that combine semantic search and metadata filtering
   - Implement intelligent routing based on query complexity and intent

5. **Agent Implementation**:
   - Create LLM-based agents that can interpret natural language queries
   - Enable dynamic strategy selection between semantic search and metadata filtering
   - Implement query understanding for complex requests

### Advanced Query Handling

The system excels at processing sophisticated queries by:

- **Natural Language Understanding**: Interpreting queries like "highly-rated action movie about car racing"
- **Multi-Criteria Filtering**: Combining genre, rating, and thematic requirements
- **Dynamic Strategy Selection**: Choosing between semantic search, metadata filtering, or hybrid approaches
- **Contextual Recommendations**: Providing relevant suggestions based on user preferences and movie characteristics

### Real-World Applications

This architecture extends beyond movie recommendations to various domains:

- **E-commerce**: Product recommendations with complex attribute filtering
- **Content Discovery**: Finding relevant articles, videos, or resources
- **Enterprise Search**: Intelligent document retrieval with metadata constraints
- **Personalized Recommendations**: User-specific content suggestions

## Resources

- [Haystack Qdrant Integration](https://haystack.deepset.ai/integrations/qdrant-document-store):  
  Official Haystack documentation for using Qdrant as a document store. Learn about installation, usage, and connecting to Qdrant Cloud clusters.

- [Qdrant & Haystack Integration Guide](https://qdrant.tech/documentation/frameworks/haystack/):  
  Official Qdrant documentation on integrating with Haystack. Learn how to build powerful NLP pipelines with vector search capabilities.

⭐ **Show your support!** Give Haystack a star on their GitHub repository: [github.com/deepset-ai/haystack](https://github.com/deepset-ai/haystack)

