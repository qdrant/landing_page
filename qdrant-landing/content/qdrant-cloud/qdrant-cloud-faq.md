---
title: FAQs
list:
  - id: 0
    title: Getting Started
    questions:
      - id: 0
        question: Is there a free tier?
        answer: Yes. The free tier is a single-node cluster with 0.5 vCPU, 1GB RAM, and 4GB disk. That fits roughly one million 768-dimension vectors. No credit card. Free clusters suspend after 1 week of inactivity and delete after 4 weeks if you don't reactivate them.
      - id: 1
        question: What clouds and regions are supported?
        answer: AWS, GCP, and Azure across multiple regions. The current questions shows up in the cluster creation flow and on the pricing page. New regions get added when customers ask for them.
      - id: 2
        question: Which clients and SDKs do you support?
        answer: Official SDKs for Python, TypeScript, Rust, Go, Java, and .NET. The REST and gRPC APIs are documented and identical to open-source Qdrant, so any community client built against the OSS engine works against Cloud.
      - id: 3
        question: Can I bring my own embedding model?
        answer: Yes. Qdrant Cloud is model-agnostic, so you can bring vectors from OpenAI, Cohere, Voyage, or your own fine-tunes. If you want one less vendor, Qdrant Cloud Inference generates text and image embeddings inside the cluster using models like MiniLM, SPLADE, BM25, Mixedbread Embed-Large, and CLIP. Paid clusters get up to 5 million free tokens per model per month, with no token cap on BM25.
  - id: 1
    title: Pricing and Billing
    questions:
      - id: 0
        question: How is pricing calculated?
        answer: "Resource-based: vCPU, RAM, and storage, billed hourly. Cloud Inference adds usage charges only when you call paid embedding models. The pricing page has a sizing calculator."
      - id: 1
        question: Are there overage charges or surprise bills?
        answer: No. Cluster sizes are explicit and any change needs your authorization. Capacity alerts fire at 80% so you can upgrade on your own terms before anything breaks.
      - id: 2
        question: Do you offer startup or research discounts?
        answer: "Yes. The Qdrant for Startups program offers a 20% Qdrant Cloud discount for 12 months. Eligibility: pre-seed, seed, or Series A, under 5 years old, under $5M in funding, building an AI product (agencies and dev shops don't qualify). Apply at qdrant.tech/qdrant-for-startups."
  - id: 2
    title: Performance and Scale
    questions:
      - id: 0
        question: What query latency should I expect?
        answer: For a typical 10M-vector collection at 768 dimensions with moderate filtering, P50 lands in the single-digit milliseconds and P99 stays under 50ms. Numbers shift with dimension count, recall target, filter selectivity, and cluster size. Reproducible benchmarks at qdrant.tech/benchmarks.
      - id: 1
        question: How fast can I ingest data?
        answer: CPU indexing handles tens of thousands of vectors per second per node, depending on dimension and HNSW parameters. GPU-accelerated HNSW indexing delivers up to 4x faster index construction for bulk loads. GPU clusters are available today on AWS, with other clouds on the roadmap.
      - id: 2
        question: How does quantization affect recall?
        answer: "Scalar quantization typically loses 1% to 2% recall and cuts RAM by 4x. TurboQuant (Google's algorithm, integrated into Qdrant) sits in the middle: 4-bit gives roughly 8x compression with recall close to scalar, up to 32x at higher ratios. Binary with rescoring keeps recall close to full precision while cutting memory by up to 32x for compatible embedding models. The cluster UI shows recall before and after so you can pick the trade-off you want."
  - id: 3
    title: Clusters and Scaling
    questions:
      - id: 0
        question: How do I scale up or down?
        answer: Vertical scaling adds vCPU, RAM, or disk to existing nodes. Horizontal scaling adds nodes and rebalances shards automatically. Both run from the dashboard or the API. If your collections aren't replicated, a vertical scale takes a short downtime window. Replicated collections scale without interruption.
      - id: 1
        question: What happens when my cluster gets full?
        answer: If RAM or disk usage stays above 80% for 5 minutes, the account owner gets an email alert. From there you can scale vertically (more capacity per node) or horizontally (more nodes), or delete data. No surprise lockouts, no surprise bills.
      - id: 2
        question: Is multi-region supported?
        answer: Multi-AZ within a single region is available on the Premium Multi-AZ tier. It needs a minimum of three nodes and scales in multiples of three. Multi-region active-active replication isn't a managed feature yet. Teams that need it run separate clusters per region today.
  - id: 4
    title: Reliability
    questions:
      - id: 0
        question: What's your SLA?
        answer: 99.5% uptime on Standard. 99.9% on Premium. Up to 99.95% on Premium Multi-AZ. The full SLA, including uptime definitions and service-credit terms, lives at qdrant.to/sla.
      - id: 1
        question: How do backups work?
        answer: Scheduled incremental snapshots on AWS and GCP, with configurable retention. Azure backups bill based on total disk usage. You can also take on-demand snapshots before risky changes and restore to the same cluster or a new one. For long-term retention or compliance, you can export snapshots to your own object storage.
      - id: 2
        question: What's your disaster recovery posture?
        answer: You set the snapshot cadence to match your RPO. Premium Multi-AZ deployments replicate across three availability zones (cross-AZ replication, not failover) with no failover delay. If a zone goes down, reads and writes continue from the surviving zones with no customer action required. For cross-region retention, export snapshots to your own object storage in any region.
  - id: 5
    title: Security and Compliance
    questions:
      - id: 0
        question: Are you SOC 2, GDPR, and HIPAA compliant?
        answer: Yes. SOC 2 Type II report and HIPAA certification on file. GDPR-compliant Data Processing Agreement available. Email Solutions Engineering for current compliance documentation and BAA scope.   
      - id: 1
        question: How is data encrypted?
        answer: TLS in transit. Storage volumes encrypted at rest. Premium customers can use customer-managed keys for disk encryption, plus SSO and VPC private links. Snapshots and backups inherit the same encryption.
      - id: 2
        question: What does audit logging capture?
        answer: "Every API operation: queries, upserts, deletes, collection management, and snapshot operations. Each entry is structured JSON with caller identity, timestamp, target collection, and the decision (allowed or denied). You can retrieve logs through an API endpoint, configure retention to match your policy, and download them for long-term storage in your own systems. Available on all paid clusters."
      - id: 3
        question: Are you EU-based?
        answer: Yes. Qdrant is headquartered in Berlin. EU customers can keep data in EU regions exclusively, which addresses US Cloud Act concerns and similar extraterritorial regimes.
  - id: 6
    title: Migration and Lock-In
    questions:
      - id: 0
        question: Is migrating from Qdrant Open Source to Cloud difficult?
        answer: No. Our open-source migration tool turns it into a configuration change, not a rewrite. Application code points at a new endpoint; business logic stays intact.   
      - id: 1
        question: How do I migrate from another vector database?
        answer: The migration tool covers Pinecone, Weaviate, Milvus, Chroma, Redis, MongoDB, OpenSearch, Elasticsearch, pgvector, S3 Vectors, FAISS, Apache Solr, and Qdrant-to-Qdrant (for example, OSS to Cloud). The bigger lift is usually re-running the ingestion pipeline; the data move itself is incremental and resumes if interrupted. Solutions Engineering will pair on a migration plan if you ask.  
      - id: 2
        question: Can I move workloads back from Cloud to OSS later?
        answer: Yes. Export a snapshot, restore it on your own infrastructure running open-source Qdrant. The engine and data format are identical. Your data is yours.
      - id: 3
        question: What happens if Qdrant Cloud goes away?
        answer: The engine is open source under Apache 2.0, with 30k+ GitHub stars and a 60k-member Discord community. You can run it yourself indefinitely. Engine parity keeps your options open whatever happens to the managed service.
  - id: 7
    title: Support
    questions:
      - id: 0
        question: What support tiers do you offer?
        answer: Community (Discord, free), Standard (10x5 business hours, Mon-Fri 08:00 to 18:00 CET), and Premium (24x7 critical incident response with priority response times).
      - id: 1
        question: How fast do you respond?
        answer: We use four severity levels. Standard customers get a Sev 1 response in 4 business hours, Sev 2 in 6, Sev 3 in 24. Premium customers get Sev 1 in 1 hour, Sev 2 in 2, Sev 3 in 4 business hours. Real engineers, not a tier-1 chatbot.
      - id: 2
        question: Do you have a community channel?
        answer: Yes. The Qdrant Discord is open to all developers, including the engineering team. discord.gg/qdrant
sitemapExclude: true
---
