---
label: Written in Rust
title: Need a Database Written in Rust? Qdrant Is Rust From Storage to API
description: Qdrant is a vector search engine. Rust gives it memory safety and precise control of memory, so it stays fast and reliable under high load.
image:
  src: /img/lp-rust/rust-end-to-end.png
  alt: A Rust service calling the qdrant-client crate over gRPC into the Qdrant engine, all three written in Rust
cards:
  - id: 0
    title: Keep latency steady under load.
    description: Rust frees memory as soon as a value goes out of scope, so the engine keeps a low memory profile and steady response times as traffic grows.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Run parallel work safely.
    description: Rust's compiler rules out data races, which lets Qdrant parallelize indexing and search across cores.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Ship a small image.
    description: The Qdrant Docker image is about 74 MB compressed on Docker Hub.
    icon:
      src: /icons/outline/shield-check-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
