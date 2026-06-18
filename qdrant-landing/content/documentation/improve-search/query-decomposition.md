---
title: Query Decomposition for Multi-Hop Questions
short_description: "Answer multi-hop questions by retrieving in steps: an LLM asks each follow-up sub-question, then Qdrant fuses the results with RRF."
description: "Answer multi-hop questions in Qdrant: decompose the query into retrieval steps, let an LLM ask each follow-up, and fuse results with RRF."
weight: 8
partition: ecosystem
---

# Query Decomposition for Multi-Hop Questions

| Time: 15 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

A multi-hop question chains two facts: the second depends on the answer to the first. "Where was the director of the film Inception born?" needs the director, then that person's birthplace. A single query retrieves chunks about the film, but the birthplace sits in a chunk about Christopher Nolan that never mentions Inception. Reranking and fusion only reorder what one query already retrieved, so they can't recover evidence that was never in the candidate set.

Decomposition fetches it: search for the question, let an LLM read the results and ask the next sub-question, search again, and repeat until nothing is missing. Each hop's query is informed by what the last hop found. The approach builds on [Self-Ask](https://arxiv.org/abs/2210.03350), where the model asks itself follow-up questions, and [IRCoT](https://arxiv.org/abs/2212.10509), which interleaves retrieval with the model's reasoning across steps.

**Prerequisites.** A populated Qdrant collection, an embedding model to encode queries, and Python with `qdrant-client` and `openai`.

## How It Works

The flow is: retrieve for the question, ask the LLM what's still missing, retrieve for that, repeat, then fuse everything. Start with the clients and a cap on the number of hops.

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
    # top 3 chunks from every hop so far
    context = "\n".join(hit.payload.get("text", "") for hits in hops for hit in hits[:3])
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
    return None if answer == "DONE" else answer
```

Once every sub-question is known, one request retrieves for all of them and fuses the results. Fusing every hop matters: a multi-hop question is a chain and each hop retrieves one link, so keeping only the last query would lose the evidence that ties the answer back to the original question.

```python
def fused_retrieve(queries, limit=10):
    """Retrieve for every sub-question and let Qdrant merge them with built-in Reciprocal Rank Fusion (RRF)."""
    response = client.query_points(
        collection_name="{collection_name}",
        prefetch=[
            models.Prefetch(query=embed(q), using="dense", limit=limit)
            for q in queries
        ],
        query=models.RrfQuery(rrf=models.Rrf()),
        limit=limit,
    )
    return response.points
```

We use [Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf): each list scores a chunk as `1 / (k + rank)` for a small constant `k` (2 by default in Qdrant), and those scores sum across the lists, so a chunk ranked high in any hop rises, and one that appears in several hops rises further. It combines by rank rather than raw score because similarity scores from different query vectors aren't comparable, but ranks are.

Tie the pieces together: loop until the LLM is satisfied, then fuse.

```python
question = "Where was the director of the film Inception born?"
queries = [question]         # every sub-question we retrieve for
hops = [retrieve(question)]  # their results, used to steer the LLM

for _ in range(MAX_HOPS):
    follow_up = next_subquestion(question, hops)
    if follow_up is None:
        break
    queries.append(follow_up)
    hops.append(retrieve(follow_up))

pool = fused_retrieve(queries)  # Qdrant fuses all sub-questions with built-in RRF
```

The per-hop retrievals inside the loop only feed the LLM's choice of the next sub-question. `fused_retrieve` produces the final `pool`, running every sub-question through Qdrant's RRF in one request. Pass that `pool` to your answer step: the LLM call that reads the chunks and writes the answer.

## When to Use It

Decomposition adds an LLM call and a query per hop, so reach for it only when a question spans multiple facts. For single-fact questions, one query is faster and just as accurate. To confirm it helps on your data, compare `recall@k` for single-pass against decomposition on a small set of multi-hop questions; the [Measuring Retrieval Relevance](/documentation/improve-search/retrieval-relevance/) tutorial covers the setup.
