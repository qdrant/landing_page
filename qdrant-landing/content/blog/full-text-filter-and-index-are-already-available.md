---
draft: false
title: Full-text filter and index are already available!
slug: qdrant-introduces-full-text-filters-and-indexes
short_description: Qdrant v0.10 introduced full-text filters
description: Qdrant v0.10 introduced full-text filters and indexes to enable
  more search capabilities for those working with textual data.
preview_image: /blog/from_cms/andrey.vasnetsov_black_hole_sucking_up_the_word_tag_cloud_f349586d-3e51-43c5-9e5e-92abf9a9e871.png
date: 2022-11-16T09:53:05.860Z
author: Kacper Łukawski
featured: false
tags:
  - Information Retrieval
  - Database
  - Open Source
  - Vector Search Database
---
Qdrant is designed as an efficient vector database, allowing for a quick search of the nearest neighbours. But, you may find yourself in need of applying some extra filtering on top of the semantic search. Up to version 0.10, Qdrant was offering support for keywords only. Since 0.10, there is a possibility to apply full-text constraints as well. There is a new type of filter that you can use to do that, also combined with every other filter type.

## Using full-text filters without the payload index

Full-text filters without the index created on a field will return only those entries which contain all the terms included in the query. That is effectively a substring match on all the individual terms but **not a substring on a whole query**.

![](/blog/from_cms/1_ek61_uvtyn89duqtmqqztq.webp "An example of how to search for “long_sleeves” in a “detail_desc” payload field.")

## Full-text search behaviour on an indexed payload field

There are more options if you create a full-text index on a field you will filter by.

![](/blog/from_cms/1_pohx4eznqpgoxak6ppzypq.webp "Full-text search behaviour on an indexed payload field There are more options if you create a full-text index on a field you will filter by.")

First and foremost, you can choose the tokenizer. It defines how Qdrant should split the text into tokens. There are three options available:

* **word** — spaces, punctuation marks and special characters define the token boundaries
* **whitespace** — token boundaries defined by whitespace characters
* **prefix** — token boundaries are the same as for the “word” tokenizer, but in addition to that, there are prefixes created for every single token. As a result, “Qdrant” will be indexed as “Q”, “Qd”, “Qdr”, “Qdra”, “Qdran”, and “Qdrant”.

There are also some additional parameters you can provide, such as

* **min_token_len** — minimal length of the token
* **max_token_len** — maximal length of the token
* **lowercase** — if set to *true*, then the index will be case-insensitive, as Qdrant will convert all the texts to lowercase

# Using text filters in practice

![](/blog/from_cms/1_pbtd2tzqtjqqlbi61r8czg.webp "There are also some additional parameters you can provide, such as  min_token_len — minimal length of the token max_token_len — maximal length of the token lowercase — if set to true, then the index will be case-insensitive, as Qdrant will convert all the texts to lowercase Using text filters in practice")

The main difference between using full-text filters on the indexed vs non-indexed field is the performance of such query. In a simple benchmark, performed on the [H&M dataset](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations) (with over 105k examples), the average query time looks as follows (n=1000):

![](/blog/from_cms/screenshot_31.png)

It is evident that creating a filter on a field that we’ll query often, may lead us to substantial performance gains without much effort.