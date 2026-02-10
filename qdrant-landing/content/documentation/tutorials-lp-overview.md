---
title: Overview
weight: 16
is_empty: false
aliases:
  - how-to
  - tutorials
partition: qdrant
---

# Qdrant Tutorial Repository

### Basic Tutorials
*Get up and running with Qdrant in minutes.*

{{% include "content/documentation/headless/content/tutorials/basic.md" %}}

---

### Search Engineering Tutorials
*Master vector search modalities, reranking, and retrieval quality.*

{{% include "content/documentation/headless/content/tutorials/search-engineering.md" %}}

---

### Operations & Scale
*Production-grade management, monitoring, and high-volume optimization.*

{{% include "content/documentation/headless/content/tutorials/operations.md" %}}

---

### Develop & Implement
*Core tools and APIs for building with Qdrant.*

{{% include "content/documentation/headless/content/tutorials/develop.md" %}}

<!-- KEEP BELOW FOR REFERENCE -->
<!-- 

# Qdrant Tutorial Repository

### Basic Tutorials
*Get up and running with Qdrant in minutes.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [Qdrant Quickstart](/documentation/quickstart/) | Basic CRUD operations and local deployment. | <span class="pill">Python</span> | 10m | <span class="text-green">Beginner</span> |
| [Semantic Search 101](/documentation/tutorials-basics/search-beginners/) | Build a search engine for science fiction books. | <span class="pill">Python</span> | 5m | <span class="text-green">Beginner</span> |
| [5-Minute RAG with DeepSeek](/documentation/tutorials-basics/rag-deepseek/) | Build a RAG pipeline with DeepSeek enrichment. | <span class="pill">Python</span> | 5m | <span class="text-green">Beginner</span> |

---

### Search Engineering
*Master vector search modalities, reranking, and retrieval quality.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [Hybrid Search with FastEmbed](/documentation/tutorials-search-engineering/hybrid-search-fastembed/) | Combine dense and sparse search for startups. | <span class="pill">FastAPI</span> | 20m | <span class="text-green">Beginner</span> |
| [Semantic Search Basics](/documentation/tutorials-search-engineering/neural-search/) | Deploy a search service for company descriptions. | <span class="pill">FastAPI</span> | 30m | <span class="text-green">Beginner</span> |
| [Collaborative Filtering](/documentation/tutorials-search-engineering/collaborative-filtering/) | Collaborative filtering using sparse embeddings. | <span class="pill">Python</span> | 45m | <span class="text-yellow">Intermediate</span> |
| [Multivector Document Retrieval](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/) | PDF RAG using ColPali and embedding pooling. | <span class="pill">Python</span> | 30m | <span class="text-yellow">Intermediate</span> |
| [Retrieval Quality Evaluation](/documentation/tutorials-search-engineering/retrieval-quality/) | Measure quality and tune HNSW parameters. | <span class="pill">Python</span> | 30m | <span class="text-yellow">Intermediate</span> |
| [Reranking for Better Search](/documentation/search-precision/reranking-semantic-search/) | Use multivector representations for better ranking. | <span class="pill">Python</span> | 30m | <span class="text-yellow">Intermediate</span> |
| [Hybrid Search with Reranking](/documentation/tutorials-search-engineering/reranking-hybrid-search/) | Implement late interaction and sparse reranking. | <span class="pill">Python</span> | 40m | <span class="text-yellow">Intermediate</span> |
| [Semantic Search for Code](/documentation/tutorials-search-engineering/code-search/) | Navigate codebases using vector similarity. | <span class="pill">Python</span> | 45m | <span class="text-yellow">Intermediate</span> |
| [Static Embeddings](/documentation/tutorials-search-engineering/static-embeddings/) | Evaluate the renaissance of static embeddings. | <span class="pill">Python</span> | 20m | <span class="text-yellow">Intermediate</span> |

---

### RAG & AI Agents
*Build intelligent agents and complex LLM-driven applications.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [Multimodal & Multilingual RAG](/documentation/multimodal-search/) | Search across image and text modalities. | <span class="pill">LlamaIndex</span> | 15m | <span class="text-green">Beginner</span> |
| [Agentic RAG with CrewAI](/documentation/agentic-rag-crewai-zoom/) | Step-by-step multi-agent RAG system. | <span class="pill">CrewAI</span> | 45m | <span class="text-green">Beginner</span> |
| [Agentic RAG with LangGraph](/documentation/agentic-rag-langgraph/) | Build AI agents to answer library documentation. | <span class="pill">LangGraph</span> | 45m | <span class="text-yellow">Intermediate</span> |
| [Discord RAG Bot](/documentation/agentic-rag-camelai-discord/) | Develop a functional bot with CAMEL-AI. | <span class="pill">OpenAI</span> | 45m | <span class="text-yellow">Intermediate</span> |
| [LLM-Powered Filter Automation](/documentation/search-precision/automate-filtering-with-llms/) | Use LLM structured output for dynamic filters. | <span class="pill">Python</span> | 30m | <span class="text-yellow">Intermediate</span> |

---

### Operations & Scale
*Production-grade management, monitoring, and high-volume optimization.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [Snapshots](/documentation/tutorials-operations/create-snapshot/) | Create and restore collection snapshots. | <span class="pill">Python</span> | 20m | <span class="text-green">Beginner</span> |
| [Cloud Inference Hybrid Search](/documentation/tutorials-and-examples/cloud-inference-hybrid-search/) | Hybrid search using Qdrant's built-in inference. | <span class="pill">Any</span> | 20m | <span class="text-green">Beginner</span> |
| [Data Migration](/documentation/tutorials-operations/migration/) | Move dense and sparse embeddings to Qdrant. | <span class="pill">CLI</span> | 30m | <span class="text-yellow">Intermediate</span> |
| [Qdrant Cloud Prometheus Monitoring](/documentation/tutorials-and-examples/managed-cloud-prometheus/) | Observability with Prometheus and Grafana. | <span class="pill">Prometheus</span> | 30m | <span class="text-yellow">Intermediate</span> |
| [Self-Hosted Prometheus Monitoring](/documentation/tutorials-and-examples/hybrid-cloud-prometheus/) | Observability for hybrid/private cloud setups. | <span class="pill">Prometheus</span> | 30m | <span class="text-yellow">Intermediate</span> |
| [Large-Scale Search](/documentation/tutorials-operations/large-scale-search/) | Cost-efficient search for LAION-400M datasets. | <span class="pill">None</span> | 2 days | <span class="text-red">Advanced</span> |

---

### Develop & Implement
*Core tools and APIs for building with Qdrant.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [Bulk Operations](/documentation/tutorials-develop/bulk-upload/) | High-scale ingestion tricks for power users. | <span class="pill">Python</span> | 20m | <span class="text-yellow">Intermediate</span> |
| [Async API](/documentation/tutorials-develop/async-api/) | Use Asynchronous programming for efficiency. | <span class="pill">Python</span> | 25m | <span class="text-yellow">Intermediate</span> |

---

### Ecosystem & Integrations
*Connect Qdrant to cloud providers, data streams, and ETL tools.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [S3 Ingestion with LangChain](/documentation/data-ingestion-beginners/) | Stream data from AWS S3 to vector store. | <span class="pill">LangChain</span> | 30m | <span class="text-green">Beginner</span> |
| [Hugging Face Dataset Ingestion](/documentation/tutorials-ecosystem/huggingface-datasets/) | Load and search public ML datasets. | <span class="pill">Python</span> | 15m | <span class="text-green">Beginner</span> |
| [Databricks Ingestion](/documentation/send-data/databricks/) | Vectorize datasets using FastEmbed on Databricks. | <span class="pill">Databricks</span> | 30m | <span class="text-yellow">Intermediate</span> |
| [Querying with Airflow](/documentation/send-data/qdrant-airflow-astronomer/) | Orchestrate data engineering workflows. | <span class="pill">Airflow</span> | 45m | <span class="text-yellow">Intermediate</span> |
| [n8n Workflow Automation](/documentation/qdrant-n8n/) | Combine Qdrant with low-code n8n workflows. | <span class="pill">n8n</span> | 45m | <span class="text-yellow">Intermediate</span> |
| [Kafka Streaming into Qdrant](/documentation/send-data/data-streaming-kafka-qdrant/) | Setup Qdrant Sink Connector for real-time data. | <span class="pill">Kafka</span> | 60m | <span class="text-red">Advanced</span> |

-->