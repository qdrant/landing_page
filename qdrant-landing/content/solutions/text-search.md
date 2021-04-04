---
title: Semantic Sext Search
tabid: textsearch
icon: paper
image: /content/images/text_search.png
image_caption: Neural Text Search
source_link: https://github.com/qdrant/qdrant_demo
demo_link: https://demo.qdrant.tech/
tutorial_link: 
custom_link:
custom_link_name: 
weight: 10
---

In many cases, the usual full-text search does not give the desired result.
Documents may have too few keywords, or queries might be too large.
In those cases, the search either finds no intersections or returns a lot of irrelevant results.

One way to overcome these problems is a neural network-based semantic search.
It can be used stand-alone or in conjunction with traditional search.

The neural search uses **semantic embeddings** instead of keywords and works best with short texts.
With Qdrant and a pre-trained neural network, you can build and deploy semantic neural search on your data in minutes!

Check out our demo. Compare the results of a semantic search based on a pre-trained transformer NN and a regular full-text search.
