---
title: "SHIFTing Languages in Multilingual RAG"
draft: false
slug: shift-multilingual-rag
short_description: "Shift document and query vectors to one pivot language for cheap cross-lingual recall in multilingual RAG."
description: "Fix multilingual embedding language bias with SHIFT: shift document and query vectors to one pivot language and store them in a single Qdrant index."
preview_image: /blog/shift-multilingual-rag/preview/preview.jpg
social_preview_image: /blog/shift-multilingual-rag/preview/social_preview.jpg
title_preview_image: /blog/shift-multilingual-rag/preview/title.jpg
date: 2026-09-16T09:00:00+02:00
author: Evgeniya Sukhodolskaya
featured: false
tags:
  - multilingual
  - rag
  - cross-lingual
  - embeddings
  - vector-search
---

If you speak more than one language, you know the feeling when the mental switch in your head starts up with the rattling sound of a struggling engine, mixing every word you have to produce into some Denglish, Frenglish, or Spanglish. Work-related thoughts come back from your inner search engine of a brain in English, life wisdom -- in the mother tongue, and the mix is unpredictable, a little weird, but it works.

Real knowledge bases mix languages the same way: many EU companies, for example, keep internal docs in two or three languages at once, and asking such a knowledge base a question becomes a gamble on which language holds the answer. Knowledge retrieval here inevitably means dealing with multilingual RAG, retrieval-augmented generation over a collection where questions and documents mix different languages. 

In an ideal world of information retrieval, the language of the query or the document doesn't matter, what matters is that the retrieved answer *answers* the question. Production and ideal world overlap in approximately... 0.42% of cases.

## Language Leaks Into Your Search

Retrieval by meaning is supposedly solved with semantic search, and language shouldn't be an obstacle. Take a multilingual embedding model (one that maps text from many languages into the same vector space, like [multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) or [bge-m3](https://huggingface.co/BAAI/bge-m3)), and texts that mean the same thing should land near each other. Should...

Because of how they're trained, many multilingual encoders group texts by both meaning and language, and often this language grouping wins the multilingual RAG gamble. So, if you'd ask a German question, you will most probably get only German answers. The better answer can easily be in English, yet it'll be unreachable due to the language bias gap.

We checked it with `intfloat/multilingual-e5-small`, the model our [Cloud Inference](https://qdrant.tech/documentation/cloud/inference/) serves for free. On [XRAG](https://huggingface.co/datasets/AmazonScience/XRAG), 15,277 real news articles in five languages, a same-language answer lands in the top 10 in 61% of cases, while an equally relevant answer in another language makes it in only 8%.

{{< figure src="/blog/shift-multilingual-rag/multilingual-e5-small-screenshot-webUI.png" alt="The multilingual-e5-small embedding space on real data: English and Spanish documents fall into separate clusters, the language bias in action." caption="English and Spanish documents from XRAG, encoded by \"multilingual-e5-small\", split into separate clusters instead of mixing by meaning." width="75%" >}}

The common fixes against this bias are rather costly: translating every document and keeping a per-language copy, then running one search per language and merging results. 
Or reaching for a bigger, seemingly unbiased model, like, in our recent research, we noticed that [Qwen3-Embedding-8B](https://huggingface.co/Qwen/Qwen3-Embedding-8B) is a complete champ at fighting the language bias in embeddings.

{{< figure src="/blog/shift-multilingual-rag/qwen-webUI-screenshot.png" alt="Qwen3-Embedding at 4096 dimensions keeps English and Spanish points intermixed by meaning rather than split by language." caption="Qwen3-8B keeps English and Spanish points intermixed by meaning." width="75%" >}}

...but Qwen-8B vectors are 4096-dimensional; for comparison, `multilingual-e5-small` produces 384-dimensional vectors. 

So the common fixes either cost a lot to store and search at scale, or a lot to build and maintain, like translation pipelines. 

We constantly monitor IR research to mine little cheat codes for retrieval. And the recent [SHIFT paper](https://arxiv.org/abs/2606.18801) claims a cheap, no-training, generalizable fix for multilingual encoder bias. What caught our attention: the paper's main star is `multilingual-e5-large`, and we serve its smaller sibling in Cloud.   
So we reached for this low-hanging, silver-bullet fruit; spoiler: it works, but should be used with caution.

## The Idea: Every Language Is an Offset

[SHIFT](https://arxiv.org/abs/2606.18801) ("Semantic Harmonization via Index-side Feature Transformation for Multilingual Information Retrieval", June 2026) models **each language as a roughly fixed language offset on top of meaning**: the encoder places texts by what they mean, but each language also moves its vectors in one consistent direction.

Subtract the German offset from German vectors, and they move toward their English equivalents while the meaning placement is preserved.

{{< figure src="/blog/shift-multilingual-rag/the-shift.svg" alt="The language offset: one arrow, learned once, drags the whole German cluster onto the English one so a German document lands on top of its English twin." caption="One learned offset drags the whole German cluster onto the English one" width="85%" >}}

To find the offset, the authors take a large set of translation pairs (533k pairs from [mMARCO](https://github.com/unicamp-dl/mMARCO)), embed them with the model of choice, then subtract and average the vectors:

```text
offset[lang] = mean(embed(target_lang) − embed(pivot_lang))
```

If the translations are truly parallel, each pair says the same thing twice, so the subtraction cancels the meaning component and leaves the language direction; averaging over many pairs cancels the leftover noise.

Then, at indexing time, they bring every non-pivot-language document into the pivot language's space:

```text
indexed = embed(doc) − alpha · offset[lang]
```

`alpha` sets how hard you shift. The authors sweep it from 0.1 to 1.0 and report the best value per model.

At query time, if all your queries come in the pivot language (for example, English), it finishes here, you're expected to collect the low hanging fruits of cross-lingual retrieval gain.  
In a real multilingual scenario mentioned in Appendix J, where queries arrive in other languages, too, they should be shifted in a same way.

As a result, overall retrieval metrics should improve. For `multilingual-e5-large`, average nDCG@20 rises from 0.633 to 0.737 across the paper's benchmarks, as the cross-language retrieval metric, TLR@20 (Target-Languages Recall), jumps the most, freed of the bias.

## Is It Reusable?

The SHIFT method is as simple as it gets, so if it works, it is a very cheap win: keep one index, use the model of your choice, improve retrieval, and skip the latency of a translation pipelines. So what counts as a win?

- The authors show the method works across different multilingual embedding models (with the best results on `multilingual-e5-large`). If we try it on our smaller `multilingual-e5-small`, do we still see improvements?
- Do the overall metrics hide a same-language regression? After the shift, a query might stop finding the most relevant answer in its own language. The paper focuses on overall and cross-language metrics, but for production you should know the trade-off.
- Does a language have a fixed offset that is reusable across domains, or is the offset dataset- and topic-dependent? If it is dataset-dependent, how many parallel pairs are enough to estimate it?
- How does the method behave on a dataset that actually looks like multilingual RAG?

#### Quick Check

We wanted a setup that resembles a real collection and check it first under exact search, vector against vector, then under Qdrant's HNSW index, since SHIFTting vectors could disrupt the graph and, hence, lower the quality of approximate search to unbearable levels.

**The model.** [`intfloat/multilingual-e5-small`](https://huggingface.co/intfloat/multilingual-e5-small): 384 dimensions, identical to the one served in our [Qdrant Cloud Inference](/documentation/cloud/inference/).

**The data.** [XRAG](https://huggingface.co/datasets/AmazonScience/XRAG): 15,277 news articles in English, German, Spanish, Arabic, and Chinese.
- 6,200 human-answered questions (1,000 English and 1,300 in each of the other four languages)
- About 73% of the articles are in English
- A question can have relevant answers in more than one language
- Most of these questions genuinely need cross-language retrieval: 83% have a relevant answer in a language other than their own, and only 34% have one in their own language.

> XRAG ships no language labels, which the shift needs in order to pick an offset per language, so we tagged documents with a simple language detector (about 74% accurate overall, reliable for Arabic and Chinese, noisier on German and Spanish)

**The sensibility check.** We also ran [Multi-EuP](https://huggingface.co/datasets/MultiEuP) (parliamentary debate passages) and [XQuAD](https://huggingface.co/datasets/google/xquad) (question-answer paragraphs) on their English/German/Spanish slices as a sanity check, to see whether the paper's result replicates on our small model.

**The metric.** Recall@10, split three ways: **overall** (all relevant answers), **same-language** (only answers in the query's language), and **cross-language** (only answers in other languages). Same- and cross-language recall are macro-averaged across query languages.  
We chose @10 over the paper's @20 deliberately: in production RAG, the fewer chunks you feed the model, the less you distract it.

#### Offset

The authors estimated their offsets from 533k mMARCO pairs. Repeating that scale for an experiment felt excessive, so we checked two things:  
(a) whether an offset converges on far fewer than half a million pairs, and (b) whether the offset is universal, or influenced by the dataset domain. If it is domain-influenced, how different are offsets across datasets?

We estimated language offsets on [OPUS-100](https://huggingface.co/datasets/Helsinki-NLP/opus-100), increasing the sample until the offset stopped moving, then compared them against offsets estimated the same way on mMARCO.

> **A note on offsets for "multilingual-e5-small".** e5-family models expect `passage:` in front of documents and `query:` in front of queries, so an offset for a small model has to be estimated twice, once in each space, and applied to the matching side.

The findings:

- **You do not need half a million pairs.** The offset stabilizes quickly: two independent samples of the same corpus agree at cosine 0.9999, and it barely moves past a thousand pairs. A few hundred (we used 3,000) already fix the direction.
- **Offsets do differ between datasets, as expected** (otherwise this language vector would have been found and published long ago:D). Meaning can't be fully separable from language. But the difference is smaller than we assumed: offsets from two different corpora (Opus and mMARCO) agreed at about 0.93 cosine (de 0.933, es 0.926).
- **Within one dataset, the subsample barely matters.** You converge to the same offset quickly regardless of which slice you take, for us, two random disjoint samples of the same corpus agreed at cosine 0.9999

So if you can afford it, sample a few hundred to a few thousand documents from your own collection, get parallel translations (a good machine translator, ideally human-checked), and cache your own, better-fitting offset vectors. Public datasets work too for a start.

## Is It Reproduceable?

| dataset | overall recall@10 | same-language recall@10 | cross-language recall@10 |
|---|---|---|---|
| XRAG baseline | 0.195 | 0.608 | 0.083 |
| XRAG SHIFT | **0.297** | 0.488 | **0.240** |
| Multi-EuP baseline | 0.188 | 0.463 | 0.053 |
| Multi-EuP SHIFT | **0.286** | 0.357 | **0.227** |
| XQuAD baseline | 0.833 | 0.996 | 0.752 |
| XQuAD SHIFT | **0.967** | 0.989 | **0.955** |

On the XRAG collection, the trade is favorable: answers are spread across languages, so the gain in cross-language recall outweighs the loss in same-language recall.  
For example, for a Spanish query about the UK winter fuel decision (*"¿Qué acontecimiento fue más polémico: la advertencia de la investigación del Partido Laborista sobre las muertes o la decisión de recortar los pagos del combustible en invierno?"*): its relevant English article starts at rank **#438**, too far down to matter, and after the shift it reaches **#5**.

- **Cross-language recall triples to quadruples**
- **Same-language recall pays for it**. This is expected: we re-aimed every non-English document toward English, so a German query now finds its German answers less reliably. German pays the most: its same-language recall on XRAG drops from 0.61 to 0.35.
- **Overall grows here** because in these datasets many answers live outside the query's language. 

If your users mostly ask German questions about German documents, SHIFT will harm your retrieval quality. Measure your own answer-language mix before touching anything.

#### HNSW

If the method works under a full scan, does it survive HNSW? Shifting vectors could distort the graph's structure and approximate nearest neighbours search.

> At this corpus size, a default Qdrant collection stays in full-scan mode, so to measure HNSW we lowered the indexing threshold to 1,000 KiB.

On the same shifted vectors, recall from the HNSW index matched exact search to within about 0.005:

| dataset | exact (overall / same / cross) | HNSW (overall / same / cross) |
|---|---|---|
| XRAG | 0.297 / 0.488 / 0.240 | 0.297 / 0.487 / 0.240 |
| Multi-EuP | 0.286 / 0.357 / 0.227 | 0.282 / 0.353 / 0.224 |

#### Strength of the Shift

`alpha` sets the strength of the shifting. The best value depends on the model: the paper's bigger `multilingual-e5-large` is peaking around 0.6, its other models work best at 1.0.  
For `multilingual-e5-small`, recall climbs straight to `alpha` = 1.

{{< figure src="/blog/shift-multilingual-rag/alpha-curve.svg" alt="recall@10 on held-out questions rises steadily as alpha increases from 0 to 1, with no peak in the middle, best at 1.0." caption="**Alpha sweep.** recall@10 climbs steadily to 1.0 for multilingual-e5-small, with no peak in between." width="75%" >}}

The best alpha depends on your use case, so if you want something better than the default 1.0: get a few hundred to a few thousand labeled questions (qrels), then tune.  
Split them, sweep alpha on one half, and apply the best value to the other to validate.

## The Recipe

The method is worth it **when answers are usually spread across languages**, since the shift buys cross-language reach at a same-language cost.  
If your questions and their answers almost always share a language, the shift's same-language cost isn't worth it, and keeping per-language search (with translation where needed) may serve you better.

To shift your data, you need:

- **Translated pairs** to build each offset: public parallel corpora like [OPUS-100](https://huggingface.co/datasets/Helsinki-NLP/opus-100) or Tatoeba, or a machine-translated sample of your own documents.  
  A few hundred pairs already stabilize the direction (we used 3,000 per language). The offset is not a universal constant, though, so build it from text that resembles your documents.
- Optionally, **a language detector** to tag each document and query at ingest.

```text
# 1. Learn one offset per language, once, on a parallel corpora
# (a public dataset, or your own for the best fit)
offset[lang] = mean(embed(target_lang) − embed(English))

# 2. Index
for doc in documents:
    v = embed(doc.text)
    if doc.lang != English:
        v = v − offset[doc.lang] # alpha = 1, a full shift
    index.add(normalize(v))

# 3. Query: shift a non-English query, then search the index
v = embed(query.text)
if query.lang != English:
    v = v − offset[query.lang]
answers = index.search(normalize(v), top_k=10)
```

The paper's [reference implementation on GitHub](https://github.com/yjoonjang/SHIFT).

> Re-estimate the offsets whenever you change the model or the pivot language. 

## Conclusion

Use SHIFT method when you have resources for only one shared index, when answers are frequently in a different language than the query, and when you don't have the time or energy for a translation step.

1. **Measure your answer-language mix first.** Sample real queries and label where their answers live, language-wise. Mostly same-language? Skip the shift.
2. **If you can, build offsets from your own texts.** The language offset proved corpus-dependent (about 0.93 agreement between the mMARCO and OPUS versions). A few hundred translation pairs of your own documents beat half a million from someone else's corpus, though public ones are still usable.
3. **Mind the prefixes.** e5-family models use `passage:` for documents and `query:` for queries. Estimate each offset with the same prefix you apply it to. Our Cloud Inference adds the right prefix automatically.
4. **Alpha = 1 worked here, but tuning for your own setup is better.** If same-language traffic is large, sweep alpha on a labeled sample (say 2-3k queries, half for tuning and half for validation; a coarse grid is enough) and pick your own balance.

If you are building multilingual RAG, contact us on [Discord](https://discord.gg/qdrant). We are also looking into cross-lingual sparse neural retrieval now, and would love to get some interesting use cases to test our approaches!
