---
draft: false
title: "Qdrant Hybrid Cloud: the First Managed Vector Database You Can Run Anywhere"
slug: hybrid-cloud
short_description: 
description:
preview_image: /blog/hybrid-cloud/hybrid-cloud.png
social_preview_image: /blog/hybrid-cloud/hybrid-cloud.png
date: 2024-04-10T00:10:00Z
author: Andre Zayarni, CEO & Co-Founder
featured: true
tags:
  - Hybrid Cloud
---

Qdrant Hybrid Cloud: Introducing the First Managed Vector Database You Can Run Anywhere with Unmatched Flexibility and Control

We are excited to announce the official launch of Qdrant Hybrid Cloud today, a significant leap forward in the field of vector search and enterprise AI. Rooted in our open-source origin, we’re committed to offering our users and customers unparalleled control and sovereignty over their data and vector search workloads. Qdrant Hybrid Cloud stands as the industry's first managed vector database that can be deployed in any environment - be it cloud, on-premise, or the edge.

Looking at the evolution of the AI application landscape (incl. GenAI, semantic search, or recommendation systems) over recent years, it's clear that developers’ and machine learning engineers’ needs and expectations for the modern AI stack have advanced. The industry is swiftly transitioning from a phase heavily focused on prototyping innovative AI solutions to a stage where businesses are actively deploying AI applications into production. In this new phase, considerations such as **privacy**, **data sovereignty**, **deployment flexibility**, and **control** have become top of mind for developers. These factors are critical when developing, launching, and scaling new applications, whether they are customer-facing services like AI assistants or internal company solutions for knowledge and information retrieval or process automation.

Qdrant Hybrid Cloud provides developers a vector database that can be deployed in their existing environment, ensuring data sovereignty and privacy control through complete database isolation - all while being fully managed.

- **Unmatched Deployment Flexibility**: With its Kubernetes-native architecture, Qdrant Hybrid Cloud provides the ability to bring your own cloud or compute by deploying Qdrant as a managed service on the infrastructure of choice, such as Oracle Cloud Infrastructure (OCI), Vultr, Red Hat OpenShift, DigitalOcean, OVHcloud, Scaleway, STACKIT, Civo, VMware vSphere, AWS, Google Cloud, or Microsoft Azure.
- **Privacy & Data Sovereignty**: Qdrant Hybrid Cloud offers unparalleled data isolation and the flexibility to process vector search workloads in their own environments.
- **Scalable & Secure Architecture**: Qdrant Hybrid Cloud's design ensures scalability and adaptability with its Kubernetes-native architecture, separates data and control for enhanced security, and offers a unified management interface for ease of use, enabling businesses to grow and adapt without compromising privacy or control.
- **Effortless Setup in Seconds**: Setting up Qdrant Hybrid Cloud is incredibly straightforward, thanks to a "One-Step" Kubernetes installation that connects effortlessly with your chosen infrastructure, enabling secure, scalable deployments right from the get-go

Let’s explore these aspects in more detail:

#### Maximizing Deployment Flexibility: Enabling Applications to Run Across Any Environment

![hybrid-cloud-environments](/blog/hybrid-cloud/hybrid-cloud-environments.png)

Our Qdrant Hybrid Cloud is the first managed vector database engineered for unmatched deployment flexibility and control, enabling use across any cloud, on-premise, or edge locations. This means that regardless of where you choose to run your AI applications, you can now enjoy the benefits of a fully managed Qdrant vector database, simplifying operations.

This unparalleled deployment flexibility, powered by our seamless Kubernetes-native architecture, allows for deployment beyond traditional platforms like AWS, Google Cloud, or Microsoft Azure, reaching into diverse environments with ease.

For this launch of Qdrant Hybrid Cloud, we are proud to collaborate with key cloud providers, including **Oracle Cloud Infrastructure (OCI), Red Hat OpenShift, Vultr, DigitalOcean, OVHcloud, Scaleway, STACKIT, and Civo**. These partnerships underscore our commitment to delivering a versatile and robust vector database solution that meets the complex deployment requirements of today's AI applications.

In addition to our partnerships with key cloud providers, we are also launching in collaboration with renowned AI development tools and framework leaders, including **LlamaIndex**, **Cohere**, **Airbyte**, **JinaAI**, **Haystack by deepset**, and **AlephAlpha**. These launch partners are instrumental in ensuring our users can seamlessly integrate with essential technologies for their AI applications, enriching our offering and reinforcing our commitment to versatile and comprehensive deployment environments.

Together with our launch partners we have created detailed tutorials that show how to build cutting-edge AI applications with Qdrant Hybrid Cloud on the infrastructure of your choice. These tutorials are available in our launch partner blog. Additionally, you can find expansive documentation and tutorials on how to deploy Qdrant Hybrid Cloud.

#### Powering Vector Search & AI with Unmatched Data Sovereignty

Proprietary data, the lifeblood of AI-driven innovation, fuels personalized experiences, accurate recommendations, and timely anomaly detection. This data, unique to each organization, encompasses customer behaviors, internal processes, and market insights - crucial for tailoring AI applications to specific business needs and competitive differentiation. However, leveraging such data effectively while ensuring its security, privacy, and control requires diligence.

Our Qdrant Hybrid Cloud offering is tailored to meet these multifaceted requirements in a data-sensitive world. The innovative architecture of Qdrant Hybrid Cloud ensures complete database isolation, empowering developers with the autonomy to decide where to process their vector search workloads, thus maintaining total data sovereignty. This strategic approach, rooted deeply in our commitment to open-source principles, is aimed at fostering a new level of trust and reliability by providing the essential tools to navigate the evolving landscape of enterprise AI.

#### How We Designed the Qdrant Hybrid Cloud Architecture

We designed the architecture of Qdrant Hybrid Cloud to meet the evolving needs of businesses seeking unparalleled flexibility, control, and privacy.

- **Kubernetes-Native Design**: By embracing Kubernetes, we've ensured that our architecture is both scalable and adaptable. This choice supports our deployment flexibility principle, allowing Qdrant Hybrid Cloud to integrate seamlessly with any infrastructure that can run Kubernetes.
- **Decoupled Data and Control Planes**: Our architecture separates the data plane (where the data is stored and processed) from the control plane (which manages the cluster operations). This separation enhances security, allows for more granular control over the data, and enables the data plane to reside anywhere the user chooses.
- **Unified Management Interface**: Despite the underlying complexity and the diversity of deployment environments, we designed a unified, user-friendly interface that simplifies the Qdrant cluster management. This interface supports everything from deployment to scaling and upgrading operations, all accessible from the Qdrant Cloud portal.
- **Extensible and Modular**: Recognizing the rapidly evolving nature of technology and enterprise needs, we built Qdrant Hybrid Cloud to be both extensible and modular. Users can easily integrate new services, data sources, and deployment environments as their requirements grow and change.

![hybrid-cloud-architecture](/blog/hybrid-cloud/hybrid-cloud-architecture.png)

#### Quickstart: Effortless Setup with our One-Step Installation

We’ve made getting started with Qdrant Hybrid Cloud as simple as possible. The Kubernetes “One-Step” installation will allow you to connect with the infrastructure of your choice. This is how you can get started:

1. **Activate Hybrid Cloud**: Simply sign up for or log into your Qdrant Cloud account and enable the feature with a click on "request access to hybrid cloud."
2. **Onboard your Kubernetes cluster**: Navigate to the Hybrid Cloud section to add your Kubernetes cluster as a private region - be it in the cloud, on-premise, or at the edge.
3. **Deploy Qdrant clusters securely, with confidence:** Now, you can effortlessly create and manage Qdrant clusters in your own environment, directly from the central Qdrant Management Console. This supports horizontal and vertical scaling, zero-downtime upgrades, and disaster recovery seamlessly, allowing you to deploy anywhere with confidence.

Explore our detailed documentation and tutorials to seamlessly deploy Qdrant Hybrid Cloud in your preferred environment, and don't miss our launch partner blog post for practical insights. Start leveraging the full potential of Qdrant Hybrid Cloud and create your first Qdrant cluster today, unlocking the flexibility and control essential for your AI and vector search workloads.

[![hybrid-cloud-get-started](/blog/hybrid-cloud/hybrid-cloud-get-started.png)](https://cloud.qdrant.io/login)

## Launch Partners

Thank you to our launch partners - learn what they have to say about Qdrant Hybrid Cloud:

#### Oracle: 
> *"We are excited to partner with Qdrant to bring their powerful vector search capabilities to Oracle Cloud Infrastructure. By offering Qdrant Hybrid Cloud as a managed service on OCI, we are empowering enterprises to harness the full potential of AI-driven applications while maintaining complete control over their data. This collaboration represents a significant step forward in making scalable vector search accessible and manageable for businesses across various industries, enabling them to drive innovation, enhance productivity, and unlock valuable insights from their data."* Dr. Sanjay Basu, Senior Director of Cloud Engineering, AI/GPU Infrastructure at Oracle

#### Vultr: 
> *"Our collaboration with Qdrant empowers developers to unlock the potential of vector search applications, such as RAG, by deploying Qdrant Hybrid Cloud with its high-performance search capabilities directly on Vultr's global, automated cloud infrastructure. This partnership creates a highly scalable and customizable platform, uniquely designed for deploying and managing AI workloads with unparalleled efficiency."* Kevin Cochrane, Vultr CMO.

#### Scaleway:
> *"With our partnership with Qdrant, Scaleway reinforces its status as Europe's leading cloud provider for AI innovation. The integration of Qdrant's fast and accurate vector database enriches our expanding suite of AI solutions. This means you can build smarter, faster AI projects with us, worry-free about performance and security."* Frédéric Bardolle, Lead PM AI, Scaleway

#### Deepset:
> *“We hope that with Haystack 2.0 and our growing partnerships such as what we have here with Qdrant Hybrid Cloud, engineers are able to build AI systems with full autonomy. Both in how their pipelines are designed, and how their data are managed.”* Tuana Çelik, Developer Relations Lead, deepset.