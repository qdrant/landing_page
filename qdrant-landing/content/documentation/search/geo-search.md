---
title: Geo Search
short_description: "Combine vector similarity with location in Qdrant: filter by radius, bounding box, or polygon, and rank results by distance."
description: "Run geo search in Qdrant by combining semantic vector retrieval with geo filters (radius, bounding box, polygon) and distance-based score boosting."
weight: 45
cta: "Try location-aware vector search on a free Cloud cluster."
---

# Geo Search

Many searches involve two meanings of "near". A user searching for a "quiet café to work from" wants results that are both semantically relevant and geographically close. Qdrant handles both in a single request: the vector query ranks results by meaning, while geo conditions filter or re-rank them by location.

## Why Location Needs Special Handling

Combining location constraints with vector search is more complex than adding a filter.

- **Geographic proximity is not semantic similarity.** A venue 200 meters away may be a poor semantic match, while the best match may be across town. You need to decide whether location or meaning determines which results qualify and how they are ranked.
- **The same radius can produce very different result sets.** A 1 km radius may cover thousands of points in a dense city center but only a handful in a rural area. The engine must handle both extremes.
- **Filters can disconnect the search graph.** Vector indexes such as HNSW find neighbors by walking a graph. Strict filters can exclude most nodes, leaving the remaining nodes disconnected and causing the search to miss relevant results. [Filterable HNSW](/documentation/manage-data/indexing/#filterable-hnsw-index) addresses this by adding extra edges, with the geo index contributing to the process.

{{< island
    path="content/documentation/headless/geo-search/two-kinds-of-near"
    width="100%" ratio="844 / 665"
    title="A simplified simulation on sample data. The first two strategies are generic approaches, not Qdrant settings. Move the circle and change the radius to see how each one finds the venues closest in meaning to the query."
>}}
![A map of venues with a circular search area next to the same venues placed by meaning, with three search strategies compared by how many of the 10 best matches each one finds.](/docs/geo-search-two-kinds-of-near.png)
{{< /island >}}

For the underlying techniques, refer to the article [Filtering in Vector Search](/articles/vector-search-filtering/).

## How Geo Search Works in Qdrant

Geo search relies on three components:

1. **A `geo` payload field.** Each point stores one or more coordinates as `lat` and `lon` in its [payload](/documentation/manage-data/payload/#geo).
2. **A geo payload index.** The index speeds up geo filtering and helps Qdrant to plan queries. Refer to [Create a Geo Index](#create-a-geo-index).
3. **Geo conditions and expressions.** Conditions determine which points qualify, while expressions calculate distance-based scores. Refer to [Filter by Location](#filter-by-location) and [Rank by Distance](#rank-by-distance).

## Choose an Approach

| You want to | Use | Details |
|---|---|---|
| Return only points inside an area | Use a geo filter: `geo_radius`, `geo_bounding_box`, or `geo_polygon`. | [Filter by Location](#filter-by-location) |
| Prefer nearby points without excluding distant ones | Use a formula query with `geo_distance` and a decay function. | [Rank by Distance](#rank-by-distance) |
| Combine filtering and ranking | Use a geo filter to restrict the search area, and a formula query to rank the remaining points | [Combine Filtering and Ranking](#combine-filtering-and-ranking) |
| Keep filtered search fast and accurate | Create a geo payload index before ingesting data | [Create a Geo Index](#create-a-geo-index) |

## Store Locations

Geo filters operate on payload values in the [geo format](/documentation/manage-data/payload/#geo): objects containing `lat` and `lon` in decimal degrees. Latitude must be between -90 and 90, and longitude between -180 and 180.

A field can also contain an array of geo objects. If a point has multiple locations, it matches when at least one location satisfies the condition.

## Create a Geo Index

A geo payload index enables Qdrant to find points within a specified area without scanning every payload. Without an index, geo filters must scan the points they apply to, which can be slow on large collections.

Create a payload index on the field containing the coordinates, using the `geo` schema:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/geo/" >}}

The index supports [`geo_radius`, `geo_bounding_box`, and `geo_polygon`](#filter-by-location) conditions on that field.

<aside role="status">
Create payload indexes immediately after creating a collection, before ingesting data. Qdrant can only add the extra HNSW edges described in <a href="#keep-filtered-search-accurate">Keep Filtered Search Accurate</a> after the payload index exists. To rebuild an existing index, see <a href="/documentation/manage-data/indexing/#filterable-hnsw-index">Filterable HNSW Index</a>.
</aside>

### Keep Filtered Search Accurate

A strict filter can leave the HNSW graph with disconnected parts, so a filtered search misses good matches. To prevent this, Qdrant automatically adds extra edges to the graph for each indexed payload field, and a geo index does the same.

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="100%" ratio="760 / 334"
>}}
![Two copies of the same search area. With regular links only, the venues inside the area form three separate groups. With extra links added, the groups are connected.](/docs/geo-search-extra-links.svg)
{{< /island >}}

For how the extra edges work, and for what to do when you combine several strict filters, refer to [Filterable HNSW Index](/documentation/manage-data/indexing/#filterable-hnsw-index) and the [ACORN search algorithm](/documentation/manage-data/indexing/#the-acorn-search-algorithm).

### Choose Between Full Scan and Graph Search

Qdrant selects a search strategy based on the estimated number of points matching the filter. The query planner uses payload indexes to estimate this number:

- **Few matches:** Qdrant performs an exact search over the matching points. The cost scales with the number of matches.
- **Many matches:** Qdrant traverses the HNSW graph and applies the filter during traversal.

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="100%" ratio="760 / 334"
>}}
![Two copies of the same search area. With few matching venues, each one is checked individually. With many matching venues, the search follows links between them through the graph.](/docs/geo-search-query-planner.svg)
{{< /island >}}

The collection's `full_scan_threshold` determines when Qdrant switches between these strategies.

For example, a radius covering a dense city center will likely use graph search, while the same radius in a rural area will likely use exact search.

Refer to [Vector Index](/documentation/manage-data/indexing/#vector-index) for configuration details.

### Disable the Extra Edges {version="1.17.0"}

If a geo field is used only to filter sparse vector searches, which do not use HNSW, set `enable_hnsw` to `false` on the payload index. This reduces indexing time and memory usage.

Refer to [Disable the Creation of Extra Edges for Payload Fields](/documentation/manage-data/indexing/#disable-the-creation-of-extra-edges-for-payload-fields).

## Filter by Location

A geo filter returns only points with locations inside a specified area. Like other [filter](/documentation/search/filtering/) conditions, you can combine it with `must`, `should`, and `must_not` clauses and conditions on other payload fields.

Geo filters do not affect ranking. They determine which points qualify, while the vector query determines their order. To rank results by distance, refer to [Rank by Distance](#rank-by-distance).

### Choose a Shape

| Shape | Defined by | Use it for |
|---|---|---|
| `geo_radius` | A center and a radius in meters | "Near me" searches |
| `geo_bounding_box` | Two opposite corners | Map viewports and rectangular regions |
| `geo_polygon` | An exterior ring and optional interior rings | Irregular areas such as districts, borders, or delivery zones |

For shapes without a dedicated geo condition, such as a corridor along a route, define a polygon around the area.

### Radius

`geo_radius` matches locations within a circle defined by a `center` and a `radius` in meters. It uses the Haversine distance, which measures distance along the Earth's surface rather than on a flat map.

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="75%" ratio="400 / 170"
    title="A radius filter matches the points inside a circle."
>}}
![A circle around a center point with a dashed line marking the radius. Points inside the circle are highlighted.](/docs/geo-search-shape-radius.svg)
{{< /island >}}

{{< code-snippet path="/documentation/headless/snippets/filter-condition/geo-radius/" >}}

Use a radius for searches such as "within 2 km of me".

### Bounding Box

`geo_bounding_box` matches locations within a rectangle aligned with latitude and longitude lines. Define the rectangle using its `top_left` and `bottom_right` corners, each specified as a `lat` and `lon` pair.

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="75%" ratio="400 / 170"
    title="A bounding box filter matches the points inside a rectangle."
>}}
![A rectangle with its top left and bottom right corners marked. Points inside the rectangle are highlighted.](/docs/geo-search-shape-bounding-box.svg)
{{< /island >}}

{{< code-snippet path="/documentation/headless/snippets/filter-condition/geo-bounding-box/" >}}

Bounding boxes can cross the antimeridian (180° longitude). Set `top_left` to a longitude greater than `bottom_right`, and Qdrant handles the wrapped range.

Use a bounding box for searches within a map viewport.

### Polygon {version="1.4.0"}

`geo_polygon` matches locations within an arbitrary shape, such as a country, district, or delivery zone. A polygon consists of an `exterior` ring and optional `interiors` rings that define holes.

For example, to find points within a lake but exclude an island, define the lake as the exterior ring and the island as an interior ring.

{{< island
    path="content/documentation/headless/geo-search/figure"
    width="75%" ratio="400 / 170"
    title="A polygon filter matches the points inside the exterior ring and outside any interior ring."
>}}
![A polygon with a smaller interior shape cut out of it. Points inside the exterior but outside the interior are highlighted.](/docs/geo-search-shape-polygon.svg)
{{< /island >}}

{{< code-snippet path="/documentation/headless/snippets/filter-condition/geo-poligon/" >}}

Each ring must contain at least four points, with identical first and last points to close the ring. Use a consistent clockwise or counterclockwise order within each ring.

A point matches if it falls inside the exterior ring but outside all interior rings.

Qdrant uses unprojected global coordinates (longitude and latitude in decimal degrees) and is datum-agnostic.

### Combine with Other Conditions

Geo conditions work with other filter conditions. For example, to find open venues within 5 km, add a `geo_radius` condition and a match condition to the same `must` clause.

To exclude an area, add the geo condition to `must_not`.

Refer to [Filtering](/documentation/search/filtering/) for the available clauses.

## Rank by Distance

A geo filter determines whether a point falls within a specified area. Geo ranking offers a more flexible approach: prioritize nearby points without excluding more relevant results that are farther away.

Use a [formula query](/documentation/search/search-relevance/#score-boosting) to combine vector similarity scores with distance-based scores.

### Boost Points Closer to the User {version="1.14.0"}

The `geo_distance` expression calculates the Haversine distance in meters between a fixed `origin` and a location stored in a payload field.

Because distance has no upper bound, use a decay function to convert it into a value in the range `(0, 1]`. The value is 1 at the origin and decreases as distance increases. You can then add this value to the vector similarity score.

{{< code-snippet path="/documentation/headless/snippets/query-points/score-boost-closer-to-user/" >}}

In this example:

- `prefetch` retrieves candidates by vector similarity.
- `geo_distance` calculates the distance between each candidate's `geo.location` and the user's `origin`.
- `gauss_decay` converts the distance into a value between 0 and 1. The `scale` parameter specifies the distance in meters at which the output equals `midpoint` (0.5 by default).
- `sum` adds the decay value to the vector score (`$score`).
- `defaults` provides a fallback location for points without one.

Refer to [Decay Functions](/documentation/search/search-relevance/#decay-functions) for the available functions (`lin_decay`, `exp_decay`, and `gauss_decay`) and their parameters.

<aside role="status">
Adjust the decay term to match the scale of the vector score. Cosine scores are bounded and typically fall within a narrow range, while some fused scores can be much smaller. If the decay term is significantly larger than the vector score, distance will dominate the ranking. Multiply the decay term by a coefficient to balance their influence.
</aside>

### Combine Filtering and Ranking

Filtering and ranking serve different purposes and can be combined in a single request. A geo filter restricts results to a specified area, while a formula ranks the remaining points by relevance and distance.

Add the geo condition to the query's `filter` and the `geo_distance` expression to its `formula`.

For example, a delivery app can use a [polygon](#polygon) to restrict results to its service area, then rank matching restaurants by relevance and distance.

## Next Steps

- [Indexing](/documentation/manage-data/indexing/) covers payload and vector indexes in general.
- [Search Relevance](/documentation/search/search-relevance/) covers formula queries and other ways to tune ranking.
- [Hybrid Queries](/documentation/search/hybrid-queries/) shows how to fuse several retrievers before applying a formula.
