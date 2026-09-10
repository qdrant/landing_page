# Maintain Learn

Learn has four resources: Guides, Tutorials & Examples, Courses, and Articles. Keep each piece in one source file and use the collections to make it discoverable.

## Tutorials & Examples

`qdrant-landing/data/examples.yaml` is the catalog. Each entry identifies an existing tutorial page, its goal, and its stack. Optional keywords improve search. Selected notebook and repository links appear in `resources`.

Hugo reads each title and description from the source tutorial. The catalog links to that page; it does not move or copy the tutorial. Both the HTML and Markdown catalog use the same entries. The browser filters the rendered cards without a separate search service.

Adding a tutorial requires one catalog entry. Use existing goal and stack labels where they fit. The build fails if the source page is missing or a selected resource URL no longer appears in the source tutorial.

## Guides

The three guide sections use `learning_kind: guides` and `partition: learn`. Topic cards and sidebar entries derive from their contents. Public URLs can remain stable through `url`, while `aliases` preserve former article URLs after a move.

The tuning series uses `guide_series: true` on its six pages. Their weights determine the order, numbered cards, and previous/next links. Standalone design guides remain outside that sequence.

`contributing/guide-sources.json` records the existing source for each migrated guide. Its hashes protect the preserved source text while allowing the routing and presentation changes recorded there. Review technical revisions separately from navigation changes.

## Articles

An article's `category` remains its normal topic field. The Articles index contains the few compatibility mappings needed for the four public topics. Authors can use Search Quality, Embedding Research, Qdrant Internals, or Production Ops directly for new articles.

The index also contains the archive cascade. It makes the listed pages redirect, excludes them from discovery, and suppresses their bodies in HTML and Markdown. Their original source files remain untouched. Apply retirement rules there instead of editing each archived article.

## Verify Changes

Build Hugo, then run `python3 automation/check-learn.py --public qdrant-landing/public`. The check covers preserved guide text, category membership, series navigation, catalog links, redirects, and archive exclusions. The existing redirect audit remains part of CI.

Check search, filters, Clear Filters, and a narrow-screen layout in the preview before submitting navigation changes.
