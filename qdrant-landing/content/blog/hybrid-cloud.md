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

We are excited to announce the official launch of **Qdrant Hybrid Cloud** today, a significant leap forward in the field of vector search and enterprise AI. Rooted in our open-source origin, we are committed to offering our users and customers unparalleled control and sovereignty over their data and vector search workloads. Qdrant Hybrid Cloud stands as the industry's first managed vector database that can be deployed in any environment - be it cloud, on-premise, or the edge. 

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/gWH2uhWgTvM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></p>

As the AI application landscape evolves, the industry is transitioning from prototyping innovative AI solutions to actively deploying AI applications into production (incl. GenAI, semantic search, or recommendation systems). In this new phase, **privacy**, **data sovereignty**, **deployment flexibility**, and **control** are at the top of developers’ minds. These factors are critical when developing, launching, and scaling new applications, whether they are customer-facing services like AI assistants or internal company solutions for knowledge and information retrieval or process automation.

Qdrant Hybrid Cloud offers developers a vector database that can be deployed in any existing environment, ensuring data sovereignty and privacy control through complete database isolation - with the full capabilities of our managed cloud service.

- **Unmatched Deployment Flexibility**: With its Kubernetes-native architecture, Qdrant Hybrid Cloud provides the ability to bring your own cloud or compute by deploying Qdrant as a managed service on the infrastructure of choice, such as Oracle Cloud Infrastructure (OCI), Vultr, Red Hat OpenShift, DigitalOcean, OVHcloud, Scaleway, STACKIT, Civo, VMware vSphere, AWS, Google Cloud, or Microsoft Azure.

- **Privacy & Data Sovereignty**: Qdrant Hybrid Cloud offers unparalleled data isolation and the flexibility to process vector search workloads in their own environments.

- **Scalable & Secure Architecture**: Qdrant Hybrid Cloud's design ensures scalability and adaptability with its Kubernetes-native architecture, separates data and control for enhanced security, and offers a unified management interface for ease of use, enabling businesses to grow and adapt without compromising privacy or control.

- **Effortless Setup in Seconds**: Setting up Qdrant Hybrid Cloud is incredibly straightforward, thanks to our [simple Kubernetes installation](/documentation/hybrid-cloud/) that connects effortlessly with your chosen infrastructure, enabling secure, scalable deployments right from the get-go

Let’s explore these aspects in more detail:

#### Maximizing Deployment Flexibility: Enabling Applications to Run Across Any Environment

![hybrid-cloud-environments](/blog/hybrid-cloud/hybrid-cloud-environments.png)

Qdrant Hybrid Cloud, powered by our seamless Kubernetes-native architecture, is the first managed vector database engineered for unparalleled deployment flexibility. This means that regardless of where you run your AI applications, you can now enjoy the benefits of a fully managed Qdrant vector database, simplifying operations across any cloud, on-premise, or edge locations. 

For this launch of Qdrant Hybrid Cloud, we are proud to collaborate with key cloud providers, including **Oracle Cloud Infrastructure (OCI)**, [Red Hat OpenShift](/blog/hybrid-cloud-red-hat-openshift/), [Vultr](/blog/hybrid-cloud-vultr/), [DigitalOcean](/blog/hybrid-cloud-digitalocean/), [OVHcloud](/blog/hybrid-cloud-ovhcloud/), [Scaleway](/blog/hybrid-cloud-scaleway/), and [STACKIT](/blog/hybrid-cloud-stackit/). These partnerships underscore our commitment to delivering a versatile and robust vector database solution that meets the complex deployment requirements of today's AI applications.

In addition to our partnerships with key cloud providers, we are also launching in collaboration with renowned AI development tools and framework leaders, including [LlamaIndex](/blog/hybrid-cloud-llamaindex/), **LangChain**, [Airbyte](/blog/hybrid-cloud-airbyte/), [JinaAI](/blog/hybrid-cloud-jinaai/), [Haystack by deepset](/blog/hybrid-cloud-haystack/), and [Aleph Alpha](/blog/hybrid-cloud-aleph-alpha/). These launch partners are instrumental in ensuring our users can seamlessly integrate with essential technologies for their AI applications, enriching our offering and reinforcing our commitment to versatile and comprehensive deployment environments.

Together with our launch partners we have created detailed tutorials that show how to build cutting-edge AI applications with Qdrant Hybrid Cloud on the infrastructure of your choice. These tutorials are available in our [launch partner blog](/blog/hybrid-cloud-launch-partners/). Additionally, you can find expansive [documentation](/documentation/hybrid-cloud/) and instructions on how to [deploy Qdrant Hybrid Cloud](/documentation/hybrid-cloud/hybrid-cloud-setup/).

#### Powering Vector Search & AI with Unmatched Data Sovereignty

Proprietary data, the lifeblood of AI-driven innovation, fuels personalized experiences, accurate recommendations, and timely anomaly detection. This data, unique to each organization, encompasses customer behaviors, internal processes, and market insights - crucial for tailoring AI applications to specific business needs and competitive differentiation. However, leveraging such data effectively while ensuring its **security, privacy, and control** requires diligence.

The innovative architecture of Qdrant Hybrid Cloud ensures **complete database isolation**, empowering developers with the autonomy to tailor where they process their vector search workloads with total data sovereignty. Rooted deeply in our commitment to open-source principles, this approach aims to foster a new level of trust and reliability by providing the essential tools to navigate the exciting landscape of enterprise AI.

#### How We Designed the Qdrant Hybrid Cloud Architecture

We designed the architecture of Qdrant Hybrid Cloud to meet the evolving needs of businesses seeking unparalleled flexibility, control, and privacy.

- **Kubernetes-Native Design**: By embracing Kubernetes, we've ensured that our architecture is both scalable and adaptable. This choice supports our deployment flexibility principle, allowing Qdrant Hybrid Cloud to integrate seamlessly with any infrastructure that can run Kubernetes.

- **Decoupled Data and Control Planes**: Our architecture separates the data plane (where the data is stored and processed) from the control plane (which manages the cluster operations). This separation enhances security, allows for more granular control over the data, and enables the data plane to reside anywhere the user chooses.

- **Unified Management Interface**: Despite the underlying complexity and the diversity of deployment environments, we designed a unified, user-friendly interface that simplifies the Qdrant cluster management. This interface supports everything from deployment to scaling and upgrading operations, all accessible from the [Qdrant Cloud portal](https://cloud.qdrant.io/login).

- **Extensible and Modular**: Recognizing the rapidly evolving nature of technology and enterprise needs, we built Qdrant Hybrid Cloud to be both extensible and modular. Users can easily integrate new services, data sources, and deployment environments as their requirements grow and change.

#### Diagram: Qdrant Hybrid Cloud Architecture
![hybrid-cloud-architecture](/blog/hybrid-cloud/hybrid-cloud-architecture.png)

#### Quickstart: Effortless Setup with Our One-Step Installation

We’ve made getting started with Qdrant Hybrid Cloud as simple as possible. The Kubernetes “One-Step” installation will allow you to connect with the infrastructure of your choice. This is how you can get started:

1. **Activate Hybrid Cloud**: Simply sign up for or log into your [Qdrant Cloud](https://cloud.qdrant.io/login) account and navigate to the **Hybrid Cloud** section.

2. **Onboard your Kubernetes cluster**: Follow the onboarding wizard and add your Kubernetes cluster as a Hybrid Cloud Environment - be it in the cloud, on-premise, or at the edge.

3. **Deploy Qdrant clusters securely, with confidence:** Now, you can effortlessly create and manage Qdrant clusters in your own environment, directly from the central Qdrant Management Console. This supports horizontal and vertical scaling, zero-downtime upgrades, and disaster recovery seamlessly, allowing you to deploy anywhere with confidence.

Explore our [detailed documentation](/documentation/hybrid-cloud/) and [tutorials](/documentation/examples/) to seamlessly deploy Qdrant Hybrid Cloud in your preferred environment, and don't miss our [launch partner blog post](/blog/hybrid-cloud-launch-partners/) for practical insights. Start leveraging the full potential of Qdrant Hybrid Cloud and [create your first Qdrant cluster today](https://cloud.qdrant.io/login), unlocking the flexibility and control essential for your AI and vector search workloads.

[![hybrid-cloud-get-started](/blog/hybrid-cloud/hybrid-cloud-get-started.png)](https://cloud.qdrant.io/login)

## Launch Partners

Thank you to our launch partners - learn what they have to say about Qdrant Hybrid Cloud:

#### Oracle Cloud Infrastructure: 
> *"We are excited to partner with Qdrant to bring their powerful vector search capabilities to Oracle Cloud Infrastructure. By offering Qdrant Hybrid Cloud as a managed service on OCI, we are empowering enterprises to harness the full potential of AI-driven applications while maintaining complete control over their data. This collaboration represents a significant step forward in making scalable vector search accessible and manageable for businesses across various industries, enabling them to drive innovation, enhance productivity, and unlock valuable insights from their data."* Dr. Sanjay Basu, Senior Director of Cloud Engineering, AI/GPU Infrastructure at Oracle

#### Red Hat:
> *“Red Hat is committed to driving transparency, flexibility and choice for organizations to more easily unlock the power of AI. By working with partners like Qdrant to enable streamlined integration experiences on Red Hat OpenShift for AI use cases, organizations can more effectively harness critical data and deliver real business outcomes,”* said Steven Huels, vice president and general manager, AI Business Unit, Red Hat. 

Read more in our [official Red Hat Partner Blog](/blog/hybrid-cloud-red-hat-openshift/).

#### Vultr: 
> *"Our collaboration with Qdrant empowers developers to unlock the potential of vector search applications, such as RAG, by deploying Qdrant Hybrid Cloud with its high-performance search capabilities directly on Vultr's global, automated cloud infrastructure. This partnership creates a highly scalable and customizable platform, uniquely designed for deploying and managing AI workloads with unparalleled efficiency."* Kevin Cochrane, Vultr CMO.

Read more in our [official Vultr Partner Blog](/blog/hybrid-cloud-vultr/).

#### DigitalOcean:
> *“Qdrant, with its seamless integration and robust performance, equips businesses to develop cutting-edge applications that truly resonate with their users. Through applications such as semantic search, Q&A systems, recommendation engines, image search, and RAG, DigitalOcean customers can leverage their data to the fullest, ensuring privacy and driving innovation.“* - Bikram Gupta, Lead Product Manager, Kubernetes & App Platform, DigitalOcean.

Read more in our [official DigitalOcean Partner Blog](/blog/hybrid-cloud-digitalocean/).

#### Scaleway:
> *"With our partnership with Qdrant, Scaleway reinforces its status as Europe's leading cloud provider for AI innovation. The integration of Qdrant's fast and accurate vector database enriches our expanding suite of AI solutions. This means you can build smarter, faster AI projects with us, worry-free about performance and security."* Frédéric Bardolle, Lead PM AI, Scaleway

Read more in our [official Scaleway Partner Blog](/blog/hybrid-cloud-scaleway/).

#### Airbyte:
> *“The Qdrant product lineup is a great fit for the Airbyte community. Native Python support pairs extremely well with our recent PyAirbyte launch, and the Qdrant K8 and Cloud offerings make a great complement for Airbyte OSS and Airbyte Cloud users, respectively. We’re excited to be working with Qdrant to unlock new and exciting use cases for AI and Data.”* AJ Steers, Staff Engineer for AI, Airbyte  

Read more in our [official Airbyte Partner Blog](/blog/hybrid-cloud-airbyte/).

#### deepset:
> *“We hope that with Haystack 2.0 and our growing partnerships such as what we have here with Qdrant Hybrid Cloud, engineers are able to build AI systems with full autonomy. Both in how their pipelines are designed, and how their data are managed.”* Tuana Çelik, Developer Relations Lead, deepset.

Read more in our [official Haystack by deepset Partner Blog](/blog/hybrid-cloud-haystack/).

#### LlamaIndex:
> *“LlamaIndex is thrilled to partner with Qdrant on the launch of Qdrant Hybrid Cloud, which upholds Qdrant's core functionality within a Kubernetes-based architecture. This advancement enhances LlamaIndex's ability to support diverse user environments, facilitating the development and scaling of production-grade, context-augmented LLM applications.”* Jerry Liu, CEO and Co-Founder, LlamaIndex

Read more in our [official LlamaIndex Partner Blog](/blog/hybrid-cloud-llamaindex/).

#### ...and many more!

We have launched Qdrant Hybrid Cloud with additional reputable partners around the world. Learn more from each of their blogs: 

- **Aleph Alpha:** [Enhance AI Data Sovereignty with Aleph Alpha and Qdrant Hybrid Cloud](/blog/hybrid-cloud-aleph-alpha/)
- **STACKIT:** [STACKIT and Qdrant Hybrid Cloud for Best Data Privacy](/blog/hybrid-cloud-stackit/)
- **OVHcloud:** [Qdrant and OVHcloud Bring Vector Search to All Enterprises](/blog/hybrid-cloud-ovhcloud/)
- **Jina AI:** [Cutting-Edge GenAI with Jina AI and Qdrant Hybrid Cloud](/blog/hybrid-cloud-jinaai/)
