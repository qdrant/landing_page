---
title: FAQs
questions:
- id: 0
  question: How is Qdrant Edge different from running Qdrant on a small machine?
  answer: "Qdrant Server uses a client-server architecture: you run it as a process and talk to it over the network. Qdrant Edge runs inside your application process instead, as an embedded library with no background services. Think of it as SQLite, but for vector search. There's no server to deploy, no port to expose, and no network hop between your application and its data."
- id: 1
  question: How does synchronization with a central Qdrant server work?
  answer: Qdrant Edge provides APIs to synchronize an Edge Shard with a Qdrant server collection. Apply a partial snapshot to the shard with update_from_snapshot in Python or recover_partial_snapshot in Rust. You can use this to offload indexing to a more powerful instance, back up and restore data, aggregate data from multiple devices centrally, or keep devices consistent with each other.
- id: 2
  question: Which languages does Qdrant Edge support?
  answer: Python and Rust. Install the Python bindings with pip install qdrant-edge-py, or add the qdrant-edge crate. Examples for both are in the Qdrant GitHub repository. If you need another language, talk to us before committing to an architecture.
- id: 3
  question: Can I generate embeddings on the device?
  answer: Yes. Generate vector embeddings on-device with FastEmbed, and BM25 sparse embeddings on-device for keyword search. Both have their own guides in the Qdrant Edge documentation.
- id: 4
  question: Is Qdrant Edge ready for production?
  answer: Qdrant Edge is in beta as of August 2026, and the API and functionality may change in future releases. It's publicly available and you can start building with it today. Talk to us about your device class and timeline if you need stability guarantees.
- id: 5
  question: What can an Edge Shard do?
  answer: An Edge Shard manages its own vector and payload storage and performs search and retrieval locally. The API covers creating and loading a shard, updating and querying data, faceting, scrolling, counting, retrieving by ID, flushing to disk, optimizing, reading shard metadata, and applying snapshots.
sitemapExclude: true
---
