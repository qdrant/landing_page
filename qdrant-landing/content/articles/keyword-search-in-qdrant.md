---
title: "How to Configure Keyword Search in Qdrant"
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

Search gets interesting when someone knows exactly what they want. Maybe they type a product number like `AB123`, paste an error code, or search for the exact phrase "brake pad."

Dense search is great when the user is searching by meaning. But when they've typed a part number, something similar isn't good enough. They want that part number.

That's where keyword search comes in. In Qdrant you can keep the dense search you already have and add two keyword paths beside it: a payload text index for literal matching, and a sparse vector for ranking. Both live in the same collection as your dense vectors, so what you're really deciding is which one should handle which search.

## Two Keyword Paths, Two Different Jobs

Imagine someone searches your catalog for `brake pad`. Sometimes you just need to know which documents contain those words, and that's the payload text index: it filters the collection without scoring or ordering anything. Other times you have hundreds of matching documents and need to decide which should come first. That's what sparse vectors are for.

Qdrant can use BM25 for sparse ranking, or you can bring in SPLADE or miniCOIL. If sparse search helps, you can combine it with your dense results.

Tokenizers, stemming, stopwords, and ASCII folding all exist on both paths, and configuring the text index doesn't configure your sparse vectors. If you want both sides treating the text the same way, you have to set both.

{{< figure src="/articles_data/keyword-search-in-qdrant/four-decisions.svg" alt="Diagram: the four decisions laid against the two surfaces they sit on. Padlock glyphs mark the choices fixed when you create the index or upload your points, caliper glyphs mark the ones only your own data settles, and cells drawn solid were scored on BEIR while hatched cells are behavior we probed." width="100%" >}}

For most workloads there are four decisions worth your attention:

1. `avg_len` for BM25
2. Phrase matching for exact text
3. The tokenizer your content needs
4. Whether sparse and dense should be fused

The last one is where I'd start testing.

## Do Not Assume Hybrid Search Is Better

{{< figure src="/articles_data/keyword-search-in-qdrant/distance-decides.svg" alt="Diagram: two cases side by side. When dense and sparse score close together, fusing pays. When they are far apart, fusing costs, because the weaker side's confident mistakes displace the stronger side's right answers. Upgrading the embedding model moves a setup from the first case to the second." width="100%" >}}

It's easy to think dense understands meaning, sparse understands keywords, so combining them must be better. Sometimes that holds, and often it doesn't. The only way to find out is to test dense alone, sparse alone, and the two together on the same queries.

If dense and sparse land reasonably close, fusion can help. If dense is much stronger, the sparse side starts promoting its own mistakes and pushing better dense results down.

I hit this after switching to a stronger embedding model. Sparse search didn't significantly improve any of the five corpora I tested, and it significantly hurt three of them. Nothing in Qdrant was broken; the dense retriever had simply gotten good enough that equal fusion stopped being useful. So repeat this test whenever you change embedding models.

Two things can wreck the measurement itself.

The first is self-retrieval. If your queries are also documents in the collection, remove them before scoring. On ArguAna, doing that moved nDCG@10 from `0.2639` to `0.3518`, a 25 percent difference, which was the largest effect of any protocol decision I made. It's a measurement artifact, not a tuning win, and if you leave it in every number after it is wrong.

The second is run-to-run noise. Query the same fused collection twice without changing anything: tie breaking alone moved 120 of 323 top 10 results on NFCorpus and 105 of 300 on SciFact. If a gain is smaller than the normal movement between your own two runs, I wouldn't call it an improvement.

All of this only decides whether you need sparse *ranking*. You can still use the text index for exact phrases, identifiers, and other literal searches even when fusion doesn't help.

## Pick Sparse Search Based on the Workload

{{< figure src="/articles_data/keyword-search-in-qdrant/ordering-reverses.svg" alt="Diagram: BM25, SPLADE and miniCOIL placed first, second and third on each corpus. SPLADE leads on two and trails on three, miniCOIL leads on two, and BM25 sits second on every corpus where all three methods ran." width="100%" >}}

If sparse ranking earns a place, the next question is which method. BM25, SPLADE, and miniCOIL all produce sparse vectors, but they behave differently.

BM25 is the straightforward choice when your users search with the same terms that appear in your documents. SPLADE can add related terms that were never in the original text, which helps when users describe things differently from your content. miniCOIL adds contextual weighting, useful when the same word means different things depending on where it appears.

There was no universal winner in my testing. SPLADE finished first on two corpora and last on three, while BM25 stayed around the middle. miniCOIL only ran on three of the five, ArguAna, NFCorpus, and SciFact, so its comparisons rest on a narrower base than the other two. The order changed with retrieval depth as well: on NFCorpus, SPLADE was last at nDCG@10 and first at nDCG@100.

So there's no sparse model I'd blindly pick for every application. Test the one that matches how your users search, and test it at the depth you actually serve.

BM25 and miniCOIL need `Modifier.IDF`. SPLADE doesn't, because its weights already carry term importance.

```python
qc.create_collection(
    collection_name="docs",
    vectors_config={
        "dense": models.VectorParams(
            size=1024,
            distance=models.Distance.COSINE,
        )
    },
    sparse_vectors_config={
        "text-sparse": models.SparseVectorParams(
            modifier=models.Modifier.IDF,
        )
    },
)
```

For SPLADE, pass `None` instead.

## Use the Text Index When the Words Themselves Matter

Back to `brake pad`. You probably don't want documents that mention "brake" near the top and "pad" somewhere near the bottom. You want the phrase. That's what phrase matching is for.

```python
qc.create_payload_index(
    collection_name="docs",
    field_name="text",
    field_schema=models.TextIndexParams(
        type=models.TextIndexType.TEXT,
        tokenizer=models.TokenizerType.WORD,
        lowercase=True,
        phrase_matching=True,
    ),
    wait=True,
)
```

With phrase matching on, the words have to appear together and in order. In my testing it matched all 180 phrases I pulled from real corpus text, while a normal AND query returned a median of 4.3 to 7 times as many documents, because it also caught every document where those words happened to appear separately. That gap is the whole point for catalogs, product names, support documentation, and error codes.

Turn phrase matching on when you create the index. Adding it later rebuilds that field.

Identifiers work naturally here too, since the word tokenizer already splits on hyphens and underscores, so a code inside `ABC-123-RED` becomes searchable on its own. There's also a prefix tokenizer when you need to match the start of a token. What you don't get today is arbitrary matching from the middle of one, so if your application leans on that, design around it before you index the catalog.

## Match the Tokenizer to the Language

{{< figure src="/articles_data/keyword-search-in-qdrant/where-words-end.svg" alt="Diagram: unspaced Japanese text becoming a single unsearchable token under the default tokenizer, then segmented into two searchable terms under the multilingual one. Below it, an accented word matched by an unaccented query once ASCII folding is on." width="100%" >}}

English makes tokenization look simple because spaces usually show where words begin and end. Japanese, Chinese, and Thai don't work that way, and with a normal word tokenizer a long unspaced string becomes one giant token, leaving everything inside it hard to reach. Qdrant's multilingual tokenizer handles that segmentation for you.

In a small test of five documents and 11 queries across Japanese, Chinese, and Thai, switching tokenizers took 8 of those 11 from returning nothing to returning the right document.

ASCII folding solves a different problem. If your content has `München` and someone searches `Munchen`, folding lets those match.

Just remember to set the same behavior on the sparse side, or your text index will segment one way while BM25 ranks another. And segmentation won't give you substring search: a short term still can't be found inside a longer compound on its own.

## Check BM25's Average Document Length

{{< figure src="/articles_data/keyword-search-in-qdrant/wrong-yardstick.svg" alt="Diagram: the spread of document lengths in a corpus, with the corpus mean marked in green and BM25's fixed default of 256 marked in red far to the right. BM25 divides every document's length by the red line rather than the green one." width="100%" >}}

BM25 needs to know roughly how long the average document in your corpus is, and Qdrant's bundled model assumes an `avg_len` of `256`. That might match your data. It might not. If your documents average closer to 70 tokens, BM25 is still normalizing them against 256 until you say otherwise.

So calculate the average before you upload, and count it the way BM25 counts, with stopwords removed. A raw word count runs high and undoes the correction you came for.

```python
avg_len = round(
    sum(content_tokens(d) for d in docs) / len(docs),
    1,
)

options = models.Bm25Config(
    avg_len=avg_len,
    k=1.2,
    b=0.75,
)
```

Use the same `options` for documents and queries. The value gets baked into the stored BM25 weights, so changing it later means reindexing.

Correcting `avg_len` improved all five corpora I tested, with gains from `0.0035` to `0.0676` nDCG@10. ArguAna and SCIDOCS stayed significant after multiple comparison correction; the other three moved the same way, but by small enough margins that I'd still validate it on your own data.

One exception is worth spelling out. If you're using the multilingual tokenizer for unspaced text, a normal word counter may see one or two tokens where Qdrant sees dozens, and your calculated average ends up worse than the default. Leave `avg_len` alone until you can count the same tokens Qdrant produces.

## What I Would Configure First

If you already have dense search running, I'd build keyword search in this order:

1. Create the text index with the tokenizer your content needs.
2. Enable phrase matching if users search for exact phrases.
3. Apply the same tokenizer and ASCII folding to BM25.
4. Measure your corpus `avg_len` before uploading.
5. Remove self-retrieval before evaluating anything.
6. Test dense, sparse, and fused separately.
7. Repeat the fused test so you know your normal measurement noise.
8. Test again whenever you change embedding models.
9. Keep the text index for literal search even if sparse fusion doesn't help.

Most other settings can stay at their defaults until your workload gives you a reason to change them. Two limits you design around instead of tuning: there's no matching from the middle of a token today, and field boosts need a separate sparse vector per field plus a query leg for each. Those are architecture decisions.

You end up with three retrieval paths in one collection. Which of them your users need is a question your own queries answer.

## How I Measured This

Every number here came from the same setup, so you can rebuild it and check the results.

I used five [BEIR](https://github.com/beir-cellar/beir) collections: ArguAna, FIQA, NFCorpus, SCIDOCS, and SciFact. The sparse legs were `Qdrant/bm25`, `prithivida/Splade_PP_en_v1`, and `Qdrant/minicoil-v1`, with miniCOIL running on ArguAna, NFCorpus, and SciFact only. The dense legs were `sentence-transformers/all-MiniLM-L6-v2` and `mixedbread-ai/mxbai-embed-large-v1`.

BM25 ran at k=1.2 and b=0.75, with retrieval depth 100, scored using nDCG@10 on Qdrant v1.19.0 with in-cluster inference. On ArguAna, where the queries are themselves documents in the collection, each query's own document was dropped before scoring.

Two caveats on provenance. The cross-method comparisons between BM25, SPLADE, and miniCOIL span more than one version of the harness, so read those orderings as point estimates rather than controlled swaps. And the two hand-probed results, the 180 phrases and the 11 multilingual queries, ran against client 1.18.0, so treat them as behavior checks.

## Where to Go Next

* [Payload documentation](/documentation/manage-data/payload/): text index options, phrase matching, and tokenizers.
* [Vectors documentation](/documentation/manage-data/vectors/): sparse vectors and hybrid search.
* [BEIR](https://github.com/beir-cellar/beir): the retrieval collections behind these measurements.

To talk through your own setup, [get in touch](/contact-us/).
