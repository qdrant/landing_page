---
title: Qdrant 0.10 released
short_description: A short review of all the features introduced in Qdrant 0.10
description: Qdrant 0.10 brings a lot of changes. Check out what's new!
preview_dir: /articles_data/qdrant-0-10-release/preview
small_preview_image: /articles_data/qdrant-0-10-release/new-svgrepo-com.svg
social_preview_image: /articles_data/qdrant-0-10-release/preview/social_preview.jpg
weight: 70
author: Kacper Łukawski
author_link: https://medium.com/@lukawskikacper
date: 2022-09-19T13:30:00+02:00
draft: false
---

Qdrant 0.10 is a new version that brings a lot of performance improvements, but also some new features which
were heavily requested by our users. Here is an overview of what has changed.

## Storing multiple vectors per object

Previously, if you wanted to use semantic search with multiple vectors per object, you had to create separate collections 
for each vector type. This was even if the vectors shared some other attributes in the payload. With Qdrant 0.10, you can 
now store all of these vectors together in the same collection, which allows you to share a single copy of the payload. 
This makes it easier to use semantic search with multiple vector types, and reduces the amount of work you need to do to 
set up your collections.

## Batch vector search

Previously, you had to send multiple requests to the Qdrant API to perform multiple non-related tasks. However, this 
can cause significant network overhead and slow down the process, especially if you have a poor connection speed. 
Fortunately, the [new batch search feature](https://blog.qdrant.tech/batch-vector-search-with-qdrant-8c4d598179d5) allows 
you to avoid this issue. With just one API call, Qdrant will handle multiple search requests in the most efficient way 
possible. This means that you can perform multiple tasks simultaneously without having to worry about network overhead
or slow performance.

## Built-in ARM support

To make our application accessible to ARM users, we have compiled it specifically for that platform. If it is not 
compiled for ARM, the device will have to emulate it, which can slow down performance. To ensure the best possible 
experience for ARM users, we have created Docker images specifically for that platform. Keep in mind that using 
a limited set of processor instructions may affect the performance of your vector search. Therefore, [we have tested 
both ARM and non-ARM architectures using similar setups to understand the potential impact on performance
](https://blog.qdrant.tech/qdrant-supports-arm-architecture-363e92aa5026).

## Full-text filtering

Qdrant is a vector database that allows you to quickly search for the nearest neighbors. However, you may need to apply 
additional filters on top of the semantic search. Up until version 0.10, Qdrant only supported keyword filters. With the 
release of Qdrant 0.10, [you can now use full-text filters](https://blog.qdrant.tech/qdrant-introduces-full-text-filters-and-indexes-9a032fcb5fa) 
as well. This new filter type can be used on its own or in combination with other filter types to provide even more 
flexibility in your searches.
