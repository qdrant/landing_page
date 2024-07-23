---
title: Qdrant Web UI
weight: 2
aliases:
  - /documentation/web-ui/
---

# Qdrant Web UI

You can manage both local and cloud Qdrant deployments through the Web UI.

If you've set up a deployment locally with the Qdrant [Quickstart](/documentation/quick-start/),
navigate to http://localhost:6333/dashboard.

If you've set up a deployment in a cloud cluster, find your Cluster URL in your
cloud dashboard, at https://cloud.qdrant.io. Add `:6333/dashboard` to the end
of the URL. 

## Access the Web UI

Qdrant's Web UI is an intuitive and efficient graphic interface for your Qdrant Collections, REST API and data points.

In the **Console**, you may use the REST API to interact with Qdrant, while in **Collections**, you can manage all the collections and upload Snapshots. 

![Qdrant Web UI](/articles_data/qdrant-1.3.x/web-ui.png)

### Qdrant Web UI features

In the Qdrant Web UI, you can:

- Run HTTP-based calls from the console
- List and search existing [collections](/documentation/concepts/collections/)
- Learn from our interactive tutorial

You can navigate to these options directly. For example, if you used our 
[quick start](/documentation/quick-start/) to set up a cluster on localhost,
you can review our tutorial at http://localhost:6333/dashboard#/tutorial.
