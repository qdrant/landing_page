---
title: Legal tech
description: Legal tech
social_preview_image: /legal-tech/social-preview.png
sections:
  #hero-section
  - type: hero
    badge:
      title: LegalTech
      icon:
        src: /icons/outline/scales-blue.svg
        alt: Scales
    title: When Accuracy is<br>Non-Negotiable
    description: Hybrid search with metadata filtering for jurisdiction, case type, and document category. Build retrieval for patent corpora, M&A due diligence, and more.
    containedButton:
      text: Talk to an Expert
      url: /contact-us/
    outlinedButton:
      text: Read the Docs
      url: /documentation/
    language: Python
    code: |
        # Hybrid legal document search
        results = client.query_points(
            collection_name="legal_docs",
            prefetch=[
                Prefetch(query=dense_emb, using="dense",
                    limit=100),
                Prefetch(query=sparse_emb, using="sparse",
                    limit=100),
            ],
            query=FusionQuery(fusion=Fusion.RRF),
            query_filter=Filter(must=[
                FieldCondition("jurisdiction",
                    match=MatchValue("california")),
                FieldCondition("case_type",
                    match=MatchValue("patent")),
                FieldCondition("filing_date",
                    range=Range(gte="2020-01-01")),
                FieldCondition("settlement_amount",
                    range=Range(gte=50000)),
            ]),
            limit=20,
        )
    steps:
      - id: 0
        title: Step 1
        description: Embed - Parse + Embed Resume / JD
        icon:
          src: /icons/outline/square-code.svg
          alt: Code
      - id: 1
        title: Step 2
        description: Search - Semantic Search + Strict Filter
        icon:
          src: /icons/outline/filter-blue-small.svg
          alt: Filter
      - id: 2
        title: Step 3
        description: Rank - Rank + Rerank (Optional)
        icon:
          src: /icons/outline/list.svg
          alt: List
      - id: 3
        title: Step 4
        description: Result - Evidence-based Match
        icon:
          src: /icons/outline/circle-check.svg
          alt: Check
    badges:
      - id: 0
        title: Low latency
        icon:
          src: /icons/outline/filter-green.svg
          alt: Filter
      - id: 1
        title: High Accuracy
        icon:
          src: /icons/outline/target-blue.svg
          alt: Target
      - id: 2
        title: Billion+ Vector Scale
        icon:
          src: /icons/outline/circle-dollar-sign.svg
          alt: Dollar
      - id: 3
        title: GDPR/SOC2 Compliant
        icon:
          src: /icons/outline/shield-check.svg
          alt: Check
      - id: 4
        title: Hybrid Cloud
        icon:
          src: /icons/outline/shield-check.svg
          alt: Check

  #testimonials-section
  - type: testimonials
    testimonials:
      - id: 0
        reverse: true
        review: “We scaled to a billion vectors with sub-second latency. Workflows that took hours now take minutes.”
        author:
          name: Herbie Turner
          role: CTO / Co-founder
          avatar:
            src: /img/legal-tech/customer1.svg
            alt: Herbie Turner avatar
        metric:
          - id: 0
            title: 1B+
            description: Vectors in Production
          - id: 1
            title: 250B+
            description: Tokens Processed
        logo:
          src: /img/legal-tech/ai.svg
          alt: AI logo
      - id: 1
        reverse: false
        review: “We ingest thousands of legal docs,  and need precise retrieval and accurate citations. Qdrant makes this possible.”
        author:
          name: Lesly Arun Franco
          role: CTO
          avatar:
            src: /img/legal-tech/customer2.svg
            alt: Lesly Arun Franco avatar
        metric:
          - id: 0
            title: 90%
            description: Faster Due Diligence
          - id: 1
            title: 40%
            description: Fewer Legal Hours
        logo:
          src: /img/legal-tech/aracor.svg
          alt: Aracor logo
          
  #bento-cards-section
  - type: bento-cards
    subtitle: Why Teams Choose Qdrant
    title: General-Purpose Databases Weren't Built for Legal AI
    description: Keyword search, rigid filters, and bolt-on vector capabilities break under the demands of modern legal platforms. Teams running semantic search, document analysis, and AI agents hit the same walls.
    cards:
      - id: 0
        icon:
          src: /icons/outline/circle-alert.svg
          alt: Alert
        title: Legacy Search Can't Handle Legal Metadata
        description: "Legal documents can carry 2,000+ metadata fields: jurisdictions, case types, filing dates, settlement amounts. Other search engines require brute-force vector search with embedding constraints. Post-filter architectures degrade recall as filters multiply.<br><br>Qdrant's filterable HNSW applies filters during graph traversal."
      - id: 1
        icon:
          src: /icons/outline/file-check.svg
          alt: File check
        title: Compliance Blocks Most Cloud Providers
        description: Attorney-client privilege and data residency requirements mean managed cloud solutions are often non-starters. 100% of LegalTech sales conversations surface security and compliance.<br><br>Qdrant deploys on-prem, in private VPCs, or hybrid cloud — with SOC2, GDPR, and HIPAA-ready compliance built in.

  #case-studies-section
  - type: case-studies
    title: Why People Migrate to Qdrant
    caseStudies:
      - id: 0
        title: “We outgrew keyword-based systems”
        description: Write performance with legacy, Java-based search engines couldn’t keep up.
      - id: 1
        title: “We needed rich filtering for legal documents”
        description: Fine-tuning configurations at the collection level was crucial for varied AI applications
      - id: 2
        title: “Data Sovereignty was critical”
        description: Qdrant offers hybrid cloud and private cloud deployments.
      - id: 3
        title: “Legal Corpora are massive and high stakes”
        description: Performance failures in legal AI have  financial and reputational consequences<br><br>Qdrant's stays fast and accurate.

  #get-contacted-section
  - type: get-contacted
    title: Evaluating Migration?
    description: Our solutions engineers do technical deep-dives with HR tech teams weekly.
    contactUs:
      text: Book a Session
      url: /contact-us/
      
  #bento-cards-section
  - type: bento-cards
    title: What you can build with Qdrant
    description: From patent analysis to M&A due diligence, legal teams combine Qdrant's retrieval primitives to deliver citation-grade accuracy keyword search never could.
    cards:
      - id: 0
        icon:
          src: /icons/outline/search-blue.svg
          alt: Search
        title: Jurisdiction-Scoped Document Search
        description: '"Find California patent cases from 2020 with settlements over $50k" returns ranked results filtered by jurisdiction, date, case type, and amount. Hybrid search grounds results in real documents.'
        chips:
          - id: 0
            title: Hybrid Search
            link: /documentation/search/hybrid-queries/
          - id: 1
            title: Payload Filters
            link: /documentation/search/filtering/
          - id: 2
            title: Reciprocal Rank Fusion (RRF)
            link: /documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf
      - id: 1
        icon:
          src: /icons/outline/file-badge-blue.svg
          alt: File badge
        title: Patent Prior Art / Claim Charting
        description: Search 200M+ patents by technology class, grant date, and patent family. Scalar quantization at billion-scale. Recommend API for claim-chart matching against prior art.
        chips:
          - id: 0
            title: Quantization
            link: /
      - id: 2
        icon:
          src: /icons/outline/search-check-blue.svg
          alt: Search check
        title: M&A Due Diligence
        description: Automated signature validation, contract comparison, and risk flagging across thousands of deal documents. Multitenant isolation per deal room with real-time ingestion during active deals.
        chips:
          - id: 0
            title: Multitenancy
            link: /

  #architecture-section
  - type: architecture
    title: How It Works Under the Hood
    description: Architecture patterns with API examples for<br>legal document search, patent analysis, and multi-tenancy.
    sections:
      - id: 0
        title: Hybrid Search
        description: Legal queries are part structured (jurisdiction, date, case type) and part unstructured (“negligence in product liability” or “prior art for CRISPR gene editing”). This pattern fuses semantic and keyword retrieval with metadata filters in a single query.
        link:
          href: /documentation/search/hybrid-queries/
          text: View Full Example
        steps:
          - id: 0
            title: Dense Vectors
            description: Semantic understanding of legal language and concepts
          - id: 1
            title: Sparse Vectors (BM25/SPLADE)
            description: For exact legal terms (e.g. statute numbers, case citations)
        language: Python
        code: |
          # Hybrid legal document search
          results = client.query_points(
            collection_name="legal_docs",
            prefetch=[
                Prefetch(query=dense_emb, using="dense",
                    limit=100),
                Prefetch(query=sparse_emb, using="sparse",
                    limit=100),
            ],
            query=FusionQuery(fusion=Fusion.RRF),
            query_filter=Filter(must=[
                FieldCondition(key="jurisdiction",
                    match=MatchValue("california")),
                FieldCondition("case_type",
                    match=MatchValue("patent")),
            ]),
            limit=20,
          )
      - id: 1
        title: RAG-Powered Legal Research
        description: Ground AI assistants in real case law and statutes. This is the pattern Lawme uses for automated legal document drafting — vectorize document chunks, retrieve relevant context per question, and generate cited answers.
        link:
          href: /rag/
          text: View Full Example
        steps:
          - id: 0
            title: Custom shard keys by jurisdiction
            description: US, AU, UK case law isolated
          - id: 1
            title: Scalar, binary, asymmetric quantization (8-bit)
            description: Up to 32x compression with reranking
          - id: 2
            title: Real-time payload updates
            description: Mark documents as reviewed without reindexing
        language: Python
        code: |
          # RAG: retrieve legal context for AI assistant
          review_chunks = client.query_points(
              collection_name="case_law",
              prefetch=[
                  Prefetch(query=question_emb, using="dense",
                      limit=50),
                  Prefetch(query=question_sparse, using="sparse",
                      limit=50),
              ],
              query=FusionQuery(fusion=Fusion.RRF),
              query_filter=Filter(must=[
                  FieldCondition("jurisdiction",
                      match=MatchValue("australia")),
              ]),
              limit=10,
          )
          
          # Feed to LLM with grounded context
          context = "\n".join([r.payload["text"]
              for r in review_chunks.points])
          answer = llm.generate(
              f"Based on case law: {context}\n"
              f"Question: {user_question}"
          )
      - id: 2
        title: Large Patent Corpus Search
        description: Search hundreds of millions of patents across jurisdictions with scalar, binary or asymmetric quantization.
        link:
          href: /documentation/manage-data/quantization/
          text: View Full Example
        steps:
          - id: 0
            title: Scalar, binary, asymmetric quantization (8-bit)
            description: Keeps hot vectors in RAM, full-precision on disk
          - id: 1
            title: Recommend API for claim charting
            description: Find prior art similar to specific patent claims
          - id: 2
            title: Pay-for-what-you-use pricing
            description: 10× more data for the same cost
        language: Python
        code: |
          # Prior art search at billion scale
          results = client.query_points(
              collection_name="patents",
              query=claim_embedding,
              query_filter=Filter(must=[
                  FieldCondition("grant_date",
                      range=Range(lte="2015-06-01")),
                  FieldCondition("technology_class",
                      match=MatchAny(["H04L", "G06F"])),
              ]),
              params=SearchParams(
                  quantization=QuantizationSearchParams(
                      rescore=True,
                      oversampling=2.0
                  )
              ),
              limit=50,
          )
          
          # Claim-chart matching via Recommend API
          similar = client.query_points(
              collection_name="patents",
              query=RecommendQuery(
                  recommend=RecommendInput(
                      positive=[claim_vector_id],
                      negative=[known_irrelevant_id],
                  )
              ),
              limit=25,
          )

  #logos-section
  - type: logos
    title: Powering Search For
    logos:
      - id: 0
        icon:
          src: /img/legal-tech/ai-light.svg
          alt: AI logo
      - id: 1
        icon:
          src: /img/legal-tech/aracor-light.svg
          alt: Aracor logo
      - id: 2
        icon:
          src: /img/legal-tech/garden-light.svg
          alt: Garden logo
      - id: 3
        icon:
          src: /img/legal-tech/lawme-ai-light.svg
          alt: Lawme AI logo

  #testimonials-section
  - type: testimonials
    testimonials:
      - id: 0
        reverse: true
        review: “To scale, you need vector search with low latency, high accuracy, and reasonable costs. Qdrant makes that possible.”
        author:
          name: Jordan Parker
          role: Co-founder Lawme
          avatar:
            src: /img/legal-tech/customer3.svg
            alt: Jordan Parker avatar
        metric:
          - id: 0
            title: 10x
            description: faster query throughput
          - id: 1
            title: 75%
            description: reduction in retrieval costs
        logo:
          src: /img/legal-tech/lawme-ai.svg
          alt: Lawme AI
      - id: 1
        reverse: false
        review: “Filterable HNSW was the deal-maker. We don't have to think about the vector layer anymore.”
        author:
          name: Justin Mack
          role: CTO / Co-founder, Garden AI
          avatar:
            src: /img/legal-tech/customer4.svg
            alt: Justin Mack avatar
        metric:
          - id: 0
            title: 10×
            description: Lower cost per stored GB
          - id: 1
            title: <100ms
            description: p95 query latency at 200M+ patents
        logo:
          src: /img/legal-tech/garden.svg
          alt: Garden logo

  #faq-section
  - type: faq
    title: FAQs
    questions:
      - id: 0
        question: How Does Qdrant Handle Complex Legal Metadata Filtering?
        answer: Qdrant applies filters during HNSW graph traversal, not after retrieval. This means filtering by jurisdiction, case type, date range, or settlement amount doesn't degrade recall or spike latency.
      - id: 1
        question: How Does Hybrid Search Work for Legal Research?
        answer: 
      - id: 2
        question: What Deployment Options Work for Law Firms With Data Residency Requirements?
        answer: 
      - id: 3
        question: How Does Qdrant Compare to PGVector for Legal AI?
        answer: 
        
  #cta-banner-section
  - type: cta-banner
    title: Talk to an expert about <br><span>LegalTech</span> retrieval.
    description: We'll show you the architecture that fits.
    button:
      text: Talk to an Expert
      url: /contact-us/

build:
  render: always
cascade:
  - build:
      list: local
      publishResources: false
      render: never
---
