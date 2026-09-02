---
title: "Your Search Defaults Are Wrong"
short_description: "Phrase matching is off, ASCII folding is off, and avg_len is 256 whatever your documents look like. Four things worth checking."
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

Someone searches for an error code. Or a part number, a surname, a phrase in quotes. The results come back reasonable, related, and completely wrong, because matching meaning is what your dense vectors do, and meaning is not what was asked for.

Adding keyword search beside them is the fix, either as a filter or as a ranking. It also puts four settings in the path of your relevance that you never chose. Here is which ones to change, which to leave alone, and how to tell the difference on your own data.

## Where Text Matching Actually Happens

{{< figure src="/articles_data/keyword-search-in-qdrant/two-paths.svg" alt="Diagram: one query splits into two surfaces. The payload text index filters, narrowing a candidate set with no ordering inside it. A sparse vector ranks, producing scores that fuse with the dense vector's." width="100%" >}}

You can't always tell where a keyword problem sits, because Qdrant matches on words in more than one place. A document that never comes back is a filter problem; right documents in the wrong order is a ranking problem. Sort out which you have first.

- **Filtering** The [payload](/documentation/manage-data/payload/) text index answers one question: does this document contain these words? No score, no ordering, only a narrowed set.
- **Ranking** A [sparse vector](/documentation/manage-data/vectors/) holds mostly zeros, one weight per word instead of a few hundred abstract dimensions. Qdrant's built-in [BM25](/articles/minicoil/) model builds one from your text, and its scores merge with your dense vector's.
- **Shared names** The tokenization settings sit on both surfaces under the same names, each working on its own path.
- **Different defaults** With the stemmer unset you get Snowball English on the BM25 side and no stemming at all on the index side. Set it twice.

> Name the surface first, and every setting below has exactly one place to go. It also tells you which half of this article you can skip.

## Which Decisions Apply to You

{{< figure src="/articles_data/keyword-search-in-qdrant/decision-tree.svg" alt="Diagram: a decision tree. A document that never comes back is a filter problem, leading to the tokenizer or to phrase matching. Right documents in the wrong order is a ranking problem, leading to avg_len or to measuring the distance between retrievers before adding a sparse vector." width="100%" >}}

Which surface a decision sits on also decides whether it applies to you. Take the ones ahead one path at a time.

- **`avg_len`** Ranking path, and BM25 only. SPLADE and miniCOIL don't have it.
- **Phrase matching** Filter path, turned on when you create the text index.
- **The tokenizer** Both paths, so you set it in both places.
- **Whether to fuse** Ranking path. Whether a sparse vector belongs beside your dense one.

> Most setups need one or two of these four, not all of them. Working out which ones is an afternoon; finding out later is a re-index.

## BM25 Isn't Broken, Its Default Is

{{< figure src="/articles_data/keyword-search-in-qdrant/wrong-yardstick.svg" alt="Diagram: the spread of document lengths in a corpus, with the corpus mean marked in green and BM25's fixed default of 256 marked in red far to the right. BM25 divides every document's length by the red line rather than the green one." width="100%" >}}

Your BM25 ranking is mediocre, and you're ready to conclude it doesn't suit your data. Check one number first. BM25 divides every document's length by a corpus average, and Qdrant's built-in model fixes that average at 256 whatever your documents hold, so unless yours average near it, the divisor is wrong on every document. Measure your own mean and pass it in.

- **Count as BM25 counts** The engine strips stopwords before scoring, so a raw word count runs high. On very short documents, try both.
- **Set it at upload** The value bakes into every stored weight, so changing it later means re-indexing, and paying for dense inference again on a hybrid setup.
- **Expect a small move** Correcting it moved every corpus we tried the right way, though the gains are small and only some separate from noise.
- **Only BM25 has it** SPLADE and miniCOIL have no `avg_len`, so skip this for them.

> One pass over your documents, and BM25 finally scores against your corpus instead of somebody else's. The gain is small, and it is the cheapest thing on this page.

## Quoted Phrases Need a Flag

{{< figure src="/articles_data/keyword-search-in-qdrant/present-vs-adjacent.svg" alt="Diagram: the query for the phrase brake pad, against three documents. One holds the phrase in order and matches. Two hold both words apart and match only when phrase matching is off." width="100%" >}}

Over on the filter path, a user quotes a product code or a name, and back come documents with those words scattered anywhere in the text. Your index checked that the words are present, not that they sit in that order. Phrase matching tests the order, and it's worth enabling early.

- **Adjacency, not presence** With the flag on, the index can require that words sit side by side in that order. Without it, only that both appear.
- **Fewer stray matches** On phrases mined from real corpus text, phrase matching was exact on every one we tried, while the both-words query returned many more documents, none of the extras holding the phrase.
- **Off by default** Decide at index creation: adding the flag later means rebuilding that field's index.
- **Failure differs by deployment** On Qdrant Cloud, where strict mode is the default, the query fails with an error naming the index it wanted. Self-hosted with strict mode off, we expect an empty result instead, unmeasured.

> Set the flag when you create the index and a quoted product code returns that product, not everything that mentions it. Decide later and you rebuild the field first.

## Empty Results on Non-English Text

{{< figure src="/articles_data/keyword-search-in-qdrant/where-words-end.svg" alt="Diagram: unspaced Japanese text becoming a single unsearchable token under the default tokenizer, then segmented into two searchable terms under the multilingual one. Below it, an accented word matched by an unaccented query once ASCII folding is on." width="100%" >}}

Word order isn't the only thing an index can miss. Your Japanese, Chinese, or Thai searches come back empty, and nothing says why. The default tokenizer finds word boundaries by looking for spaces, so unspaced text becomes one token with nothing findable inside it. The fixes are settings you have to ask for, though our corpora are English, so this is behavior we probed rather than retrieval quality we measured.

- **Multilingual tokenizer** Switch to it when unspaced text returns nothing; it segments Japanese, Chinese, and Thai.
- **ASCII folding** It's off by default. Turn it on so an unaccented query still reaches "München".
- **Segmentation, not substrings** A short word won't find a longer compound that contains it, and German compounds don't split.
- **No visibility** Qdrant won't report how it tokenized a value, so an empty result leaves nothing to inspect.
- **Both surfaces** BM25 takes the same setting, so set it there too, or your text filters correctly and scores as one long word.

> Match the tokenizer to your text and searches that returned nothing start returning documents. Leave it wrong and the symptom is indistinguishable from an empty collection.

## Hybrid Search Isn't Always Better

{{< figure src="/articles_data/keyword-search-in-qdrant/distance-decides.svg" alt="Diagram: two cases side by side. When dense and sparse score close together, fusing pays. When they are far apart, fusing costs, because the weaker side's confident mistakes displace the stronger side's right answers. Upgrading the embedding model moves a setup from the first case to the second." width="100%" >}}

The ranking path's largest question arrives pre-settled, because everyone says hybrid search wins: you're about to add a sparse vector to a dense setup that already works. It can cost you instead, because fusion promotes whatever each side ranks first, and the weaker retriever's confident mistakes push the stronger one's right answers down. Score each retriever separately on your own labeled queries and read the distance between them.

- **Self-retrieval first** If your queries are also documents in the collection, each one retrieves itself at the top and every number after is wrong: fetch one extra result and drop the query's own document. Where this applies, it outweighs every other decision here.
- **Ranking, not threshold** Close together, or sparse ahead, and fusing pays; far apart and it costs. The distance called the outcome on nearly every pair where only the sparse method changed, but the turning point moves with your dense model, so no cutoff travels, and we only measured near the top of the results.
- **The upgrade trap** One event can flip your sparse half from asset to cost: an embedding model upgrade, dangerous because the dense side improves and nothing looks broken. Sparse helped on most corpora with a weak dense model. With a strong one it stopped helping almost everywhere, cost real ground on most of them, and the one gain left standing didn't survive correction.
- **No merge rescue** No merge setting rescues a wide distance. RRF (Cormack, Clarke, and Buettcher, 2009) shares its rank constant across both legs, so it can't down-weight a retriever at all. Per-leg weights can, and the best one we found sat inside our own measurement noise, chosen on the same queries it was scored on.
- **Keep the text index** Whatever the distance says, exact matching is a job no model upgrade covers.

> Scoring each retriever on its own tells you whether to fuse before you build it. That is a morning of work against a change you might otherwise have to undo, and it is worth repeating the day you upgrade your dense model.

## No Sparse Method Wins Everywhere

{{< figure src="/articles_data/keyword-search-in-qdrant/ordering-reverses.svg" alt="Diagram: BM25, SPLADE and miniCOIL ranked first, second and third across four corpora, with the order changing at every one and the lines crossing." width="100%" >}}

You've decided to fuse and want a name. No recommendation travels, because the ranking between BM25, SPLADE, and miniCOIL changes with the corpus, and the gap moves with the method. Score the ones you shortlist on your own labeled queries.

- **Different weight sources** BM25 counts words, no model involved. [SPLADE](https://huggingface.co/prithivida/Splade_PP_en_v1) learns its weights with a transformer and adds terms a document never used, so a "cardiac arrest" page answers "heart attack" while staying a bag of words. [miniCOIL](/articles/minicoil/) keeps BM25's formula with contextual weights, so "bank" in a river sentence differs from "bank" in a finance one.
- **Ordering reverses by corpus** SPLADE placed first on two corpora and last on two others, and BM25 never won one where all three ran, so learned weights aren't simply an upgrade on counting. We scored five English corpora, three of them for miniCOIL, and only near the top of each ranking.
- **Query-time cost** Each added SPLADE term is another posting list to walk. Our runs scored quality and not latency, so that cost has no number.
- **Set `Modifier.IDF` per model** BM25 and miniCOIL need it, since neither stores collection statistics in its weights: without it, BM25's ranking isn't weak but broken. SPLADE's weights already carry term importance, which the modifier double-counts. Nothing errors either way.
- **miniCOIL encodes locally** Our deployment has no in-cluster inference for it, and its query and document encoders differ.

> Shortlist all three and score them on your own queries. The winner changed on every corpus we tried, so your own measurement is the only thing that transfers.

## What No Setting Will Fix

{{< figure src="/articles_data/keyword-search-in-qdrant/three-limits.svg" alt="Diagram: three limits and the route through each. A misspelled query goes to the dense vector, a fragment mid-token has no route today, and weighting a title over a body needs one sparse vector per field." width="100%" >}}

Whichever method you pick, your users will ask for things no keyword setting delivers, and tuning toward them wastes time. Design around these limits instead.

- **Misspellings** No path or sparse setting corrects a typo. A typo barely moves the meaning, so it's your dense vector's job, and why you keep it when the gap says not to fuse. Our catalog is too small to size the effect, though it shows the shape: dense answered every misspelled query, BM25 most, the filter path none.
- **Mid-word fragments** The tokenizer splits on hyphens and underscores, so a part number inside a longer code already matches, and the opt-in prefix tokenizer covers leading fragments. Only a fragment mid-token stays unreachable.
- **Field boosts** One sparse vector is one bag of words with no notion of fields. Per-field sparse vectors plus per-leg weights buy one weight per field, at the cost of storage and a prefetch per field per query, the only route today.

> Keep your dense vector and the typo problem takes care of itself. The other two want designing around, not tuning toward.

## What to Do First

- Set `avg_len` from your own corpus mean, counted the way BM25 counts, before concluding keyword ranking doesn't suit your data.
- Turn phrase matching on when you create the index, not when a user first quotes a product code.
- Match the tokenizer to your language on the ranking path as well as the filter path, and fold accents your users skip.
- Measure the gap between your retrievers before you fuse, and again the day you change embedding models.
- Keep the dense vector and the text index whatever the distance says, and design around the typo and field-boost limits.
- Otherwise change nothing. Stemming and the stopword list earned their defaults on our corpora.

## Where to Go Next

- [Payload documentation](/documentation/manage-data/payload/): the text index options, phrase matching and the tokenizers included.
- [Vectors documentation](/documentation/manage-data/vectors/): how sparse vectors are stored, queried, and fused with dense ones.
- [BEIR](https://github.com/beir-cellar/beir): the five retrieval collections behind every result here, scored with nDCG@10 on Qdrant v1.19.0.
- `qdrant-keyword-guide`, a private repository: the code, the raw per-query results, and the measurement limits behind this guidance.

To talk through your own setup, [get in touch](/contact-us/).
