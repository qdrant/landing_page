---
title: Overview
weight: 16
aliases:
  - how-to
  - tutorials
partition: qdrant
---

# Qdrant Tutorial Directory

### Quickstart
*Get up and running with Qdrant in minutes.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [Local Qdrant Setup](/documentation/quickstart/) | Basic CRUD operations and local deployment. | Python | 10m | Beginner |
| [5-Minute Semantic Search](/documentation/tutorials-quickstart/search-beginners/) | Build a search engine for science fiction books. | Python | 5m | Beginner |
| [5-Minute RAG with DeepSeek](/documentation/tutorials-quickstart/rag-deepseek/) | Build a RAG pipeline with DeepSeek enrichment. | Python | 5m | Beginner |

---

### Search Engineering
*Master vector search modalities, reranking, and retrieval quality.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [Neural Search Service](/documentation/tutorials-search-engineering/neural-search/) | Deploy a search service for company descriptions. | FastAPI | 30m | Beginner |
| [Hybrid Search with FastEmbed](/documentation/tutorials-search-engineering/hybrid-search-fastembed/) | Combine dense and sparse search for startups. | FastAPI | 20m | Beginner |
| [Movie Recommendations](/documentation/tutorials-search-engineering/collaborative-filtering/) | Collaborative filtering using sparse embeddings. | Python | 45m | Intermediate |
| [Advanced PDF Retrieval](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/) | PDF RAG using ColPali and embedding pooling. | Python | 30m | Intermediate |
| [Retrieval Quality Benchmarking](/documentation/tutorials-search-engineering/retrieval-quality/) | Measure quality and tune HNSW parameters. | Python | 30m | Intermediate |
| [Multivector Reranking](/documentation/search-precision/reranking-semantic-search/) | Use multivector representations for better ranking. | Python | 30m | Intermediate |
| [Hybrid Search Reranking](/documentation/tutorials-search-engineering/reranking-hybrid-search/) | Implement late interaction and sparse reranking. | Python | 40m | Intermediate |
| [Semantic Code Search](/documentation/tutorials-search-engineering/code-search/) | Navigate codebases using vector similarity. | Python | 45m | Intermediate |
| [Static Embeddings Analysis](/documentation/tutorials-search-engineering/static-embeddings/) | Evaluate the renaissance of static embeddings. | Python | 20m | Intermediate |

---

### RAG & AI Agents
*Build intelligent agents and complex LLM-driven applications.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [Agentic RAG with CrewAI](/documentation/agentic-rag-crewai-zoom/) | Step-by-step multi-agent RAG system. | CrewAI | 45m | Beginner |
| [Agentic RAG with LangGraph](/documentation/agentic-rag-langgraph/) | Build AI agents to answer library documentation. | LangGraph | 45m | Intermediate |
| [Agentic Discord ChatBot](/documentation/agentic-rag-camelai-discord/) | Develop a functional bot with CAMEL-AI. | OpenAI | 45m | Intermediate |
| [Multimodal Search (LlamaIndex)](/documentation/multimodal-search/) | Search across image and text modalities. | LlamaIndex | 15m | Beginner |
| [Automate Metadata Filtering](/documentation/search-precision/automate-filtering-with-llms/) | Use LLM structured output for dynamic filters. | Python | 30m | Intermediate |

---

### Ecosystem & Integrations
*Connect Qdrant to cloud providers, data streams, and ETL tools.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [S3 Ingestion with LangChain](/documentation/data-ingestion-beginners/) | Stream data from AWS S3 to vector store. | LangChain | 30m | Beginner |
| [Hugging Face Datasets](/documentation/tutorials-ecosystem/huggingface-datasets/) | Load and search public ML datasets. | Python | 15m | Beginner |
| [Databricks Integration](/documentation/send-data/databricks/) | Vectorize datasets using FastEmbed on Databricks. | Databricks | 30m | Intermediate |
| [Airflow & Astronomer](/documentation/send-data/qdrant-airflow-astronomer/) | Orchestrate data engineering workflows. | Airflow | 45m | Intermediate |
| [Kafka Data Streaming](/documentation/send-data/data-streaming-kafka-qdrant/) | Setup Qdrant Sink Connector for real-time data. | Kafka | 60m | Advanced |
| [No-Code Automation (n8n)](/documentation/qdrant-n8n/) | Combine Qdrant with low-code n8n workflows. | n8n | 45m | Intermediate |

---

### Operations & Scale
*Production-grade management, monitoring, and high-volume optimization.*

| Tutorial | Objective | Stack | Time | Level |
| :--- | :--- | :--- | :--- | :--- |
| [Embedding Migration](/documentation/tutorials-operations/migration/) | Move dense and sparse embeddings to Qdrant. | CLI | 30m | Intermediate |
| [Bulk Data Uploads](/documentation/tutorials-operations/bulk-upload/) | High-scale ingestion tricks for power users. | Python | 20m | Intermediate |
| [Snapshot & Backup](/documentation/tutorials-operations/create-snapshot/) | Create and restore collection snapshots. | Python | 20m | Beginner |
| [Billion-Scale Search](/documentation/tutorials-operations/large-scale-search/) | Cost-efficient search for LAION-400M datasets. | None | 2 days | Advanced |
| [Python Async API](/documentation/tutorials-operations/async-api/) | Use Asynchronous programming for efficiency. | Python | 25m | Intermediate |
| [Cloud Inference Search](/documentation/tutorials-and-examples/cloud-inference-hybrid-search/) | Hybrid search using Qdrant's built-in inference. | Any | 20m | Beginner |
| [Monitor Managed Cloud](/documentation/tutorials-and-examples/managed-cloud-prometheus/) | Observability with Prometheus and Grafana. | Prometheus | 30m | Intermediate |
| [Monitor Private Cloud](/documentation/tutorials-and-examples/hybrid-cloud-prometheus/) | Observability for hybrid/private cloud setups. | Prometheus | 30m | Intermediate |