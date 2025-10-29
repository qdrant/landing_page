---
title: "Integrating with Unstructured.io"
description: Learn how Unstructured.io and Qdrant transform unstructured enterprise data into structured embeddings through VLM document understanding, smart chunking, and secure, production-ready ETL pipelines. 
weight: 3
---

{{< date >}} Day 7 {{< /date >}}

# Integrating with Unstructured.io

Process and vectorize documents with Unstructured.io and Qdrant.

{{< youtube "FRIOwOy6VZk" >}}

## What You'll Learn

- Document processing with Unstructured.io
- Multi-format document ingestion
- Structured data extraction
- Automated vectorization pipelines
- Enterprise data transformation workflows
- VLM-powered document understanding
- Production-ready ETL pipelines

## Unstructured Enterprise Data Processing

Unstructured.io addresses the critical challenge of processing unstructured enterprise data, which typically accounts for 80% of enterprise information. The platform provides a composable solution to transform PDFs, Word documents, emails, and other unstructured formats into structured outputs optimized for GenAI initiatives, eliminating the complexity of custom scripts and tools.

### Core Architecture

Unstructured.io's enterprise-grade platform offers several key components:

- **VLM Partitioner**: Uses GPT-4o vision for intelligent document understanding, recognizing layout, tables, images, and text hierarchy
- **Smart Chunker**: Employs `chunk_by_title` strategy for semantic coherence, creating optimized chunks for embeddings
- **Vector Embedder**: Uses OpenAI's text embedding 3 small model to create embeddings that understand semantic meaning
- **Enterprise Security**: Production-ready, scalable, and composable pipeline with enterprise security and compliance

### End-to-End Workflow

The complete workflow demonstrates seamless integration between AWS S3, Unstructured, and Qdrant:

1. **Data Ingestion**:
   - Raw content stored in AWS S3 buckets
   - Unstructured's S3 connector pulls documents into the SaaS platform
   - Supports multiple document formats (PDF, Word, emails, etc.)

2. **Document Processing**:
   - Documents are partitioned into structured elements using VLM technology
   - Intelligent recognition of layout, tables, images, and text hierarchy
   - Smart chunking strategy preserves semantic coherence

3. **Vector Generation**:
   - Chunked documents are embedded using OpenAI's text embedding 3 small model
   - Dense vector representations capture semantic meaning
   - Rich metadata preserved including document hierarchy and element classification

4. **Qdrant Integration**:
   - Qdrant connector deposits processed data into vector database
   - One uploaded file can result in 43 points in Qdrant due to chunking
   - Metadata includes document hierarchy, element classification, and sample text

### Key Features

**VLM Partitioner Capabilities**:
- Intelligent document layout recognition
- Table and figure extraction with context preservation
- Image understanding and text hierarchy analysis
- Multi-modal content processing

**Smart Chunking Strategy**:
- `chunk_by_title` approach maintains semantic coherence
- Optimized chunk sizes for embedding models
- Context preservation across document sections
- Hierarchical document structure maintenance

**Enterprise-Grade Processing**:
- Production-ready scalability
- Enterprise security and compliance features
- Automated ETL pipeline management
- Reduced complexity compared to custom solutions

### Real-World Applications

This architecture enables various enterprise use cases:

- **Document Intelligence**: Automated processing of legal documents, contracts, and reports
- **Knowledge Management**: Enterprise-wide document search and retrieval systems
- **Compliance**: Automated document analysis for regulatory requirements
- **RAG Applications**: Enhanced retrieval for AI applications with structured document understanding

## Resources

- [Unstructured Qdrant Destination](https://docs.unstructured.io/ui/destinations/qdrant):  
  Official Unstructured documentation for sending processed data to Qdrant. Learn about Qdrant Cloud integration, collection setup, and workflow configuration.

- [Qdrant & Unstructured Integration Guide](https://qdrant.tech/documentation/frameworks/unstructured/):  
  Official Qdrant documentation for Unstructured.io integration, covering setup and best practices for document processing pipelines.

⭐ **Show your support!** Give Unstructured a star on their GitHub repository: [github.com/Unstructured-IO/unstructured](https://github.com/Unstructured-IO/unstructured)

