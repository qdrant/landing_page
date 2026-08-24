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
draft: true
---

Search that understands meaning is very good at questions. Someone asks for "cheap flights to Berlin." It finds a page about "affordable airfare to Germany," even though those two phrases barely share a word. That's what dense vector search does well, and it's why most teams start there and stay happy for a while.

Then someone searches for an error code. Or a part number, a surname, a phrase in quotes. The results come back reasonable, related, and completely wrong. Nothing broke: the engine found things that mean something similar, which is exactly what it was built for. "Similar" was never what the user asked for.

So you add keyword search alongside it. That's the right call. Keyword search is the older idea: match the words the user actually typed, then rank by how telling those words are. The two approaches fail in opposite directions, so running both and merging the results usually beats either one alone. That combination is what people mean by [hybrid search](/documentation/search/hybrid-queries/).

Qdrant's tools for the keyword half grew quickly across v1.15.0 and v1.16.0. Exact phrase matching, tokenizers for languages that don't put spaces between words, stemming, stopword lists, accent folding. Each has a documentation page telling you what it does.

What no page tells you is which of them you need.

That's the hard part, because none of these settings fail loudly. Get one wrong and you get no error, just results that look plausible and are quietly worse than they should be. And a default is a guess about somebody's data, which isn't yours: one of them is a fixed number sitting in BM25's scoring formula, wrong for most collections, and it's the first option below.

So this is four decisions, each with the same three questions: when you want it, when to leave it alone, and how to tell which applies to you.

The numbers below come from five [BEIR](https://github.com/beir-cellar/beir) corpora, ArguAna, FIQA, NFCorpus, SCIDOCS and SciFact, as of Qdrant v1.19.0, with per-query significance testing. Dense retrieval is `sentence-transformers/all-MiniLM-L6-v2` unless stated, the stronger model later is `mixedbread-ai/mxbai-embed-large-v1`, and the sparse methods beside `Qdrant/bm25` are `prithivida/Splade_PP_en_v1` and `Qdrant/minicoil-v1`. Where a result didn't survive correction, it says so, and the two smaller demonstrations are labeled where they appear.

## Two Places Text Matching Happens

One distinction decides which of those four are even relevant to you.

**The [payload](/documentation/manage-data/payload/) text index is a filter.** Payload is Qdrant's word for the JSON you attach to each point. An index over a text field there answers one question: does this document contain these words, yes or no? No score, no ordering. It narrows the candidates and hands them on.

**A [sparse vector](/documentation/manage-data/vectors/) is a ranking.** Sparse just means a vector that's mostly zeros, with one weight per word instead of a few hundred abstract dimensions. Qdrant's built-in `Qdrant/bm25` model turns your text into one of these.

[BM25](/articles/minicoil/) is the classic keyword scoring formula: a word counts for more when it appears often in one document and less when it's common everywhere. Those scores get merged with your dense vector's.

{{< figure src="/articles_data/keyword-search-in-qdrant/two-mechanisms.svg" alt="Diagram: a query splits into two paths. The payload text index answers contains-or-not and narrows a candidate set; a sparse vector scores, ranks, and fuses with a dense vector." caption="The two places text matching happens. The filter decides what comes back at all; the ranking decides what order it comes back in. Seven settings exist on both, under the same names." width="100%" >}}

If your complaint is "the right document never comes back at all," you have a filter problem. If it's "the right documents come back, but in the wrong order," you have a ranking problem.

They're configured separately, which is what catches people out. Seven settings exist on **both** surfaces under the same names, including `tokenizer`, `stemmer`, `stopwords`, and `ascii_folding`. Switching your text index to the multilingual tokenizer does nothing at all to how BM25 scores Japanese. If you want a behavior in both places, set it in both places.

Same names, and not always the same defaults. Leaving `stemmer` unset means Snowball English on the BM25 side and no stemming at all on the index side, so "stemming is on by default" is true of one and false of the other.

## How to Tell What You Need

Every recommendation below ends with a way to check it, and they all use one setup: labeled queries, run three ways, scored.

Set `Modifier.IDF` on the collection for BM25 and miniCOIL, and leave it off for SPLADE, whose learned weights already carry term importance. Without it BM25's ranking isn't weak, it's broken:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY,
                      cloud_inference=True)      # both models run in-cluster

client.create_collection(
    collection_name=COLLECTION,
    vectors_config={"dense": models.VectorParams(
        size=DIM, distance=models.Distance.COSINE)},
    sparse_vectors_config={"bm25": models.SparseVectorParams(
        modifier=models.Modifier.IDF)},
)
```

Then the comparison. Run it once per sparse method you're considering:

```python
YOUR_SPARSE_MODEL = "Qdrant/bm25"   # or Splade_PP_en_v1, or minicoil-v1
YOUR_DENSE_MODEL  = "sentence-transformers/all-MiniLM-L6-v2"
SPARSE_OPTIONS    = None            # BM25 only: see Tuning BM25

def three_ways(collection, query_text):
    sparse = models.Document(text=query_text, model=YOUR_SPARSE_MODEL,
                             options=SPARSE_OPTIONS)
    dense = models.Document(text=query_text, model=YOUR_DENSE_MODEL)
    DEPTH = 100    # same for all three, or you compare depths not methods

    sparse_only = client.query_points(collection_name=collection, query=sparse,
                                      using="bm25", limit=DEPTH)
    dense_only = client.query_points(collection_name=collection, query=dense,
                                     using="dense", limit=DEPTH)
    fused = client.query_points(
        collection_name=collection,
        prefetch=[models.Prefetch(query=sparse, using="bm25", limit=DEPTH),
                  models.Prefetch(query=dense, using="dense", limit=DEPTH)],
        query=models.FusionQuery(fusion=models.Fusion.RRF), limit=DEPTH)
    return sparse_only.points, dense_only.points, fused.points
```

**One trap first.** If your queries are also documents in the collection, each one retrieves itself at rank one and every score is wrong. That is true of ArguAna, which this article quotes often: leaving the query's own document in costs **25%** of nDCG@10 there, 0.2639 against 0.3518. Fetch one extra and drop it before scoring. Where this applies it outweighs everything else on this page.

Score the three result sets with whatever metric suits your data. Ours is [nDCG@10](https://en.wikipedia.org/wiki/Discounted_cumulative_gain), which rewards putting the right answers near the top of the first ten rather than merely somewhere in them. `cloud_inference=True` keeps both models in the cluster, which is a managed Cloud feature; self-hosted, you encode locally and upsert vectors.

> *Run every fused comparison twice. Querying the same collection again, with no re-indexing, moved a third of our top-10 results, so treat any fused difference under **0.004** as noise.*

## Tuning BM25

*Ranking path, BM25 only*

**Do this:** set `avg_len` to your corpus mean, counted the way BM25 counts. It defaults to **256** regardless of your documents, and BM25 divides every document's length by that number, so a wrong average distorts every score.

That is the whole option. Most people who conclude BM25 doesn't work on their data are looking at a misconfigured BM25, and this is usually the misconfiguration. SPLADE and miniCOIL have no `avg_len`, `k`, or `b` at all, so if you're using one, skip ahead to whether to fuse at all.

It moved every corpus the right way, though only two of five gains survived correction. The big number is the best case, not the expected one:

| Corpus | Content mean | Default `avg_len=256` | Corrected | Change | Survived correction |
|---|---|---|---|---|---|
| ArguAna | 96.7 | 0.3518 | 0.4194 | <span class="text-success">+19.2%</span> | yes |
| SCIDOCS | 116.5 | 0.1500 | 0.1573 | <span class="text-success">+4.8%</span> | yes |
| FIQA | 72.1 | 0.2435 | 0.2506 | <span class="text-success">+2.9%</span> | no |
| NFCorpus | 166.2 | 0.3238 | 0.3273 | <span class="text-success">+1.1%</span> | no |
| SciFact | 151.6 | 0.6830 | 0.6885 | <span class="text-success">+0.8%</span> | no |

**Leave stemming and the stopword list alone.** Stemming is on by default and earned its place on three of five corpora; changing the stopword list moved one. Count your mean without stopwords, since the engine strips 127 of them before scoring and a raw word count comes out far too high. On very short documents try it both ways, because that was the one corpus where the raw count won:

```python
import re, statistics
from qdrant_client import models

# The 127 words Qdrant/bm25 actually removes, found by probing the engine. The
# shipped english.txt lists 179; its extra 52 are contraction fragments.
STOPWORDS = frozenset("""
    a about above after again against all am an and any are as at be because
    been before being below between both but by can did do does doing don down
    during each few for from further had has have having he her here hers
    herself him himself his how i if in into is it its itself just me more most
    my myself no nor not now of off on once only or other our ours ourselves
    out over own s same she should so some such t than that the their theirs
    them themselves then there these they this those through to too under
    until up very was we were what when where which while who whom why will
    with you your yours yourself yourselves
""".split())

def content_length(text):
    return sum(1 for tok in re.findall(r"\w+", text.lower(), re.UNICODE)
               if tok not in STOPWORDS)

YOUR_MEAN = statistics.fmean(content_length(d) for d in your_documents)
SPARSE_OPTIONS = models.Bm25Config(avg_len=YOUR_MEAN)

# Assumes spaces between words. On Japanese, Chinese or Thai it returns about 2
# per document, worse than the default: use the multilingual tokenizer instead.
```

Then upsert with `models.Document(text=..., model="Qdrant/bm25", options=SPARSE_OPTIONS)` so index time and query time agree.

{{< figure src="/articles_data/keyword-search-in-qdrant/avg-len-gain.svg" alt="Bar chart of the relative gain from correcting avg_len from its default of 256 to the measured corpus mean, positive on all five BEIR corpora." caption="Relative gain from setting avg_len to the measured corpus mean instead of the default 256. Positive on all five corpora tested, median about 3%, two of five surviving correction." width="100%" >}}

**Use this when** you're about to conclude that BM25 doesn't work for you.

**Skip it when** your documents genuinely average near 256 content tokens. That's the one case where the default is already right.

**How to tell:** measure your corpus average the way BM25 counts, pass it in, rebuild, compare. Don't try to predict the gain from how far your mean sits from 256, because on our corpora that distance didn't track the effect.

**Watch for:** changing `avg_len` means re-indexing every point, since the value is baked into each stored weight at upload. It isn't a setting you can edit on a live collection. If that collection also carries a dense vector, you pay that model's inference cost a second time for every document.

## Exact Terms and Phrases

*Filter path*

Reach for the payload text index when a query has to match specific words rather than a general idea. Product codes, error strings, names, anything a user would put in quotes.

Phrase matching is the piece most people miss, because the flag is off by default:

```python
client.create_payload_index(
    collection_name="my_collection",
    field_name="content",
    field_schema=models.TextIndexParams(
        type=models.TextIndexType.TEXT,
        tokenizer=models.TokenizerType.WORD,
        lowercase=True,
        phrase_matching=True,     # off unless you say otherwise
    ),
)
```

Without it you can still require that both words are present. You can't require that they sit next to each other, in that order.

That difference is bigger than it sounds. On phrases pulled from real corpus text, phrase matching was exact on 180 of 180 across three corpora. Asking for both words separately returned a median of four to seven times as many documents, every one of them containing both words somewhere and not the phrase.

While you're here: make sure every field you filter on has an index at all. An unindexed field degrades quality silently, and under strict mode it's rejected outright.

**Use it when** word order changes the meaning.

**Skip it when** your queries are conversational and matching in any order is doing you a favor.

**How to tell:** take 20 queries where you know the answer, run each as a phrase and again as a both-words match, and count the extra documents. If the counts are close, you don't need this.

**Watch for:** without the flag, behavior depends on where you're running. With strict mode on, the default on Qdrant Cloud, the query fails with a 400 naming the index type it wanted. Self-hosted with strict mode off, we expect it to return nothing instead, which would send you off debugging your tokenizer when the problem was configuration. We only measured the Cloud behavior. Adding the flag later means rebuilding that field's index.

## Non-Latin and Accented Text

*Filter path, and separately the ranking path*

A tokenizer decides where one word ends and the next begins. The default splits on spaces, which is a fine rule for English and a disastrous one for Japanese, Chinese, or Thai, because those languages don't put spaces between words. A whole sentence becomes one token, and nothing inside it can be found.

```python
field_schema=models.TextIndexParams(
    type=models.TextIndexType.TEXT,
    tokenizer=models.TokenizerType.MULTILINGUAL,
    lowercase=True,
)
```

In a demonstration set of five documents and 11 queries, switching to the multilingual tokenizer took 8 of them from returning nothing to returning the right document, across Japanese, Chinese, and Thai. Searching `京都` for the Kyoto article returned nothing on the word tokenizer and the right article on the multilingual one. That shows the tokenizer is the blocker; it isn't a measurement of quality.

ASCII folding is the related setting for European text, making `Munchen` match `München`. It's **off** by default, and your users won't always type the accent.

This is the filter path only. If you also rank with BM25, set the same tokenizer in your `Bm25Config`, or your Japanese will filter correctly and score as though it were one long word.

**Use them when** your text isn't space-delimited, or carries accents your users may skip.

**Skip them when** your content is plain English.

**How to tell:** index 10 documents in your hardest language, then search for a word you can see inside one of them. Nothing back means the tokenizer is your problem.

**Watch for:** this is real word segmentation, not substring matching, which is both what you want and where it stops. `東京` won't find a document containing `東京都`, because segmentation treated that as a single word. German surprised us: `Krankenhausarzt` already worked without the multilingual tokenizer, and `Krankenhaus` still doesn't find it, because compounds aren't broken apart. There's also no way to ask Qdrant how it tokenized a value, so an empty result leaves you nothing to inspect.

## Whether to Fuse at All

*Ranking path*

Should you put a sparse vector next to your dense one and merge them? Score each retriever separately on the same labeled queries, then take `(dense - sparse) / dense`. That single number decides it.

Close together, or sparse ahead, and fusing pays double digits. Far apart and it costs you, because merging promotes whatever each side ranks first, so the weaker side's confident wrong answers push the stronger side's right answers out.

{{< figure src="/articles_data/keyword-search-in-qdrant/sparse-contribution-by-model.svg" alt="Paired bar chart of what the sparse prefetch adds on top of dense across five BEIR corpora, under two embedding models, with the stronger model at or below zero on four of the five." caption="What the sparse prefetch adds on top of dense, under two embedding models. With the stronger model it stops helping significantly anywhere and costs 7 to 8.5% on three corpora." width="100%" >}}

**Use it when** your two retrievers score comparably on your own labeled queries.

**Skip it when** one clearly beats the other. Keep the text index either way, because exact matching is a different job that no model upgrade covers.

**How to tell:** run the three-way comparison from earlier with each sparse method you're considering. Compare `sparse_only` against `dense_only` for the gap, then check whether `fused` beats `dense_only`. The smallest gap is the one to fuse.

**Watch for:** re-check after any embedding model change. An upgrade is normally good news, and it is the one event that can quietly flip your sparse half from asset to cost, precisely because your other numbers went up and nothing looks wrong. With a weak dense model the sparse half helped on most corpora; with a strong one it stopped helping anywhere and cost 7% to 8.5% on three of five.

And don't expect the merge settings to rescue a wide gap. RRF's rank constant `k` is shared by both legs, so it cannot down-weight a retriever, and 12 sweeps of it came back negative. Per-leg `weights` can, and lowering the sparse weight lifted the score every time, on all five corpora, but only toward not fusing: as that weight approaches zero the fused ranking approaches `dense_only`, and none of the five went past it. FIQA came closest, landing 0.0001 short of simply dropping the sparse half.

### Why There Is No Shortcut

There is no best sparse method to name, because the ranking between them reverses by corpus. On ArguAna, SPLADE beat the dense model outright and fusing paid **17.7%** against BM25's 1.9% and miniCOIL's 0.6%, on NFCorpus and SciFact that order inverts with miniCOIL leading, and as standalone retrievers the three differ by as much as 27%. A recommendation that travels between corpora does not exist, so this section hands you a measurement instead.

What does travel is the gap, which called the outcome correctly on **21 of 22** swaps where only the sparse method changed. Read it as a ranking rather than a cutoff, since one corpus still gained at a 29.9% gap while another lost at 27.2%, and the turning point moves with your dense model. It is a rank-10 result across five corpora, three of them for miniCOIL, and none of the machinery is new: RRF is Cormack, Clarke and Buettcher, 2009.

## Three Limits to Design Around

Three things the keyword paths will not do for you, and what to reach for instead.

**Misspellings: use your dense vector.** Neither keyword path corrects a typo, and no sparse setting will. A typo barely moves the meaning, so the dense side handles it: on six misspelled queries over a ten-product catalog the text index found none, BM25 five, the dense vector all six. Ten documents shows the shape of that, not its size.

**Fragments inside a word: split the field, or index prefixes.** The tokenizer splits on hyphens and underscores, so `1234` already finds `ABC-1234-XY` and `timeout` finds `ERR_TIMEOUT_5567`, and the `prefix` tokenizer covers leading fragments if you ask for it. What no setting reaches is a fragment in the middle of a token, so `234` will not find `ABC-1234-XY`.

**Boosting a title over a body: one sparse vector per field.** A single sparse vector is one bag of words for the whole document, so it has no notion of fields. Give each field its own sparse vector and per-leg RRF `weights` gives you one weight per field. It costs storage and a prefetch per field on every query, and it is the only route to a field boost today.

The first is also the argument for keeping your dense vector even when the gap says not to merge. All three have a route through them; none has a single setting that solves it, so plan for them rather than tuning toward them.

## What to Do First

Every option above comes down to the same thing: the defaults are guesses about somebody else's data, and one measurement on yours beats any recommendation on this page. What changes is the order, because two of these are cheap to get right and one is expensive to change later.

- **If you rank with BM25**, set `avg_len` to your corpus mean first. It applies to every BM25 workload, costs one measurement, and moved every corpus we tried in the right direction by a median of about 3%.
- **If word order carries meaning in your queries**, turn phrase matching on before you need it. Adding it later means rebuilding that field's index.
- **If your text is not space-delimited**, switch to the multilingual tokenizer, and turn on ASCII folding if it carries accents your users may skip.
- **If you are considering a sparse vector alongside a dense one**, measure the gap before you add it. That answer changes by corpus, and again the day you upgrade your embedding model.
- **Otherwise, change nothing.** Stemming and the stopword list earned their defaults on our corpora.

To talk through your own setup, [get in touch](/contact-us/).

---
