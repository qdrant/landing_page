---
label: HARDWARE FIT
title: Built For Constrained Devices
tabs:
  - id: 0
    title: Python
    code: |
      from pathlib import Path

      SHARD_DIRECTORY = "./qdrant-edge-directory"
    
      Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
  - id: 1
    title: Rust
    code: |
      const SHARD_DIRECTORY: &str = "./qdrant-edge-directory";
      
      fs_err::create_dir_all(SHARD_DIRECTORY)?;
cards:
  - id: 0
    title: Runs on devices with no room for a database process.
    description: Qdrant Edge is designed for in-process retrieval on devices that don't have room for a database process, and nothing runs between your calls.
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

