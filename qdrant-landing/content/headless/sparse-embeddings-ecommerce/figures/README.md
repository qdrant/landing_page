# Sparse E-Commerce Tutorial Figures

## Editing and Regeneration

The 14 HTML figures use the existing `include` shortcode. Edit their HTML
here and their dedicated stylesheet and SVG shapes in
`static/documentation/tutorials/sparse-embeddings-ecommerce/`. Paths are
relative to `qdrant-landing/`.

- Labels, captions, and chart values are native HTML. SVG assets contain
  editable shapes with a `viewBox`; update both theme variants together.
- `cross-domain-ndcg.csv` is the bar chart's source data. If it changes,
  update the corresponding HTML value labels, `--sef-value` attributes,
  and percentage annotations together. Bar widths use the common 0-1.2
  scale. The shared chart generator does not support this grouped
  horizontal-bar layout, so this figure uses the series-local HTML/CSS.
- The transfer and radar drawings have no numeric source series. Preserve
  their qualitative relationships; do not infer measurements from shapes.
- Keep original entity labels and values. Do not add internal titles,
  subtitles, or footer notes. Captions describe only the visible figure.
  `ANCE Loop` is the original center label, not a figure heading.
- Rebuild with Hugo **0.160.1** and Dart Sass on `PATH`. No figure generator
  or JavaScript is required. From `qdrant-landing/`, `hugo serve` previews
  Parts 1-5 under `/documentation/tutorials-search-engineering/` and their
  `index.md` outputs. Check both page themes, the desktop article column,
  and a 390px viewport after edits. `resvg input.svg output.png` can
  rasterize individual shape assets, but it does not render the HTML/CSS
  composition.

The original PNGs can be recovered for comparison with:

```bash
git show e3215d0e9b9a11b0b6af719307e7eed92e3c436f:qdrant-landing/static/articles_data/sparse-embeddings-ecommerce-part-N/NAME.png > /private/tmp/NAME.png
```

## Part 1

| Figure | Preserved Entities and Values | Deliberate Adaptation |
| --- | --- | --- |
| `wrong-iphone-result` | Query `iPhone 15 Pro Max 256GB`; dense result `128GB`, cosine `0.97`, and cross; sparse result `256GB`, exact match, and check. | Each mark is attached to its storage value and shares its status color. Parallel result panels stack on narrow hosts. |
| `dense-vs-sparse-viz` | Dense: 768 dimensions, all active; sparse: ~30,000 dimensions, ~200 active; headphones, noise, wireless, audio, and sound; 36 illustrated slots in each strip. | Dense slots retain varying violet shades. Sparse inactive slots are outlined; vocabulary groups wrap with their labels. |
| `splade-pipeline` | `noise canceling headphones`; DistilBERT + MLM / Transformer encoder; `log(1 + ReLU(x))`; Max Pool / Across token positions; ~200 nonzero values / 30,522 dimensions; headphones 2.3, noise 1.9, canceling 1.7, audio 1.2. | Preserves vertical stage order. Term weights use wrapping chips. |

## Part 2

| Figure | Preserved Entities and Values | Deliberate Adaptation |
| --- | --- | --- |
| `esci-relevance-gradient` | `iPhone charger`; Apple 20W USB-C Adapter / Exact / 1.0; Anker USB-C to Lightning / Substitute / 0.7; iPhone 15 Clear Case / Complement / 0.5; Samsung Galaxy S24 Case / Irrelevant / 0.0. | Full relevance cards carry the category colors; each product keeps its label and score. |
| `training-stack` | Modal / Serverless A100 GPUs; Sentence Transformers v5 / SparseEncoder + SpladeLoss; Qdrant / Native sparse vector indexing. | The three unconnected stack layers use the series' entity colors. No data-flow arrows are added. |
| `modal-detached-training` | `>>` / Launch training / `modal run --detach`; `!!` / SSH drops / Connection lost; `**` / GPU keeps running / A100 in the cloud; `OK` / Checkpoints ready / Volume persisted. | Horizontal stages become vertical on narrow hosts, with the same order and connector gutters. |

## Part 3

| Figure | Preserved Entities and Values | Deliberate Adaptation |
| --- | --- | --- |
| `hybrid-search-fusion` | Sparse Path / SPLADE embeddings / Inverted index; Dense Path / Sentence embeddings / HNSW index; RRF Fusion / Reciprocal Rank Fusion; Ranked Results. | Both paths stay parallel at narrow widths and converge on fusion. Dense/sparse colors match the series. |
| `ance-loop` | `ANCE Loop` at the center; Train Model, Index in Qdrant, Search & Retrieve, and Mine Hard Negatives; four corresponding arc colors. | Retains the circular, four-corner composition. The reading order follows train, index, search, mine. |

## Part 4

| Figure | Preserved Entities and Values | Deliberate Adaptation |
| --- | --- | --- |
| `cross-domain-ndcg` | BM25, off-the-shelf SPLADE, and fine-tuned SPLADE, in that order: MS MARCO (out-of-domain) 0.915 / 0.982 / 0.751, -17.9%; Home Depot 0.349 / 0.391 / 0.384, +10.0%; WANDS (Wayfair) 0.329 / 0.341 / 0.355, +7.9%; ESCI (Amazon) 0.305 / 0.326 / 0.389, +27.5%; nDCG@10 axis, 0.0-1.2; better/worse roles. | Model labels accompany each horizontal bar instead of a distant legend. Narrow hosts place labels before their bars. Fragmented per-row gridlines are omitted; common scale ticks and exact values remain. |
| `transfer-decay-curve` | Specialist and Generalist; Amazon, Wayfair, Home Depot, OOD; crossing curves and the specialist's steeper decline. | Qualitative lines retain an unnumbered vertical axis. Legend wraps after the plot on narrow hosts. Original internal heading is omitted. |
| `domain-coverage-venn` | Overlapping Wayfair, Amazon ESCI, and Home Depot circles; Multi-domain model at the three-way overlap. | Native HTML labels overlay theme-specific SVG circles. On narrow hosts, the center label wraps at its original hyphen and moves slightly within the overlap to clear the circle boundaries. No overlap quantities are added. |
| `specialist-vs-generalist` | Electronics, Furniture, Tools, Clothing, Appliances; Specialist peak in Electronics; broader Generalist polygon; both legend entries. | Qualitative radar encoding and category order remain. Legend wraps after the plot on narrow hosts. No numeric radial scale is added. |

## Part 5

| Figure | Preserved Entities and Values | Deliberate Adaptation |
| --- | --- | --- |
| `research-to-production-pipeline` | Steps 1-5: Notebook, Training, Qdrant, API, Search. | Horizontal stages become vertical on narrow hosts. The original research-to-training-to-indexing-to-serving-to-search sentence becomes the external caption. |
| `production-architecture` | User Query; API Gateway / Encode query (SPLADE + Dense); Qdrant Cluster enclosing Sparse Index and Dense Index; Ranked Products. | Preserves vertical request flow and cluster ownership. Index panels stack within the cluster on narrow hosts. The original periodic-retraining footer is omitted; the caption describes only the serving path. |
