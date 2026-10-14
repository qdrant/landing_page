---
label: HARDWARE FIT
title: Built For Constrained Devices
tabs:
  - id: 0
    title: Python
    language: python
    code: |
      from pathlib import Path

      SHARD_DIRECTORY = "./qdrant-edge-directory"
    
      Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
  - id: 1
    title: Rust
    language: rust
    code: |
      const SHARD_DIRECTORY: &str = "./qdrant-edge-directory";
      
      fs_err::create_dir_all(SHARD_DIRECTORY)?;
cards:
  - id: 0
    title: Runs on devices with no room for a database process.
    description: Qdrant Edge uses CPU and memory only while your application is calling it, so it isn't taking resources from the model running alongside it.
  - id: 1
    title: Each device carries its own shard.
    description: An Edge Shard is self-contained and operates independently, so adding a device means creating another shard rather than scaling a cluster.
  - id: 2
    title: Python and Rust today.
    description: Qdrant Edge ships Python bindings on PyPI and the qdrant-edge crate on crates.io. If your application uses another language, talk to us before you commit to an architecture.
link:
  url: /documentation/edge/edge-quickstart/
  text: Read The Qdrant Edge Quickstart
sitemapExclude: true
---

