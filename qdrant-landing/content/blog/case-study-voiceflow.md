---
draft: false
title: "Voiceflow & Qdrant: Powering No-Code AI Agent Creation with Scalable Vector Search"
short_description: "Enabling scalable, no-code AI agent creation."
description: "Learn how Voiceflow builds scalable, customizable, no-code AI agent solutions for enterprises."
preview_image: /blog/case-study-voiceflow/image0.png
social_preview_image: /blog/case-study-voiceflow/image0.png
date: 2024-12-10T00:02:00Z
author: Qdrant
featured: false
tags:
  - voiceflow
  - qdrant
  - no-code
  - AI agents
  - vector search
  - RAG
  - case study
---
![voiceflow/image2.png](/blog/case-study-voiceflow/image1.png)

[Voiceflow](https://www.voiceflow.com/) enables enterprises to create AI agents in a no-code environment by designing workflows through a drag-and-drop interface. The platform allows developers to host and customize chatbot interfaces without needing to build their own RAG pipeline, working out of the box and being easily adaptable to specific use cases. “Powered by technologies like Natural Language Understanding (NLU), Large Language Models (LLM), and Qdrant as a vector search engine, Voiceflow serves a diverse range of customers, including enterprises that develop chatbots for internal and external AI use cases,” says [Xavier Portillo Edo](https://www.linkedin.com/in/xavierportillaedo/), Head of Cloud Infrastructure at Voiceflow.

## Evaluation Criteria

[Denys Linkov](https://www.linkedin.com/in/denyslinkov/), Machine Learning Team Lead at Voiceflow, explained the journey of building a managed RAG solution. "Initially, our product focused on users manually defining steps on the canvas. After the release of ChatGPT, we added AI-based responses, leading to the launch of our managed RAG solution in the spring of 2023," Linkov said.

As part of this development, the Voiceflow engineering team was looking for a [vector database](/qdrant-vector-database/) solution to power their RAG setup. They evaluated various vector databases based on several key factors:

- **Performance**: The ability to [handle the scale](/documentation/guides/distributed_deployment/) required by Voiceflow, supporting hundreds of thousands of projects efficiently.
- **Metadata**: The capability to tag data and chunks and retrieve based on those values, essential for organizing and accessing specific information swiftly.
- **Managed Solution**: The availability of a [managed service](/documentation/cloud/) with automated maintenance, scaling, and security, freeing the team from infrastructure concerns.

*"We started with Pinecone but eventually switched to Qdrant,"* Linkov noted. The reasons for the switch included:

- **Scaling Capabilities**: Qdrant offers a robust multi-node setup with [horizontal scaling](/documentation/cloud/cluster-scaling/), allowing clusters to grow by adding more nodes and distributing data and load among them. This ensures high performance and resilience, which is crucial for handling large-scale projects.
- **Infrastructure**: “Qdrant provides robust infrastructure support, allowing integration with virtual private clouds on AWS using AWS Private Links and ensuring encryption with AWS KMS. This setup ensures high security and reliability,” says Portillo Edo.
- **Responsive Qdrant Team**: "The Qdrant team is very responsive, ships features quickly and is a great partner to build with," Linkov added.

## Migration and Onboarding

Voiceflow began its migration to Qdrant by creating [backups](/documentation/cloud/backups/) and ensuring data consistency through random checks and key customer verifications. "Once we were confident in the stability, we transitioned the primary database to Qdrant, completing the migration smoothly," Linkov explained.

During onboarding, Voiceflow transitioned from namespaces to Qdrant's collections, which offer enhanced flexibility and advanced vector search capabilities. They also implemented Quantization to enhance data processing efficiency. This comprehensive process ensured a seamless transition to Qdrant's robust infrastructure.

## RAG Pipeline Setup

Voiceflow's RAG pipeline setup provides a streamlined process for uploading and managing data from various sources, designed to offer flexibility and customization at each step.

- **Data Upload**: Customers can upload data via API from sources such as URLs, PDFs, Word documents, and plain text formats. Integration with platforms like Zendesk is supported, and users can choose between single uploads or refresh-based uploads.
- **Data Ingestion**: Once data is ingested, Voiceflow offers preset strategies for data checking. Users can utilize these strategies or opt for more customization through the API to tailor the ingestion process as needed.
- **Metadata Tagging**: Metadata tags can be applied during the ingestion process, which helps organize and facilitate efficient data retrieval later on.
- **Data Retrieval**: At retrieval time, Voiceflow provides prompts that can modify user questions by adding context, variables, or other modifications. This customization includes adding personas or structuring responses as markdown. Depending on the type of interaction (e.g., button, carousel with an image for image retrieval), these prompts are displayed to users in a structured format.

This comprehensive setup ensures that Voiceflow users can efficiently manage and customize their data workflows, providing a robust solution for building AI-driven applications.

## How Voiceflow Uses Qdrant

Voiceflow leverages Qdrant's robust features and infrastructure to optimize their AI assistant platform. Here’s a breakdown of how they utilize these capabilities:

*Database Features:*

- **Quantization**: This feature helps Voiceflow to perform efficient data processing by reducing the size of vectors, making searches faster. The team uses [Product Quantization](https://qdrant.tech/articles/product-quantization/) in particular.
- **Chunking Search**: Voiceflow uses chunking search to improve search efficiency by breaking down large datasets into manageable chunks, which allows for faster and more efficient data retrieval.
- **Sparse Vector Search**: Although not yet implemented, this feature is being explored for more precise keyword searches. "This is an encouraging direction the Qdrant team is taking here as many users seek more exact keyword search," said Linkov.

*Architecture:*

- **Node Pool**: A large node pool is used for public cloud users, ensuring scalability, while several smaller, isolated instances cater to private cloud users, providing enhanced security.

*Infrastructure:*

- **Private Link**: The ability to use Private Link connections across different instances is a significant advantage, requiring robust infrastructure support from Qdrant. "This setup was crucial for SOC2 compliance, and Qdrant's support team made the process seamless by ensuring feasibility and aiding in the implementation," Linkov explained.

By utilizing these features, Voiceflow ensures that its platform is scalable, secure, and efficient, meeting the diverse needs of its users.

## The Outcome

Voiceflow achieved significant improvements and efficiencies by leveraging Qdrant's capabilities:

- **Enhanced Metadata Tagging**: Implemented robust metadata tagging, allowing for custom fields and tags that facilitate efficient search filtering.
- **Optimized Performance**: Resolved concerns about retrieval times with a high number of tags by optimizing indexing strategies, achieving efficient performance.
- **Minimal Operational Overhead**: Experienced minimal overhead, streamlining their operational processes.
- **Future-Ready**: Anticipates further innovation in hybrid search with multi-token attention.
- **Multitenancy Support**: Utilized Qdrant's efficient and [isolated data management](/documentation/guides/multiple-partitions/) to support diverse user needs.

Overall, Qdrant's features and infrastructure provided Voiceflow with a stable, scalable, and efficient solution for their data processing and retrieval needs.

## What’s Next

Voiceflow plans to enhance its platform with more filtering and customization options, allowing developers to host and customize chatbot interfaces without building their own [RAG](/rag/) pipeline.