---
label: HOW IT WORKS
title: From Install To First Query
steps:
  - id: 0
    icon:
      src: /icons/outline/hard-drive-purplt.svg
      alt: Hard drive
    title: Create or load an Edge Shard on local disk.
    description: Install the Python bindings with pip install qdrant-edge-py, or add the qdrant-edge crate for Rust. Call create to start a new shard at a path you choose, or load to open one that already has data.
  - id: 1
    icon:
      src: /icons/outline/app-window.svg
      alt: App window
    title: Update and query it directly from your application.
    description: Write and query points in the same process, with no client to configure and no connection to open. Call flush to persist writes and optimize to compact the shard. Nothing runs between your calls.
  - id: 2
    icon: 
      src: /icons/outline/refresh-cw-green.svg
      alt: Refresh
    title: Synchronize with a central Qdrant server whenever you need to.
    description: Apply a partial snapshot from the server with update_from_snapshot in Python, or recover_partial_snapshot in Rust.
banner:
  icon:
    src: /icons/outline/hard-drive-download.svg
    alt: Hard drive download
  description: Install a library and open a file on disk. There is no container to build and nothing to run between your calls.
  link: 
    url: /documentation/edge/edge-synchronization-guide/
    text: Read The Qdrant Edge Synchronization Guide
sitemapExclude: true
---

