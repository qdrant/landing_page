---
title: "miniCOIL EN-ES: Sparse Neural Retrieval Across the Language Barrier"
short_description: "miniCOIL goes bilingual: concept-based exact matching for English and Spanish, research preview."
description: "miniCOIL goes bilingual: concept-based exact matching for English and Spanish, research preview."
social_preview_image: /articles_data/minicoil-en-es/preview/social_preview.jpg
preview_dir: /articles_data/minicoil-en-es/preview
# TODO(cover): preview/* are generated from the placeholder cover; replace with the final cover set
weight: -230
author: Juan Pablo Sotelo and Evgeniya Sukhodolskaya
date: 2026-09-25T09:00:00+02:00
draft: false
keywords:
  - sparse neural retrieval
  - multilingual
  - cross-lingual
  - bm25
  - minicoil
category: embedding-research
---

*Sparse neural retrieval finally started getting more and more attention ([SPARSEUP](https://www.linkup.so/blog/introducing-sparseup-by-linkup), [MILCO](https://arxiv.org/abs/2510.00671), [sparse encoders in Sentence Transformers](https://huggingface.co/blog/train-sparse-encoder)...). Well, amazing, we like attention!*

Our [miniCOIL v1](https://qdrant.tech/articles/minicoil/) sparse neural retriever article ended with a promise: to keep working on this sparse neural retriever in-depth, improving the model's quality, and in-width, *"extending it to other dense encoders and to languages beyond English."*

Here is the next "in-width" step of the miniCOIL saga: to try and cross the language barrier, that is, make the model suitable for multilingual retrieval.  
It's a fun challenge, as sparse retrievers are hard to adapt to this scenario: exact matching in cross-lingual text search usually means translation.

Together with the team at [Pento](https://pento.ai), we came up with **miniCOIL EN-ES**: a bilingual sparse neural retriever where *"dog"* and *"perro"* land in the same cells of a sparse vector, *cells representing one concept*. This way, one inverted index serves English and Spanish queries and documents alike, no translation step in between.

{{< figure src="/articles_data/minicoil-en-es/00-hero-shared-slot.png" alt="miniCOIL EN-ES: the English word dog and the Spanish word perro both write into the same block of cells in one sparse vector." caption="miniCOIL EN-ES: \"dog\" and \"perro\" land in the same slot of a sparse vector." width="90%" >}}

We're sharing the design and a first set of results.  
We'd love your feedback: whether you'd use something of the kind, whether the approach works for you. If so, we'd scale the model's vocabulary and training, and let's see what comes next: the idea is easily transferable to other languages.

## Same Word, Different Language

Word-based sparse retrieval has a limitation that no amount of relevance-based weighting alone can fix: it is based on matching exact terms: *"dog"* and *"perro"* mean the same thing, but to BM25 and co. they don't: they are two different tokens in two different postings lists.

#### Translate, Then Search

The most common approach is to translate (documents, or queries, or even both). For example, if you'd like to stick with BM25, you could run the query through a machine translation model, then do BM25-based retrieval in the corpus language.

It works, but it puts a translation model in the hot path of a query, adds a dependency, and leads to management of a separate index (or a separate translated copy of the corpus) per language pair.

#### Dense Multilingual Retrieval

Multilingual dense encoders solve cross-lingual matching by construction: *"She won a prize"* and *"Ella ganó un premio"* land close together in embedding space. (At least in theory: many multilingual encoders group texts by language as well as by meaning, as our [recent blog](https://qdrant.tech/blog/shift-multilingual-rag/) on language bias shows.)

Yet dense retrieval is not a 1-1 alternative to full-text search. On the contrary, in many use cases it would shine combined with something more controllable, less recall-broad, as sometimes you're really just asking for *"I need THIS specific keyword to be in the document."*

#### Making Sparse Vectors Polyglots

We want cross-lingual matching with no translation step and no reliance on dense retrieval alone.

Instead, we want to reuse the miniCOIL recipe: keep BM25's reliable signals, a word's importance in the document (term frequency, normalized by document length) and its rarity across the corpus (IDF), and throw on top a small learned component that adds a word's meaning-in-the-context.  

However, in [miniCOIL v1](https://qdrant.tech/articles/minicoil/), the unit of the vocabulary is the English word: there's no cell in a miniCOIL v1 sparse vector for *"perro"*, and if there were, it wouldn't be the same cell as *"dog"*.

So the question that defined the next edition of the miniCOIL saga, "miniCOIL EN-ES", was: **what should a sparse slot represent, if not a word?**

## From Words to Concepts

That's how a concept of a **concept** was born (*applause*): a small set of English and Spanish words that translate to each other, such as `{cat, gato}` or `{house, home, casa, hogar}`.

> Concepts are not specific to English and Spanish; the approach is transferable to other languages. More about this further in the article.

{{< figure src="/articles_data/minicoil-en-es/01-concept-slots.png" alt="Two sparse vectors compared: miniCOIL v1 writes the English word dog into a 4-cell block; miniCOIL EN-ES writes the concept {dog, perro} into a shared 8-cell block. Both vectors keep a one-cell BM25 fallback for out-of-vocabulary words." caption="One slot per concept: in miniCOIL EN-ES \"dog\" and \"perro\" resolve to the same concept, and unresolved words fall back to BM25." width="90%" >}}

#### One Slot per Concept

While in miniCOIL v1, every English word in a 30k vocabulary got its own trainable layer-model and its own 4 consecutive cells-dimensions in the sparse vector, in miniCOIL EN-ES, every *concept* gets one trainable **head** in a similar manner.

When an English document says *"dog"* and a Spanish query says *"perro"*, both resolve to the same concept ID, both are projected by the same head, and both write into the same block of the sparse vector (in this model, 8 consecutive dimensions).  
That allows for both mono- and cross-lingual matching simultaneously, and still keeps miniCOIL's ability to resolve meaning-in-the-context.

#### Standing on the Shoulders of BM25, Again (We Got Comfortable)

*At this point, we're jumping on these shoulders with the comfort of a clingy toddler*

The scoring formula between sparse miniCOIL EN-ES vectors copy-cats the miniCOIL v1 approach. For every concept $c_i$ the query words map to, we look for documents whose words map to the same concept, in whichever language the document is written:

$$ \text{score}(D,Q) = \sum_{c_i \in \text{concepts}(Q)} \text{IDF}(c_i) \cdot \text{Importance}^{c_i}_{D} \cdot {\color{YellowGreen}\text{Meaning}^{c_i(Q) \times c_i(D)}} $$

Here $c_i(Q)$ and $c_i(D)$ are the query's and the document's vectors for concept $c_i$; if several words of one text map to the same concept, they are pooled into a single vector before scoring.

- The **Importance** component is the BM25 term weight the concept occurrence gets (*k, avg_len and b should be adjusted according to corpus statistics on concepts; however, consider this version with usual defaults a miniCOIL-EN-ES-let's-check-how-it-goes*).
- The **Meaning** component is the dot product of two low-dimensional (eight for this model) miniCOIL vectors, as in v1.

> **Note:** The BM25 formula is suitable not only for words: the probabilistic relevance framework behind it states *"the model is not restricted to terms and term frequencies — any property, attribute or feature of the document, or of the document–query pair, which we reasonably expect to provide some evidence as to relevance, may be included"* ([Robertson & Zaragoza, 2009](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf), Section 2.4).

**For every word that isn't in the concept vocabulary**, we keep the approach from v1: **fall back to plain BM25**.  

In an ideal world, whatever isn't part of this vocabulary is a named entity, a specific term, a code: something "untranslatable". We hope it matches exactly, one to one, no matter the language.  
*Of course, it's a weak assumption, and we'd like to try other fixes for out-of-vocabulary cross-lingual matches, like the LexEcho head in [MILCO](https://arxiv.org/abs/2510.00671); however, that's for the next editions.*

## Building a Concept Vocabulary

Before we can train a head per concept, we need concepts themselves, a vocabulary of them.

#### Dictionary as a Graph

To build the concept vocabulary we use the [MUSE bilingual dictionaries](https://github.com/facebookresearch/MUSE): about 112k English-to-Spanish and a same-ish amount of Spanish-to-English pairs. Each pair is an edge in a bipartite graph, English and Spanish words on the two sides, and a concept is a tightly connected community in that graph.

Running community detection ([Louvain](https://arxiv.org/abs/0803.0476)) over the aforementioned dictionary graph gives us candidate concept clusters:
* We keep only clusters that contain at least one word in both languages. 
* We also cap cluster size: Louvain's resolution parameter controls how granular the communities are (higher resolution favors smaller, tighter ones), so on any cluster that grows too large we re-run Louvain with the resolution bumped up, until the concept's word count fits under the cap.

#### The "bajo" Problem

The first attempt produced a few clusters of several hundred words, a little too many. The culprit is polysemy: Spanish *"bajo"* means *low*, *bass*, *short* and *under*; each of those English words has its own translations, and one such word is enough to stitch dozens of weakly related terms into one giant hairball of a concept.

The fix we used is not very glamorous (as anything else heuristics-, in-my-expert-opinion-it-is-ok-based):  
MUSE lists translations in frequency order, so we keep only the **top-2 translations per source word** before building the graph. Combined with a maximum cluster size of 20, this yields about 80k clean concepts, median size 2 (a typical concept is literally just a word and its translation, like `{cat, gato}`) and 99th percentile size 9.

{{< figure src="/articles_data/minicoil-en-es/02-muse-graph.png" alt="Left: a bipartite English-Spanish dictionary graph with tight communities forming concepts. Right: the polysemous Spanish word bajo stitching many unrelated words into one giant cluster." caption="Concepts are Louvain communities in a bilingual dictionary graph. Polysemous words like Spanish \"bajo\" stitch many unrelated terms together, so we had to cap the resulting concept size." width="90%" >}}

#### 80k Concepts Are 30 Times Too Many

To verify whether the approach works, keeping 80,000 concepts and training a layer for each seemed unnecessary (for example, we could live without the {mockingjay, sinsajo} one).

To trim the concept vocabulary, we streamed English and Spanish Wikipedia, split articles into sentences, and counted how many sentences contain each concept in each language, keeping only concepts with enough evidence on both sides. This leaves roughly 12,000 concepts with enough sentences for a per-concept head to learn to light up the right sense region of its concept, in whichever of the two languages the match comes in.

For the released model we went even further and kept, out of the 12k, only the concepts that mMARCO retrieval queries actually use. Ranking concepts by how many query-word occurrences they catch, the top 2,398 concepts grab 90% of everything the full 12k vocabulary would.  

So this [first, raw, small miniCOIL EN-ES](https://huggingface.co/Jocana/minicoil-en-es) trains only **2,398 concept heads**.

## Training miniCOIL EN-ES

The [v1 recipe](https://qdrant.tech/articles/minicoil/) was: take contextual word representations from an English-only dense encoder, and learn a one-layer projection into a tiny word meaning space, calibrated on how a bigger teacher encoder arranges sentences with that word. We kept the recipe and changed the ingredients (*a dad joke about paella and tacos*).

#### miniCOIL EN-ES Backbone

For miniCOIL EN-ES we need a multilingual input encoder that already "knows" English and Spanish, so that the trainable head focuses on the *sense*, not only on figuring out translation from scratch.

We tested the `multilingual-e5` family on parallel EN/ES sentence pairs.  
All sizes retrieved the parallel counterpart 100% of the time, with an average cross-lingual cosine similarity of 0.91 to 0.93. Hence, for convenience (*including availability of free inference on Qdrant Cloud*), we chose the smallest backbone option: [`intfloat/multilingual-e5-small`](https://huggingface.co/intfloat/multilingual-e5-small): 384 output dimensions, 118M parameters.

Each miniCOIL EN-ES head is consequently a `384 -> 8` projection: 3,072 weights (for comparison, a v1 per-word layer is `512 -> 4`, 2,048 weights).

#### Four Quadrants (not Qdrant's), Five Points

The v1 model trained on triplets: an anchor sentence containing the word, one positive sentence with this word in the same meaning and one negative sentence, where the same word has a different meaning. And the teacher encoder decides which of the two sits closer to the anchor.

Keep that objective unchanged in a bilingual setting, and nothing in it forces the two languages to mix: most sampled triplets are same-language, so a head can drive the loss to zero by arranging English sentences among English ones and Spanish among Spanish, as two separate regions. This way, *"dog"* sentences still never land near *"perro"* ones.

So instead we decided to sample **five points** (quintuplets!) per training example, covering four quadrants. The following example uses the concept `{award, prize, premio, galardón}`:

| Quadrant | Loss term | Example | Teaches |
| --- | --- | --- | --- |
| Same language, similar | `sl_pos` | *"won the Nobel prize"* ~ *"received an award for research"* | collapse same sense within a language |
| Same language, dissimilar | `sl_neg` | *"won the Nobel prize"* vs *"the bounty was claimed"* | separate senses within a language |
| Cross language, similar | `xl_pos` | *"won the Nobel prize"* ~ *"ganó el premio Nobel"* | align equivalent meanings across languages |
| Cross language, dissimilar | `xl_neg` | *"won the Nobel prize"* vs *"recompensa por su captura"* | separate senses across languages |

"Close" and "far" are decided by the teacher encoder, [`Qwen/Qwen3-Embedding-0.6B`](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B), whose sentence embeddings we store in Qdrant alongside every sentence. Negatives are semi-hard: the nearest candidate that is still at least a margin farther from the anchor than the positive is.

{{< figure src="/articles_data/minicoil-en-es/04-five-point.png" alt="Quadrant diagram of five-point sampling: an anchor sentence in the center, same-language and cross-language positives pulled toward it, same-language and cross-language negatives pushed away." caption="Five points per training example: same- and cross-language positives and negatives around each anchor, with \"similar\" and \"dissimilar\" decided by the teacher encoder." width="90%" >}}

The loss is a cosine triplet loss over those four relationships: one triplet in the anchor's own language (`sl`, same-language) and one across languages (`xl`, cross-language), each with its own margin:

$$ \text{loss} = \text{relu}\big(d(a, \text{sl}\_{\text{pos}}) - d(a, \text{sl}\_{\text{neg}}) + \text{margin}\_{\text{sl}}\big) + \text{relu}\big(d(a, \text{xl}\_{\text{pos}}) - d(a, \text{xl}\_{\text{neg}}) + \text{margin}\_{\text{xl}}\big) $$

Here `a` is the anchor sentence, `sl_pos` / `sl_neg` are the close and far sentences in the anchor's language, `xl_pos` / `xl_neg` are the close and far sentences in the other language, and `d` is cosine distance on the head's 8D output.

For both triplets (same- and cross-language), `margin` is not a fixed hyperparameter: it is the gap the teacher itself measures on that triplet, `margin = d_teacher(anchor, negative) − d_teacher(anchor, positive)`. The target is "separate these two at least as much as the teacher does." Two guardrails on top:

- Same-language and cross-language triplets get separate margins (`margin_sl`, `margin_xl`), because the teacher's cross-lingual distances run on a different scale than its monolingual ones.
- A candidate triplet, same-language and cross-language alike, is used only if the teacher's gap clears the floor of at least 0.1 in cosine distance, scaled up for concepts whose sentences the teacher already spreads far apart.

#### Implementation Details

The training code is open source in the [pentoai/minicoil-en-es](https://github.com/pentoai/minicoil-en-es) repository.

<details>
<summary>Model and training configuration</summary>

| Component | Description |
| --- | --- |
| **Backbone** | [multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small), 384 dimensions, token-pooled over the concept's subword tokens |
| **miniCOIL vector size** | 8 dimensions per concept (`Linear(384 → 8, bias=False) + tanh`) |
| **Vocabulary** | 2,398 bilingual concepts from a pruned vocabulary built from MUSE dictionaries via Louvain clustering |
| **Training data** | A slice of English and Spanish Wikipedia: the first 400k articles of each language, streamed, keeping up to 800 sentences per concept per language (about 2.3M sentences in total), stored in Qdrant with teacher model embeddings |
| **Teacher encoder** | [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) (sentence embeddings, 1024D), used only to mine training data and set margins |
| **Sampling** | 5-point bilingual samples re-mined every epoch; semi-hard negatives; per-sample margins from the teacher; 50/50 EN/ES anchors |
| **Augmentation** | Sentences trimmed to a ±5-word window around the concept word |
| **Training parameters** | **Epochs**: 80 per concept. **Optimizer**: Adam, lr 2e-3, `ReduceLROnPlateau`, dropout 0.1. **Validation set**: 20% |

</details>

The final model has 2,398 heads and ~7.4M parameters (about 6% of the backbone encoder), and ships as a ~29.5 MB safetensors file.

## Constructing a Retriever

Obtaining per-concept mini-vectors is only halfway to multilingual sparse neural retrieval. The other half is turning them into one sparse vector that, used in retrieval, will rank multilingual results by their relevance.

#### Everyone Gets a Piece of BM25

The final sparse vector used for retrieval is built [the same way miniCOIL v1 does it](https://qdrant.tech/articles/minicoil/#bag-of-words-in-4d), with the littlest possible additional tweaks coming from the multilingual setting:

1. **Tokens that don't resolve to a trained concept are weighted by the plain BM25 fallback**, which uses the same English tokenizer, stemmer and stop words plus default parameters as FastEmbed's `Qdrant/bm25`. We reserve a separate region of the sparse vector for OOV tokens.

2. **We used a cheap, dirty fix of dropping the query language's own stopwords** on the query side, with documents untouched. For future experiments, we should find a way to make the BM25 fallback bilingual, not always-English: stopwords, tokenization and stemming behave differently per language.

3. Raw `tanh` outputs, that is, the 8 values of a miniCOIL EN-ES concept block, come out much smaller than a typical BM25 word weight (their vector norm averages ~0.15), so a concept match would *lose* compared to a BM25-based match on the initial term.  
  **We normalize each concept 8D block to unit length and scale it by the BM25 weight** the initial term (part of the concept) would have had. This way, a same-sense match scores like the lexical term and a wrong-sense match is suppressed.

#### Matching Every Word Form

The concept vocabulary is built from dictionary forms of words, so plurals and conjugations like *"gatos"*, *"injections"* and *"corrieron"* in the encoded-for-retrieval text won't find their concept by exact lookup.

We added a lemmatizer fallback ([simplemma](https://github.com/adbar/simplemma)): only when a token itself is not in the vocabulary, we look up its lemma instead (*"gatos"* → *"gato"* → concept found).

The lemmatizer fallback is gated by stopword lists, checked for both the token and its lemma.  
Without that gate, auxiliary verbs would sneak into concepts through their lemmas (*is/are → be*, *es → ser*), and since `{be, ser, estar}` is itself a concept in the vocabulary, that one near-stopword concept would fire on almost every sentence in the index.

On our validation split, turning the lemmatizer fallback on buys roughly +0.01 MRR@10 in every retrieval direction, most in Spanish and cross-lingual, while recall stays put: it doesn't retrieve more, it lets the concept heads score passages that were already being found. It is on by default in the published model, and all results that follow use it.

## Results

The published checkpoint is at [Jocana/minicoil-en-es](https://huggingface.co/Jocana/minicoil-en-es).

#### Eval Setup

We check our intuition that the model turned out to be useful on [mMARCO](https://huggingface.co/datasets/unicamp-dl/mmarco), the machine-translated MS MARCO passage ranking collection, using its English and Spanish versions.  
As the same query and passage IDs exist in both languages, we can test all four retrieval directions: **EN→EN**, **ES→ES**, **EN→ES** and **ES→EN**.

The corpus is the judged `dev.small` passage pool: when we get test queries and their relevance judgments for a language, we index just the ~7.5k passages those judgments point to, not the full 8.8M-passage collection, to speed up the evaluation.  
Every query's relevant passage is present in the corpus by construction; the task is to rank it above the other queries' passages.

**The evaluation slice is *concept-covered*.** We keep queries where our 2,398 trained concepts can influence the ranking at all: the query shares at least one trained concept with its gold passage. That keeps about 78% of queries. Splits are frozen; the final model was scored on the test split once.

Hence, this eval answers rather *"when the concept mechanism applies, does it help"*, not *"how good is this retriever on arbitrary queries"*.

> **Note:** numbers won't align with public mMARCO benchmarks, as the eval set construction differs. Read the tables as relative comparisons between systems under one shared setup, that is, a feel for the mechanism.

##### We Compare

* **BM25**: FastEmbed's `Qdrant/bm25` with default parameters (k=1.2, b=0.75, avg_len=256) as the **monolingual baseline** (EN→EN, ES→ES).
* **miniCOIL v1**: FastEmbed's `Qdrant/minicoil-v1`, English only.
* **translate-then-BM25**: queries translated with [NLLB-200-distilled-600M](https://huggingface.co/facebook/nllb-200-distilled-600M), then BM25 (with default parameters) in the corpus language, the **cross-lingual baseline** that miniCOIL EN-ES has to match without a translation model in the pipeline.

##### We Measure

MRR@10 and nDCG@10 for ranking quality, and Recall@100 for retrieval breadth.

#### Monolingual Retrieval

| Direction | Retriever | MRR@10 | nDCG@10 | R@100 |
| --- | --- | --- | --- | --- |
| EN→EN | BM25 | 0.880 | 0.898 | 0.991 |
| EN→EN | miniCOIL v1 | **0.892** | **0.909** | 0.993 |
| EN→EN | miniCOIL EN-ES | 0.889 | 0.905 | **0.995** |
| ES→ES | BM25 | 0.809 | 0.830 | 0.968 |
| ES→ES | miniCOIL EN-ES | **0.840** | **0.861** | **0.988** |

In English the gains are of the same modest size v1 showed on BEIR: the model lands within 0.004 of v1 itself, carrying 2,398 concepts instead of v1's 30,000 words.

In Spanish the gains are slightly larger: Spanish is rich in word forms, so lemma-aware concept matching recovers matches that stemming misses.  
Gains could be even larger: while the BM25 ES→ES baseline is configured with Spanish in mind, miniCOIL's current BM25 fallback is inflexible, processing any input with an English stemmer, which makes it only suitable for matching named entities or numbers. A per-language fallback could improve the metrics.

#### Cross-Lingual Retrieval

| Direction | System | MRR@10 | nDCG@10 | R@100 |
| --- | --- | --- | --- | --- |
| EN→ES | translate-then-BM25 | **0.730** | **0.757** | 0.941 |
| EN→ES | miniCOIL EN-ES | 0.711 | 0.743 | **0.963** |
| ES→EN | translate-then-BM25 | **0.774** | **0.798** | 0.949 |
| ES→EN | miniCOIL EN-ES | 0.715 | 0.746 | **0.963** |

miniCOIL EN-ES trails translate-then-BM25 on top-10 ranking in both cross-lingual directions; however, Recall@100 goes the other way in both: the concept mechanism finds the relevant passages across the language border, while translated exact matching orders the top better.

However, two caveats make this result look like a desirable one: translate-then-BM25 has to use a translation model in the hot path of every query, while miniCOIL EN-ES retrieves cross-lingually from one index, no translation needed, on a heavily pruned concept vocabulary.  
Moreover, current miniCOIL EN-ES's own BM25 fallback runs the English stemmer on all inputs, Spanish included, so part of its gap is a configuration debt.

## Takeaways

This article describes a preliminary experiment. The model behind these tables trains 2,398 concepts out of a vocabulary of roughly 12,000, on at most 800 sentences per concept and language taken from a small slice of Wikipedia.  
Within that scope, evaluation provides us with evidence of the model's potential.

#### Keep it miniCOIL-branded

We stayed loyal to certain features of the miniCOIL approach:

**Self-supervised.** No relevance labels. Training data is Wikipedia sentences, and the supervision is the geometry of a larger encoder, so adding a language or a domain doesn't mean "annotating queries".

**BM25 underneath.** Everything out of vocabulary falls back to BM25, so the model degrades to a known baseline. However, in a multilingual setting, configuring this fallback gets trickier, so this is where a lot of room for improvement might hide.

**Lightweight and modular.** 8 floats per concept occurrence, 30 MB on disk without the backbone. Heads-per-concept are independent: we can inspect one, retrain one, or add one, without touching the rest.

#### What's Next

* **More concepts.** Train the remaining 10k heads of the pruned vocabulary.
* **But refine them.** Split noisy many-disconnected-words clusters, so wrong senses don't inject ranking noise into the top.
* **More training data.** Expand the training set and go beyond Wikipedia, so every concept head sees more sentences, more registers and more domains. The rarer concepts in the tail of the concept vocabulary need this to have enough evidence to be trained.
* **Train on lemmas.** Use the same token → lemma → concept path at training time that inference uses, so concept heads learn on the various word forms.
* **Figure out multilingual BM25 fallback.** Figure out how to manage language-aware stopwords and stemming in the BM25 fallback, and how to correctly propagate concept statistics to BM25 parameters (k, b, avg_len).

And, as with v1: try the model on your own data before deciding or adopting anything. No benchmarks will 100% guarantee performance on your corpus.

Share with us if you're building multilingual pipelines on [Discord](https://discord.gg/qdrant)!
