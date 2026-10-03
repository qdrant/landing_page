---
title: "Google Summer of Code 2023 - Web UI for Visualization and Exploration"
short_description: "Explore Kartik Gupta's 2023 GSoC work on Qdrant's Web UI, from collection browsing to queries and vector visualization."
description: "Explore Kartik Gupta's 2023 Google Summer of Code work on Qdrant's Web UI, including collection browsing, query editing, and vector visualization."
social_preview_image: /blog/web-ui-gsoc/preview/social_preview.jpg
author: Kartik Gupta
author_link: https://kartik-gupta-ij.vercel.app/
date: 2023-08-28T08:00:00+03:00
draft: false
keywords:
    - vector reduction
    - console
    - gsoc'23
    - vector similarity
    - exploration
    - recommendation
hideFromList: true
slug: web-ui-gsoc
preview_image: /blog/web-ui-gsoc/preview/title.jpg
small_preview_image: /blog/web-ui-gsoc/preview/preview.jpg
featured: false
tags:
  - Open Source
  - Summer of Code
aliases:
  - /articles/web-ui-gsoc/
---

> Editor's note: The project follow-ups describe plans from 2023. This 2023 post was edited for length and clarity. Read the [original version](https://github.com/qdrant/landing_page/blob/bb7f15b97237c97748fdbeea45499e2fcaba2377/qdrant-landing/content/articles/web-ui-gsoc.md).

I'm Kartik Gupta, and I worked on Qdrant's Web UI during Google Summer of Code 2023. Exploring vector data through API responses alone made it hard to see collections, inspect points, and understand their relationships. My project brought those tasks into a browser interface.

This post describes the interface I built in 2023. Screenshots show that version; use the [current Web UI documentation](/documentation/web-ui/) for setup and instructions.

## Building the Interface

I began with a [Figma design](https://www.figma.com/file/z54cAcOErNjlVBsZ1DrXyD/Qdant?type=design&node-id=0-1&mode=design) and organized the work into six milestones. The layout connected the collection browser, point viewer, query editor, and vector visualization pages.

The collection page listed the available collections and linked to their data.

{{< figure src="/blog/web-ui-gsoc/collections-page.png" caption="The collection browser in the 2023 Web UI." alt="Qdrant Web UI listing collections and their vector configurations" >}}

The point viewer let users inspect stored data and choose a point for a recommendation query. Its "find similar" action used the selected point's ID to retrieve related points.

{{< figure src="/blog/web-ui-gsoc/points-page.png" caption="The point viewer in the 2023 Web UI." alt="Stored points and payloads with actions for finding similar points" >}}

I also built a query editor with syntax highlighting, autocomplete, and error checks. Connecting Monaco Editor to API requests required both language support and a way to run individual queries.

{{< figure src="/blog/web-ui-gsoc/console-page.png" caption="The query editor in the 2023 Web UI." alt="Query editor with a request and its Qdrant response" >}}

The visualization page reduced high-dimensional vectors to two dimensions and displayed the resulting points with their payloads.

{{< figure src="/blog/web-ui-gsoc/visualization-page.png" caption="Vector visualization in the 2023 Web UI." alt="Two-dimensional vector plot with a point's payload shown for inspection" >}}

## Working Through the Challenges

Autocomplete was one of the harder parts. My mentor, Andrey, suggested a separate module that could use the OpenAPI specification to support suggestions. This helped connect the editor's language features to the API definitions.

Vector reduction also put pressure on the browser. I moved that work into Web Workers so the main thread could keep handling the interface. Learning how to start and terminate workers became part of the implementation.

The console had its own integration problems. Parsing requests, sending them to Qdrant, and displaying responses had to work together. A bug that registered the run button several times reminded me to test the editor's lifecycle, not only a single successful query.

## What I Took From the Project

The project introduced me to vector search, dimension reduction, Monaco Editor, Material UI, and Vite. It also taught me to set realistic milestones and ask for feedback while the work was still easy to change.

At the end of the program, I wanted to improve JSON key-value suggestions, connect error checks more closely to OpenAPI, and explore faster visualization methods.

Thank you to my mentors and the Qdrant community for helping me complete the work. To explore your own collections, open the [current Qdrant Web UI](/documentation/web-ui/).
