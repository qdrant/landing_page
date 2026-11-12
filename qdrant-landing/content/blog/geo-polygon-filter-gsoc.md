---
title: "Google Summer of Code 2023 - Polygon Geo Filter for Qdrant"
short_description: "Explore Zein Wen's 2023 Google Summer of Code work adding polygon filters to Qdrant, with geometry tests and API design."
description: "Explore Zein Wen's 2023 Google Summer of Code project adding polygon geo filters to Qdrant, from geohash candidates to geometry tests and API design."
social_preview_image: /blog/geo-polygon-filter-gsoc/preview/social_preview.jpg
author: Zein Wen
author_link: https://www.linkedin.com/in/zishenwen/
date: 2023-10-12T08:00:00+03:00
draft: false
keywords:
    - payload filtering
    - geo polygon
    - search condition
    - gsoc'23
slug: geo-polygon-filter-gsoc
preview_image: /blog/geo-polygon-filter-gsoc/preview/title.jpg
small_preview_image: /blog/geo-polygon-filter-gsoc/preview/preview.jpg
featured: false
tags:
  - Open Source
  - Summer of Code
aliases:
  - /articles/geo-polygon-filter-gsoc/
---

> Editor's note: This 2023 post was edited for length and clarity. Read the [original version](https://github.com/qdrant/landing_page/blob/bb7f15b97237c97748fdbeea45499e2fcaba2377/qdrant-landing/content/articles/geo-polygon-filter-gsoc.md).

I'm Zein Wen, and I worked on polygon filtering with Arnaud Gourlay during Google Summer of Code 2023. Restaurant recommendations often need a geographic boundary as well as a similarity score. A circle or rectangle cannot describe every neighborhood, so my project added polygon filters to Qdrant.

This post records my 2023 contribution. For current usage, see the [geo polygon filtering documentation](/documentation/search/filtering/#geo-polygon).

## Finding Points Inside a Boundary

Before this project, Qdrant supported radius and rectangle filters. Polygon filtering let users describe irregular areas and combine them with vector search.

{{< figure src="/blog/geo-polygon-filter-gsoc/geo-filter-example.png" caption="A geographic search area. Source: [TravelTime](https://traveltime.com/blog/map-postcode-data-catchment-area)." alt="Map of London with locations inside an irregular search boundary" >}}

The geographic index uses geohashes to group locations into rectangular cells. During a query, it finds cells that could overlap the polygon, then checks candidate locations against the polygon itself. This avoids testing every stored location.

{{< figure src="/blog/geo-polygon-filter-gsoc/geo-index.svg" caption="The index narrows the candidates before checking the polygon boundary." alt="Stored locations are grouped by geohash cell, overlapping cells supply candidates, and a polygon check returns matching locations" >}}

Two geometry operations needed careful testing: checking whether a polygon intersects a rectangle and whether a point lies inside a polygon. The Rust `geo` library provided these operations, but we still needed to understand their behavior and verify edge cases.

I explored winding-number and ray-casting algorithms and used visual tests to compare results. That work helped me learn an unfamiliar part of the codebase through small, testable questions.

{{< figure src="/blog/geo-polygon-filter-gsoc/geo-computation-testing.png" caption="Geometry test cases from the project." alt="Six polygon test plots showing different boundaries and point locations" >}}

## Keeping the API Consistent

We considered [GeoJSON](https://geojson.org/) for the interface. Its coordinate representation differed from Qdrant's existing radius and rectangle filters, so we kept the polygon interface consistent with those filters.

We also considered a separate multi-polygon filter. Combining polygon conditions already covered that use case, just as users could combine circles or rectangles. Adding another filter type would have increased the API's complexity without adding a necessary operation.

This was a useful lesson in API design. A familiar standard can help users, but consistency with the surrounding API matters too.

## Learning Through Open Source

This was my first opportunity to write Rust for a production project. Arnaud and the other Qdrant engineers helped me work through unfamiliar code, compare alternatives, and explain my decisions during review.

I learned to keep the user's task in mind when designing an interface. I also gained confidence in discussing different approaches and asking questions before committing to a design.

Thank you to everyone who reviewed the work and helped me contribute. To try polygon filtering, follow the [current documentation](/documentation/search/filtering/#geo-polygon) with a [Qdrant Cloud cluster](https://cloud.qdrant.io/) or a [local deployment](/documentation/quickstart/).
