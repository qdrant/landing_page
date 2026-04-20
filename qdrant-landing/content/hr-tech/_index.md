---
title: HR Tech & Talent Marketplaces
description: Discover how Qdrant's vector search technology can transform HR marketplaces and recruitment platforms by powering intelligent job matching, resume search, and candidate recommendations.
sections:
  #hero-section
  - type: hero
    badge:
      title: HR Tech
      icon:
        src: /icons/outline/briefcase-business.svg
        alt: Case
    title: Recruitment Data is Fuzzy. Hiring Constraints Aren't.
    description: Power job search, candidate matching, and recommendation systems for scaled talent platforms.
    containedButton: 
      text: Talk to an Expert
      url: "#"
    outlinedButton:
      text: Read the Docs
      url: "#"
    language: Python
    code: |
      result = client.query_points(
          collection_name="jobs",
          prefetch=[
              models.Prefetch(
                  query=dense_emb, using="dense",
                  ),
              models.Prefetch(
                  query=sparse_vec, using="sparse",
                  ),
          ],
          query=models.FusionQuery(
              fusion=models.Fusion.RRF),
          query_filter=models.Filter(must=[
               models.FieldCondition(
                  key="location",
                  match=models.MatchAny(any=["london", "remote"]),
               ),
               models.FieldCondition(
                  key="salary_max",
                  range=models.Range(gte=60000),
               ),
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
        title: Advanced filters for hiring constraints
        icon: 
          src: /icons/outline/filter-green.svg
          alt: Filter
      - id: 1
        title: Real-time matching speed
        icon: 
          src: /icons/outline/rocket-blue-small.svg
          alt: Rocket
      - id: 2
        title: Optimize at scale to meet budget
        icon: 
          src: /icons/outline/circle-dollar-sign.svg
          alt: Dollar
      - id: 3
        title: Native inference capability
        icon: 
          src: /icons/outline/server.svg
          alt: Server
          
  #testimonials-section
  - type: testimonials
    testimonials:
      - id: 0
        reverse: true
        review: “Qdrant is the last thing I worry about breaking.”
        author:
          name: Elvis Moraa
          role: Engineering Lead, Pariti
          avatar:
            src: /img/hr-tech/image.svg
            alt: Elvis Moraa avatar
        metric:
          - id: 0
            title: 2.4x
            description: increase in hiring fill rate
          - id: 1
            title: 70%
            description: reduction in candidate vetting time
        logo:
          src: /img/hr-tech/pariti-light.svg
          alt: Pariti logo

  #bento-cards-section
  - type: bento-cards
    subtitle: Why Teams Choose Qdrant
    title: Recruitment Search is Broken at Scale
    description: Many HR tech teams don't start with vector search. They start with Elasticsearch, PGVector, or a managed API, and hit a wall when the product needs compound filters at scale, multi-language support, or sub-second latency on millions of vectors. These are the engineering problems that surface, and the pain we hear from teams switching.
    cards:
      - id: 0
        icon:
          src: /icons/outline/circle-alert.svg
          alt: Alert
        title: Inconsistent Taxonomies
        description: '"Senior Software Engineer," "Staff Dev," and "Lead SWE" might be the same role. Keyword search misses these. Semantic search doesn''t. Embeddings catch them.'
      - id: 1
        icon:
          src: /icons/outline/circle-alert.svg
          alt: Alert
        title: Fuzzy Data with Constraints
        description: Skills and titles are inconsistent across resumes, but location, work authorization, and certifications are hard constraints. You need semantic similarity AND hard filters on the same query.

  #case-studies-section
  - type: case-studies
    title: What Our Clients Say
    caseStudies: 
      - id: 0
        title: “Our managed search API is a black box.”
        description: No tuning, debugging, or control over ranking, even though you're paying a premium for convenience. With Qdrant, you can inspect every result, tune every parameter, and debug without guessing.
      - id: 1
        title: “Filters destroy our recall.”
        description: Post-filter architectures degrade when you add location + salary + category + level. Apply filters during HNSW traversal with Qdrant? No need to reduce recall or spike latency.
      - id: 2
        title: “We over-provision and still get spikes.”
        description: Burst traffic during peak hiring seasons, latency spikes during daily ingestion, clusters sized for worst-case that idle most of the day. Qdrant's Rust-based engine and quantization options mean you provision for actual usage, not theoretical peaks.
      - id: 3
        title: “Our solution doesn't scale past two languages.”
        description: PGVector worked at first for your home market. Now you're expanding to new countries and your search infrastructure can't handle multi-language embeddings or regional deployment. Qdrant supports any embedding model and deploys across regions.
  
  #get-contacted-section
  - type: get-contacted
    title: Evaluating Migration?
    description: Our solutions engineers do technical deep-dives with HR tech teams weekly.
    contactUs:
      text: Book a Session
      url:

  #bento-cards-section
  - type: bento-cards
    title: What you can build with Qdrant
    cards:
      - id: 0
        icon:
          src: /icons/outline/search-blue.svg
          alt: Search
        title: Modernized Job Search
        description: Layer semantic relevance on top of existing keyword/Boolean patterns with hybrid search. Apply strict metadata filters alongside vector similarity, no post-filter penalty.
        chips:
          - id: 0
            title: Hybrid Search
            link: /documentation/search/hybrid-queries/
          - id: 1
            title: Payload Filters
            link: /documentation/search/filtering/
          - id: 2
            title: Reciprocal Rank Fusion
            link: /documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf
      - id: 1
        icon:
          src: /icons/outline/heart-handshake.svg
          alt: Alert
        title: Similar Jobs & Candidates
        description: Layer semantic relevance on top of existing keyword/Boolean patterns with hybrid search. Apply strict metadata filters alongside vector similarity, no post-filter penalty.
        chips:
          - id: 0
            title: Recommendation API
            link: /documentation/search/explore/#recommendation-api
            
  #architecture-section
  - type: architecture
    title: How It Works Under the Hood
    description: Architecture patterns with API examples for the problems above.
    sections: 
      - id: 0
        title: Semantic Match with Hard Hiring Constraints
        description: Embed the job description or resume, then apply must-match payload filters for non-negotiable constraints. Filters applied during HNSW traversal, not after, so recall doesn't degrade.
        link:
          href: /documentation/search/hybrid-queries/
          text: View Full Example
        steps:
          - id: 0
            title: Pre-filter during graph traversal
            description: Compound filters on location, salary, category don't cause latency spikes.
          - id: 1
            title: Hybrid Search
            description: Combine dense + sparse vectors with Reciprocal Rank Fusion in a single query.
          - id: 2
            title: Native Inferencing
            description: Use Qdrant Cloud inference to simplify your data pipeline.
        language: Python
        code: |
            # Pattern: hybrid semantic + keyword with filters
            # → see docs for complete example
            result = client.query_points(
                collection_name="jobs",
                prefetch=[
                    models.Prefetch(
                        query=dense_emb, using="dense",
                        limit=100),
                    models.Prefetch(
                        query=sparse_vec, using="sparse",
                        limit=100),
                ],
                query=models.FusionQuery(
                    fusion=models.Fusion.RRF),
                query_filter=models.Filter(must=[
                    models.FieldCondition(
                        key="location",
                        match=models.MatchAny(any=["london", "remote"]),
                    ),
                    models.FieldCondition(
                        key="salary_max",
                        range=models.Range(gte=60000),
                    ),
                ]),
                limit=20,
            )
      - id: 1
        title: Quantization for 10M+ Vectors
        description: Scalar and binary quantization compress vectors 4-32x in memory. At 10M+ candidate or job vectors.
        link:
          href: /documentation/manage-data/quantization/
          text: View Full Example
        steps:
          - id: 0
            title: Scalar Quantization
            description: 4x memory reduction with minimal recall loss. One config flag.
          - id: 1
            title: Predictable Cost
            description: fixed infra cost for vector search means retrieval across multiple pipeline stages without margin erosion.
        language: Python
        code: |
            # Pattern: quantized collection for scale
            # → see docs for complete example
            client.create_collection(
                collection_name="candidates_quantized",
                vectors_config={
                    "dense": models.VectorParams(
                        size=1536,
                        distance=models.Distance.COSINE,
                    ),
                },
                sparse_vectors_config={
                    "sparse": models.SparseVectorParams(
                        modifier=models.Modifier.IDF,
                    ),
                },
                quantization_config=models.ScalarQuantization(
                    scalar=models.ScalarQuantizationConfig(
                        type=models.ScalarType.INT8,
                        quantile=0.99,
                        always_ram=True,
                    )
                ),
            )
      - id: 2
        title: '"Similar Jobs" and Candidate Discovery'
        description: Recommendation-style retrieval using existing points as query inputs. Pass positive and negative examples, no embedding step needed on the query side.
        link:
          href: /documentation/search/explore/
          text: View Full Example
        steps:
          - id: 0
            title: Recommend by Point ID
            description: No re-embedding required. Just pass the job or candidate ID.
          - id: 1
            title: Positive + Negative Examples
            description: '"More like these 3, less like that one": refine without retraining.'
        language: Python
        code: |
            # Pattern: recommend by point ID
            # → see docs for complete example
            result = client.query_points(
                collection_name="jobs",
                query=models.RecommendQuery(
                    recommend=models.RecommendInput(
                      positive=[0], # job_id_0
                      negative=[1], # job_id_1
                    )
                ),
                using="dense",
                query_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="category",
            match=models.MatchValue(value="engineering"),
                        ),
                        models.FieldCondition(
                            key="remote",
                            match=models.MatchValue(value=True),
                        ),
                    ]
                ),
                limit=20,
            )

  #dark-banner-section
  - type: dark-banner
    description: Pariti is referral-driven hiring marketplace in Africa. Qdrant vector search ranks 70k candidates in real time.
    industry: Pariti · HR Tech
    metric: 
      rate: 20% → 48%
      description: Hiring Fill Rate
    logo:
      src: /img/hr-tech/pariti-light-small.svg
      alt: Pariti logo
    link: 
      href: "#"
      text: Read the Full Case Study

  #faq-section
  - type: faq
    title: FAQs
    questions:
      - id: 0
        question: How Does Vector Search Improve Job Matching Compared to Keyword Search?
        answer: Keyword search requires candidates to guess the exact terms employers use. A job seeker searching "development" gets "business development" results mixed in with software engineering roles. Vector search converts job descriptions, resumes, and queries into embeddings that capture meaning, so "Senior Software Engineer," "Staff Dev," and "Lead SWE" all surface as semantically similar. Qdrant combines this semantic matching with strict payload filters (location, salary range, work authorization) in a single query, so results are both relevant and compliant with hard hiring constraints.
      - id: 1
        question: Can Qdrant Handle Millions of Job or Candidate Vectors Without Performance Degradation?
        answer: 
      - id: 2
        question: Is Qdrant Compliant with HIPAA, GDPR, and Data Residency Requirements for HR Data?
        answer:
      - id: 3
        question: How Does Qdrant Compare to Elasticsearch or OpenSearch for Recruiting Search?
        answer:
      - id: 4
        question: Does Qdrant Support Geospatial Search for Location-Based Job Matching?
        answer:
      - id: 5
        question: Can Qdrant Support Multi-Language Job Search for International Job Boards?
        answer:
      - id: 6
        question: What Latency Can I Expect from Qdrant for Real-Time Candidate or Job Search?
        answer:
          
  #cta-banner-section
  - type: cta-banner
    title: Talk to an expert about <br><span>HR marketplace</span> retrieval.
    description: Get guidance on scaling search, matching, and recommendations beyond 20M vectors.
    button:
      text: Talk to an Expert
      url: "#"
    
build:
  render: always
cascade:
  - build:
      list: local
      publishResources: false
      render: never
---
