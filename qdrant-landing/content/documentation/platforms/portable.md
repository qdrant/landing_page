---
title: Portable.io
aliases: [ ../frameworks/portable/ ]
---

# Portable

[Portable](https://portable.io/) is an ELT platform that builds connectors on-demand for data teams. It enables connecting applications to your data warehouse with no code.

You can avail the [Qdrant connector](https://portable.io/connectors/qdrant) to build data pipelines from your collections.

![Qdrant Connector](/documentation/frameworks/portable/home.png)

## Prerequisites

1. A Qdrant instance to connect to. You can get a free cloud instance at [cloud.qdrant.io](https://cloud.qdrant.io/).
2. A [Portable account](https://app.portable.io/).

## Setting up the connector

Navigate to the Portable dashboard. Search for `"Qdrant"` in the sources section.

![Install New Source](/documentation/frameworks/portable/install.png)

Configure the connector with your Qdrant instance credentials.

![Configure connector](/documentation/frameworks/portable/configure.png)

You can now build your flows using data from Qdrant by selecting a [destination](https://app.portable.io/destinations) and scheduling it.

## Further Reading

- [Portable API Reference](https://developer.portable.io/api-reference/introduction).
- [Portable Academy](https://portable.io/learn)
