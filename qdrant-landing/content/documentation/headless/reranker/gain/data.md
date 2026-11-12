
**Measured reranker results**

| dataset | candidate_count | best_gain | best_model | reranker_ndcg_10 | tuned_fusion_ndcg_10 |
| --- | --- | --- | --- | --- | --- |
| SciFact | 10 | 0.016245 | jina-reranker-v2-base-multilingual | 0.781827 | 0.765582 |
| SciFact | 25 | 0.031150 | jina-reranker-v2-base-multilingual | 0.796732 | 0.765582 |
| SciFact | 50 | 0.028209 | jina-reranker-v2-base-multilingual | 0.793791 | 0.765582 |
| SciFact | 100 | 0.029876 | jina-reranker-v2-base-multilingual | 0.795458 | 0.765582 |
| SciFact | 200 | 0.032718 | jina-reranker-v2-base-multilingual | 0.798300 | 0.765582 |
| ArguAna | 10 | 0.006772 | jina-reranker-v2-base-multilingual | 0.469684 | 0.462912 |
| ArguAna | 25 | 0.017350 | jina-reranker-v2-base-multilingual | 0.480262 | 0.462912 |
| ArguAna | 50 | 0.010199 | jina-reranker-v2-base-multilingual | 0.473111 | 0.462912 |
| ArguAna | 100 | 0.000613 | jina-reranker-v2-base-multilingual | 0.463525 | 0.462912 |
| ArguAna | 200 | -0.001043 | jina-reranker-v2-base-multilingual | 0.461869 | 0.462912 |
| WANDS | 10 | -0.033478 | ms-marco-MiniLM-L-12-v2 | 0.742713 | 0.776191 |
| WANDS | 25 | -0.009709 | jina-reranker-v2-base-multilingual | 0.766482 | 0.776191 |
| WANDS | 50 | -0.008270 | ms-marco-MiniLM-L-6-v2 | 0.767921 | 0.776191 |
| WANDS | 100 | -0.008970 | ms-marco-MiniLM-L-6-v2 | 0.767220 | 0.776191 |
| WANDS | 200 | -0.007916 | ms-marco-MiniLM-L-6-v2 | 0.768275 | 0.776191 |
| CodeSearchNet | 10 | 0.046975 | jina-reranker-v2-base-multilingual | 0.729504 | 0.682529 |
| CodeSearchNet | 25 | 0.086092 | jina-reranker-v2-base-multilingual | 0.768621 | 0.682529 |
| CodeSearchNet | 50 | 0.107161 | jina-reranker-v2-base-multilingual | 0.789690 | 0.682529 |
| CodeSearchNet | 100 | 0.129529 | jina-reranker-v2-base-multilingual | 0.812058 | 0.682529 |
| CodeSearchNet | 200 | 0.135025 | jina-reranker-v2-base-multilingual | 0.817554 | 0.682529 |
| DBPedia-entity | 10 | 0.032788 | jina-reranker-v2-base-multilingual | 0.490784 | 0.457996 |
| DBPedia-entity | 25 | 0.096173 | jina-reranker-v2-base-multilingual | 0.554169 | 0.457996 |
| DBPedia-entity | 50 | 0.111213 | jina-reranker-v2-base-multilingual | 0.569209 | 0.457996 |
| DBPedia-entity | 100 | 0.113639 | jina-reranker-v2-base-multilingual | 0.571635 | 0.457996 |
| DBPedia-entity | 200 | 0.114618 | jina-reranker-v2-base-multilingual | 0.572614 | 0.457996 |
