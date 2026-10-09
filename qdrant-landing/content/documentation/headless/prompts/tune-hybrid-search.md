---
title: "Tune hybrid search"
page: /documentation/search-tuning/how-to-tune-hybrid-search/
# Two skills: the parent explains what a hybrid query is and how it is scoped,
# the child is specifically about fusion, which is what this page tunes.
skills:
  - qdrant-search-quality/search-strategies/hybrid-search
  - qdrant-search-quality/search-strategies/hybrid-search/combining-searches
---
Help me tune hybrid search on my Qdrant collection. Read https://skills.qdrant.tech/qdrant-search-quality/search-strategies/hybrid-search/SKILL.md and https://skills.qdrant.tech/qdrant-search-quality/search-strategies/hybrid-search/combining-searches/SKILL.md first.

Ask me for my current prefetch setup, my labeled query set, and the metric I use to score results. Wait until I provide labels before recommending a configuration. Base each choice on my data rather than assuming a default will work.

Work through these steps in order, and show me the scores at each step:

1. Check whether fusion beats the better of the two prefetches on its own. If it doesn’t, tell me to stop here.
2. Test both RRF and DBSF to see which performs better.
3. If RRF wins, tune its `k` constant based on how many relevant documents my queries have, rather than copying a standard value.
4. Only then, test a few weight pairs.

Validate the best configuration on held-out queries before recommending it for production. Tell me whether the gains justify the extra prefetch and index, and call out improvements that are too small to be worth that cost.
