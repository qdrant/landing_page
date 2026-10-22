---
title: Query Decomposition for Multi-Hop Questions
short_description: "Answer multi-hop questions by retrieving in steps: an LLM asks each follow-up sub-question, then fuse the per-hop results with RRF."
description: "Answer multi-hop questions in Qdrant: decompose the query into retrieval steps, let an LLM ask each follow-up, and fuse results with RRF."
weight: 16
date: 2026-06-25T18:25:32Z
goal: RAG & Agents
stack:
  - Python
  - OpenAI
aliases:
  - /documentation/search-patterns/query-decomposition/
  - /documentation/improve-search/query-decomposition/
---

# Query Decomposition for Multi-Hop Questions

| Time: 15 min | Level: Intermediate | Stack: Python |
|--------------|---------------------|---------------|

A multi-hop question chains two facts: the second depends on the answer to the first. "Where was the director of the film Inception born?" needs the director, then that person's birthplace. A single query retrieves chunks about the film, but the birthplace sits in a chunk about Christopher Nolan that never mentions Inception. Reranking and fusion only reorder what one query already retrieved, so they can't recover evidence that was never in the candidate set.

Decomposition fetches it: search for the question, let an LLM read the results and ask the next sub-question, search again, and repeat until nothing is missing. The approach builds on [Self-Ask](https://arxiv.org/abs/2210.03350), where the model asks itself follow-up questions, and [IRCoT](https://arxiv.org/abs/2212.10509), which interleaves retrieval with the model's reasoning across steps.

**Prerequisites.** A populated Qdrant collection, an embedding model to encode queries, and Python with `qdrant-client` and `openai`.

## How It Works

Start with the clients and a cap on the number of hops.

```python
from openai import OpenAI
from qdrant_client import QdrantClient, models

from your_embedding_model import embed  # must match the model your collection uses

llm = OpenAI(api_key="<your-api-key>")
# QdrantClient(url="https://<id>.cloud.qdrant.io", api_key="...") for Qdrant Cloud
client = QdrantClient("http://localhost:6333")

MODEL = "gpt-5-mini"    # small, fast, cheap; swap for any chat model you prefer
MAX_HOPS = 3            # cap the follow-up hops so the loop always terminates
```

Each hop is an ordinary similarity search:

```python
def retrieve(text, limit=10):
    response = client.query_points(
        collection_name="{collection_name}",
        query=embed(text),
        using="dense",  # your vector's name; omit if unnamed
        limit=limit,
    )
    return response.points
```

After each hop, the LLM reads the results so far and names the one fact still missing, or replies `DONE`. Picking the next sub-question is a light task, so a small, fast model handles it well:

```python
def next_subquestion(question, hops):
    """Ask the LLM what to retrieve next, or return None when nothing is missing."""
    # the top 3 chunks from each hop so far
    context = "\n".join(
        hit.payload.get("text", "")
        for hits in hops
        for hit in hits[:3]
    )
    prompt = (
        f"Question: {question}\n\n"
        f"Results so far:\n{context}\n\n"
        "What single follow-up question still needs answering? "
        "Reply with only the question, or DONE if the results already answer it."
    )
    response = llm.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    answer = response.choices[0].message.content.strip()
    return None if answer.strip(" .").upper() == "DONE" else answer
```

The loop already has every hop's results. Fuse all of them: each hop retrieves one link of the chain, so dropping the earlier hops can lose the evidence that ties the answer back to the question.

```python
def rrf_fuse(hops, k=2, limit=10):
    """Merge the per-hop results with Reciprocal Rank Fusion (RRF)."""
    scores, points = {}, {}
    for hits in hops:
        for rank, hit in enumerate(hits):
            scores[hit.id] = scores.get(hit.id, 0) + 1 / (k + rank)
            points.setdefault(hit.id, hit)
    ranked = sorted(scores, key=scores.get, reverse=True)
    return [points[i] for i in ranked[:limit]]
```

Reciprocal Rank Fusion scores each chunk by its rank in every hop, `1 / (k + rank)`, and sums across hops, so a chunk ranked high in any hop rises and one ranked high in several rises further.

{{< island path="content/documentation/headless/query-decomposition/rrf-merge" ratio="3 / 1" title="Illustrative RRF scores with `k=2` and zero-based ranks. Letters identify chunks; each tile includes its score. Chunk C contributes 0.250 and 0.333, totaling about 0.583. Equal scores keep first-seen order." >}}
![Two ranked chunk lists merge with RRF. Chunk C appears at ranks two and one, scoring 0.583 after fusion. The merged order is C, A, E, B, with scores 0.583, 0.500, 0.500, and 0.333.](/documentation/tutorials/query-decomposition/rrf-merge.svg)
{{< /island >}}

`rrf_fuse` runs in your own code because the loop already holds every hop's results. Qdrant can also run RRF on the server, inside a single query; see the [hybrid queries reference](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf).

The example uses `k=2`, the default of Qdrant's server-side RRF. `k` sets how much a chunk found by several hops is pushed up.

- **This can help when a follow-up goes off track**, because agreement between hops can outweigh one hop's wrong top result.
- **It can also hurt**: a vague chunk that loosely matches two sub-questions can outrank the one chunk that answers a hop.

{{< island path="content/documentation/headless/query-decomposition/rrf-helps-hurts" ratio="3 / 1" title="Illustrative examples with `k=2`. Check marks identify needed chunks A and C; dashed borders identify vague chunk E. The horizontal line limits the answer to two chunks. Crosses mark a wrong result or an excluded needed chunk. Repeated chunks score 0.583; each hop's top chunk scores 0.500. Equal scores keep first-seen order." >}}
![With a two-chunk answer limit, RRF keeps needed chunks C and A in the Helps case. In the Hurts case, repeated vague chunk E displaces needed chunk C. Each tile shows its chunk ID and RRF score.](/documentation/tutorials/query-decomposition/rrf-helps-hurts.svg)
{{< /island >}}

- A smaller `k` favors each hop's top result.
- A larger `k` lets a chunk found by 2 hops outrank a top chunk found by only one, even from lower ranks.

<aside role="status">Whatever <code>k</code> you choose, keep <code>limit</code> at least as large as the number of hops: with a smaller limit, the hops' distinct top chunks can't all reach the answer step.</aside>

<details>
<summary>RRF is not the only way to merge the hops</summary>

- **Interleaving**: take each hop's first chunk, then each hop's second, and so on, skipping duplicates, until you fill up a limit of chunks you'll show to the LLM.
- **Highest score**: keep each chunk once with its best similarity score and sort. It's simple, but scores from different queries aren't always directly comparable, so one hop can fill all the top positions of the final result.
- **Keep everything**: pass every hop's chunks to the answer step, up to a cap, as [IRCoT](https://arxiv.org/abs/2212.10509) does. Here the answer prompt grows with each hop.

</details>

Tie the pieces together: loop until the LLM is satisfied or the hop cap is reached, then fuse.

```python
question = "Where was the director of the film Inception born?"
hops = [retrieve(question)]  # each hop's results, also used to steer the LLM

for _ in range(MAX_HOPS):
    follow_up = next_subquestion(question, hops)
    if follow_up is None:
        break
    print("follow-up:", follow_up)
    hops.append(retrieve(follow_up))

pool = rrf_fuse(hops)  # fuse every hop's results; no extra queries
for point in pool[:3]:
    print(point.payload["text"])
```

The loop prints the follow-up the LLM generates, then `rrf_fuse` reuses the hops to build `pool`. The exact output depends on your data and the LLM. The following output is illustrative:

```text
follow-up: Where was Christopher Nolan born?
Christopher Nolan was born on 30 July 1970 in London, England. He developed an interest in filmmaking as a child.
Inception is a 2010 science fiction film written and directed by Christopher Nolan. It follows a thief who steals corporate secrets through dream-sharing technology.
Christopher Nolan studied English literature at University College London before starting his film career.
```

In this illustrative run, the birthplace chunk never mentions Inception, and the original question didn't surface it; only the follow-up did. Here, RRF ranks both the film chunk and the birthplace chunk at the top of `pool`. Pass that `pool` to your answer step: the LLM call that reads the chunks and writes the answer.

## When to Use It

Decomposition adds an LLM call and a query per hop, so reach for it only when a question spans multiple facts. For single-fact questions, one query is faster and usually just as accurate. To confirm it helps on your data, compare `recall@k` for single-pass against decomposition on a small set of multi-hop questions; the [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) guide covers the setup.
