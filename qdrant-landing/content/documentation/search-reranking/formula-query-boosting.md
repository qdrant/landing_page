---
title: "Boost Marketplace Search with Formula Queries"
short_description: "Mix popularity, price, stock, and freshness into your ranking, and size each weight so it doesn't wreck relevance."
description: "Boost search results with Qdrant formula queries: size the weights, choose between filters and boosts, and see what each boost costs in relevance on a product search dataset."
weight: 110
author: Clelia Bertelli
date: 2026-11-23T00:00:00+00:00
draft: false
keywords:
  - formula query
  - score boosting
  - ecommerce search
  - reranking
  - search relevance
guide_series: true
---

# Boost Marketplace Search with Formula Queries

A shopper types "white sofa" into your marketplace, and vector search returns the sofas that best match the query. Your merchandising team wants more than a good match: sofas in stock should rank first, well-reviewed sofas should rank ahead of unreviewed ones, and the shopper's budget should be respected.

Reranking models and, in general, application logic for reranking, spend a good chunk of effort on sorting and putting current, in-stock, in-budget products first. Qdrant's [formula queries](/documentation/search/search-relevance/#score-boosting) do the same sorting inside the query, without any model inference or need for custom glue code. A formula query rescores each candidate in a pool by adding payload fields, such as review counts or stock, to the candidate's similarity score. Formula queries are therefore the first ranking stage to try, and this first part of the series covers them.

Writing a formula might just take you a few minutes, but choosing its weights takes measurement: a weight that is too small changes nothing, and a weight that is too large lets a popular sofa that does not match the query beat the right sofa. We ran seven experiments on a real product search dataset to measure three things: the boost size at which relevance starts to drop, the signals that work better as filters than as boosts, and the effect of boosting a signal that predicts relevance poorly.

{{< island path="content/documentation/headless/search-reranking/formula-query" ratio="1200 / 420" title="A formula query rescores the candidates of a prefetch by adding boosts from payload fields to each similarity score, so a popular, in-stock product can move ahead of a closer match that is out of stock. The scores are illustrative." >}}
![A prefetch returns 100 candidates with similarity scores, and a formula that reads payload fields for popularity and stock adds a boost to each score. In the ranked list, the Leather sofa scores 1.00 and moves to first, the Velvet loveseat scores 0.98, the out-of-stock Linen 3-seater falls from first to third at 0.88, and the Sectional scores 0.86.](/docs/search-reranking/formula-query.svg)
{{< /island >}}

## How We Tested

We used [WANDS](https://github.com/wayfair/wands), Wayfair's product search dataset, which has 42,994 products and 480 queries with human relevance labels (Exact, Partial, Irrelevant). Search ran on Qdrant Cloud 1.20.2 with `mxbai-embed-large-v1` dense vectors, SPLADE sparse vectors, and reciprocal rank fusion (RRF). WANDS includes review counts and ratings but no price, stock, or dates, so we generated those three signals with a fixed seed.

We measure relevance with nDCG@10, a score from 0 to 1 that rises when the products humans labeled best appear near the top of the 10 results. Without any boost, nDCG@10 is about 0.70 on our data. The [`qdrant-labs/formula-query-boosting-bench` repository](https://github.com/qdrant-labs/formula-query-boosting-bench) contains all the code and raw results.

## A Practical Example

Every query in this guide has the same shape: dense and sparse retrieval each fetch 100 candidates, RRF merges the two lists, and a formula rescores the merged pool before Qdrant returns the top 10:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="<YOUR_QDRANT_CLOUD_URL>", api_key="<YOUR_API_KEY>")  # use your cluster URL

SPREAD: float = 0.64  # the scale of the fused scores, derived in the next section


def search(
    dense_vector: list[float], sparse_vector: models.SparseVector
) -> list[models.ScoredPoint]:
    return client.query_points(
        collection_name="products",
        prefetch=models.Prefetch(
            prefetch=[
                models.Prefetch(query=dense_vector, using="dense", limit=100),
                models.Prefetch(query=sparse_vector, using="sparse", limit=100),
            ],
            query=models.RrfQuery(rrf=models.Rrf(k=2)),
            limit=100,
        ),
        query=models.FormulaQuery(
            formula=models.SumExpression(
                sum=[
                    "$score",  # the fused similarity score
                    models.MultExpression(mult=[0.2 * SPREAD, "pop_norm"]),
                ]
            ),
            defaults={"pop_norm": 0.0},  # products without reviews
        ),
        limit=10,
    ).points
```

The final score of each candidate is its similarity score plus a popularity term (which derives from the payload field `pop_norm`, holding a popularity value between 0 and 1). The `defaults` parameter gives products without a `pop_norm` value a fallback of 0.0, so a missing field cannot silently break the score. The [documentation](/documentation/search/search-relevance/#score-boosting) lists every expression that a formula can use, including conditions, decay functions, and geo distance.

But what is `SPREAD`? Let's take a look at how we derive it from the data in the next section.

## Don't Leave Your Weights Unscaled

A formula adds numbers to `$score`, so a boost only has an effect when it is comparable to the gaps between scores. Those gaps depend on the retrieval method: across our 480 queries, the cosine scores of a dense-only search have a gap of about 0.12 between the first to the hundredth candidat, while, with RRF (using `k=2`, Qdrant's default), the score gap over the same ranks is about 0.64.

Let's consider a popularity boost with a raw weight of 0.2: on the dense-only search, a weight of 0.2 exceeds the entire gap between rank 1 and rank 100, so a very popular product can jump past every other candidate, even if irrelevant. On the hybrid search, the same weight of 0.2 only moves products that were already close together. The results confirm this: with the raw weight, nDCG on the dense-only search fell from 0.70 to 0.65 at a weight of 0.2, while nDCG on the hybrid search barely changed.

{{< chart id="formula-boosting/weight-scale" caption="nDCG@10 as the boost weight grows, for dense-only and hybrid search. A raw weight breaks dense-only search at a weight where hybrid search still works, and multiplying the weight by the spread of the candidate scores gives both searches the same behavior." >}}

So, in order to avoid drastic side effects, a weight must match the scale of the scores from the retrieval pipeline. To find the scaling factor, we measure the spread of our own scores once and multiply every weight by that spread. The following function measures the spread on a sample of real queries:

```python
from typing import NamedTuple


class Query(NamedTuple):
    dense: list[float]
    sparse: models.SparseVector


def measure_spread(queries: list[Query]) -> float:
    gaps: list[float] = []
    for query in queries:  # a sample of real queries
        points = client.query_points(
            collection_name="products",
            prefetch=[
                models.Prefetch(query=query.dense, using="dense", limit=100),
                models.Prefetch(query=query.sparse, using="sparse", limit=100),
            ],
            query=models.RrfQuery(rrf=models.Rrf(k=2)),
            limit=100,
        ).points
        gaps.append(points[0].score - points[-1].score)  # rank 1 minus rank 100
    return sum(gaps) / len(gaps)
```

After we multiplied the weights by the spread, a multiplier of 0.2 changed nDCG by an amount we could not distinguish from noise on either search, and a multiplier of 0.5 cost less than 0.01 nDCG. A multiplier between 0.1 and 0.2 is therefore a reasonable starting point, and the same multiplier now behaves the same way with either retriever. You should measure the spread again whenever you change the embedding model, the fusion method, or `k`, because all three change the spread.

## Normalize the Signal, Then Cap It

Review counts have a long tail: most products have a handful of reviews and a few have thousands. A formula that uses raw counts lets those few products dominate every query, so, to avoid this, we normalized popularity at indexing time with `ln(1 + reviews) / ln(1 + max_reviews)`. The normalization places popularity between 0 and 1 and makes the gap between 10 and 1,000 reviews count for more than the gap between 1,000 and 2,000.

While normalization did most of the work, we also tested a cap, which limits the gain that any single product can receive from a signal. We set the cap to one full spread:

```python
capped_popularity: models.MinExpression = models.MinExpression(
    min=[
        SPREAD,  # no product gains more than this from popularity
        models.MultExpression(mult=[2 * SPREAD, "pop_norm"]),
    ]
)
```

{{< chart id="formula-boosting/popularity-cap" caption="The share of the top 10 filled by the 5% most popular products, and nDCG@10, as the popularity weight grows, with and without the cap. The two lines differ only at a multiplier of 2." >}}

A cap has no effect at normal weights, because a normalized signal never reaches it, and a cap matters only at extreme weights. With a multiplier of 2, the uncapped boost filled 32% of the top 10 slots with the 5% most popular products (they fill 3.5% without a boost), and nDCG dropped to 0.57. With the cap, the 5% most popular products filled 17% of the slots, and nDCG was 0.61. The cap improves both numbers, but a cap mainly protects against signals that can spike, such as raw view counts, and a large weight stays risky with a cap in place. The `min` expression requires Qdrant 1.19.1 or later.

## Hard Filters, Soft Boosts

A constraint can work as a filter, which removes non-matching products from the results, or as a boost, which keeps every product and ranks matching products higher. A filter fits constraints where showing a violating product is a mistake, and a boost fits constraints where a violating product is merely less welcome.

The following table assigns common marketplace constraints to a filter or a boost:

| Constraint | Use | Reason |
| --- | --- | --- |
| Ships to the shopper's country | Filter | A product that cannot be delivered is a mistake in the results |
| Size, age limit, or compliance rule | Filter | A product that breaks the rule is a mistake in the results |
| Price range | Boost | A product slightly outside the range can still be the right product |
| Brand or color preference | Boost | A product without the preference can still match the query |
| In stock | Boost | A shopper who searches for an out-of-stock product still needs to find it |
| Recently added | Boost | An older product can still match the query |

A boost for a price range multiplies a range condition by a weight, so products inside the range receive the boost and products outside it do not:

```python
price_boost: models.MultExpression = models.MultExpression(
    mult=[
        0.2 * SPREAD,
        models.FieldCondition(key="price", range=models.Range(gte=120, lte=400)),
    ]
)
```

The following chart shows what are the consequences of each choice. A filter guarantees that every returned product satisfies the constraint, so the filter line stays at 100%. A boost raises the share of satisfying products as the multiplier grows. The boost for stock reaches the filter's level at a high multiplier, and the boost for price stays below the filter's level at every multiplier.

{{< chart id="formula-boosting/filter-vs-boost-share" caption="The share of the top 10 that satisfies the constraint, for a boost by weight multiplier and for a filter, which has no weight and stays at 100%." >}}

Of course, as for everything in computer science, we have tradeoffs: strictness costs recall. A filter lowers relevance for a price range, and the cost stays the same at every multiplier because a filter has no weight. A boost costs almost nothing at small multipliers, and its cost grows with the multiplier. Stock follows the same pattern on a much smaller scale, because availability has nothing to do with the meaning of a query.

{{< chart id="formula-boosting/filter-vs-boost" caption="Change in nDCG@10 for a boost, by weight multiplier, and for a filter, which has no weight and stays flat. Both the price range and the stock status are unrelated to relevance in this data." >}}

Start a boost at a multiplier of 0.2 and raise the multiplier only while relevance holds. In the chart of relevance cost, the boost lines stay near zero at small multipliers and drop at large ones.

It is also important to note that a filter has a failure mode that a boost lacks: a narrow filter can leave fewer candidates than a results page needs. In our run, the price filter returned fewer than 10 products for 52 of 379 queries. In production settings, you should try your most selective filter on real queries and count the results: if they're not enough to fill a page and you can allow for some looseness, you should consider using boosts instead.

Put each filter in the prefetches, so that the 100 candidates already satisfy it. The following function builds a dense prefetch that keeps only products that ship to a country, and the sparse prefetch needs the same filter:

```python
def shippable_prefetch(dense_vector: list[float], country: str) -> models.Prefetch:
    ships_to_country = models.Filter(
        must=[
            models.FieldCondition(
                key="ships_to", match=models.MatchValue(value=country)
            )
        ]
    )
    return models.Prefetch(
        query=dense_vector, using="dense", filter=ships_to_country, limit=100
    )
```

## Good Relevance Signal, Good Boost

### Personalization

Price and stock are facts about a product, while personalization and freshness are more of bets: boosting the shopper's favorite color or boosting recently added products assumes that the shopper wants those products. 

For personalization, we boosted products that share the shopper's favorite attribute, such as color or material. We generated shopper profiles at three strengths: unrelated to the query's relevant products, half of the profiles related, and all profiles related. The formula and the weights stayed the same in all three runs.

{{< chart id="formula-boosting/signal-quality" caption="Change in nDCG@10 when boosting the shopper's favorite attribute, by weight multiplier. An unrelated signal only lowers relevance, and a closely related signal raises relevance at every weight." >}}

With an unrelated signal, a multiplier of 0.1 had no visible effect, a multiplier of 0.2 lowered nDCG by 0.006, and a multiplier of 2 lowered nDCG from 0.74 to 0.59. With a closely related signal, nDCG rose by 0.015 at a multiplier of 0.1 and by 0.037 at a multiplier of 1. With a weakly related signal, nDCG showed no clear gain up to a multiplier of 0.2 and fell from a multiplier of 0.5.

The business metric rose in all three cases while relevance did not. The share of top-10 products with the favorite attribute doubled at a multiplier of 0.2, from 14% to 28%, even with the unrelated signal. A rising business metric therefore shows only that the formula executes as written. Only a relevance measurement _and_ a business metric test can show that shoppers are being served _correct_ and _relevant_ results.

### Freshness

A freshness boost gives the largest bonus to products added today and shrinks that bonus as products age. The fade length sets how fast the bonus shrinks: a short fade rewards only the newest products, while a long fade spreads the bonus over products added in the last several months.

In our data, new products were more likely to be relevant, and a freshness boost still improved relevance only slightly. The boost did fill the top 10 with more new products, so it changes which products shoppers see more than it improves the match with their query. A long fade is the safer choice when you raise the weight, because the chart shows that long fades lose less relevance than short fades.

{{< chart id="formula-boosting/freshness-fade" caption="Change in nDCG@10 when boosting recently added products, by weight multiplier, for four fade lengths. New products are more likely to be relevant in this data, and slower fades lose less relevance at large weights." >}}

Keep personalization and freshness boosts at a multiplier of 0.2 or lower until your own data shows that the signal predicts relevance, and measure relevance before raising the multiplier further.

## More Candidates ≠ Better Results

A formula reorders only the candidates that the prefetch returns. We ran the same boost, with a multiplier of 0.2, over pools of 50, 100, 200, and 500 candidates. nDCG changed by less than 0.003, and the share of matching products in the top 10 changed by less than 0.01. At modest weights, a boost reorders products that were already close in score, so a product that retrieval ranks 300th has little-to-no chance of reaching the top 10.

{{< chart id="formula-boosting/candidate-pool" caption="nDCG@10 and the share of the top 10 that matches the shopper, for pools of 50 to 500 candidates at a multiplier of 0.2. Both lines stay flat as the pool grows, for an unrelated and for a closely related profile signal." >}}

Two consequences follow: a pool of 100 candidates is enough for a top 10 at the recommended weights, and a bigger pool does not repair a boost that performs badly. When an important product never appears, check retrieval and filters before the formula, and see the [candidate depth guide](/documentation/search-tuning/candidate-depth/) for choosing how many candidates to fetch. You also have to keep in mind that a larger pool of candidates means increased latency, so you should measure that before changing the size of the pool.

## What to Ship

For a marketplace, we would start with these steps:

1. Normalize every signal to a range between 0 and 1 at indexing time, using a log for counts, and pass `defaults` for every payload field the formula reads.
2. Measure the spread of the candidate scores on a sample of real queries, and write each weight as a multiplier times that spread.
3. Start every soft boost at a multiplier between 0.1 and 0.2, and cap any signal that can spike.
4. Use filters only for what must hold, and put them in the prefetches.
5. Index the payload fields the formula reads, and evaluate with your own relevance labels and/or an A/B test before raising a multiplier past 0.2.

Keep in mind that our benchmark ran on a small-to-medium-size dataset, with 480 queries and synthetic prices, shopper profiles and dates that we could modify to experiment with relevance signals: real data are most likely messier and more difficult to cleanly correlate with relevance, so we encourage you to run your own benchmarks.

## What to Tune Next

To try the weights on your own catalog, run the [benchmark code](https://github.com/qdrant-labs/formula-query-boosting-bench) against any Qdrant Cloud cluster. The [relevance documentation](/documentation/search/search-relevance/) covers every expression, and the post on [decay functions](/blog/decay-functions/) goes deeper on freshness and distance boosts.

After the formula is tuned, test a reranker against your best first stage before paying for one, using the guide [When Is a Reranker Worth It?](/documentation/search-tuning/when-a-reranker-is-worth-it/). If the products you want never reach the candidate pool, revisit [candidate depth](/documentation/search-tuning/candidate-depth/).
