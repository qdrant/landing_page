---
title: "Keyword Search in Qdrant: What to Configure and When"
short_description: "Which keyword settings to change, which to leave alone, and how to tell the difference on your own data."
description: "When to use phrase matching, multilingual tokenization, and BM25 in Qdrant, when to skip them, and where the capabilities stop."
preview_dir: /articles_data/keyword-search-in-qdrant/preview
social_preview_image: /articles_data/keyword-search-in-qdrant/preview/social_preview.jpg
weight: 34
author: John Kupchanko
author_link: https://github.com/jkupchanko
keywords:
  - keyword search
  - bm25
  - sparse vectors
  - hybrid search
  - phrase matching
  - multilingual tokenization
category: search-quality
date: 2026-08-13T12:00:00+03:00
draft: false
---

A customer types a part number, and a dense-only system returns things that mean roughly that: related, reasonable, not the part. Qdrant matches the words themselves on two surfaces beside your dense vector, a payload text index that filters and a sparse vector that ranks, and you configure each one separately. Here is what to configure for common keyword workloads, what our measurements settled, and what your own data has to decide.

## Two Text Surfaces, Both Yours to Configure

*Text index and sparse*

{{< figure src="/articles_data/keyword-search-in-qdrant/two-paths.svg" alt="Diagram: one query splits into two surfaces. The payload text index filters, narrowing a candidate set with no ordering inside it. A sparse vector ranks, producing scores that fuse with the dense vector's." width="100%" >}}

You're adding keyword matching beside a dense vector that already works, and Qdrant gives you two places to do it.

- **Filtering**: The [payload](/documentation/manage-data/payload/) text index answers one question: does this document contain these words? No score, no ordering, only a narrowed set.
- **Ranking**: A [sparse vector](/documentation/manage-data/vectors/) holds mostly zeros, one weight per word. Qdrant's built-in [BM25](/articles/minicoil/) model builds one from your text, and its scores merge with your dense vector's.
- **Shared names**: Tokenizer, stemmer, stopwords, and ASCII folding sit on both surfaces under the same names, and each works only on its own path.
- **Different defaults**: Leave the stemmer unset and you get Snowball English on the BM25 side and no stemming at all on the index side. Set it twice.

> You get two independent text surfaces over one collection, so every setting below has exactly one place to go.

## Four Decisions, and What Each One Rests On

*Both surfaces*

{{< figure src="/articles_data/keyword-search-in-qdrant/four-decisions.svg" alt="Diagram: the four decisions laid against the two surfaces they sit on. Padlock glyphs mark the choices fixed when you create the index or upload your points, caliper glyphs mark the ones only your own data settles, and cells drawn solid were scored on BEIR while hatched cells are behavior we probed." width="100%" >}}

Four decisions on those surfaces are genuinely yours. The rest hold at their defaults. Two of the four are locked when you create the index or upload your points, so deciding late means a rebuild. Two kinds of claim follow, so you know how far to trust each. What we say about `avg_len`, fusing, and the sparse methods, we scored on five English BEIR corpora and tested query by query. What we say about phrase matching and tokenizers is behavior we probed on hand-checked documents, not retrieval quality we measured.

- **`avg_len`**: Ranking path, BM25 only, and locked at upload. SPLADE and miniCOIL don't have it.
- **Phrase matching**: Filter path, and switched on when you create the text index.
- **The tokenizer**: Both paths, so you set it in both places.
- **Whether to fuse**: Ranking path. Both vectors sit on one collection, so you score each leg on your own queries before you commit.

> The list is short and named, most of it stays at the defaults, and you can settle the rest on your own queries before you build anything.

## Catalogs, Part Numbers, and Identifiers

*Text index*

{{< figure src="/articles_data/keyword-search-in-qdrant/present-vs-adjacent.svg" alt="Diagram: the query for the phrase brake pad, against three documents. One holds the phrase in order and matches. Two hold both words apart and match only when phrase matching is off." width="100%" >}}

You're indexing a parts catalog, an error-code reference, or a support archive where people search by identifier. Qdrant's payload text index matches those words exactly.

- **Adjacency, not presence**: Phrase matching lets the index require the words side by side in that order. It's off by default, and adding it later rebuilds that field's index.
- **Identifiers split already**: The word tokenizer breaks on hyphens and underscores, so a code inside a longer part number matches on its own, and the opt-in prefix tokenizer covers leading fragments. A fragment mid-token stays out of reach.
- **What we saw**: On phrases mined from corpus text rather than a scored benchmark run, phrase matching was exact on every one we tried, while the both-words query returned many more documents, none of the extras holding the phrase.
- **Failure differs by deployment**: Under Cloud's default strict mode, a phrase query without the flag fails with an error naming the index it wanted. Self-hosted with strict mode off, we expect an empty result instead, unmeasured.

> Set the flag when you create the index and a quoted product code returns that product, with the hyphens in your part numbers already matchable on their own.

## Support Content in Japanese, Chinese, and Thai

*Text index and sparse*

{{< figure src="/articles_data/keyword-search-in-qdrant/where-words-end.svg" alt="Diagram: unspaced Japanese text becoming a single unsearchable token under the default tokenizer, then segmented into two searchable terms under the multilingual one. Below it, an accented word matched by an unaccented query once ASCII folding is on." width="100%" >}}

You're putting support content behind search in Japanese, Chinese, or Thai, or in European languages your users type without accents. Qdrant segments unspaced text with its multilingual tokenizer, no per-language plugin involved. Our corpora are English, so what follows is behavior we probed on hand-checked documents rather than retrieval quality we measured.

- **Multilingual tokenizer**: The default looks for spaces, so unspaced text arrives whole with nothing findable inside it.
- **ASCII folding**: It's off by default. Turn it on and an unaccented query still reaches "München".
- **Set both surfaces**: Set the tokenizer and the folding on your BM25 config too, or your text filters correctly and scores as one long word.
- **No tokenization report**: Qdrant won't show you how it tokenized a value.
- **Segmentation, not substrings**: A short word won't find a longer compound that contains it, and German compounds don't split.

> Match the tokenizer to your text on both surfaces, and content in scripts that don't use spaces is searchable on the same collection as your English.

## Fit BM25 to Your Own Corpus

*Sparse only*

{{< figure src="/articles_data/keyword-search-in-qdrant/wrong-yardstick.svg" alt="Diagram: the spread of document lengths in a corpus, with the corpus mean marked in green and BM25's fixed default of 256 marked in red far to the right. BM25 divides every document's length by the red line rather than the green one." width="100%" >}}

You're ranking support tickets, product descriptions, or abstracts, whatever length your business made them. BM25 divides every document's length by a corpus average, and `avg_len` puts that average on your collection beside `k` and `b`, all three yours to set at upload.

- **Measure your own mean**: The bundled model ships `avg_len` at 256 whatever your documents hold. Count the way BM25 counts, with stopwords stripped.
- **Set it at upload**: The value bakes into every stored weight, so changing it later means re-indexing, and paying for dense inference again on a hybrid collection.
- **Expect a small move**: Correcting it moved every corpus we tried in the right direction, the gains are small, and only some of them separate from noise.
- **Don't predict the size**: Distance from the default didn't track the effect on our corpora, and on very short documents the corrected count can overshoot.

> One pass over your documents and BM25 scores against your corpus's own lengths. It's the cheapest change on this page.

## Score Each Leg Before You Build the Merge

*Sparse and dense*

{{< figure src="/articles_data/keyword-search-in-qdrant/distance-decides.svg" alt="Diagram: two cases side by side. When dense and sparse score close together, fusing pays. When they are far apart, fusing costs, because the weaker side's confident mistakes displace the stronger side's right answers. Upgrading the embedding model moves a setup from the first case to the second." width="100%" >}}

You have a dense setup that works, and you're weighing whether a sparse leg belongs beside it. Exact terms and quoted phrases stay available on the text index whatever you decide, so the only open question is the ranking half. One collection carries both vectors, so settle it on your own labeled queries: query sparse alone, dense alone, and fused at equal depth, then read the distance between the legs.

- **The text index stays**: Quoted phrases, part numbers, and segmented scripts are a job no embedding upgrade covers, so this decision is only ever about the sparse ranking leg.
- **Drop self-retrieval first**: If your queries are also documents in the collection, each one retrieves itself at the top and every number after it is wrong. Fetch past your cutoff and drop the query's own document. Where this applies, it outweighs every other decision here.
- **Read the distance**: Close together, or sparse ahead, and fusing pays; far apart and it costs, because fusion promotes whatever each leg ranks first. No cutoff travels, and we measured near the top of the results only.
- **Repeat after an upgrade**: Under the stronger dense model, the sparse leg did not significantly help on any of the five corpora and significantly hurt on three. Nothing looks broken when it happens.
- **Merge weights are yours**: RRF (Cormack, Clarke, and Buettcher, 2009) shares its rank constant across both legs, so it can't down-weight a retriever at all. Per-leg weights can, and sweeping ours rose monotonically as the sparse weight fell, converging on not fusing, with the best weight chosen on the same queries it was scored on.

> Every leg is separately addressable over one collection, so you add the sparse half only where it earns its place, and keep exact matching either way. A morning of measurement, not a build you might undo.

## Three Sparse Methods, One Collection Shape

*Sparse only*

{{< figure src="/articles_data/keyword-search-in-qdrant/ordering-reverses.svg" alt="Diagram: BM25, SPLADE and miniCOIL ranked first, second and third across four corpora, with the order changing at every one and the lines crossing." width="100%" >}}

You've settled that a sparse leg earns its place. BM25, SPLADE, and miniCOIL are model names against one sparse vector field, and they solve lexical ranking differently, so start from the behavior that matches your content. On Cloud, BM25 and SPLADE run inference in-cluster.

- **Start from behavior**: BM25 counts words, so reach for it when your users type the terms your documents use. [SPLADE](https://huggingface.co/prithivida/Splade_PP_en_v1) learns its weights with a transformer and adds terms a document never used, which helps when they ask in different words than your content. [miniCOIL](/articles/minicoil/) keeps BM25's formula with contextual weights, for content where the same word means different things, and it encodes locally in our deployment.
- **Then validate the pick**: Don't assume one of them wins everywhere. SPLADE placed first on two corpora and last on two others, and BM25 never won one where all three ran, so score your shortlist on your own queries before you commit.
- **Set `Modifier.IDF` per method**: BM25 and miniCOIL need it; SPLADE's weights already carry term importance, which the modifier double-counts. Nothing errors either way.
- **Ours are point estimates**: These comparisons span more than one version of our harness and read near the top of each ranking only, so take them as point estimates, not controlled swaps.

> Three methods read the same collection shape, so trying the one your content argues for costs a rebuild and a scoring run, not a second service.

## Where the Two Surfaces Cover Each Other

*All three*

{{< figure src="/articles_data/keyword-search-in-qdrant/three-limits.svg" alt="Diagram: three limits and the route through each. A misspelled query goes to the dense vector, a fragment mid-token has no route today, and weighting a title over a body needs one sparse vector per field." width="100%" >}}

Your users misspell things, quote part numbers, and search in scripts without spaces. One collection carries the text index, the sparse vector, and the dense vector, and the three divide the work along a clean line.

- **Your dense vector owns meaning**: A typo barely moves it, so the dense side takes what no keyword setting corrects. Over a small catalog, the filter path answered none of the misspelled queries, BM25 most, dense all, fused all: shape only, too small to size the effect.
- **Keyword owns the literal**: Quoted phrases, part numbers, and segmented scripts stay the text index's job whatever the distance said, and no embedding upgrade covers them.
- **Fragments inside a token**: Hyphens and underscores split already, and the opt-in prefix tokenizer covers leading fragments. A fragment mid-token has no route today.
- **Field boosts**: A sparse vector is one bag of words with no fields in it. One per field plus per-leg weights buys a weight per field, costing storage and a prefetch per field per query, the only route today.

> Keep all three in one collection and the gaps stop stacking up: what the words miss, your dense vector usually catches.

## What to Set, and What to Measure

In build order, on a collection that already carries a dense vector:

- Create the text index with the tokenizer your content needs, and turn phrase matching on then.
- Set that same tokenizer and your folding on the BM25 config too.
- Measure your own corpus mean the way BM25 counts, and pass it as `avg_len` at upload.
- Score sparse alone, dense alone, and fused on your own labeled queries before you build the merge, and again the day you change embedding models.
- Keep both whatever the distance says: the dense vector for meaning, the text index for the literal. Design around the mid-token fragment and the field boost.
- Change nothing else. Stemming and the stopword list earned their defaults on our corpora, so leave them alone.

## Where to Go Next

- [Payload documentation](/documentation/manage-data/payload/): the text index options, phrase matching and the tokenizers included.
- [Vectors documentation](/documentation/manage-data/vectors/): how sparse vectors are stored, queried, and fused with dense ones.
- [BEIR](https://github.com/beir-cellar/beir): the five retrieval collections behind every result here, scored with nDCG@10 on Qdrant v1.19.0.
- `qdrant-keyword-guide`, a private repository: the code, the raw per-query results, and the measurement limits behind this guidance.

To talk through your own setup, [get in touch](/contact-us/).
