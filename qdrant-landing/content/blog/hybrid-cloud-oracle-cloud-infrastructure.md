---
draft: true
title: "OCI and Qdrant Hybrid Cloud for Maximum Data Sovereignty"
short_description: "Qdrant Hybrid Cloud is now available for OCI customers as a managed vector search engine for data-sensitive AI apps." 
description: "Qdrant Hybrid Cloud is now available for OCI customers as a managed vector search engine for data-sensitive AI apps."
preview_image: /blog/hybrid-cloud-oracle-cloud-infrastructure/hybrid-cloud-oracle-cloud-infrastructure.png
date: 2024-04-11T00:03:00Z
author: Qdrant
featured: false
weight: 1005
tags:
  - Qdrant
  - Vector Database
---

Qdrant and Oracle Cloud Infrastructure (OCI) Cloud Engineering are thrilled to announce the ability to deploy Qdrant Hybrid Cloud as a managed service on OCI. This marks the next step in the collaboration between Qdrant and Oracle Cloud Infrastructure, which will enable enterprises to realize the benefits of artificial intelligence powered through scalable vector search. In 2023, OCI added Qdrant to its [Oracle Cloud Infrastructure solution portfolio](https://blogs.oracle.com/cloud-infrastructure/post/vecto-database-qdrant-support-oci-kubernetes). Qdrant Hybrid Cloud is the managed service of the Qdrant vector search engine that can be deployed and run in any existing OCI environment, allowing enterprises to run fully managed vector search workloads in their existing infrastructure. This is a milestone for leveraging a managed vector search engine for data-sensitive AI applications.

In the past years, enterprises have been actively engaged in exploring AI applications to enhance their products and services or unlock internal company knowledge to drive the productivity of teams. These applications range from generative AI use cases, for example, powered by retrieval augmented generation (RAG), recommendation systems, or advanced enterprise search through semantic, similarity, or neural search. As these vector search applications continue to evolve and grow with respect to dimensionality and complexity, it will be increasingly relevant to have a scalable, manageable vector search engine, also called out by Gartner’s 2024 Impact Radar. In addition to scalability, enterprises also require flexibility in deployment options to be able to maximize the use of these new AI tools within their existing environment, ensuring interoperability and full control over their data.

> *"We are excited to partner with Qdrant to bring their powerful vector search capabilities to Oracle Cloud Infrastructure. By offering Qdrant Hybrid Cloud as a managed service on OCI, we are empowering enterprises to harness the full potential of AI-driven applications while maintaining complete control over their data. This collaboration represents a significant step forward in making scalable vector search accessible and manageable for businesses across various industries, enabling them to drive innovation, enhance productivity, and unlock valuable insights from their data."* Dr. Sanjay Basu, Senior Director of Cloud Engineering, AI/GPU Infrastructure at Oracle. 

#### How Qdrant and OCI Support Enterprises in Unlocking Value Through AI

Deploying Qdrant Hybrid Cloud on OCI facilitates vector search in production environments without altering existing setups, ideal for enterprises and developers leveraging OCI's services. Key benefits include:

- **Seamless Deployment:** Qdrant Hybrid Cloud’s Kubernetes-native architecture allows you to simply connect your OCI cluster as a Hybrid Cloud Environment and deploy Qdrant with a one-step installation ensuring a smooth and scalable setup.

- **Seamless Integration with OCI Services:** The integration facilitates efficient resource utilization and enhances security provisions by leveraging OCI's comprehensive suite of services.

- **Simplified Cluster Management**: Qdrant’s central cluster management allows to scale your cluster on OCI (vertically and horizontally), and supports seamless zero-downtime upgrades and disaster recovery,

- **Control and Data Privacy**: Deploying Qdrant on OCI ensures complete data isolation, while enjoying the benefits of a fully managed cluster management.

#### Qdrant on OCI in Action: Building a RAG System for AI-Enabled Support

![hybrid-cloud-oracle-cloud-infrastructure-tutorial](/blog/hybrid-cloud-oracle-cloud-infrastructure/hybrid-cloud-oracle-cloud-infrastructure-tutorial.png)

We created a comprehensive tutorial to show how to leverage the benefits of Qdrant Hybrid Cloud on OCI and build AI applications with a focus on data sovereignty. This use case is focused on building a RAG system for FAQ, leveraging the strengths of **Qdrant Hybrid Cloud**, [Oracle](https://www.linkedin.com/company/oracle/) Cloud Infrastructure (OCI), [Cohere](https://www.linkedin.com/company/cohere-ai/) models, and [Langchain](https://www.langchain.com/). This step-by-step guide illustrates how to route incoming customer questions efficiently - either trying to answer them directly or redirecting them for human intervention while keeping the sensitive data within your premises.

[Try the Tutorial](/documentation/tutorials/natural-language-search-oracle-cloud-infrastructure-cohere-langchain/)

Deploying Qdrant Hybrid Cloud on Oracle Cloud Infrastructure only takes a few minutes due to the seamless Kubernetes-native integration. You can get started by following these three steps:

1. **Hybrid Cloud Activation**: Start by signing into your [Qdrant Cloud account](https://qdrant.to/cloud) and activate ‘Hybrid Cloud’.

2. **Cluster Integration**: In the Hybrid Cloud section, add your OCI Kubernetes clusters as a Hybrid Cloud Environment.

3. **Effortless Deployment**: Utilize the Qdrant Management Console to seamlessly create and manage your Qdrant clusters on OCI.

You can find a detailed description in our documentation focused on deploying Qdrant on OCI.

[Read Hybrid Cloud Documentation](/documentation/hybrid-cloud/)

#### Ready to Get Started?

Create a [Qdrant Cloud account](https://cloud.qdrant.io/login) and deploy your first **Qdrant Hybrid Cloud** cluster in a few minutes. You can always learn more in the [official release blog](/blog/hybrid-cloud/). 
