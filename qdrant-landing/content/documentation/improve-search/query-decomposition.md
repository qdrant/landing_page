---
title: Query Decomposition for Multi-Hop Questions
short_description: "Answer multi-hop questions by retrieving in steps: an LLM asks each follow-up sub-question, then fuse the per-hop results with RRF."
description: "Answer multi-hop questions in Qdrant: decompose the query into retrieval steps, let an LLM ask each follow-up, and fuse results with RRF."
weight: 8
partition: ecosystem
---

# Query Decomposition for Multi-Hop Questions

| Time: 15 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

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
    return None if answer.upper().startswith("DONE") else answer
```

The loop already has every hop's results. Fuse all of them, not just the last: each hop retrieves one link of the chain, so dropping the earlier hops loses the evidence that ties the answer back to the question.

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

Reciprocal Rank Fusion scores each chunk by its rank in every hop, `1 / (k + rank)`, and sums across hops, so a chunk ranked high in any hop rises and one ranked high in several rises further. For more on RRF, see the [hybrid queries reference](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf). We fuse in Python because the loop already holds each hop's results; to fuse inside a single request instead, Qdrant runs RRF server-side with `RrfQuery`.

Tie the pieces together: loop until the LLM is satisfied, then fuse.

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

The loop prints the follow-up the LLM generates, then `rrf_fuse` reuses the hops to build `pool`. With a small, synthetic film-and-director collection, it prints:

```text
follow-up: Where was Christopher Nolan born?
Christopher Nolan was born on 30 July 1970 in London, England. He developed an interest in filmmaking as a child.
Inception is a 2010 science fiction film written and directed by Christopher Nolan. It follows a thief who steals corporate secrets through dream-sharing technology.
Christopher Nolan studied English literature at University College London before starting his film career.
```

The birthplace chunk never mentions Inception, so only the follow-up surfaces it. In this run, RRF brings both links to the top of `pool`. Pass that `pool` to your answer step: the LLM call that reads the chunks and writes the answer.

## When to Use It

Decomposition adds an LLM call and a query per hop, so reach for it only when a question spans multiple facts. For single-fact questions, one query is faster and just as accurate. To confirm it helps on your data, compare `recall@k` for single-pass against decomposition on a small set of multi-hop questions; the [Measuring Retrieval Relevance](/documentation/improve-search/retrieval-relevance/) tutorial covers the setup.
