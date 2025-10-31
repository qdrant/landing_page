---
title: "Relevance Feedback in Qdrant"
short_description: "The story behind the vector search-native relevance feedback feature, available since 1.17.0, which increases the relevance of search results universally, cheaply, and at scale."
description: "The story behind the vector search-native relevance feedback feature, available since 1.17.0, which increases the relevance of search results universally, cheaply, and at scale."
social_preview_image: /articles_data/relevance-feedback/preview/social_preview.jpg
preview_dir: /articles_data/relevance-feedback/preview
weight: -170
author: Evgeniya Sukhodolskaya
date: 2025-10-31T00:00:00+03:00
draft: false
keywords:
  - search relevance
  - reranking
  - query rewriting
  - relevance
category: machine-learning
---

This March, we dropped a statement-bomb in the “[Relevance Feedback in Information Retrieval](https://qdrant.tech/articles/search-feedback-loop/)” article and then went silent.

We claimed that even though the information retrieval research field has proposed many useful mechanisms for increasing the relevance of search results, none of them made it to the neural search industry, simply because these approaches are not scalable.

Certainly, there are methods widely used to improve the relevance of retrieved results: query rewriting, for example. Yet none of the vector search solutions out there have tried to use the possibilities that come with full access to the vector search index: traversing it in the direction of relevance, instead of guessing where to shoot the query to the vector space.

To break this vector-search-native tools silence, we’re introducing FeedbackQuery <TBD link to release> — a universal, cheap and scalable method for improving the relevance recall of your search results.

## Vector Search Optimization

In vector search, like in any field, you’re always trading off speed, cost, and quality on the way to production. Everyone needs instruments to tune that balance for their use case, like [vector quantization](https://qdrant.tech/articles/what-is-vector-quantization/) to lower costs or [reranking](https://qdrant.tech/documentation/search-precision/reranking-semantic-search/) to increase relevance.

For those instruments to work (and to stick in industry), they have to be **universal**, **native to the stack**, and **reasonable**. 

> “Reasonable” means optimizing one side of the speed–cost–quality triangle **without** tanking the other two.

At scale, neural search is usually limited to fairly simple dense encoders (embeddings up to a few thousand dimensions), as running large models to sift through billions of data points is, well, unreasonable.

So most search quality-boosting tools aim to adjust/align/guide these simple retrievers. The guidance can come from the search user or a domain expert: rescoring via business-logic-based rules, reranking with a learned-to-rank model, and using **relevance feedback** mechanisms.

### What is Relevance Feedback

**Relevance feedback** distills signals from current search results into the next retrieval iteration to surface more relevant documents.

It can be provided by a human or a model, be binary (relevant–irrelevant) or gradual – rescore top documents by their relative relevance to the query. 

Based on this feedback, one of the retrieval components is adjusted: the query or the scoring method between the query and documents. The next retrieval iteration is done with this aligned component.

> For a detailed taxonomy with various methods in the field, check out our overview article “[Relevance Feedback in Information Retrieval](https://qdrant.tech/articles/search-feedback-loop/)”.

Relevance-feedback-based methods are a standard in full-text search, some of them proposed more than 50 years ago.

Yet it feels like, when it comes to modern vector search, users have to reinvent the relevance feedback wheel due to the lack of universal interfaces: prompt an agent to rewrite queries in endless costly loops, do heuristics-based vector math and fine-tune models per request on the client side… Simply put, “struggle”.

### Tools of a Vector Search Engine

The goal is to fill this gap and let users get a proper relevance feedback interface to use in our vector search engine.

So what makes a method a production-ready for vector search?

#### ...Should be Cheap

Since the 2+ retrieval steps already add to the search latency, we cannot afford to spend much time or money on gathering feedback. That means:

**Small context limit**  
The set of documents we pass to a **feedback model** should be extremely small. It is rarely affordable to run an LLM, use a cross encoder, or fine tune a machine learning model on hundreds of documents per request.

> A **feedback model** here is anything – agent, ML model, formula, … – that’s capable of providing (numerical) information on how relevant the retrieved document is to the query. 

We should already improve recall with that small sample. We can’t afford having the whole dataset as a feedback context for an agent.

**Automated**  
You might have noticed that we wrote "a feedback **model**". Humans are known to be the laziest at providing feedback, so the search feedback loop must run on its own.

**No labeling required**  
Methods which require many labels or domain expert input are hard to adopt. The feedback model should be easy to train, and data self-supervised.

#### ...Should be Universal

**For every type of data**  
Vector search is attractive because it is agnostic to the data type: images, video, audio… Not only text. Vector search native tools should be the same, operating on vectors without minding their nature. That is why query rewriting as reformulating text won’t suffice.

**For every type of signal**  
Some relevance feedback methods depend on clean feedback signals: strictly relevant or irrelevant documents.   
In real life, especially when we need relevance boosting, results returned to a request could be, for example, *meh* and *more meh*. Ideally, the method should be able to use the noisy signals.

## Our Idea

Usually neither LLMs nor subject matter experts providing feedback know the dataset’s exact shape or the vector space it spans. For that they would need to process a large subset of stored vectors.

What they can do is help define a relevance direction from the examples they have seen. A retriever could then use these direction hints on the next retrieval iteration.

### Relevance Direction

{{< figure src="/articles_data/relevance-feedback/lost_astronaut.png" alt="An astronaut lost in the forest" >}}

Imagine a hiker lost in a forest with a weak phone signal. They still manage to send a couple of quick photos to a friend who knows orienteering. 

The friend does not have a map of the whole forest or a live view of every tree. Still, they try to help and reply:

- *“Better go away from anything looking like this plant. It might signal that a swamp is near.”*  
- *“I see moss on this tree. Moss grows on the north side. If you keep north you might find a way out.”*

Now the hiker has extra knowledge to choose a path, comparing the landscape around them to the photos and applying the direction hints from their experienced friend.

Read this as vector search. 

1. The forest is a **vector space**.   
2. The hiker is a **retriever model.**   
3. The brilliant friend is a **feedback model**.   
4. The photos are the **context**, **limited** to the amount we can afford to use for feedback.

And the hiker’s new “where-should-I-go” decisions based on the acquired information are **feedback-based** (forest path) **scoring**.

### Using Entire Vector Space

So the idea is to use feedback to define a more relevant direction (**closer** to this, **further** from that) within the vector space spanned by the dataset. 

That implies warping the notion of "closer" and "further" – the distance (or similarity) **scoring metric** used during the retrieval.

Tweaking the relevance scoring formula based on the feedback model’s signal is nothing revolutionary. What changes is that this feedback-based scoring is used during the traversal of the **entire** dataset used by the vector search engine, not just a subset of results.

### Sketch of the Approach

So, our idea can roughly be sketched like this:

1. **Initial retrieval.** We want to optimize it because the top results could be more relevant.

2. **Get feedback.** A good choice is granular judgments: pointwise scores between the query and the top retrieved documents from step one. Granular judgments are more helpful for defining **relevance direction** when results are not strictly relevant or irrelevant.

> A **context limit** is how many top documents from the initial retrieval the feedback model scores. We want to keep it as small as possible to **save time and resources**.

3. Extract the signal from the feedback and propagate it into a new scoring formula.

4. Use this new feedback-based scoring formula in the next retrieval iteration with the same query on the whole dataset of documents (when traversing vector index in the **direction of relevance**).

## Dissecting Feedback

Let’s think about how a very small amount of feedback can be used the **most effectively**.

### Direction’s Delta 

If we show only one document to the feedback model, it is hard for it to say whether it is already a good match. Perhaps there are no relevant matches in the dataset at all.

With two documents, this model could already judge which one is closer to what the user expects. Feedback then could be a **context pair** of (more) **positive** and (more) **negative** examples-documents.

> A **context pair (positive, negative)** is two documents from the top context limit results of the initial retrieval. The positive received a higher relevance-to-query score from the feedback model, and the negative received a lower score.

Then, if the retriever favors, by some **delta,** a document closer to the negative example, it has chosen the wrong direction in the vector space and should change it.

<TBD IMAGE WITH DELTA>

### Feedback’s Confidence

Two documents nearly indistinguishable from a perspective of a feedback model give far less information than a context pair with one clearly more relevant document; the latter helps to enforce a direction of relevance.

When documents in the context pair seem different to the feedback model, it is more **confident** to guide the retriever.

<TBD IMAGE WITH CONFIDENCE>

## Feedback-based Scoring

With the context pair(s) at our expense, we can try the following feedback-based scoring:

1. Let the retriever still have a say in what is relevant to the query.  
2. Yet reward candidates that are closer to the positive element of the context pair.  
3. Especially when the feedback model was confident in this pair.

We need to combine signals in a reasonable, simple fashion, using as few parameters as we can.

> We need trainable parameters in the feedback-based scoring formula because relevance score distributions likely vary by dataset, retriever, and feedback model.

Usually what helps is looking at edge cases.

### The Math of Edge Cases

**Direction’s delta is zero**  
If the retriever sees the positive and the negative documents (from the context pair) as equally similar to the candidate document, there’s no direction to choose.

**Feedback’s confidence is zero.**  
If, from the feedback model’s perspective, both documents in a context pair are identical to the query, there’s, once again, no information on direction of more relevance.

In both cases the final formula should rely on the retriever's judgment, as opposed to a situation when feedback signals are strong. 

One of the options to express this behaviour is through a weighted sum of retriever and feedback’s model signals.

### Naive Formula

Applying the math of edge cases and the idea that confidence and delta signals should play their individual role in the scoring, we came up with this three-parameter formula.

$$
F = a \cdot \text{score} + \text{confidence}^{b} \cdot c \cdot \text{delta}
$$

It computes the score between the query and a document-candidate on the retrieval iteration after feedback. 

>  Is this formula the only option? Absolutely not! We’ve tried three others in experiments, and this one was the simplest working one. In future releases we even plan to allow providing custom formulas!

{{< figure src="/articles_data/relevance-feedback/rel_feedback_scoring.png" alt="All components of feedback-based scoring formula" >}}

`score`

$\text{score}_\text{retriever}(\text{query}, \text{candidate document})$

|||
|---|---|
| What does it mean? | A similarity score between the query and the candidate embedding generated by the retriever model. For example, cosine similarity. |
| When is it calculated? | On the second step of retrieval, during search for more relevant candidates in the vector space. |
| Example | If $\text{cosine}(\text{query}, \text{candidate document}) = 0.83$, then $\text{score} = 0.83$. |

`confidence`

$\text{confidence}_\text{feedback}(\text{context pair})$

|||
|---|---|
| What does it mean? | A difference in relevance to the query for the two documents in the context pair, as scored by the feedback model. |
| When is it calculated? | At the moment feedback is collected, right after the initial retrieval. |
| Example | The first retrieval returns $\text{doc}_1$ and $\text{doc}_2$.<br/>A feedback model scores them $0.99$ (more relevant, so “**p**ositive”) and $0.70$ (less relevant, so “**n**egative”) respectively against the query.<br/>$\text{confidence}$ of the context pair ($\text{doc}_p$, $\text{doc}_n$) $= 0.99 - 0.70 = 0.29$. |

`delta`

$\text{delta}_\text{retriever}(\text{context pair}, \text{candidate document})$

|||
|---|---|
| What does it mean? | The difference between the candidate’s similarity scores (for example, cosine similarity) to the positive document and to the negative document from the context pair. All embeddings, on which the similarity score is computed, are generated by the retriever for compatibility. |
| hen is it calculated? | On the second step of retrieval, during search for more relevant candidates in the vector space. |
| Example | Given the aforementioned context pair ($\text{doc}_p$, $\text{doc}_n$) and a candidate, all embedded by the retriever:<br/>If $\text{cosine}(\text{doc}_p, \text{candidate})$ and $\text{cosine}(\text{doc}_n, \text{candidate})$ are respectively $0.78$ and $0.40$.<br/>$\text{delta} = 0.78 - 0.40 = 0.38$. |

## Training Formula Parameters

With the right parameters a, b and c, the naive formula should rank documents better than our simple retriever.  
That leads us to **minimizing Ranking Loss** as the training objective.

Since the formula has only three parameters, **the amount of training data shouldn’t be big at all**. A few hundred domain relevant queries are enough.

**For each query, the goal is for the feedback based scoring formula to rank documents as well as the feedback model would.**

1. During training we initially retrieve the top X documents per query. X is chosen as large as affordable, given the cost of obtaining a golden ranking on these X documents from the feedback model.
2. The feedback model provides feedback on the top Y results, with Y (context limit) much smaller than X.
3. The remaining X minus Y documents form the training pool for reranking. The aim is to train the formula parameters so that documents the feedback model considers more relevant than those in the top Y are scored higher.

## Experiments

Before building a new interface, we needed to confirm our instinct: that a relevance feedback scoring can surface documents that initial retrieval misses.

The experiment code is published [here](https://github.com/qdrant/relevance-feedback-experiments)<TBD merge before publishing>. 

### Design

Each triplet (retriever, feedback model, dataset) forms one experiment.

**Dataset**  
A subset of [BEIR (Informational Retrieval benchmark)](https://github.com/beir-cellar/beir): MSMARCO (8.84mln documents), SCIDOCS (25K documents), Quora (523K documents), FiQA-2018 (57K documents) and NFCorpus (3.6K documents) – documents and queries, no qrels.

**Retriever**  
As retrievers we chose [jina-embeddings-v2-base-en](https://huggingface.co/jinaai/jina-embeddings-v2-base-en) (768 output dimensions), [mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) (1024 output dimensions) and [Qwen3-Embedding-0.6B](https://huggingface.co/michaelfeil/Qwen3-Embedding-0.6B-auto) (1024 output dimensions).

**Feedback model**  
The cheapest feedback model that came to mind was using **embedding models with higher dimensionality than the ones for retrieval**.

> Yet, a feedback model can be anything: a cross encoder, a custom ranking model, an LLM, or an agent.

The pointwise feedback from these models is simply a cosine similarity between query and document embeddings. Based on these scores, we form context pairs of positive documents (higher cosine score) and negative documents (lower cosine score).

We chose as feedback models [mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) (1024 output dimensions), [Qwen3-Embedding-0.6B](https://huggingface.co/michaelfeil/Qwen3-Embedding-0.6B-auto) (1024 output dimensions), [Qwen3-Embedding-4B](https://huggingface.co/michaelfeil/Qwen3-Embedding-4B-auto) (2560 output dimensions), and [colBERTv2.0](https://huggingface.co/colbert-ir/colbertv2.0) (multivectors of 128 dimensions each).

With Qdrant and [Qdrant’s Cloud Inference](https://qdrant.tech/cloud-inference/) at our disposal, we ran embedding inference once for all datasets on both retrieval and feedback models, stored the embeddings in Qdrant, and then experimented with different formulas. This way, we could even use one model interchangeably as a retriever and a feedback model.

### Metric

We want to show that relevance feedback scoring increases recall of the retrieved results. That means **surfacing the documents relevant to the query that the baseline retriever missed**.  
   
Rescoring humongous datasets like MSMARCO on the client side (for every query, while trying different formulas and hyperparameters) would not have been fun. That is exactly the problem with many relevance feedback approaches, limiting their applicability to a subset of retrieved documents.   

Our relevance feedback interface is a solution, but firstly we needed experiments to justify building it, so we’ve got ourselves a chicken-egg problem. **Hen**ce, in experiments, we also had to simulate feedback-based scoring on a limited subset of documents.

**What we’re measuring**  
Does our feedback-based scoring formula pull more relevant documents up into the evaluation window N than the baseline retriever?

**Set up:**

* For each query, the retriever returns a ranked list from the initial retrieval. This is our limited subset of documents that simulates the full dataset.  
* The feedback model sees only the context limit of results (say, top-X, X being 3-5). We mine our context pairs and their confidence.  
* We set a **threshold**. It is the best relevance score between query and document within that context limit as assigned by the feedback model.

Any document **outside the context limit** that **would score above the threshold** is a “we-want-to-surface-it” item.

<TBD CERTAINLY NEED THE IMAGE>

**Compare baseline (retriever) versus rescored (feedback-based formula) with the custom recall@N:**

* Look **at the next N positions** after the top-X documents used for feedback.  
* **Baseline:** count how many “we-want-to-surface-it” documents already appear there in the baseline ranking.  
* **Rescored:** rescore and rerank the tail, meaning everything after the top X, using a trained formula. Check the first N positions of the new ranking and count again the “we-want-to-surface-it” items.

Sum counts across all queries for baseline and for rescored and calculate the **relative gain**.

<TBD CERTAINLY NEED THE IMAGE>

### Experiment Parameters

<details>
  <summary><b>Training data size</b></summary>

| Dataset    | Train queries | Test queries |
|------------|---------------:|-------------:|
| NFCorpus   | 223            | 100          |
| FiQa-2018  | 500            | 148          |
| SCIDOCS    | 500            | 500          |
| MSMARCO    | 4000           | 1000         |
| Quora      | 6000           | 1000         |

Queries for training are split in 50% train, 50% validation.

</details>

<details>
  <summary><b>Training parameters</b></summary>

| Parameter                                                   | Value |
|-------------------------------------------------------------|------:|
| Golden Ranking Limit (simulating the whole dataset)         | 100   |
| Context Limit (to mine context pairs with the feedback model)| 5     |
| Learning rate                                               | 0.005 |
| Epochs with early stopping and patience 200                 | 2000  |

</details>

<details>
  <summary><b>Testing parameters</b></summary>

| Parameter                                                   | Value |
|-------------------------------------------------------------|------:|
| Feedback-based scoring Limit (simulating the whole dataset) | 100   |
| Context Limit (to mine context pairs with the feedback model)| 3     |
| Evaluation window N (recall@10)                             | 10    |

</details>

### Results

Out of all pairs of retriever and feedback models, we got three leaders with the following relative gain in **recall@10** compared to the baseline retriever. 

We showed only **three** documents to the feedback model to get a signal for the feedback-based scoring formula.

|  | Qwen3-0.6B → colBERTv2.0 | Qwen3-0.6B → Qwen3-4B | mxbai-large-v1 → colBERTv2.0 |
| ----- | ----- | ----- | ----- |
| **NFCorpus** | +10.34% | +10.61% | **+21.57%** |
| **FiQA-2018** | +6.45% | +10.94% | **+12.24%** |
| **SCIDOCS** | **+38.72%** | +0.69% | +9.55% |
| **MSMARCO** | **+23.23%** | +16.73% | +2.40% |
| **Quora** | **+5.04%** | +2.67% | 0.00% |

[jina-embeddings-v2-base-en](https://huggingface.co/jinaai/jina-embeddings-v2-base-en), as a smaller, and, consequently, less expressive retriever, was not responsive to the feedback. The result was mostly noise, with no noticeable improvement from adding the feedback signal.

|  | jina-v2-base → mxbai-large-v1 | jina-v2-base → Qwen3-0.6B | jina-v2-base → Qwen3-4B |
| ----- | ----- | ----- | ----- |
| **NFCorpus** | **+4.62%** | −3.85% | +2.86% |
| **FiQA-2018** | −3.90% | −1.59% | **+3.97%** |
| **SCIDOCS** | **+4.55%** | +1.62% | +1.82% |
| **MSMARCO** | +2.57% | +2.23% | **+2.82%** |
| **Quora** | 0.00% | −1.37% | 0.00% |

A couple of takeaways:

* The retriever’s expressiveness limits how much it can respond to feedback. Moreover, past a certain point, making the feedback model more sophisticated will not help, because the retriever works in a lower dimensional space and often can’t capture the distinctions the feedback model is making.  
    
* Initially we used only one context pair with the highest confidence in the feedback-based scoring formula, both when training and when applying feedback based scoring. Then we discovered that for the latter, adding signals from other pairs (for example, from 3 documents, we can mine 3 context pairs) improves results. They are added as a summand per pair: $+ \text{confidence}(\text{context\_pair}_i)^b \cdot c \cdot \text{delta}(\text{document\_candidate}, \text{context\_pair}_i)$

The results show a relative gain on a subset of documents. This hints that our relevance feedback approach makes sense. After implementing the interface, we checked our theory that rescoring the whole dataset delivers even better results. 
<TBD some numbers to calculate on the interface prototype>

The feedback-driven request takes about as long as baseline retrieval, and we get more relevant results!

## Conclusion

We’ve released a new relevance feedback tool in Qdrant 1.17.0 <TBD link> to increase the relevance of your vector search results. **It is built for scale, it’s cheap, customizable and universal.**

**It is cheap to use**, because FeedbackQuery runs in about the same time as a vanilla retrieval, and the time and resources spent on mining feedback are minimal.

**It is cheap to adapt to your use case**: dataset, retriever, and feedback model. Just plug in your Qdrant collection, a small sample of queries related to the dataset, and the desired feedback model here<TBD framework link>, then save the weights for the feedback based scoring formula. No GPU or labels needed.

**It is universal**, since it is data type agnostic and works directly on any vectors with all types of retrievers and feedback models, from a dense encoder to an agent. 

It uses **the whole vector space of documents** to search for more relevant results.

It’s a perfect tool for production.

### How to Use Relevance Feedback

​​Use the relevance feedback method once basic retrieval is in place and you are looking for extra instruments to boost result relevance, such as hybrid search, query rewriting, reranking, or score boosting. (If you are not looking for them, why not? There is no limit to perfection!)

**It’s here not to replace but to complement other search relevance tools.** For example, it is a good aid for your search agents, letting you propagate their use case understanding directly to the vector search index.

The method, like everything in Qdrant, is open source. We have provided a framework that lets you compute customized FeedbackQuery weights for your dataset, retriever, and feedback model<TBD link>.   
If you would like additional advice on FeedbackQuery setup in production or have ideas to enhance the method, please write to us<TBD some discord channel>.


