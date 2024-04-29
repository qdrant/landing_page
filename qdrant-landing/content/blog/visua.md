---
draft: false
title: "Visua and Qdrant: Vector Search in Computer Vision"
slug: 
short_description: "Using Vector Search for Quality Control and Anomaly Detection in Computer Vision."
description: "Using Vector Search for Quality Control and Anomaly Detection in Computer Vision."
preview_image: /blog/visua/image4.png
social_preview_image: /blog/visua/image4.png
date: 2024-04-29T00:02:00Z
author: Manuel Meyer
featured: false
tags:
  - visua
  - qdrant
---

![visua/image1.png](/blog/visua/image1.png)

For over a decade, [VISUA](https://visua.com/) has been a leader in precise, high-volume computer vision data analysis, developing a robust platform that caters to a wide range of use cases, from startups to large enterprises. Starting with social media monitoring, where it excels in analyzing vast data volumes to detect company logos, VISUA has built a diverse ecosystem of customers, including names in social media monitoring, like Brandwatch, cybersecurity like Mimecast, trademark protection like Ebay and several sports agencies like Vision Insights for sponsorship evaluation.

![visua/image3.png](/blog/visua/image3.png)

## The Challenge

**Quality Control at Scale**

The accuracy of object detection within images is critical for VISUA ensuring that their algorithms are detecting objects in images correctly. With growing volumes of data processed for clients, the company was looking for a way to enhance its quality control and anomaly detection mechanisms to be more scalable and auditable.

The challenge was twofold. First, VISUA needed a method to rapidly and accurately identify images and the objects within them that were similar, to identify false negatives, or unclear outcomes and use them as inputs for reinforcement learning. Second, the rapid growth in data volume challenged their previous quality control processes, which relied on a sampling method based on meta-information (like analyzing lower-confidence, smaller, or blurry images), which involved more manual reviews and was not as scalable as needed. In response, the team at VISUA explored vector databases as a solution.

## The Solution

**Accelerating Anomaly Detection and Elevating Quality Control with Vector Search**

In addressing the challenge of scaling and enhancing its quality control processes, VISUA turned to vector databases, with Qdrant emerging as the solution of choice. This technological shift allowed VISUA to leverage vector databases for identifying similarities and deduplicating vast volumes of images, videos, and frames. By doing so, VISUA was able to automatically classify objects with a level of precision that was previously unattainable.

The introduction of vectors allowed VISUA to represent data uniquely and mark frames for closer examination by prioritizing the review of anomalies and data points with the highest variance. Consequently, this technology empowered Visia to scale its quality assurance and reinforcement learning processes tenfold: “Using Qdrant as a vector database for our quality control allowed us to review 10x more data by exploiting repetitions and deduplicating samples and doing that at scale with having a query engine,” says Alessandro Prest, Co-Founder at VISUA.

![visua/image2.jpg](/blog/visua/image2.jpg)

## The Selection Process

**Finding the Right Vector Database For Quality Analysis and Anomaly Detection**

Choosing the right vector database was a pivotal decision for VISUA, and the team conducted extensive benchmarks. They tested various solutions, including Weaviate, Pinecone, and Qdrant, focusing on the efficient handling of both vector and payload indexes. The objective was to identify a system that excels in managing hybrid queries that blend vector similarities with record attributes, crucial for enhancing their quality control and anomaly detection capabilities.

Qdrant distinguished itself through its:

- **Hybrid Query Capability:** Qdrant enables the execution of hybrid queries that combine payload fields and vector data, allowing for comprehensive and nuanced searches. This functionality leverages the strengths of both payload attributes and vector similarities for detailed data analysis. Prest noted the importance of Qdrant's hybrid approach, saying, “When talking with the founders of Qdrant, we realized that they put a lot of effort into this hybrid approach, which really resonated with us.”
- **Performance Superiority**: Qdrant distinguished itself as the fastest engine for VISUA's specific needs, significantly outpacing alternatives with query speeds up to 40 times faster for certain VISUA use cases. Alessandro Prest highlighted, "Qdrant was the fastest engine by a large margin for our use case," underscoring its significant efficiency and scalability advantages.
- **API Documentation**: The clarity, comprehensiveness, and user-friendliness of Qdrant’s API documentation and reference guides further solidified VISUA’s decision.

This strategic selection enabled VISUA to achieve a notable increase in operational efficiency and scalability in its quality control processes.

## Implementing Qdrant

Upon selecting Qdrant as their vector database solution, VISUA undertook a methodical approach to integration. The process began in a controlled development environment, allowing VISUA to simulate real-world use cases and ensure that Qdrant met their operational requirements. This careful, phased approach ensured a smooth transition when moving Qdrant into their production environment, hosted on AWS clusters. VISUA is leveraging several specific Qdrant features in their production setup:

1. **Support for Multiple Vectors per Record/Point**: This feature allows for a nuanced and multifaceted analysis of data, enabling VISUA to manage and query complex datasets more effectively.
2. **Quantization**: Quantization optimizes storage and accelerates query processing, improving data handling efficiency and lowering memory use, essential for large-scale operations.

## The Results

Integrating Qdrant into VISUA's quality control operations has delivered measurable outcomes when it comes to efficiency and scalability:

- **40x Faster Query Processing**: Qdrant has drastically reduced the time needed for complex queries, enhancing workflow efficiency.
- **10x Scalability Boost:** The efficiency of Qdrant enables VISUA to handle ten times more data in its quality assurance and learning processes, supporting growth without sacrificing quality.
- **Increased Data Review Capacity:** The increased capacity to review the data allowed VISUA to enhance the accuracy of its algorithms through reinforcement learning.

#### Expanding Qdrant’s Use Beyond Anomaly Detection

While the primary application of Qdrant is focused on quality control, VISUA's team is actively exploring additional use cases with Qdrant. VISUA's use of Qdrant has inspired new opportunities, notably in content moderation. "The moment we started to experiment with Qdrant, opened up a lot of ideas within the team for new applications,” said Prest on the potential unlocked by Qdrant. For example, this has led them to actively explore the Qdrant [Discovery API](https://qdrant.tech/documentation/concepts/explore/?q=discovery#discovery-api), with an eye on enhancing content moderation processes.

Beyond content moderation, VISUA is set for significant growth by broadening its copyright infringement detection services. As the demand for detecting a wider range of infringements, like unauthorized use of popular characters on merchandise, increases, VISUA plans to expand its technology capabilities. Qdrant will be pivotal in this expansion, enabling VISUA to meet the complex and growing challenges of moderating copyrighted content effectively and ensuring comprehensive protection for brands and creators.