---
draft: false
title: "Qdrant Hybrid Cloud and Haystack for Enterprise RAG"
short_description: "A winning combination for enterprise-scale RAG consists of a strong framework and a scalable database." 
description: "A winning combination for enterprise-scale RAG consists of a strong framework and a scalable database."
preview_image: /blog/hybrid-cloud-haystack/hybrid-cloud-haystack.png
date: 2024-04-10T00:02:00Z
author: Qdrant
featured: false
weight: 1009
tags:
  - Qdrant
  - Vector Database
---

We’re excited to share that Qdrant and [Haystack](https://haystack.deepset.ai/) are continuing to expand their seamless integration to the new [Qdrant Hybrid Cloud](/hybrid-cloud/) offering, allowing developers to deploy a managed [vector database](/articles/what-is-a-vector-database/) in their own environment of choice. Earlier this year, both Qdrant and Haystack, started to address their user’s growing need for production-ready retrieval-augmented-generation (RAG) deployments. The ability to build and deploy AI apps anywhere now allows for complete data sovereignty and control. This gives large enterprise customers the peace of mind they need before they expand AI functionalities throughout their operations.

With a highly customizable framework like Haystack, implementing vector search becomes incredibly simple. Qdrant's new Qdrant Hybrid Cloud offering and its Kubernetes-native design supports customers all the way from a simple prototype setup to a production scenario on any hosting platform. Users can attach AI functionalities to their existing in-house software by creating custom integration components. Don’t forget, both products are open-source and highly modular!

With Haystack and Qdrant Hybrid Cloud, the path to production has never been clearer. The elaborate integration of Qdrant as a Document Store simplifies the deployment of Haystack-based AI applications in any production-grade environment. Coupled with Qdrant’s Hybrid Cloud offering, your application can be deployed anyplace, on your own terms.

>*“We hope that with Haystack 2.0 and our growing partnerships such as what we have here with Qdrant Hybrid Cloud, engineers are able to build AI systems with full autonomy. Both in how their pipelines are designed, and how their data are managed.”* Tuana Çelik, Developer Relations Lead, deepset.

#### Simplifying RAG Deployment: Qdrant Hybrid Cloud and Haystack 2.0 Integration

Building apps with Qdrant Hybrid Cloud and deepset’s framework has become even simpler with Haystack 2.0. Both products are completely optimized for RAG in production scenarios. Here are some key advantages:

**Mature Integration:** You can connect your Haystack pipelines to Qdrant in a few lines of code. Qdrant Hybrid Cloud leverages the existing “Document Store” integration for data sources.This common interface makes it easy to access Qdrant as a data source from within your existing setup.

**Production Readiness:** With deepset’s new product [Hayhooks](https://docs.haystack.deepset.ai/docs/hayhooks), you can generate RESTful APIs from Haystack pipelines. This simplifies the deployment process and makes the service easily accessible by developers using Qdrant Hybrid Cloud to prepare RAG systems for production.

**Flexible & Customizable:** The open-source nature of Qdrant and Haystack’s 2.0 makes it easy to extend the capabilities of both products through customization. When tailoring vector RAG systems to their own needs, users can develop custom components and plug them into both Qdrant Hybrid Cloud and Haystack for maximum modularity. [Creating custom components](https://docs.haystack.deepset.ai/docs/custom-components) is a core functionality.

#### Learn How to Build a Production-Level RAG Service with Qdrant and Haystack

![hybrid-cloud-haystack-tutorial](/blog/hybrid-cloud-haystack/hybrid-cloud-haystack-tutorial.png)

To get you started, we created a comprehensive tutorial that shows how to build next-gen AI applications with Qdrant Hybrid Cloud using deepset’s Haystack framework.

#### Tutorial: Private Chatbot for Interactive Learning

Learn how to develop a tutor chatbot from online course materials. You will create a Retrieval Augmented Generation (RAG) pipeline with Haystack for enhanced generative AI capabilities and Qdrant Hybrid Cloud for vector search. By deploying every tool on RedHat OpenShift, you will ensure complete privacy and data sovereignty, whereby no course content leaves your cloud.

[Try the Tutorial](/documentation/tutorials/rag-chatbot-red-hat-openshift-haystack/)

#### Documentation: Deploy Qdrant in a Few Clicks

Our simple Kubernetes-native design lets you deploy Qdrant Hybrid Cloud on your hosting platform of choice in just a few steps. Learn how in our documentation.

[Read Hybrid Cloud Documentation](/documentation/hybrid-cloud/)

#### Ready to get started?

Create a [Qdrant Cloud account](https://cloud.qdrant.io/login) and deploy your first **Qdrant Hybrid Cloud** cluster in a few minutes. You can always learn more in the [official release blog](/blog/hybrid-cloud/). 