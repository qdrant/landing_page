---
title: "Decide whether to rerank"
page: /documentation/search-tuning/when-a-reranker-is-worth-it/
# Two skills because the honest answer may be "do not add a reranker". The
# parent covers stage selection, and relevance feedback is the cheaper
# alternative its own description says to weigh when someone is considering
# reranking. Naming only the first would hide the option.
skills:
  - qdrant-search-quality/search-strategies
  - qdrant-search-quality/search-strategies/relevance-feedback
---
Help me decide whether a reranker is worth adding to my search. First, read https://skills.qdrant.tech/qdrant-search-quality/search-strategies/SKILL.md and https://skills.qdrant.tech/qdrant-search-quality/search-strategies/relevance-feedback/SKILL.md.

Ask me how I currently rank results, which queries I have relevance labels for, and what my latency budget is. Wait until I provide labels before recommending anything. Then help me determine whether a reranker would address the problem I’m seeing, or whether expanding the candidate pool with relevance feedback would be a cheaper way to solve it.

Start by measuring how much room there is to improve. Compare my pipeline’s current results with the best possible ordering of the same candidates. If the gap is too small to justify a reranker’s cost, tell me.

If there’s enough room to improve, test reranking 10 candidates using the model I would actually deploy. If it doesn’t improve results, don’t increase the candidate count to try to get a win. Before ruling it out, check whether the model fits my data: compare the 95th-percentile token count of my query–document pairs with its context window, and compare its training domain with my corpus.

Only if the test improves results, find the smallest candidate count that preserves most of the gain. Then measure throughput and tail latency on my deployment hardware, and tell me whether the setup can meet my serving requirements.
