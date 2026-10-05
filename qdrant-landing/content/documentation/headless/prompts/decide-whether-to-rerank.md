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
Help me decide whether a reranker is worth adding to my search. Read https://skills.qdrant.tech/qdrant-search-quality/search-strategies/SKILL.md and https://skills.qdrant.tech/qdrant-search-quality/search-strategies/relevance-feedback/SKILL.md first, and tell me whether my symptom calls for a reranker at all or for expanding the candidate pool with relevance feedback, which is cheaper. Ask me for my current ranking setup, my labeled queries, and my latency budget, and do not recommend anything before I give you labels. Then measure the headroom: score my candidates as if they were perfectly ordered, compare that with what my pipeline returns now, and say so if the gap is too narrow to pay for. If it is worth chasing, test 10 candidates with the model I would actually serve, and do not deepen the list to rescue a loss. On a loss, check fit before giving up: compare the 95th percentile of my tokenized query and document pairs against the model's context window, and its training domain against my corpus. Only after a win, pick the smallest candidate count that holds most of the gain, then measure throughput and tail latency on the hardware I will deploy on and tell me whether that is servable.
