---
title: Reranking Most Recent Results
weight: 18
---
# Reranking Most Recent Results
One of the most impactful advancements in modern recommendation systems is the ability to prioritize recency, a feature especially valuable in e-commerce. Shoppers often want to see the latest customer reviews, especially for fast-moving products like fashion items, electronics, or beauty products. Until recently, systems would only rank products based on static similarity scores like cosine distance. This meant platforms had to fetch and manually sort reviews based on timestamp, an inefficient and delayed process.

Now, with dynamic scoring methods, the similarity score can blend both vector similarity and freshness, ranking reviews or products not just by relevance but also by how recent they are. For example, instead of only retrieving reviews with high keyword overlap, your system can now prioritize a 5-star review posted yesterday over an equally relevant one from 2015. This makes the ranking more responsive, personalized, and context-aware, helping customers trust what they’re reading and decide faster.

In this example, you will discover how to perform time-based boosting using Qdrant. 

## Install Qdrant Client
```bsh
pip install qdrant-client datasets
```

## Initialize the Client
Initialize the [Qdrant client](/documentation/quickstart/) locally. 

{{< code-snippet path="/documentation/headless/snippets/time-based-boosting/initialize-client/" >}}

## Create Collection 
Qdrant organizes data into [collections](/documentation/concepts/collections/), which store both [vectors](/documentation/concepts/vectors/) and their associated metadata. When creating a collection, you must define the vector configuration parameters in advance.

{{< code-snippet path="/documentation/headless/snippets/time-based-boosting/create-collection/" >}}

## Insert Vectors With Timestamp Payload 
Now you can add sample documents, their associated metadata, and a point id for each.

Here’s a sample of the [Amazon Beauty Reviews](https://huggingface.co/datasets/jhan21/amazon-beauty-reviews-dataset) dataset:

| rating | title                                        | text                                                              | asin  | parent_asin | user_id                         | helpful_vote | verified_purchase | ts                      |
|--------|----------------------------------------------|-------------------------------------------------------------------|-------|--------------|----------------------------------|---------------|--------------------|--------------------------|
| 5      | Feels so refreshing!                        | These are so nice and easy to apply. You insta...                 | B07   | B07          | AEX                             | 0             | False              | 2019-09-15 01:25:31.475 |
| 5      | VERY nice, seems to be working, and a little g... | Having used this for 2 months now I really am ...       | B00   | B00          | AFB                             | 0             | True               | 2017-07-28 18:58:51.369 |
| 5      | Truly Seamless, works well on wet and dry hair | WOW a comb that is truly smooth and seam-free,...         | B00A  | B00          | AFB                             | 0             | True               | 2015-01-17 21:43:57.000 |


We won’t ingest all the entries from the dataset, but for demo purposes, just take the first two thousand:

{{< code-snippet path="/documentation/headless/snippets/time-based-boosting/insert-vectors/" >}}

## Query With No Recency 
Here, you will search for some reviews without any recency filtering. 

{{< code-snippet path="/documentation/headless/snippets/time-based-boosting/query-without-recency/" >}}

Here's a sample output: 

```markdown
points=[ScoredPoint(id='55eadc68-f78c-4eb5-9061-780ec62b49fa', version=335, 
score=0.5265173, payload={'rating': 5, 'title': 'Clean hair for hairdresser', 
'text': 'Hair for hairdresser', 'asin': 'B07D487TV7', 'parent_asin': 'B07D487TV7', 
'user_id': 'AFQIVYHWA34H6K3JDVAOYOXH534Q', 'timestamp': '2019-12-28 23:56:02.592', 
'helpful_vote': 0, 'verified_purchase': True, 'ts': '2019-12-28T23:56:02.592000'},
.... vector=None, shard_key=None, order_value=None), 
ScoredPoint(id='4a1c06cf-8dd8-4ed4-865b-4c3b7e07e39b', 
 'asin': 'B07VGBBNTH', 'parent_asin': 'B07VGBBNTH', 'user_id': 
 'AG73BVBKUOH22USSFJA5ZWL7AKXA', 'timestamp': '2020-03-08 22:51:26.757', 
 'helpful_vote': 0, 'verified_purchase': False, 'ts': 
 '2020-03-08T22:51:26.757000'}, vector=None, shard_key=None, order_value=None)]
```

## Query With Time-based Boosting 
Now, let's search by boosting the reviews within one week of the provided center date using a [Score-Boosting Reranker](/documentation/concepts/hybrid-queries/#score-boosting).

{{< code-snippet path="/documentation/headless/snippets/time-based-boosting/query-with-recency/" >}}

The semantic search engine will retrieve the most similar results while boosting the most similar results.

```markdown

points=[ScoredPoint(id='55eadc68-f78c-4eb5-9061-780ec62b49fa', version=335, 
score=0.5265173, payload={'rating': 5, 'title': 'Clean hair for hairdresser', 
'text': 'Hair for hairdresser', 'asin': 'B07D487TV7', 'parent_asin': 'B07D487TV7',
 'user_id': 'AFQIVYHWA34H6K3JDVAOYOXH534Q', 'timestamp': '2019-12-28 23:56:02.592', 
 'helpful_vote': 0, 'verified_purchase': True, 'ts': '2019-12-28T23:56:02.592000'},
 ... , 'asin': 'B07VGBBNTH', 'parent_asin': 'B07VGBBNTH', 
 'user_id': 'AG73BVBKUOH22USSFJA5ZWL7AKXA', 'timestamp': 
 '2020-03-08 22:51:26.757', 'helpful_vote': 0, 'verified_purchase': False,
 'ts': '2020-03-08T22:51:26.757000'}, vector=None, shard_key=None, order_value=None)]
```