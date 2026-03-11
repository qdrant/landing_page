---
title: FAQs
questions:
- question: What happens if I exceed Free Tier limits?
  answer: Inference is only available on paid Qdrant Cloud clusters.
- question: How Qdrant Cloud Pricing Works
  answer: Qdrant Cloud pricing is based on resource usage, if you have a bigger cluster, you pay for more. The free tier includes 1GB RAM and 4GB disk storage, upgrading will get you a dedicated cluster.
- question: Can I migrate from OSS to Qdrant Cloud?
  answer: Yes, you can easily migrate your existing Qdrant OSS deployment to Qdrant Cloud. We provide migration tools and documentation to help you transition smoothly.
- question: How does autoscaling work?
  answer: Autoscaling automatically adjusts your cluster resources based on demand. When traffic increases, additional resources are provisioned. When demand decreases, resources scale down to optimize costs.
- question: How do I choose between Free Tier and Paid Tier?
  answer: The Free Tier is ideal for development, testing, and prototypes with 1GB RAM and 4GB disk. Choose the Paid Tier for production workloads that require dedicated clusters, higher availability, and advanced features.
- question: What's the difference between Cloud, Hybrid, and Private?
  answer: Managed Cloud is fully managed by Qdrant. Hybrid Cloud lets you bring your own infrastructure while using Qdrant's management plane. Private Cloud gives you complete control with on-premise deployment.
- question: Do you support multi-region redundancy?
  answer: Yes, Premium Tier customers can configure multi-region redundancy for high availability and disaster recovery across different geographic locations.
- question: How is billing calculated month-to-month?
  answer: Billing is calculated based on actual resource usage during the billing period. You're charged for compute (vCPU hours), memory (GB hours), and storage (GB) consumed by your clusters.
sitemapExclude: true
---
