---
title: Roadmap
weight: 12
draft: true
---

# Qdrant 2023 Roadmap

Goals of the release:

* **Maintain easy upgrades** - we plan to keep backward compatibility for at least one major version back. 
  * That means that you can upgrade Qdrant without any downtime and without any changes in your client code within one major version.
  * Storage should be compatible between any two consequent versions, so you can upgrade Qdrant with automatic data migration between consecutive versions.
* **Make billion-scale serving cheap** - qdrant already can serve billions of vectors, but we want to make it even more affordable.
* **Easy scaling** - our plan is to make it easy to dynamically scale Qdrant, so you could go from 1 to 1B vectors seamlessly.
* **Various similarity search scenarios** - we want to support more similarity search scenarios, e.g. sparse search, grouping requests, diverse search, etc.

## Milestones

* :atom_symbol: Quantization support
  * [ ] Scalar quantization f32 -> u8 (4x compression)
  * [ ] Advanced quantization (8x and 16x compression)
  * [ ] Support for binary vectors

---

* :arrow_double_up: Scalability
  * [ ] Automatic replication factor adjustment
  * [ ] Automatic shard distribution on cluster scaling
  * [ ] Repartitioning support

---

* :eyes: Search scenarios
  * [ ] Diversity search - search for vectors that are different from each other
  * [ ] Sparse vectors search - search for vectors with a small number of non-zero values
  * [ ] Grouping requests - search within payload-defined groups
  * [ ] Different scenarios for recommendation API

---
    
* Additionally
  * [ ] Extend full-text filtering support
    * [ ] Support for phrase queries
    * [ ] Support for logical operators
  * [ ] Simplify update of collection parameters
