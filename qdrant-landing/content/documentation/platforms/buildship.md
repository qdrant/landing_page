---
title: BuildShip
aliases: [ ../frameworks/buildship/ ]
---

# BuildShip

[BuildShip](https://buildship.com/) is a low-code visual builder to create APIs, scheduled jobs, and backend workflows with AI assitance.  

You can use the [Qdrant integration](https://buildship.com/integrations/qdrant) to development workflows with semantic-search capabilites.

## Prerequisites

1. A Qdrant instance to connect to. You can get a free cloud instance at [cloud.qdrant.io](https://cloud.qdrant.io/).
2. A [BuildsShip](https://buildship.app/) for developing workflows.

## Nodes

Nodes are are fundamental building blocks of BuildShip. Each responsible for an operation in your workflow.

The Qdrant integration includes the following nodes with extensibility if required.

### Add Point

![Add Point](/documentation/frameworks/buildship/add.png)

### Retrieve Points

![Retrieve Points](/documentation/frameworks/buildship/get.png)

### Delete Points

![Delete Points](/documentation/frameworks/buildship/delete.png)

### Search Points

![Search Points](/documentation/frameworks/buildship/search.png)

## Further Reading

- [BuildShip Docs](https://docs.buildship.com/basics/node).
- [BuildShip Integrations](https://buildship.com/integrations)
