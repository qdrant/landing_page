---
title: Geo-Filtered Vector Search
short_description: "Combine semantic search with location in Qdrant: an interactive demo, why a geo filter is more than a filter, how Qdrant keeps the index connected, and how to build it."
description: "A hands-on geo search tutorial for Qdrant: try geo filtering with vector search in an interactive demo, see why naive approaches miss results, learn how geo-aware index links and the query planner fix it, and build it step by step."
layout: immersive
weight: 11
partition: develop
goal: Data & Filtering
stack:
  - Python
keywords:
  - geo
  - location
  - filters
  - hnsw
  - geo_radius
cta: "Try location-aware vector search on a free Cloud cluster."
immersive_nav:
  - label: Live demo
    href: "#demo"
  - label: The problem
    href: "#problem"
  - label: How it works
    href: "#how"
  - label: Filter shapes
    href: "#shapes"
  - label: Build it
    href: "#build"
---

{{< im kind="hero"
    eyebrow="Tutorial · Geo search"
    lead="Combine vector similarity with radius, bounding box, and polygon filters in one query, and see why a geo filter needs more than a filter on top of a vector index."
    primary="Try the demo|#demo"
    secondary="Read the Geo Search docs|/documentation/search/geo-search/"
    note="Works the same on Qdrant open source, Qdrant Cloud, and Hybrid Cloud."
>}}

{{< im kind="card" title="Query with a geo filter" meaning="“quiet café to work from”" location="1.5 km around central Berlin" >}}

{{< code-snippet path="/documentation/headless/snippets/geo-search/semantic-query/" >}}

{{< im kind="end-card" >}}

{{< im kind="end-hero" >}}

{{< im kind="section"
    id="demo"
    eyebrow="Live demo"
    title="Two Kinds of “Near” in One Query"
    intro="Every venue has a place on the map and a place in embedding space, and the two are unrelated. Move the circle and change the radius to see how many of the true 10 best matches each approach finds. Select an approach to see its results."
    glow=true
>}}

{{< island
    path="content/documentation/headless/geo-tutorial/lab"
    width="100%" ratio="1110 / 902"
>}}
![A map of venues with a circular search area next to the same venues placed by meaning, and three search approaches compared by how many of the 10 best matches each one finds.](/docs/geo-search-tutorial-lab.png)
{{< /island >}}

{{< im kind="end-section" note="A simplified simulation with sample data that runs in your browser. It shows how each approach behaves, not benchmark numbers." >}}

{{< im kind="section"
    id="problem"
    eyebrow="The problem"
    title="Why a Geo Filter Is Not Just a Filter"
    intro="Vector indexes are built to find neighbors in meaning. Location is a second, independent space, and its density varies widely."
    more="Filtering in Vector Search (article)|/articles/vector-search-filtering/"
    align="split"
>}}

{{< im kind="cells" cols=3 >}}

{{< im kind="cell" fig="1<small> of 10</small>" title="Near on the Map Is Not Near in Meaning" >}}

Of the 10 best matches for “quiet café to work from” across the whole city, only 1 is within 1.5 km of central Berlin. If you search first and filter afterward, most of the results disappear.

{{< im kind="end-cell" >}}

{{< im kind="cell" fig="37×" title="The Same Radius Is a Different Filter Every Time" >}}

In the demo, a 1 km circle in the city center holds 37 venues, and the same circle in Spandau holds 1. A geo filter can match a handful of points or most of the dataset, so no single fixed strategy works for both.

{{< im kind="end-cell" >}}

{{< im kind="cell" fig="48<small> islands</small>" title="Filters Cut the Search Graph Into Islands" >}}

HNSW finds neighbors by walking a graph. Keep only the 70 venues within 1.5 km of the city center and the demo's graph splits into 48 disconnected pieces, so the walk stops before it reaches the real best matches.

{{< im kind="end-cell" >}}

{{< im kind="strip" >}}

**One query, two spaces.** A geo-aware index has to handle meaning and location together, so you never trade accuracy for a smaller search area.

{{< im kind="end-strip" >}}

{{< im kind="end-cells" >}}

{{< im kind="end-section" >}}

{{< im kind="section"
    id="how"
    eyebrow="How Qdrant handles it"
    title="Built Into the Index, Decided per Query"
    intro="Two mechanisms work together: extra links keep the index connected inside each area, and a query planner picks the faster search path for each filter."
    glow=true
>}}

{{< im kind="cells" cols=2 >}}

{{< im kind="cell" title="Extra Links Inside Each Area" pairs=true >}}

{{< im kind="frame" >}}

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="100%" ratio="360 / 202"
>}}
![Two copies of the same search area. With regular links only, the venues inside the area form separate groups. With extra links added, the groups are connected.](/docs/geo-search-tutorial-extra-links.svg)
{{< /island >}}

{{< im kind="end-frame" >}}

**What Qdrant does.** When it builds the index, Qdrant adds links between venues that are close on the map, for each indexed payload field. A geo index does the same.

**What it means.** A geo filter no longer leaves islands, so the search walk reaches the real best matches. The geo index has to exist before you ingest data, or Qdrant cannot add the links.

{{< im kind="end-cell" >}}

{{< im kind="cell" title="A Plan for Every Query" pairs=true >}}

{{< im kind="frame" >}}

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="100%" ratio="360 / 210"
>}}
![Few matching venues are checked one by one. With many matching venues, the search walks the graph.](/docs/geo-search-tutorial-query-planner.svg)
{{< /island >}}

{{< im kind="end-frame" >}}

**What Qdrant does.** The query planner estimates how many points match the filter, using the payload index. With few matches, it checks each one exactly. With many, it walks the graph and applies the filter during the walk.

**What it means.** You write the same filter either way, from a single block to a whole region. The collection's `full_scan_threshold` sets where the planner switches.

{{< im kind="end-cell" >}}

{{< im kind="strip" >}}

**You write the filter, Qdrant plans the search.** For configuration details, see [Vector Index](/documentation/manage-data/indexing/#vector-index) and [Filterable HNSW Index](/documentation/manage-data/indexing/#filterable-hnsw-index).

{{< im kind="end-strip" >}}

{{< im kind="end-cells" >}}

{{< im kind="end-section" >}}

{{< im kind="section"
    id="shapes"
    eyebrow="Filter shapes"
    title="Radius, Box, or Any Polygon"
    intro="All three work as regular filter conditions, so you can combine them with keyword, range, full-text, and other payload conditions in the same request."
>}}

{{< im kind="cells" cols=3 >}}

{{< im kind="cell" tag="geo_radius" title="Radius" >}}

{{< im kind="frame" >}}

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="100%" ratio="300 / 112"
>}}
![A circle around a center point, with a dashed line marking the radius.](/docs/geo-search-tutorial-shape-radius.svg)
{{< /island >}}

{{< im kind="end-frame" >}}

{{< code-snippet path="/documentation/headless/snippets/filter-condition/geo-radius/" >}}

Use it for “within a 15-minute walk of me”. The radius is in meters.

{{< im kind="end-cell" >}}

{{< im kind="cell" tag="geo_bounding_box" title="Bounding Box" >}}

{{< im kind="frame" >}}

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="100%" ratio="300 / 112"
>}}
![A rectangle with two opposite corners marked.](/docs/geo-search-tutorial-shape-bounding-box.svg)
{{< /island >}}

{{< im kind="end-frame" >}}

{{< code-snippet path="/documentation/headless/snippets/filter-condition/geo-bounding-box/" >}}

Use it for whatever is visible on the user's map right now.

{{< im kind="end-cell" >}}

{{< im kind="cell" tag="geo_polygon" title="Polygon" >}}

{{< im kind="frame" >}}

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="100%" ratio="300 / 112"
>}}
![A polygon with a smaller interior shape cut out of it.](/docs/geo-search-tutorial-shape-polygon.svg)
{{< /island >}}

{{< im kind="end-frame" >}}

{{< code-snippet path="/documentation/headless/snippets/filter-condition/geo-poligon/" >}}

Use it for delivery zones, districts, or a city minus its airport. Holes are supported.

{{< im kind="end-cell" >}}

{{< im kind="end-cells" >}}

{{< im kind="end-section" >}}

{{< im kind="section"
    id="build"
    eyebrow="Build it"
    title="From an Empty Collection to a Geo Query"
    intro="Three things to set up. The order matters: create the geo index before you ingest data."
    glow=true
>}}

{{< im kind="cells" cols=3 >}}

{{< im kind="cell" tag="Step 1" title="Create the Geo Index First" >}}

Create a `geo` payload index on your location field right after you create the collection. Qdrant can then build the vector index with geo-aware links from the start.

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/geo/" >}}

{{< im kind="end-cell" >}}

{{< im kind="cell" tag="Step 2" title="Store Points as Latitude and Longitude" >}}

Store each location in a payload field as an object with `lat` and `lon` in decimal degrees, for example `{"lat": 52.52, "lon": 13.405}`. For a venue with several locations, use a list of these objects. The point matches when at least one location satisfies the condition.

Then query with meaning and location in one request, as in the “Query with a geo filter” example.

{{< im kind="end-cell" >}}

{{< im kind="cell" tag="Step 3" title="Tune It if You Need To" >}}

The defaults work for most collections. Two HNSW settings matter for geo filters:

- `full_scan_threshold` sets where the planner switches from graph search to an exact search over the matching points.
- `payload_m` sets how many extra links the index adds for each payload field.

See [Vector Index](/documentation/manage-data/indexing/#vector-index) for both.

{{< im kind="end-cell" >}}

{{< im kind="end-cells" >}}

{{< im kind="end-section" >}}

{{< im kind="section"
    id="next"
    eyebrow="Go further"
    title="Keep Going"
    intro="The Geo Search docs cover every shape, distance-based ranking, and how to combine filters and formulas."
>}}

{{< im kind="cells" cols=3 >}}

{{< im kind="cell" title="Geo Search" >}}

The reference for geo filters, `geo_distance` scoring, and combining filtering with ranking. [Read the Geo Search docs](/documentation/search/geo-search/).

{{< im kind="end-cell" >}}

{{< im kind="cell" title="Filtering" >}}

Combine a geo condition with `must`, `should`, and `must_not` clauses and conditions on other payload fields. [Read the Filtering docs](/documentation/search/filtering/).

{{< im kind="end-cell" >}}

{{< im kind="cell" title="How Filtered Search Works" >}}

A deeper look at why filters break vector search and how filterable HNSW fixes it. [Read the article](/articles/vector-search-filtering/).

{{< im kind="end-cell" >}}

{{< im kind="end-cells" >}}

{{< im kind="end-section" >}}
