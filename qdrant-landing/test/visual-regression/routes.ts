/**
 * Route allowlist for visual snapshots.
 *
 * EXCLUDE_PREFIXES drops post URLs if they are ever added to ROUTES while
 * keeping section indexes (exact prefix match). Individual posts and docs
 * pages are covered by SAMPLED_ROUTES instead.
 */

export const ROUTES: string[] = [
  "/",
  "/about-us/",
  "/advanced-search/",
  "/ai-agents/",
  "/articles/",
  "/benchmarks/",
  "/benchmarks/benchmark-faq/",
  "/benchmarks/benchmarks-intro/",
  "/benchmarks/filtered-search-benchmark/",
  "/benchmarks/filtered-search-intro/",
  "/benchmarks/single-node-speed-benchmark-2022/",
  "/benchmarks/single-node-speed-benchmark/",
  "/blog/",
  "/brand-resources/",
  "/cloud-inference/",
  "/cloud/",
  "/community/",
  "/contact-us/",
  "/course/",
  "/customers/",
  "/data-analysis-anomaly-detection/",
  "/demo/",
  "/documentation/",
  "/e-commerce/",
  "/edge/",
  "/enterprise-solutions/",
  "/events/",
  "/features/",
  "/gpu-indexing/",
  "/healthcare/",
  "/hospitality-and-travel/",
  "/hr-tech/",
  "/hybrid-cloud/",
  "/learn/",
  "/learn/examples/",
  "/legal-tech/",
  "/legal/credits/",
  "/legal/impressum/",
  "/legal/privacy-policy/",
  "/legal/recruitment-privacy-policy/",
  "/legal/terms_and_conditions/",
  "/lp/ai/",
  "/lp/ai-agents/",
  "/lp/ai-retrieval/",
  "/lp/benchmarks-comparison/",
  "/lp/full-text-search/",
  "/lp/general-search/",
  "/lp/general-vector-database/",
  "/lp/generative/",
  "/lp/indexing/",
  "/lp/lucene/",
  "/lp/open-source/",
  "/lp/rust/",
  "/lp/semantic/",
  "/lp/similarity/",
  "/migrate-from-chroma/",
  "/observability/",
  "/partners/",
  "/pricing/",
  "/pricing/comparison/",
  "/private-cloud/",
  "/qdrant-for-startups/",
  "/qdrant-vector-database/",
  "/quantization/",
  "/rag/",
  "/rag/rag-evaluation-guide/",
  "/recommendations/",
  "/resilience/",
  "/security/",
  "/security/bug-bounty-program/",
  "/serverless/",
  "/services/",
  "/stars/",
  "/subscribe-confirmation/",
  "/subscribe/",
  "/use-cases/",
  "/vector-space-day-sf-26-recap/",
  "/vector-space-day-sf-26/",
  "/vector-space-day-sf-26/agenda/",
];

/**
 * Content sections are too large to snapshot in full, so a fixed random
 * sample is tested instead. Picked once with a seeded shuffle (seed 20261029),
 * then trimmed on 2026-11-03 to a mix of page types: an FAQ, an integration,
 * a concept page with code tabs, a course module, one article, and one article
 * category listing. SHORTCODE_ROUTES adds five more documentation and course
 * pages. Written out here so the baseline run and the comparison run always
 * hit the same pages. Re-pick by hand if a sampled page is removed.
 */
export const SAMPLED_ROUTES: string[] = [
  // documentation
  "/documentation/faq/database-optimization/",
  "/documentation/frameworks/fifty-one/",
  "/documentation/search/search-relevance/",
  // course
  "/course/multi-vector-search/module-3/",
  // articles
  "/articles/detecting-coffee-anomalies/",
  "/articles/vector-search-fundamentals/",
  // blog
  "/blog/case-study-lettria-v2/",
  "/blog/cohere-embedding-v3/",
  "/blog/iris-agent-qdrant/",
  "/blog/teaching-vector-db-at-scale/",
];

/**
 * One page per shortcode that has its own assets in assets/shortcodes/, so a
 * change to a shortcode's styles or script shows up in the snapshots. Keep in
 * step with the table in assets/shortcodes/README.md.
 */
export const SHORTCODE_ROUTES: string[] = [
  "/documentation/cloud/cluster-monitoring/", // accordion
  "/documentation/search/text-search/", // code-snippet
  "/blog/case-study-poliscope/", // quote
  "/course/multi-vector-search/module-2/", // date
  "/documentation/agentic-tools/", // prompt
  "/course/multi-vector-search/", // cards-list
  "/course/", // course-card (already a section route)
];

/**
 * Drop any route under these prefixes except the index itself.
 * e.g. "/blog/" kept, "/blog/my-post/" dropped.
 */
export const EXCLUDE_PREFIXES: string[] = ["/blog/", "/articles/"];

export function includedRoutes(): { route: string; name: string }[] {
  return ROUTES.filter(
    (route) =>
      !EXCLUDE_PREFIXES.some(
        (prefix) => route.startsWith(prefix) && route !== prefix
      )
  )
    .concat(SAMPLED_ROUTES)
    .concat(SHORTCODE_ROUTES.filter((route) => !ROUTES.includes(route)))
    .map((route) => ({
      route,
      name: route === "/" ? "homepage" : route.replace(/^\/|\/$/g, ""),
    }));
}
