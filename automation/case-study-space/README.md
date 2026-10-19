# Case study space

`build_space.py` generates `qdrant-landing/data/case_study_space.json`, the data
behind the "Find your nearest neighbors" explorer at the top of `/customers/`
(`themes/qdrant-2024/layouts/partials/customers/customers-neighbors.html`).

## Run it

Run it again whenever a case study is published, retired, or retitled, then
commit the JSON.

```bash
python3 -m venv /tmp/space-venv
/tmp/space-venv/bin/pip install fastembed umap-learn numpy pyyaml svgelements
/tmp/space-venv/bin/python automation/case-study-space/build_space.py
```

The first run downloads `BAAI/bge-small-en-v1.5` (about 70 MB). The output is
deterministic for a given model and set of case studies.

## What it does

1. Collects every published case study: `content/blog/case-study-*.md` with
   `draft: false`, plus `iris-agent-qdrant.md`. Name, industry, deployment, and
   logo come from `content/customers/clients/_index.md`. A published case study
   that is not in that file needs an entry in `EXTRAS`, or the script stops.
   `SKIP` lists stories superseded by a newer version of the same story.
2. Embeds each one with fastembed: the mean of its body passages, plus its
   title and description weighted as much as the whole body.
3. Removes the mean vector, which every case study shares because they all
   discuss Qdrant and vector search, then projects to 2D with UMAP.
4. Crops each logo to what it draws, sizes logos by equal area, and nudges
   points apart until no two logos overlap: once for the desktop map
   (1000 x 760 panel units) and once for the transposed phone map (760 x 1000).
5. Ranks the stories for each query chip (`QUERIES`) by cosine similarity in
   the full embedding space, and for each logo by cosine of the mean-centered
   embeddings. The page shows these real scores. Only a point dropped on empty
   space uses map distance, and the page labels that score as illustrative.

## Logos

Logos are drawn as CSS masks over one flat color, so any source colors work.
`LOGO_OVERRIDES` swaps in files that read better on the map. A case study with
no logo file renders as a wordmark of its name.
