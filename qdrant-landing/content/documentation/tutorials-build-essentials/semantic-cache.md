---
title: Semantic Caching for RAG
short_description: "Put a semantic cache in front of your RAG pipeline with Qdrant and calibrate the similarity threshold that decides when it answers."
description: "Tutorial: build a semantic cache for RAG with Qdrant Cloud Inference and OpenRouter, calibrate its similarity threshold, and keep cached answers fresh."
weight: 25
partition: ecosystem
date: 2026-10-09T00:00:00-08:00
author: Evgeniya Sukhodolskaya
aliases:
  - /articles/semantic-cache-ai-data-retrieval/
  - /blog/semantic-cache-ai-data-retrieval/
goal: RAG & Agents
stack:
  - Python
  - Cloud Inference
  - OpenRouter
draft: false
social_preview_image: /documentation/tutorials-build-essentials/semantic-cache/social_preview.jpg
example_resources:
  - label: Open Notebook
    url: https://githubtocolab.com/qdrant/examples/blob/master/semantic-cache/semantic_cache.ipynb
---

<link rel="stylesheet" href="/documentation/tutorials-build-essentials/semantic-cache/figures.css">

# Build a Semantic Cache for a RAG Pipeline

| Time: 30 min | Level: Intermediate | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/semantic-cache/semantic_cache.ipynb) |
| --- | --- | --- |

## What's a Semantic Cache

Traditional caches operate on an exact match basis, while **semantic caches** search for the meaning of the key rather than an exact match.  
For example, *"What is the capital of Brazil?"* and *"Can you tell me the capital of Brazil?"* are semantically equivalent: a semantic cache can recognize that.

If hundreds of users repeat the same question, the system can retrieve the generated answer from the cache rather than re-executing the entire process. A hit skips the main knowledge-base retrieval and the LLM call, saving time and cost.

For applications like question-answering systems where facts are retrieved from documents, caching is beneficial due to the consistent nature of the queries. However, for text generation tasks requiring varied responses, caching may not be ideal as it returns previous responses, potentially limiting variation. Thus, the decision to use caching depends on the specific use case.

### What's Non-Trivial in Semantic Cache
The hard part is deciding what counts as *"close enough"*. The threshold of "cache trust" needs to be configured per use case, and we'll provide some general recommendations on how to do so in this tutorial. We'll:

1. Build a cache collection in Qdrant.
2. Derive a similarity threshold defining cache hits for the incoming questions.
3. **[Optional]** Check cache hits with [Jev](https://docs.typesafe.ai/introduction), a zero-shot classifier.
4. **[Optional]** Invalidate stale answers, if your cache has a defined lifetime.

> The data used in this tutorial is synthetic. Set up the similarity threshold and the cache configuration based on your own data.

To follow along, [open the notebook in Colab](https://githubtocolab.com/qdrant/examples/blob/master/semantic-cache/semantic_cache.ipynb) or [view it on GitHub](https://github.com/qdrant/examples/blob/master/semantic-cache/semantic_cache.ipynb).

## Setup

### Prerequisites

You need:

- **A free Qdrant Cloud cluster**. Follow the [Cloud Quickstart](/documentation/cloud-quickstart/) and copy the cluster URL and an API key.
- **An OpenRouter API key**. OpenRouter is chosen for convenience: one key here covers the embeddings inference, the LLM part of RAG, and the optional Jev check. **Running the whole notebook costs less than one cent in OpenRouter usage**.
  - Embeddings come from `openai/text-embedding-3-small`, called through **Qdrant Cloud Inference**: Qdrant Cloud requests the embedding on the server side and Qdrant stores or queries the vector without a separate embedding call (details in [External Providers, OpenRouter](/documentation/inference/external-inference-providers/#openrouter)).
  - Answers are written by `openai/gpt-6-luna`.
- **Python**. The tutorial uses `Python 3.12`.

### Install and Connect

<details>
<summary>Install the packages and set the API keys</summary>

```bash
python -m pip install "qdrant-client>=1.19.1" openrouter

export QDRANT_URL="https://<your-cluster>.cloud.qdrant.io"
export QDRANT_API_KEY="<your-qdrant-api-key>"
export OPENROUTER_API_KEY="<your-openrouter-api-key>"
```

</details>

<details>
<summary>Connect to Qdrant and OpenRouter</summary>

```python
import os

from openrouter import OpenRouter
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
    cloud_inference=True,
    # An external embedding provider, such as OpenRouter, can take longer than the default 5 seconds.
    timeout=60,
)

openrouter = OpenRouter(api_key=os.environ["OPENROUTER_API_KEY"])
```

</details>

<details>
<summary>Define the collection names, the embedding model, the LLM for RAG, and an embedding helper for Qdrant Cloud Inference</summary>

```python
# Cloud Inference forwards "openrouter/..." models to OpenRouter with the key passed in options.
EMBEDDING_MODEL = "openrouter/openai/text-embedding-3-small"
EMBEDDING_SIZE = 1536
LLM_MODEL = "openai/gpt-6-luna"

KNOWLEDGE_BASE_COLLECTION = "semcache_tut_kb"
CACHE_COLLECTION = "semcache_tut_cache"


def embed(text: str) -> models.Document:
    # Qdrant Cloud turns text into a vector on the server.
    return models.Document(
        text=text,
        model=EMBEDDING_MODEL,
        options={"openrouter-api-key": os.environ["OPENROUTER_API_KEY"]},
    )
```

</details>

## Building the RAG (before the Cache)

In RAG, when a user asks a question, we search our knowledge base for matching context. The matched context is then passed to an LLM along with the prompt and user question for response generation.

Our knowledge base here contains short policy documents of a marketplace: returns, shipping, payment, warranty, account, and order tracking.

<details>
<summary>Our knowledge base of policy documents</summary>

```python
from typing import TypedDict


class Doc(TypedDict):
    id: str
    text: str


DOCUMENTS: list[Doc] = [
    {
        "id": "returns-v1",
        "text": "You can return most items within 30 days of delivery for a refund to the original payment method. Items must be unworn and unwashed, with the original tags attached. Shoes may be tried on indoors, but shoes with any outdoor wear on the soles cannot be returned. Sale items can be returned within 30 days for store credit only, not a refund. Items marked Final Sale, gift cards, and opened packs of socks cannot be returned. Exchanges for a different size or color follow the same 30-day and condition rules and are free. For refunds, a $6.95 return shipping fee is deducted from the refund. Refunds are issued within 5 business days after the return reaches our warehouse.",
    },
    {
        "id": "shipping-v1",
        "text": "We ship from our warehouse in Ohio to the United States, Canada, and the European Union. We do not ship to PO boxes or other countries. Standard shipping within the US takes 3 to 5 business days and is free on orders over $75; orders of $75 or less pay $5.95. US express shipping takes 1 to 2 business days and costs $14.95. Shipping to Canada takes 5 to 8 business days and costs $12.95. Shipping to the European Union takes 7 to 12 business days and costs $19.95, and the customer pays import duties on delivery. Orders placed before 2 p.m. Eastern Time on a business day ship the same day; later orders ship the next business day.",
    },
    {
        "id": "payment-v1",
        "text": "We accept Visa, Mastercard, American Express, PayPal, and Fernhollow gift cards. We do not accept cash on delivery, checks, or cryptocurrency. Your card is charged when the order ships, not when you place it. Orders between $150 and $1,000 can be paid in 4 interest-free installments at checkout. You can combine up to two gift cards in one order, and a gift card can be combined with one credit card. All prices are in US dollars. Customers in Canada and the European Union are also charged in US dollars, and their bank may add a currency conversion fee. Promo codes must be entered before payment and cannot be applied to orders that were already placed.",
    },
    {
        "id": "warranty-v1",
        "text": "All footwear has a 1-year warranty against manufacturing defects, such as sole separation, broken eyelets, or failed seams. Jackets and other outerwear have a 2-year warranty covering zippers, seams, and waterproof coatings. Backpacks have a 3-year warranty. The warranty period starts on the delivery date. The warranty does not cover normal wear, such as worn-down tread, damage from misuse, or items altered after purchase. To make a claim, email photos of the defect and your order number to warranty@fernhollow.example. Approved claims get a free replacement of the same item; if the item is no longer available, you get store credit for the purchase price. Warranty claims do not require the original tags.",
    },
    {
        "id": "account-v1",
        "text": "You can check out as a guest, but an account lets you see your order history and save addresses. To reset your password, click Forgot password on the sign-in page; the reset link expires after 60 minutes. You can change your email address in Account Settings; the change takes effect after you confirm it from the new address. Guest orders can be added to a new account if you sign up with the same email address within 90 days of the order. To delete your account, contact support; deletion is permanent and takes up to 30 days. Members of the free Trail Club earn 1 point per dollar spent, and 100 points equal a $5 reward.",
    },
    {
        "id": "order-tracking-v1",
        "text": "When your order ships, we email you a tracking number. Account holders also see order status under Orders in their account. For guest orders, use the Track Order page with your order number and email address. Tracking information can take up to 24 hours to appear after the shipping email. You can cancel or change an order within 1 hour of placing it; after that, it cannot be changed. If tracking shows no movement for 5 business days, contact support and we will open a trace with the carrier. If a package is marked delivered but you cannot find it, report it on the Track Order page within 7 days and we will file a claim with the carrier.",
    },
]
```

</details>

Let's embed and upload the documents to the knowledge base.

<details>
<summary>Code creating the knowledge base</summary>

```python
def create_knowledge_base(documents: list[Doc]) -> None:
    client.create_collection(
        KNOWLEDGE_BASE_COLLECTION,
        vectors_config=models.VectorParams(
            size=EMBEDDING_SIZE,
            distance=models.Distance.COSINE,
        ),
    )
    client.upsert(
        KNOWLEDGE_BASE_COLLECTION,
        points=[
            models.PointStruct(
                id=i,
                vector=embed(doc["text"]),
                payload={"doc_id": doc["id"], "text": doc["text"]},
            )
            for i, doc in enumerate(documents)
        ],
        wait=True,
    )


create_knowledge_base(DOCUMENTS)
```

</details>

Now let's build the "generation" part of RAG. Let's measure the pipeline's cost and latency, to check how the cache helps to save on both.

<details>
<summary>Vanilla RAG code, generation part</summary>

```python
import time

SYSTEM_PROMPT = (
    "You are a store support assistant. Answer in one or two sentences, "
    "using only the documents provided. If they do not contain the answer, say so."
)


class Answer(TypedDict):
    answer: str
    source_doc_ids: list[str]
    latency_s: float
    cost_usd: float


def rag_answer(question: str) -> Answer:
    start = time.perf_counter()

    hits = client.query_points(
        KNOWLEDGE_BASE_COLLECTION,
        query=embed(question),
        # Each document covers one policy; a second one helps questions that touch two policies.
        limit=2,
    ).points
    context = "\n\n".join(f"[{h.payload['doc_id']}]\n{h.payload['text']}" for h in hits)

    response = openrouter.chat.send(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Documents:\n{context}\n\nQuestion: {question}",
            },
        ],
        # The model spends hidden reasoning tokens before it writes the answer, so leave room for them.
        max_completion_tokens=2000,
    )

    return {
        "answer": response.choices[0].message.content.strip(),
        "source_doc_ids": [h.payload["doc_id"] for h in hits],
        "latency_s": time.perf_counter() - start,
        "cost_usd": response.usage.cost,
    }
```

</details>

Let's ask one question without any cache:

```python
result = rag_answer("Do I pay for return shipping when I return an item for a refund?")
print(result["answer"])
print(
    result["source_doc_ids"],
    f"{result['latency_s']:.2f} s",
    f"${result['cost_usd']:.6f}",
)
```

You'd see something like this:

```text
Yes. A $6.95 return shipping fee is deducted from your refund.
['returns-v1', 'payment-v1'] 2.72 s $0.000045
```

Now let's see how the cache can enter the picture.

## Create the Cache Collection

The cache implies a second collection. Each cached question is one point in this collection: the question's embedding is the vector, and the payload holds:

- `question`: the raw question that produced the answer.
- `answer`: the answer to serve.
- `source_doc_ids`: all knowledge-base documents the answer was built from.
- **[Optional]** `expires_at`: when the cached answer stops being valid, for example "2026-10-16T09:26:29+00:00".

Before any insert, we need to create payload indexes on the metadata fields we plan to use for filtering later (a payload index lets Qdrant filter on a metadata field without scanning every point, see [Indexing, Payload Index](/documentation/manage-data/indexing/#payload-index)).

We'll set them on the payload fields used in the optional [Keep Cached Answers Fresh](#keep-cached-answers-fresh) step.

```python
from datetime import timedelta


def create_cache() -> None:
    client.create_collection(
        CACHE_COLLECTION,
        vectors_config=models.VectorParams(
            size=EMBEDDING_SIZE,
            distance=models.Distance.COSINE,
        ),
    )
    # New Qdrant Cloud collections run in strict mode: filtering on a field without a payload index is rejected.
    client.create_payload_index(
        CACHE_COLLECTION, "source_doc_ids", models.PayloadSchemaType.KEYWORD, wait=True
    )
    client.create_payload_index(
        CACHE_COLLECTION, "expires_at", models.PayloadSchemaType.DATETIME, wait=True
    )


# Optional: how long a cached answer stays valid.
CACHE_TTL = timedelta(days=7)

create_cache()
```

Let's seed the cache with 20 questions.

<details>
<summary>The 20 seed questions</summary>

```python
SEED_QUESTIONS = [
    "How many days do I have to return an item?",
    "Can I return shoes I have worn outside?",
    "Do I pay for return shipping when I return an item for a refund?",
    "Can I get a refund for a sale item?",
    "How long does standard shipping take within the US?",
    "Is standard shipping within the US free on orders over $75?",
    "If I order before 2 p.m. Eastern Time on a business day, does it ship the same day?",
    "Who pays import duties on orders shipped to the European Union?",
    "Which payment methods do you accept?",
    "What currency am I charged in if I order from Canada?",
    "Can I combine two gift cards in one order?",
    "How long is the warranty on shoes?",
    "Does the warranty cover worn-down tread on hiking shoes?",
    "The zipper on my jacket broke 2 months after delivery. Can I still return it for a refund?",
    "How do I reset my password?",
    "Can I add a guest order to a new account?",
    "How many Trail Club points do I earn per dollar?",
    "When will I get a tracking number?",
    "How long do I have to cancel an order after placing it?",
    "What should I do if my package is marked delivered but I cannot find it?",
]
```

</details>

Let's save the answers from our vanilla RAG in the cache:

```python
import uuid
from datetime import datetime, timezone


def upsert(question: str, answer: str, source_doc_ids: list[str]) -> None:
    client.upsert(
        CACHE_COLLECTION,
        points=[
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=embed(question),
                payload={
                    "question": question,
                    "answer": answer,
                    "source_doc_ids": source_doc_ids,
                    # Optional: if cached answers never expire, leave this field out,
                    # and the expiry filter in cache_lookup() too.
                    "expires_at": (datetime.now(timezone.utc) + CACHE_TTL).isoformat(),
                },
            )
        ],
        wait=True,
    )


for question in SEED_QUESTIONS:
    result = rag_answer(question)
    upsert(question, result["answer"], result["source_doc_ids"])

print(client.count(CACHE_COLLECTION, exact=True).count)
```

## Set Up Cache Lookup

A cache lookup will search Qdrant for the closest cached question (`limit=1`) with its metadata.

- Without a predefined similarity threshold for our semantic cache, we'll always get something out of the collection as long as our cache is not empty.
- With a predefined one, a cached question that scores under the threshold is *"not similar enough"* => is not returned, so we get a signal that the question is new, and we need to search the main knowledge base.


```python
def cache_lookup(
    question: str, threshold: float | None = None
) -> models.ScoredPoint | None:
    points = client.query_points(
        CACHE_COLLECTION,
        query=embed(question),
        # Optional: skip cached answers that have expired.
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="expires_at",
                    range=models.DatetimeRange(gt=datetime.now(timezone.utc)),
                )
            ]
        ),
        limit=1,
        score_threshold=threshold,
    ).points
    return points[0] if points else None
```

Let's look up three new questions without a threshold:

```python
def show_closest(questions: list[str]) -> None:
    for question in questions:
        match = cache_lookup(question)
        print(f"{match.score:.4f}  {question}")
        print(f"        closest: {match.payload['question']}")


show_closest(
    [
        "Can I get a refund on a sale item?",
        "Who pays the import duties on orders shipped to the European Union?",
        "When is my card charged for an order?",
    ]
)
```

We'll get something like:

```text
0.9877  Can I get a refund on a sale item?
        closest: Can I get a refund for a sale item?
0.9922  Who pays the import duties on orders shipped to the European Union?
        closest: Who pays import duties on orders shipped to the European Union?
0.5605  When is my card charged for an order?
        closest: What currency am I charged in if I order from Canada?
```

The first two certainly could use a cached answer, while the third question was never asked. We can see by the similarity score that these examples are separable with the right threshold. How to find it?

### Calibrate the Threshold

To calibrate a threshold, you'd need a golden set for your data: incoming questions labeled with whether the cache should answer them.

You could build one based on your query logs: take questions that score close to each other and label whether they need the same answer. You could also generate questions with an LLM, as shown in [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/#generating-queries).

The more examples of each kind of question your users ask, the more you can trust the threshold.  

There is **no minimal number that fits every case**, but you can check what your golden set is able to prove. If the cache with the set threshold makes zero wrong hits on `n` real questions that should miss, sampled at random and not used to pick the threshold, you can only claim, with 95% confidence, that its wrong cache-hit rate on such questions is below about `3 / n` (the "rule of three", [Hanley and Lippman-Hand, 1983](https://pubmed.ncbi.nlm.nih.gov/6827763/)). For 15 such questions, that's 20%; to claim 1%, you need about 300.

> Don't reuse a cache semantic similarity threshold from another setup: it depends on the embedding model and on your questions.

For this tutorial, we built a synthetic golden set around the 20 cached questions. Cached questions get incoming questions that should be answered from the cache (exact repeats, light rewordings, and paraphrases) and questions that should not (related questions that need a different answer, and unrelated ones). 

<details>
<summary>An example of a synthetic golden set entry, simplified</summary>

```json
{
    "cached_question": "If I order before 2 p.m. Eastern Time on a business day, does it ship the same day?",
    "queries": [
        {
            "text": "If I place an order before 2 p.m. Eastern Time on a business day, will it ship the same day?",
            "label": "hit",
            "kind": "rewording"
        },
        {
            "text": "When I check out at 11 a.m. Eastern on a business day, does my package leave the warehouse that day?",
            "label": "hit",
            "kind": "paraphrase"
        },
        {
            "text": "If I order after 2 p.m. Eastern Time on a business day, does it ship the same day?",
            "label": "miss",
            "kind": "related"
        }
    ]
}
```

</details>

To choose a threshold, sweep it:

1. Split the golden set into three parts: "train", "val", and "test". Split by cached question, so that rewordings of one question never land in different parts.
2. On train, for every candidate value, count the correct and the wrong hits. Decide how many wrong hits you can accept. A miss costs one full RAG call; a wrong hit gives a user a wrong answer.
3. Check the threshold on val. If val shows wrong hits, pick again on train and val together.
4. Measure the final threshold once on test, and **don't change it afterward**.

<details>
<summary>How the sweep works, and what lower thresholds give</summary>

```text
# One cache lookup per question, without a threshold.
for each question in the part:
    closest[question] = cache_lookup(question)

# Trying a threshold is only counting, so a fine step of 0.01 costs nothing.
for each candidate threshold t in 0.50, 0.51, ..., 0.99:
    correct, wrong = 0, 0
    for each question in the part:
        if closest[question].score >= t:      # the cache would serve the closest answer
            if question should hit and closest[question] is its cached question:
                correct += 1
            else:
                wrong += 1
pick the t with the most correct hits among the ones with zero wrong hits
(if several t tie, take the middle one)
```

A lower threshold serves more questions, and more of them wrongly. On train + val:

| Threshold | Correct hits | Wrong hits |
| --- | --- | --- |
| 0.98 (chosen) | 7 / 21 | 0 |
| 0.95 | 10 / 21 | 1 |
| 0.90 | 11 / 21 | 1 |
| 0.80 | 13 / 21 | 4 |
| 0.70 | 16 / 21 | 4 |

</details>

The exact code, the golden set, and the split are in the [notebook](https://github.com/qdrant/examples/blob/master/semantic-cache/semantic_cache.ipynb). Replace the golden set with your own and rerun the sweep before you pick a threshold.

### Hard Hits vs Threshold

At a high threshold with zero wrong hits on our golden set, our cache deals with exact repeats and some light rewordings. That is useful, but could we do better? It'd be nice to also cover hard cases: paraphrases and questions that differ by one word and yet this word changes their meaning completely:

```python
show_closest(
    [
        "Is there a fee to send something back if I want my money back?",
        "If I order after 2 p.m. Eastern Time on a business day, does it ship the same day?",
    ]
)
```
gets the output

```text
0.6802  Is there a fee to send something back if I want my money back?
        closest: Do I pay for return shipping when I return an item for a refund?
0.9724  If I order after 2 p.m. Eastern Time on a business day, does it ship the same day?
        closest: If I order before 2 p.m. Eastern Time on a business day, does it ship the same day?
```

The first is a paraphrase that should get the cached answer but scores only 0.68. The second needs the opposite answer and scores 0.97, just under the threshold. A threshold low enough to serve the paraphrase would also serve the wrong answer to the second question, so a single threshold can't handle both. What to do?

Two ways from the top of our mind to go further:

- Add a second check for the questions the threshold isn't sure about, as in the optional [Jev step](#optional-resolve-hard-hits-with-jev).
- Fine-tune the embedding model on your own question pairs, so that questions with the same answer score close and questions with different answers score apart. See [Advanced Introduction to Triplet Loss](/articles/triplet-loss/).

### Optional: Resolve Hard Hits with Jev

The idea: keep the "sure" threshold from the previous step, and add a gray zone under it, where a second model (classifier, in our case Jev) double-checks the cache.

[Jev](https://docs.typesafe.ai/introduction) is a model by TypeSafe that answers questions about an input with probabilities instead of generated text. We give it the two questions and ask: "*Would the cached answer fully and correctly answer the new question?*" It returns the probability of "*yes*".

In `ask()` from the next step, the Jev check goes between the cache lookup and RAG:

```text
match = cache_lookup(question, threshold=GRAY_ZONE_THRESHOLD) 
if match and match.score >= THRESHOLD:
    serve the cached answer
elif match and jev_probability(match.question, question) >= CLASSIFIER_THRESHOLD:
    serve the cached answer
else:
    answer with RAG and store the answer in the cache
```

<details>
<summary>Where GRAY_ZONE_THRESHOLD and CLASSIFIER_THRESHOLD come from and examples</summary>

Both numbers come from train + val, like the main THRESHOLD:

- **GRAY_ZONE_THRESHOLD**, the lower edge of the gray zone, is the lowest score any question that should hit got against its own cached question, rounded down. Our golden set has no question that should hit under it, so a Jev call there would most likely be wasted.
- **CLASSIFIER_THRESHOLD**, the Jev threshold, comes from the same sweep as the cosine threshold, run on the questions in the gray zone. Several values can give zero wrong hits; take the middle of that range rather than its edge, to leave a margin for questions you haven't seen.

A few simple rules keep this from turning into a research project:

- **Reuse the split** you made for the main threshold: pick both new numbers on train, check them on val, and measure the whole pipeline once on test.
- **The gray zone needs enough questions.** The classifier threshold is picked only on questions that land there, so with a handful of them any value looks perfect.
- **Start without the classifier.** Add it once your logs show that many paraphrases miss the cache, and check it against the trade-off that follows.

Here's what Jev said on the two hard cases:

| New question | Cached question | Cosine | Jev | Decision |
| --- | --- | --- | --- | --- |
| "Is there a fee to send something back if I want my money back?" | "Do I pay for return shipping when I return an item for a refund?" | 0.6802 | 0.91 | Serve |
| "If I order after 2 p.m. Eastern Time on a business day, does it ship the same day?" | "If I order before 2 p.m. Eastern Time on a business day, does it ship the same day?" | 0.9724 | 0.04 | Send to RAG |

We call Jev through OpenRouter and pin the model version used for these results, `typesafe/jev-1.13-20260917`.

</details>

The code for this step is in the [notebook](https://github.com/qdrant/examples/blob/master/semantic-cache/semantic_cache.ipynb).

**The trade-off.** Jev pays off when the share of gray-zone questions that become hits is larger than the cost of a Jev call relative to a RAG call. In the notebook's runs, a Jev call cost about a third of a RAG call and took about a tenth of its time. Measure both on your own pipeline.

## Serve from the Cache

<figure class="semantic-cache-figure">
  <picture>
    <source media="(max-width: 600px)" srcset="/documentation/tutorials-build-essentials/semantic-cache/flow.mobile.svg" width="340" height="548">
    <img src="/documentation/tutorials-build-essentials/semantic-cache/flow.svg" alt="A question reaches the Qdrant cache lookup. A hit returns the stored answer without an LLM call. An optional Jev check can send a rejected hit to RAG. A miss retrieves policy documents from Qdrant, the LLM writes an answer, and the question and answer are stored before serving." width="1000" height="300" loading="lazy">
  </picture>
  <picture class="semantic-cache-figure__dark">
    <source media="(max-width: 600px)" srcset="/documentation/tutorials-build-essentials/semantic-cache/flow.mobile.dark.svg" width="340" height="548">
    <img class="semantic-cache-figure__dark" src="/documentation/tutorials-build-essentials/semantic-cache/flow.dark.svg" alt="A question reaches the Qdrant cache lookup. A hit returns the stored answer without an LLM call. An optional Jev check can send a rejected hit to RAG. A miss retrieves policy documents from Qdrant, the LLM writes an answer, and the question and answer are stored before serving." width="1000" height="300" loading="lazy">
  </picture>
  <figcaption>A hit serves the stored answer without an LLM call. A miss retrieves policy documents from Qdrant, generates an answer, and stores the question and answer.</figcaption>
</figure>

Let's put all of this together.

```python
THRESHOLD = 0.98

class Served(TypedDict):
    answer: str
    hit: bool
    latency_s: float
    cost_usd: float


def ask(question: str) -> Served:
    start = time.perf_counter()

    # With the optional Jev check, look up with GRAY_ZONE_THRESHOLD and send scores under THRESHOLD to Jev.
    match = cache_lookup(question, THRESHOLD)
    if match:
        return {
            "answer": match.payload["answer"],
            "hit": True,
            "latency_s": time.perf_counter() - start,
            # No LLM call; the optional Jev check would add its cost here.
            "cost_usd": 0.0,
        }

    result = rag_answer(question)
    # Store the new answer, so the next similar question is a cache hit.
    upsert(question, result["answer"], result["source_doc_ids"])
    return {
        "answer": result["answer"],
        "hit": False,
        "latency_s": time.perf_counter() - start,
        "cost_usd": result["cost_usd"],
    }
```

Let's test the cache: ask a question it hasn't seen, then the same question in other words.

```python
for question in [
    "When is my card charged for an order?",
    "When is my card charged for my order?",
]:
    result = ask(question)
    print(
        "cache hit " if result["hit"] else "cache miss",
        f"{result['latency_s']:.2f} s",
        f"${result['cost_usd']:.6f}",
    )
    print("    ", result["answer"])
```

You'd see something like this:

```text
cache miss 3.16 s $0.000044
     Your card is charged when your order ships, not when you place it.
cache hit  0.42 s $0.000000
     Your card is charged when your order ships, not when you place it.
```

The first question goes through RAG, and its answer lands in the cache. The second one is answered from the cache.

- A hit skips the LLM call; it still pays for embedding the question, but it's a fraction of a cent (plus a Jev call, if you add the optional check).
- A miss pays for the lookup and the store on top of RAG, so the cache saves time only when enough of your traffic repeats. Check the hit rate on your own query logs.

## Keep Cached Answers Fresh

This step is optional, consider it if in your use case a cached answer goes stale, when it gets old, or when the document behind it changes.

<details>
<summary>Expire old answers and invalidate answers when a document changes</summary>

- **It gets old.** The lookup already skips answers past `expires_at`. To free space, delete them periodically, for example from a scheduled job.
- **The document behind it changes.** Update the document in the knowledge base first, then delete every cached answer built from the old version. The next question about it misses the cache and gets a fresh answer from RAG.

```text
every hour:
    delete from cache where expires_at <= now

when a document changes (old_doc_id, new_document):
    update the document in the knowledge base
    delete from cache where source_doc_ids contains old_doc_id
```

> To keep the knowledge base itself in sync with changing documents, see [Incremental Embedding Updates](/documentation/tutorials-operations/incremental-embedding-updates/).

</details>

## Conclusion

We put a semantic cache in front of a RAG pipeline: a Qdrant collection of past questions and their answers, looked up before every RAG call.

The key takeaways:

- **The threshold decides what the cache serves.** It depends on your embedding model and your questions, so calibrate it on your own golden set split into train, val, and test, and never reuse one from another setup.
- **A safe threshold catches only near-repeats.** Paraphrases can score low, and one-word changes can score high. A second check in the gray zone with a classifier can catch more.
- **The threshold needs maintenance.** Tune it again whenever the embedding model or the kinds of questions users ask change. In between, sample served cache hits from your logs and check them for wrong answers.
