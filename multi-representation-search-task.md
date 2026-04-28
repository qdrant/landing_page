# Task: Multi-Representation Search Tutorial + Doc Updates

This task creates a new tutorial and four supporting documentation edits in the `qdrant/landing_page` repo. The goal is to close a content gap on hybrid search across different representations of the same item (title, summary, chunks, tags), which currently generates recurring questions in Discord and customer interviews.

## Skills to Use at Every Step

Load and apply these skills before each writing or editing step. Re-consult them when switching from code blocks to prose, when writing headings, and when writing callouts or summaries.

- **`qdrant-messaging`** — Apply at every step for voice, tone, positioning, and how to describe Qdrant features. Consult before drafting any prose section, every heading, every callout, every conclusion, and every cross-link description. This is non-negotiable for all customer-facing copy in this task.
- **`writing-style`** — Apply for capitalization, formatting, oxford comma, contractions, accessibility, and US English conventions.
- **`qdrant-landing-page-contribution`** — Use for repo mechanics: where files go, frontmatter conventions, how to add a tutorial to the sidebar, how to handle code tabs, and how to open the PR.

If the messaging skill suggests rewording or repositioning that conflicts with the wording in this task spec, the skill wins. This spec describes structure and substance, not final phrasing.

## Context

The gap: customers and Discord users repeatedly ask how to search across multiple representations of one item (title vs chunks vs document). Current Qdrant content covers hybrid search well at the dense+sparse level but does not show the multi-representation pattern end to end. Grouping is under-illustrated. Score boosting is documented but not connected to this pattern. Multivector misuse is common (people put unrelated representations in a multivector field, which breaks because MaxSim does not return per-subvector scores).

This task fills that gap with one tutorial as the load-bearing piece plus four targeted doc edits.

## Deliverable 1: Tutorial

**Path:** `qdrant-landing/content/documentation/tutorials-search-engineering/multi-representation-search.md`

**Working title:** Searching Across Multiple Representations of an Item (final title to be confirmed against `qdrant-messaging` skill).

**Audience:** Engineers who have already done basic hybrid search (dense + sparse) and want to combine multiple representations of the same item. Not a beginner tutorial. Assumes familiarity with named vectors and the Query API. State this clearly in the intro.

**Dataset:** Pick one of the following based on what is publicly available and reproducible:
1. arXiv (title, abstract, body chunks, categories) — well-known and easy.
2. Wikipedia (title, summary section, body chunks, infobox tags) — works if a clean export is accessible.
3. A meeting or podcast transcript dataset if one is publicly available — closest to the real Glyphic / GoPerfectMatch use case the gap calls out.

Whatever the choice, build a small ground-truth eval set up front: 50 to 100 query-relevant-doc pairs is enough. Document how the eval set was generated (LLM-assisted with manual filtering is fine, just label it clearly).

**Schema section:**

Show the collection design first, then the queries. Per point (chunk):
- `dense_chunk`: chunk-level dense embedding
- `dense_title`: title embedding (stored on every chunk for fusion convenience, or in a separate collection accessed via `lookup_from` if titles are heavy)
- `dense_summary`: summary embedding (same pattern)
- `sparse_keywords`: BM25 over the title and tags fields (where BM25 actually works well, not over chunks)
- payload: `document_id`, `title`, `tags`, `chunk_index`, `chunk_text`

Explain the design choice for each one in one or two sentences. Specifically:
- Why title and summary go on every chunk vs in a separate collection accessed via `lookup_from`.
- Why BM25 lives on title and tags rather than chunks. This is where the BM25-on-short-text point lands, in context, not as a sidebar.
- Why these are not multivectors. Brief, one or two sentences. Link to the multivectors clarification on the Vectors page (see Deliverable 3).

**Walkthrough:** Five queries, each adding one capability, each evaluated against the ground truth.

1. **Dense over chunks only.** The naive baseline. Report Recall@10, NDCG@10, MRR. Everything else compares against this.
2. **Hybrid (dense chunks + sparse keywords) with RRF.** Show the lift. Mention briefly why linear weight tuning is fragile and link out to the existing Hybrid Search Revamped article for the full argument.
3. **Add `dense_title` as a third prefetch.** Now fusing across three representations. Show the lift. Include one concrete query where the title prefetch is what saves the result. Concrete is better than abstract here.
4. **Add `group_by="document_id"` with `group_size=3`.** Walk through what changes: same retrieval, but now one entry per document with the top chunks attached. Discuss the tradeoff: grouping helps when downstream consumers want documents (UI, citations); it hurts when the LLM benefits from seeing multiple chunks ranked independently. Mention `with_lookup` for fetching shared document-level metadata efficiently.
5. **Add score boosting.** Use the formula API to give a bump when the title prefetch hit the same document, or to decay older content. Reference the existing search-relevance docs page. Show the eval delta.

**Evals:** Inline metrics after each step so the reader sees the lift in context. Final summary table at the end with all five steps side by side. Use the same metric helpers as the retrieval-quality tutorial (link to it, do not reimplement).

**What to flag, not solve:**
- Chunking strategy. One short paragraph noting that a fixed-size approach was used for simplicity. Link out to hierarchical chunking (POMA-AI VST), late chunking (Jina), and semantic chunking (Chonkie). Do not pick one.
- BM25F. Acknowledge it as the technically correct multi-field approach and that Qdrant does not yet support it natively. Show the workaround (separate sparse vectors per field, fused).
- When this pattern does not fit. Short items and homogeneous data (tweets, product names) probably do better with a single dense vector. Multi-representation pays off when items are long and structured.

**Out of scope for the tutorial body:**
- Multimodal (OCR + ColPali). Different gap. Do not include.
- Real-time indexing, sharding, multi-tenancy. Out of scope.
- Production architecture. Stays focused on retrieval design.

**Length target:** 2,000 to 3,000 words. If the draft runs longer, cut.

**Code tabs:** Follow the convention of existing tutorials in the same directory. Python first, then language tabs as supported by the Query API and grouping features.

## Deliverable 2: Hybrid Queries Grouping Section

**Path:** `qdrant-landing/content/documentation/search/hybrid-queries.md` (anchor `#grouping`)

The current section is close to an API stub. Expand it with a real title/chunk grouping example showing `group_by="document_id"` with `group_size=3` against a hybrid query. Roughly 30 lines of code plus 100 to 150 words of surrounding prose.

Add a "See also" link at the end pointing to the new tutorial.

## Deliverable 3: Vectors Page Multivector Clarification

**Path:** `qdrant-landing/content/documentation/manage-data/vectors.md` (the Multivectors subsection)

The page currently lists two scenarios where multivectors are useful, including "multiple representation of the same object." That phrasing is the source of the misuse: readers interpret it as a green light to store title + summary + chunks in a multivector field.

Tighten the existing bullet and add a short clarification, roughly 30 to 50 words of net new copy:
- Specify that "multiple representation of the same object" means same-modality, same-shape vectors (for example, images of one product from different angles), not different fields such as title + summary + chunks.
- Note that MaxSim returns a single combined score per point, not per subvector, so the caller cannot tell which subvector matched.
- Point readers to the Named Vectors section further down the same page for the title + summary + chunks case, and link to the new tutorial as the worked example.

This edit is the single highest-leverage one in the task because the misuse pattern is constant in Discord. Do it carefully and consult `qdrant-messaging` for the wording.

## Deliverable 4: Text Search BM25 Note

**Path:** `qdrant-landing/content/documentation/search/text-search.md` (BM25 subsection)

Add a short note (two to three sentences) that BM25's term-frequency, IDF, and length-normalization parameters were calibrated for document-length text and degrade on titles or short chunks. When designing a multi-representation collection, apply BM25 to the longer fields and rely on dense vectors for the short ones. Link to the new tutorial.

## Deliverable 5: Search Relevance Cross-Link

**Path:** `qdrant-landing/content/documentation/search/search-relevance.md`

The page already has the heading-boost example for the docs site (h1/h2 vs p/li). Add a one-line link from that example to the new tutorial as the worked end-to-end version.

## Sidebar and Navigation

Add the new tutorial to the Search Engineering tutorial index. Follow the conventions in `qdrant-landing-page-contribution`.

## Out of Scope

- Refreshing the 2023 search-as-you-type article. Do not touch the body. Optionally add a short callout box at the top pointing to the new tutorial as the current best-practices reference, but only if the contribution skill says callouts are appropriate for old articles.
- A multimodal version (OCR + ColPali). Different gap, different piece, do not include.
- A standalone concept page. The tutorial absorbs the framing. Cross-links from existing concept pages do the discovery work.

## Acceptance Checklist

Before opening the PR, verify:

- [ ] `qdrant-messaging` skill was consulted for every prose section, every heading, every callout, every cross-link description, and the conclusion.
- [ ] `writing-style` skill applied: oxford comma, contractions, US English, title case for headings, no acronyms without first-mention definition.
- [ ] `qdrant-landing-page-contribution` skill followed for file paths, frontmatter, sidebar entry, and PR conventions.
- [ ] The tutorial has working code with all five walkthrough steps.
- [ ] Eval numbers are reported inline after each step, not only in a summary table at the end.
- [ ] The schema section explains the rationale for each named vector and for putting BM25 only on the longer fields.
- [ ] Multivectors are not used for storing different representations anywhere in the tutorial. The schema uses named vectors.
- [ ] Cross-links go in both directions: from the four supporting doc pages into the tutorial, and from the tutorial back out to the relevant concept pages.
- [ ] The Universal Query Demo (`course/essentials/day-5/universal-query-demo`) is mentioned in the tutorial as the related piece showing three representations of one query, with a one-line note on how the new tutorial covers the document-side equivalent.
- [ ] The Vectors page edit explicitly addresses the multivector misuse pattern and links to the tutorial.
- [ ] The tutorial is between 2,000 and 3,000 words. Cut if longer.
- [ ] No em dashes anywhere in the prose.
- [ ] No hype language ("game-changing", "supercharge", "thrilled to announce", etc.).

## Notes

If the dataset choice or any structural question becomes blocking, surface it in the PR description rather than guessing. The patterns are identical across datasets but the framing reads stronger when grounded in something realistic.
