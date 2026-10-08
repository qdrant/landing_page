# Modern sparse neural retrieval figures

These 13 static, article-specific figures replace the linked PNGs in
`content/articles/modern-sparse-neural-retrieval.md`. They use the existing
`include` shortcode. No shared templates, runtime scripts, or dependencies
are required. Edit `generate.py`, then run it with Python 3 from any directory
and commit the regenerated HTML files. The Python standard library suffices.
Styles live in the article's `static/articles_data/modern-sparse-neural-retrieval/figures.css`.

## Meaning and provenance

The original PNGs are preserved in Git history under
`static/articles_data/modern-sparse-neural-retrieval/` at article revision
`e1638c94e6919ce43162731d14436aa5da269abe` (PR #2840). Research paper links
and the surrounding discussion remain in the article. Palette and chrome
follow the Qdrant qi examples: violet queries, cyan documents, amaranth
models, and purple aggregation. Labels and borders supplement color.

| Figure | Preserved entities and operations |
| --- | --- |
| Lexical retrieval | Query `What is Qdrant`; document 42 `Qdrant is a vector database`; all document TF=1; exact matching; separate corpus IDF/average-length statistics; original illustrative BM25 formula and parameter definitions. |
| Inverted index | Qdrant → documents 2, 42; vector → 5, 42; database → 2, 4, 8, 42. |
| Dense retrieval | Independent query/document encoders; one sentence vector per input; all ten illustrated coordinates per branch, including ellipses; dot-product example. |
| DeepCT | Both BERT branches; Qdrant split into Q, dra, nt; 768D context; first-subtoken selection; linear regression/rounding; query weights 5, 9, 340; document weights 230, 2, 3, 109, 105; original matched products totaling 78,218. |
| DeepImpact | Literal query bypasses document encoding; document tokenizer/context; first-subtoken selection; two-layer scalar head; document impacts 2.2, 0.3, 0.1, 1.9, 1.5; matching sum 2.5. |
| TILDEv2 | Query tokenizer/binary 30,522-slot vector; document context/scalar projection; separate Q, dra, nt; weights 1.8, 3, 0.9, 0.1, 0.2, 2, 1.8; matching sum 5.8. |
| COIL | Both contextual branches; 768D→32D projection; named token vectors; exact token gate; dot product before max over repeated document occurrences; sum over query tokens; financial-bank versus river-bank meaning. |
| UniCOIL | Both contextual branches/scalar projection; all query/document token weights; repeated-document-token maximum; original matched products totaling 4.45. |
| Document expansion | Unchanged pizza query; original Margherita document has no exact match; appending pizza enables matching; added term is dashed. |
| docT5query | Complete original passage/reference query; passage-only T5 input; sequential generation; all nine generated query examples and repetitions; separate downstream retrieval. |
| TILDE expansion | Complete original passage/reference query; vocabulary likelihood conditioned on passage; parallel prediction/top-k selection/no repetitions; every added term and original spelling; separate downstream retrieval. |
| SPARTA | Contextual document and static vocabulary branches; vocabulary-wide dot products; max over document tokens; threshold/ReLU/log after max; expanded document; independent unexpanded binary query; named weights and score 0.9. |
| SPLADE++ | Independent query/document context; 768D token vectors; Linear+GeLU+LayerNorm; BERT vocabulary projection to 30,522 outputs; log/ReLU before max over input tokens; both expanded sparse vectors; sparse dot product; named products totaling 0.36; sparsity regularization/distillation. |

## Deliberate adaptations

- Native HTML text stays at 14 CSS px, with mathematical indices at 12 CSS px.
  Desktop encoder lanes share rows. At a figure content width of 570px or less,
  the same content stacks. There is no hidden alternate composition or figure
  scrollbar. SPARTA's document output precedes the independent query in DOM
  order so the stacked arrows do not imply the query expands the document.
- Arbitrary 768D/32D coordinate matrices become labeled dimensions and named
  vectors. These were illustrative, not measured data. Token identities,
  vector dimensions, and mathematical operations remain explicit.
- SPARTA and SPLADE++ show selected vocabulary slots. Unnamed illustrative
  coordinates are omitted. SPLADE++'s raster visually aligns unnamed nonzero
  query/document slots but omits their products from its score. The revised
  figure does not invent a relationship for them: 0.36 is explicitly the
  partial sum of shown named matches. The caption states the restriction.
- DeepCT's scalar-product example is retained and marked illustrative; it is
  not a complete BM25 calculation. The article explains use of predicted
  weights in an inverted index.
- TILDEv2's raster calls its head one-layer while the article calls its
  architecture identical to DeepImpact. The neutral label "scalar projection"
  avoids resolving this source discrepancy by guessing.
- Expansion lists and source passages stay complete, including unusual
  spellings in the original TILDE output.

## Integration and validation

The existing include shortcode renders semantic figure HTML in both the page
and `index.md`. Markdown carries titles, token weights, operations, captions,
without SVG coordinates, JavaScript, controls, or
an executable application shell. Semantic HTML is intentional: no article-local
output-specific adapter exists in this revision.

The HTML itself is the complete no-JavaScript view. Theme variables follow
explicit `html[data-theme]` or system preference when no choice is set. Each
figure has a complete surface to prevent foreground/host mismatches.

Build with Hugo exactly 0.160.1 and Dart Sass on PATH, inspect the log for ERROR,
and verify both article outputs against the original PNGs from that revision. Inspect all
figures at 320px, 390px, 768px, and desktop in both selected themes, system
selection, and with JavaScript disabled. Check query bypasses and document-only
external expansion inputs separately from ordinary text legibility. Browser
visual approval is separate from a successful build.
