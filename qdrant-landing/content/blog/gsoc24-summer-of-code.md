---
draft: false
title: Qdrant Summer of Code 24
slug: qdrant-summer-of-code-24
short_description: Introducing Qdrant Summer of Code 2024 program.
description: "Introducing Qdrant Summer of Code 2024 program. GSoC alternative."
preview_image: /blog/Qdrant-summer-of-code.png
date: 2024-02-21T00:39:53.751Z
author: Andre Zayarni
featured: false
tags:
  - Open Source
  - Vector Database
  - Summer of Code
  - GSoC24
---
Google Summer of Code (#GSoC) is celebrating its 20th anniversary this year with the 2024 program. Over the past 20 years, 19K new contributors were introduced to #opensource through the program under the guidance of thousands of mentors from over 800 open-source organizations in various fields. Qdrant participated successfully in the program last year. Both projects, the UI Dashboard with unstructured data visualization and the advanced Geo Filtering, were completed in time and are now a part of the engine. One of the two young contributors joined the team and continues working on the project. 

We are thrilled to announce that Qdrant was 𝐍𝐎𝐓 𝐚𝐜𝐜𝐞𝐩𝐭𝐞𝐝 into the GSoc 2024 program for unknown reasons, but instead, we are introducing our own 𝐐𝐝𝐫𝐚𝐧𝐭 𝐒𝐮𝐦𝐦𝐞𝐫 𝐨𝐟 𝐂𝐨𝐝𝐞 program with a stipend for contributors! To not reinvent the wheel, we follow all the timelines and rules of the official Google program. 



## Our project ideas. 
We have prepared some excellent project ideas. Take a look and choose if you want to contribute in Rust or a Python-based project.


➡ *WASM-based dimension reduction viz* 📊 

Implement a dimension reduction algorithm in Rust, compile to WASM and integrate the WASM code with Qdrant Web UI.

➡ *Efficient BM25 and Okapi BM25, which uses the BERT Tokenizer* 🥇

BM25 and Okapi BM25 are popular ranking algorithms. Qdrant's FastEmbed supports dense embedding models. We need a fast, efficient, and massively parallel Rust implementation with Python bindings for these. 

➡ *ONNX Cross Encoders in Python* ⚔️ 

Export a cross-encoder ranking models to operate on ONNX runtime and integrate this model with the Qdrant's FastEmbed to support efficient re-ranking

➡ *Ranking Fusion Algorithms implementation in Rust* 🧪

Develop Rust implementations of various ranking fusion algorithms including but not limited to Reciprocal Rank Fusion (RRF). For a complete list, see: https://github.com/AmenRa/ranx
and create Python bindings for the implemented Rust modules.

➡ *Setup Jepsen to test Qdrant’s distributed guarantees* 💣

Design and write Jepsen tests based on implementations for other Databases and create a report or blog with the findings.


See all details on our Notion page: https://www.notion.so/qdrant/GSoC-2024-ideas-1dfcc01070094d87bce104623c4c1110


Contributor application period begins on March 18th. We will accept applications via email. Let's contribute and celebrate together! 

In open-source, we trust! 🦀🤘🚀
