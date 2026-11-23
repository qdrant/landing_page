---
title: Film Location Search With Score Boosting
short_description: Find film locations that match a scene, then balance preferred facilities and proximity with Qdrant formula queries.
description: Build film-location search with semantic retrieval, geographic filters, and explainable score boosting in Qdrant.
weight: 17
author: Ewa Szyszka
author_link: https://github.com/ESzyszka
goal: Search Quality
stack:
  - Python
  - FastEmbed
example_resources:
  - label: Open Notebook
    url: https://colab.research.google.com/github/qdrant/examples/blob/2ae3e42a00aa292acd999993e8c75d2977d556e9/film-location-search/film-location-search.ipynb
keywords:
  - score boosting
  - formula queries
  - geographic search
  - film location search
---

# Find a Film Location With Score Boosting

| Time | Level | Stack |
| --- | --- | --- |
| 50 minutes | Intermediate | Python, FastEmbed, Qdrant |

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/qdrant/examples/blob/2ae3e42a00aa292acd999993e8c75d2977d556e9/film-location-search/film-location-search.ipynb)

Your scene calls for an abandoned industrial warehouse with exposed brick and tall windows. One location fits the description well but is across the city. Another is a good match near the crew's base. A third has electricity for the lighting equipment. Which should lead the shortlist?

You will build a search that makes those choices explicit. First, retrieve locations by their descriptions. Then apply requirements that a location must meet and use a formula query to reward preferred facilities and proximity. You will inspect each contribution to the final score and see how an excessive boost can change the shortlist in an undesirable way.

You should be comfortable running Python notebook cells and understand that an embedding represents text as a vector. For a first introduction, work through [Semantic Search 101](/documentation/tutorials-basics/search-beginners/).

## Start the Notebook

Open the [companion notebook](https://colab.research.google.com/github/qdrant/examples/blob/2ae3e42a00aa292acd999993e8c75d2977d556e9/film-location-search/film-location-search.ipynb) in a CPU runtime and run its setup cells in order. The notebook contains the complete dataset, dependency installation, server startup, embeddings, and query outputs. The code sections in this page follow the same sequence.

The notebook runs a real Qdrant server and prints its version. This example uses Qdrant 1.20.2, `qdrant-client` 1.20.0, FastEmbed 0.8.0, and a pinned revision of BGE small English v1.5. It checks the downloaded server archive's checksum. Its collection is dedicated to this example, so rerunning the lesson does not require an existing Qdrant account or catalog. Colab itself requires Google sign-in.

The first run downloads the embedding model and server. Allow time for those downloads as part of the lesson. When you finish, set `CLEAN_UP=True` in the cleanup cell to stop the server and remove its temporary data.

## Describe the Locations

The teaching catalog contains fictional film locations distributed around Warsaw. Names, descriptions, facilities, and permission flags are invented for this example. The coordinates demonstrate geographic ranking; these are not venue recommendations or statements about permission to film at real addresses.

Each location has a description to embed and structured [payload](/documentation/manage-data/payload/) fields:

| Field | Role in Search |
| --- | --- |
| `description` | Supplies the text used to generate the location's embedding. |
| `location` | Stores latitude and longitude for geographic filtering and scoring. |
| `permission_available` | Expresses a hard eligibility requirement in the fixture. |
| `power_available` | Expresses a preferred facility that can contribute a bonus. |

Keep these roles separate. The embedding helps interpret a scene description. A field such as `permission_available` is explicit application data; semantic similarity does not establish permission or availability. One fixture deliberately has no location so we can verify that geographic eligibility excludes it before scoring.

The setup creates a cosine collection and payload indexes for the geographic and Boolean fields before ingestion. A [payload index](/documentation/manage-data/indexing/#payload-index) helps Qdrant evaluate those fields efficiently. Exact vector search over the 40 fixtures removes approximate retrieval as a source of variation in this lesson. This small dataset demonstrates behavior, not indexing performance.

## Retrieve Locations by Scene

Use the same embedding model for location descriptions and the scene query. The initial search orders locations only by vector similarity.

{{< code-snippet path="/documentation/headless/snippets/tutorial-film-location-search/" block="baseline" >}}

Read a few returned descriptions before introducing any boosts. Does the model retrieve the kind of setting the scene needs? Boosting cannot compensate for a retrieval stage that misses suitable locations altogether.

A cosine score is a similarity measure, not a confidence percentage. Its differences matter when we choose the size of an added bonus.

## Apply the Shoot's Requirements

For this exercise, a location must have the fixture's permission flag set and be within 15 kilometers of the crew's base. Put those requirements in a filter.

{{< code-snippet path="/documentation/headless/snippets/tutorial-film-location-search/" block="filter" >}}

Compare this list with the unfiltered baseline. An ineligible location disappears regardless of how well its description matches. The radius is a boundary: a location outside it cannot be brought back by a large score bonus.

For the formula queries, apply the same eligibility filter during candidate retrieval. That gives the scoring stage a shortlist of eligible points and avoids spending the candidate budget on excluded locations.

## Prefer a Useful Facility

The crew can bring a generator, so mains power is useful but optional. Add a fixed bonus when `power_available` is true.

A formula query has two stages. The `prefetch` retrieves candidates using the scene vector and eligibility filter. The formula then calculates a new score for each of those candidates, and Qdrant returns the highest-scoring results.

{{< code-snippet path="/documentation/headless/snippets/tutorial-film-location-search/" block="facility" >}}

A payload condition inside a formula evaluates to one when it matches and zero otherwise. Multiplying it by `FACILITY_WEIGHT` makes the largest possible facility bonus explicit. A location without power stays eligible; it receives no facility bonus.

The formula's `$score` is the score from the prefetch. Keeping it in the sum preserves the scene's relevance signal. Replacing the entire formula with a facility condition would instead rank only by that condition.

## Prefer Locations Near the Crew

A hard radius treats locations on either side of its boundary differently. Within that radius, we can express a gradual preference for being closer to the crew.

{{< code-snippet path="/documentation/headless/snippets/tutorial-film-location-search/" block="proximity" >}}

`GeoDistance` measures geographic distance in meters. A Gaussian decay converts that distance to a value between zero and one. With a target of zero, the decay is highest at the crew's base. `scale` is the distance where it reaches `midpoint`; it is not another cutoff.

`GEO_WEIGHT` limits the proximity contribution. A location at the origin receives the full bonus, a location at the scale receives half of it when the midpoint is 0.5, and farther locations receive progressively less. This uses geographic distance, not a driving route or journey time.

The geographic filter excludes the fixture with missing coordinates before the formula runs. A missing location should not silently become a point at the crew's base and receive the maximum proximity bonus. In your application, decide whether such records are excluded or handled through a separate search path.

## Combine and Explain the Scores

Now combine the scene score, the preferred facility, and proximity in one formula query.

{{< code-snippet path="/documentation/headless/snippets/tutorial-film-location-search/" block="combined" >}}

The notebook displays the original similarity, distance, facility contribution, proximity contribution, and final score for each result. It also checks that the independently calculated contributions agree with the scores returned by Qdrant, within numerical tolerance.

These are the top five results from the notebook run on November 23, 2026. The facility weight is 0.08, the proximity weight is 0.15, and the distance scale is 5,000 meters with a midpoint of 0.5. The prefetch limit is 40; 36 points meet the filter. Values are rounded to four decimal places.

| Location | Similarity | Distance (km) | Power Bonus | Proximity Bonus | Final Score |
| --- | ---: | ---: | ---: | ---: | ---: |
| Riverside Workshop | 0.7545 | 1.8063 | 0.0800 | 0.1370 | 0.9715 |
| North Foundry | 0.8774 | 9.3882 | 0.0800 | 0.0130 | 0.9704 |
| Daylight Furniture Loft | 0.7207 | 2.5629 | 0.0800 | 0.1250 | 0.9257 |
| East Brickworks | 0.8686 | 6.5158 | 0.0000 | 0.0462 | 0.9148 |
| Rehearsal Loft | 0.6776 | 2.6704 | 0.0800 | 0.1231 | 0.8807 |

North Foundry led the eligible semantic ranking. Both it and Riverside Workshop receive the same power bonus. Riverside's additional proximity contribution is just large enough to overcome its lower similarity score, so it moves ahead. The notebook's experiments with one bonus at a time let you inspect each contribution before combining them.

Compare the original and final ranks alongside the descriptions. A rank change tells you that the formula changed the order. Whether that order helps a location scout depends on the scene and the production's preferences.

Use the component table to choose weights deliberately. A maximum proximity bonus that is large relative to the similarity differences can reverse many relevance decisions. The example's weights are starting points for this fixture, not settings to copy unchanged into another embedding model or score scale.

## Find the Limits of the Formula

The notebook includes two experiments that make the tradeoff visible.

First, increase the proximity weight while keeping the query, filter, and candidates fixed. Read the promoted location's description. A nearby weak match can outrank a more suitable setting when proximity dominates. Return the weight to zero to see the similarity-plus-facility ranking, or set both bonuses to zero to recover similarity ordering over the same eligible candidates.

Second, reduce the prefetch limit and compare the returned IDs with a run that includes all eligible points in this small catalog. A formula can only rescore prefetched points. A suitable nearby location outside that candidate set cannot enter the final results, even if the formula would have given it a high score.

For a larger catalog, compare candidate limits using representative scene queries and judged results. A larger prefetch gives the formula more candidates to consider but also more work. The small exhaustive comparison in this notebook is a diagnostic reference, not a claim about production latency or search quality.

The [score boosting reference](/documentation/search/search-relevance/) describes the supported expressions. The [query-stage documentation](/documentation/search/hybrid-queries/) explains how prefetches feed a later query.

## Scout a Different Scene

Move the crew's origin in the final exercise. Before running it, predict which locations will benefit. Then inspect the component table to explain the actual changes. To try a different scene as well, change `QUERY_TEXT` in the embedding cell and rerun from that cell so the query vector and baseline scores are recalculated.

Try making power mandatory instead of preferred: add it to the eligibility filter and remove its bonus. Compare which locations remain eligible with the earlier soft preference. This is the decision to carry into your own application: requirements determine the candidate set, and preferences determine how eligible matches are ordered.

To adapt the example, replace the fictional catalog with your own location descriptions and verified metadata. Keep a few representative scene briefs, inspect the baseline, and choose bonus weights from the observed score contributions before expanding the candidate search.
