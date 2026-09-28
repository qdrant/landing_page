# RAG and long context: 2026 evidence

Research date: September 28, 2026. Intended use: evidence for the context-window paragraph in `qdrant-landing/content/articles/what-is-rag-in-ai.md`. Article unchanged. No established research-notes directory was found, so this note lives outside the published Hugo content tree.

## Editorial conclusion

The defensible claim is that larger context windows have not made retrieval obsolete. Avoid presenting benchmark studies as proof that RAG always beats long context. The 2026 evidence supports choosing between them, or combining them, according to task, model, and cost.

## 1. Route Before Retrieve

Yiwen Chen et al., *Route Before Retrieve: Activating Latent Routing Abilities of LLMs for RAG vs. Long-Context Selection*. First submitted May 11, 2026; revised May 12. Preprint status on the checked arXiv record. [Primary record](https://arxiv.org/abs/2605.10235).

The study evaluates routing on LaRA and LongBench-v2. One clear LongBench-v2 example uses Qwen3-235B without thinking: always using long context scores 0.47, always using RAG scores 0.46, and Pre-Route with a DeepSeek-R1 router scores 0.49 while selecting long context for 25.3% of queries. Thus 74.7% use RAG. These are QA scores, not percentages of correct answers. [Full paper, Table 4 and Section 4.1](https://arxiv.org/html/2605.10235v2).

Important limits: winners vary across models and router settings. Long-context selection rate is a computational-cost proxy, not a measured percentage saving. Do not translate the 74.7% RAG selection rate into 74.7% lower cost. The paper separately accounts for routing overhead and gives token-pricing examples, but does not justify a universal accuracy or cost advantage. [Methods and tables](https://arxiv.org/html/2605.10235v2).

## 2. The Token Tax of Epistemic Accuracy

*The Token Tax of Epistemic Accuracy: Comparing RAG and Long-Context Architectures for Document-Grounded Generative AI Applications*, June 2026 preprint. [Primary record](https://arxiv.org/abs/2606.20898).

A manufacturing-document study evaluates 972 answers: 162 questions, three approaches, and two models, GPT-5.4-mini and GPT-5.4-nano. Long context achieves 73.1% correctness versus 65.4% for semantic RAG, at roughly 26 times the per-query token cost. Reported average monetary costs are $0.1181 and $0.0045 respectively. This is evidence of an accuracy-cost trade-off, not an accuracy win for RAG. [Full paper, Sections 4.1 and 4.2](https://arxiv.org/html/2606.20898).

Limits: a narrow manufacturing case study with a corpus that fits in context and two small models. Evaluation uses an LLM judge and an expert-validated benchmark; the authors identify cases where appropriately abstaining was marked incorrect. The cost ratio is specific to the setup and pricing. [Methods and discussion](https://arxiv.org/html/2606.20898).

## 3. Q-RAG: peer-reviewed 2026 evidence

Artyom Sorokin et al., *Q-RAG: Long Context Multi-Step Retrieval via Value-Based Embedder Training*, ICLR 2026 conference paper. Treat 2026 as the verified conference-publication year; first-preprint date was not independently checked in this pass. [Official proceedings](https://proceedings.iclr.cc/paper_files/paper/2026/hash/372dee09e0c3c17df69d990b4735adac-Abstract-Conference.html).

Q-RAG trains an embedder for multi-step retrieval. RULER Table 1 reports 99.7% average needle-in-a-haystack performance at 1M tokens and 61 on multi-hop QA at that length. The broader evaluation extends to 10M tokens on BabiLong. At 128K tokens, Q-RAG scores 65 on RULER multi-hop QA versus 50 for the reported LongRoPE2-8B baseline. [Conference paper, Sections 4.1-4.3 and Table 1](https://proceedings.iclr.cc/paper_files/paper/2026/file/372dee09e0c3c17df69d990b4735adac-Paper-Conference.pdf).

Limits: synthetic long-context tasks, specialized training, and heterogeneous baselines, including results imported from other papers. This establishes an active, useful retrieval approach at long lengths; it is not a controlled comparison proving ordinary vector RAG beats current frontier long-context models in production. [Experimental setup](https://proceedings.iclr.cc/paper_files/paper/2026/file/372dee09e0c3c17df69d990b4735adac-Paper-Conference.pdf).

## Secondary candidate considered

*Chain-of-Memory* (January 14, 2026) directly compares full context with retrieval for conversation memory. On LongMemEval with GPT-4o-mini, turn-level RAG scores 64.20% versus 55.80% full context; on LoCoMo, full context instead wins 71.88% versus 65.39%. Its own Chain-of-Memory method scores 74.20% and 72.86%. This reinforces task dependence. The narrative overstates some gains relative to its own tables, so the clearer sources are preferred. [Primary paper, Table 2](https://arxiv.org/html/2601.14287v1).
