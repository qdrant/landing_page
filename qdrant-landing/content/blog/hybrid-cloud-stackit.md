---
draft: false
title: "STACKIT and Qdrant Hybrid Cloud"
short_description: "Empowering German AI Development with a Data Privacy-First Platform." 
description: "Empowering German AI Development with a Data Privacy-First Platform."
preview_image: /blog/hybrid-cloud-stackit/hybrid-cloud-stackit.png
date: 2024-04-10T00:07:00Z
author: Qdrant
featured: false
tags:
  - Qdrant
  - Vector Database
---

**Qdrant Hybrid Cloud and STACKIT: Empowering German AI Development with a Data Privacy-First Platform**

Qdrant and STACKIT are thrilled to announce that developers are now able to deploy a fully managed vector database to their STACKIT environment with the introduction of Qdrant Hybrid Cloud. This is a great step forward for the German AI ecosystem as it enables developers and businesses to build cutting edge AI applications that run on German data centers with full control over their data.

Vector databases are an essential component of the modern AI stack. They enable rapid and accurate retrieval of high-dimensional data, crucial for powering search, recommendation systems, and augmenting machine learning models. In the rising field of GenAI, vector databases power retrieval-augmented-generation (RAG) scenarios as they are able to enhance the output of large language models (LLMs) by injecting relevant contextual information. However, this contextual information is often rooted in confidential internal or customer-related information, which is why enterprises are in pursuit of solutions that allow them to make this data available for their AI applications without compromising data privacy, losing data control, or letting data exit the company's secure environment.

Qdrant Hybrid Cloud is the first managed vector database that can be deployed in an existing STACKIT environment. The Kubernetes-native setup allows businesses to operate a fully managed vector database, while maintaining control over their data through complete data isolation. Qdrant Hybrid Cloud's managed service seamlessly integrates into STACKIT's cloud environment, allowing businesses to deploy fully managed vector search workloads, secure in the knowledge that their operations are backed by the stringent data protection standards of Germany's data centers and in full compliance with GDPR. This setup not only ensures that data remains under the businesses control but also paves the way for secure, AI-driven application development.

**Key Features and Benefits of Qdrant on STACKIT:**

- **Seamless Integration and Deployment**: With Qdrant’s Kubernetes-native design, businesses can effortlessly connect their STACKIT cloud as a private region, enabling a one-step, scalable Qdrant deployment.
- **Enhanced Data Privacy**: Leveraging STACKIT's German data centers ensures that all data processing complies with GDPR and other relevant European data protection standards, providing businesses with unparalleled control over their data.
- **Scalable and Managed AI Solutions**: Deploying Qdrant on STACKIT provides a fully managed vector search engine with the ability to scale vertically and horizontally, with robust support for zero-downtime upgrades and disaster recovery, all within STACKIT's secure infrastructure.

**Use Case: AI-enabled Contract Management built with Qdrant Hybrid Cloud, STACKIT, and Aleph Alpha**

![hybrid-cloud-stackit-tutorial](/blog/hybrid-cloud-stackit/hybrid-cloud-stackit-tutorial.png)

To demonstrate the power of Qdrant Hybrid Cloud on STACKIT, we’ve developed a comprehensive tutorial showcasing how to build secure, AI-driven applications focusing on data sovereignty. This tutorial specifically shows how to build a contract management platform that enables users to upload documents (PDF or DOCx), which are then segmented for searchable access. Designed with multitenancy, users can only access their team or organization's documents. It also features custom sharding for location-specific document storage. Beyond search, the application offers rephrasing of document excerpts for clarity to those without context.

[Try the Tutorial](/documentation/tutorials/rag-contract-management-stackit-aleph-alpha/)

**Start Using Qdrant with STACKIT**

Deploying Qdrant Hybrid Cloud on STACKIT is straightforward, thanks to the seamless integration facilitated by Kubernetes. Here are the steps to kickstart your journey:

1. **Qdrant Hybrid Cloud Activation**: Start by activating ‘Hybrid Cloud’ in your Qdrant Cloud account.
2. **Cluster Integration**: Add your STACKIT Kubernetes clusters as a private region in the Hybrid Cloud section.
3. **Effortless Deployment**: Use the Qdrant Management Console to effortlessly create and manage your Qdrant clusters on STACKIT.

We invite you to explore the detailed documentation on deploying Qdrant on STACKIT, designed to guide you through each step of the process seamlessly.

[Read Hybrid Cloud Documentation](/documentation/hybrid-cloud/)

Learn more about Qdrant Hybrid Cloud in the official release blog. Ready to get started? Create your Qdrant Hybrid Cloud cluster in a few minutes by creating your Qdrant Cloud account.