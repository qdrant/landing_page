# Filterable HNSW Figures

The CSV files preserve all 502 recorded observations, intervals, and any average-position values from [the original experiment repository](https://github.com/generall/hnsw-python/tree/62d8751ace246533de51295b85b935251a97f5de/data/experiments). These are historical 2019 measurements, not measurements of current Qdrant.

Editable SVGs and the original geohash map live in `static/articles_data/filterable-hnsw/`. The article-specific loader and styles live in `content/headless/filterable-hnsw/figure/`. The existing island shortcode provides inline theme-aware rendering and static image fallbacks. The shared line-chart generator labels every sample, so these figures use static SVGs with selected axis labels.

Run `python3 assets/viz/filterable-hnsw/generate-tables.py` from `qdrant-landing/` after changing CSV observations. It updates the expandable data tables under `content/headless/filterable-hnsw/`. The CSV variable parameter is the original mask threshold or search-group parameter. The vertical axis preserves the original `precision@10` metric.
