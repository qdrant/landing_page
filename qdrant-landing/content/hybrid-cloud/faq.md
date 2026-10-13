---
title: FAQs
questions:
- id: 0
  question: Does Qdrant have access to my data in Hybrid Cloud?
  answer: "In Hybrid Cloud, your data plane runs inside your own Kubernetes environment. Qdrant Cloud receives operational metadata only: cluster health and resource usage, your Kubernetes configuration, and collection names and counts. No user data leaves your environment."
- id: 1
  question: What Kubernetes distributions does Hybrid Cloud support?
  answer: Hybrid Cloud requires a standard-compliant Kubernetes cluster. AWS EKS, Google GKE, and Azure AKS all qualify, as does any other conformant distribution.
- id: 2
  question: What network access does Qdrant need to my cluster?
  answer: None inbound. The Cloud Agent in your cluster opens outbound connections to api.cloud.qdrant.io and grpc.cloud.qdrant.io on port 443. You never open an inbound port or hand Qdrant your cloud credentials. You never open an inbound port or hand Qdrant your cloud credentials. The Qdrant clusters themselves are never exposed to Qdrant-operated infrastructure.
- id: 3
  question: Who is responsible for Kubernetes operations and storage in Hybrid Cloud?
  answer: You are responsible for the Kubernetes environment, storage provisioning, and load balancer. Qdrant is responsible for the control plane, the Kubernetes Operator, delivery of Qdrant container images to your cluster, and correct configuration and management of your Qdrant clusters.
- id: 4
  question: Can I manage Hybrid Cloud clusters from the same console as fully managed clusters?
  answer: Yes. Hybrid Cloud clusters are provisioned and managed from the Qdrant Cloud Console at cloud.qdrant.io, the same interface used for fully managed deployments. To begin setup, open the console and follow the Hybrid Cloud enrollment flow.
- id: 5
  question: How do I choose where my Hybrid Cloud cluster runs?
  answer: When creating a cluster, you select your registered Hybrid Cloud environment as the deployment target, the same way you would choose a cloud region for a fully managed cluster. This lets you place data in a specific cloud account and region to meet residency requirements.
sitemapExclude: true
---