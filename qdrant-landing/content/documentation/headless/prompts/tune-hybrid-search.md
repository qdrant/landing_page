---
title: "Tune hybrid search"
page: /documentation/search-tuning/how-to-tune-hybrid-search/
# Two skills: the parent explains what a hybrid query is and how it is scoped,
# the child is specifically about fusion, which is what this page tunes.
skills:
  - qdrant-search-quality/search-strategies/hybrid-search
  - qdrant-search-quality/search-strategies/hybrid-search/combining-searches
---
Help me tune hybrid search on my Qdrant collection. Read https://skills.qdrant.tech/qdrant-search-quality/search-strategies/hybrid-search/SKILL.md and https://skills.qdrant.tech/qdrant-search-quality/search-strategies/hybrid-search/combining-searches/SKILL.md first. Then ask me for my current prefetch setup, my labeled query set, and the metric I am scoring on, and do not recommend a configuration before I give you labels, since every choice here depends on my data rather than on a default. Work in this order and show me the number at each step: confirm fusion actually beats the better single prefetch, because sometimes it does not and then I should stop; pick RRF or DBSF by running both; set the k constant from how many relevant documents my queries have rather than copying a value; and only then sweep a few weight pairs. Validate the winner on held-out queries before you tell me to ship it, and say which gains are too small to be worth the second prefetch and the second index it costs me.
