---
title: "Qdrant Setup"
short_description: "Spin up a managed Qdrant Cloud cluster, generate API keys, and explore the Web UI for collections, points, and cluster monitoring."
description: Set up your Qdrant Cloud cluster in minutes. Learn to create collections, manage data, access the Web UI, and connect securely from Python.
weight: 2
isLesson: true
---

{{< date >}} Module 0 {{< /date >}}

# Qdrant Setup

<div class="video">
<iframe 
  src="https://www.youtube.com/embed/9JBlgNBQoOY?si=7t3LAvMsUUtlUMN7&rel=0"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

<br/>

Welcome to your first hands-on step. Before you can search anything, you need a place to store your vectors. That's what Qdrant Cloud gives you: a managed database that runs in the cloud, so there's nothing to install and nothing to keep running on your own machine. It comes with a secure connection, automatic backups, and a clean interface you'll use throughout this course.

Don't worry if some words here are new. You'll set up a cluster, get a key that lets your code talk to it, and run one quick check to confirm it's working. That's the whole goal for this lesson.

## Create Your Cluster

A **cluster** is your personal Qdrant instance in the cloud. Here's how to create one:

1. Sign up at [cloud.qdrant.io](https://cloud.qdrant.io/signup) with email, Google, or GitHub.
2. Open **Clusters** and select **Create a Free Cluster**. The Free Tier is enough for this whole course, and you won't be asked for a card.

![Screenshot of the Qdrant Cloud page for creating a new cluster](/docs/gettingstarted/gui-quickstart/create-cluster.png)

3. Pick a region close to you or your users. This keeps things fast.
4. When the cluster is ready, copy the **API key** and store it somewhere safe. An API key is like a password your code uses to prove it's allowed to reach your cluster, so treat it like one. You can always create new keys later from the **API Keys** section on the cluster page.

![Screenshot of the API key panel in Qdrant Cloud](/docs/gettingstarted/gui-quickstart/api-key.png)

## Access the Web UI

The **Web UI** is a dashboard for looking at your data and running searches without writing code. It's the fastest way to see what's happening inside your cluster while you learn.

1. Select **Cluster UI** in the top corner of the cluster page to open the dashboard.

![Screenshot of the Qdrant Cloud dashboard](/docs/gettingstarted/gui-quickstart/access-dashboard.png)

### What You Can Do in the Web UI

Use the Web UI to manage collections, inspect data, and check how your searches perform.

#### Main Navigation

- **Console:** Run commands against Qdrant right in the browser. Great for testing and seeing responses without writing a program.
- **Collections:** See and manage all your collections in one place, and track their status, size, and settings at a glance.
- **Tutorial:** Follow a guided walkthrough with sample data. You create a collection, add vectors, and run a search with live results.

![Screenshot of the interactive tutorial in the Qdrant Web UI](/docs/gettingstarted/gui-quickstart/interactive-tutorial.png)

- **Datasets:** Load ready-made public datasets into your cluster with one click.

#### Inside a Collection

When you open a collection by selecting its name,

![Screenshot showing how to select a collection in the Web UI](/courses/day0/select-collection.png)

you'll see a detailed view with several tabs. You don't need all of these yet, so here's a plain-language tour you can come back to later:

![Screenshot of the points view inside a collection](/courses/day0/collection-points.png)

- **Points Tab:** Look at, search, and manage your individual data entries. You can view each entry's data, run a quick "find similar" search, or open a graph view of how it connects to its neighbors.
- **Info Tab:** A health check for the collection. The one field to know for now is `status` — `green` means everything is healthy.
- **Cluster Tab:** Shows how your data is spread across machines. You'll care about this only once you scale up.
- **Search Quality Tab:** Measures how accurate your searches are. Useful later, when you start tuning.
- **Snapshots Tab:** Manage backups of the collection. You can create a [collection snapshot](/documentation/snapshots/), restore it, or move it to another cluster.
- **Visualize Tab:** See your vectors as a 2D map. A nice way to build intuition once you have real data loaded.
- **Graph Tab:** Explore how points connect to their nearest neighbors.

## Connect from Python

Now let's connect from code. First, store your credentials in a file named `.env` at the root of your project (or set them in Colab). Keeping them in a separate file means you won't accidentally paste your key into shared code:

```env
QDRANT_URL=https://YOUR-CLUSTER.cloud.qdrant.io:6333
QDRANT_API_KEY=YOUR_API_KEY
```

Then load those values and create a client. The **client** is the object your Python code uses to send requests to Qdrant:

```python
from qdrant_client import QdrantClient, models
import os

client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

# For Colab:
# from google.colab import userdata
# client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))

# Quick health check
collections = client.get_collections()
print(f"Connected to Qdrant Cloud: {len(collections.collections)} collections")
```

If that prints a line about being connected, you're done. That's the whole setup.

## Other Ways to Connect

You can also reach your cluster directly over the web, without Python. This is handy for a quick test:

```bash
# Using the api-key header
curl -X GET https://xyz-example.eu-central.aws.cloud.qdrant.io:6333/collections \
  --header 'api-key: <your-api-key>'

# Using the Authorization header
curl -X GET https://xyz-example.eu-central.aws.cloud.qdrant.io:6333/collections \
  --header 'Authorization: Bearer <your-api-key>'
```

## Quick Validation

If you want to double-check the connection, these two commands confirm your cluster is up and reachable:

```bash
# Service health
curl -s "$QDRANT_URL/healthz" -H "api-key: $QDRANT_API_KEY"

# List collections
curl -s "$QDRANT_URL/collections" -H "api-key: $QDRANT_API_KEY"
```

## Good Practices

A few habits worth starting now:

- Keep your key out of your code. Use an environment variable or a secrets manager.
- Rotate your API keys now and then from the cluster **Access** tab.
- Use HTTPS only, and tighten access before you expose a cluster to the public internet.

## Common Issues

- **Authentication error:** Recheck the API key and the `api-key` header. A stray space or a missing character is the usual cause.
- **Connection error:** Confirm the cluster is running and the region URL is correct. Some workplace networks block outbound connections, so try from a personal network if a request hangs.

## Qdrant Cloud Inference

This part is optional, but good to know it exists. Normally you turn text or images into vectors yourself before storing them. **[Cloud Inference](/cloud-inference/)** does that step for you inside Qdrant Cloud: you send raw text or images, and Qdrant creates the vectors and stores them in one call. You'll create vectors by hand in the next lessons so you understand what's happening, but this is a shortcut you can reach for later.

<div class="video">
<iframe
  src="https://www.youtube.com/embed/nJIX0zhrBL4?rel=0"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

Learn more in the [Qdrant Cloud Inference documentation](/documentation/cloud/inference/).

## Qdrant Agent Skills

If you're using an AI coding assistant (Claude Code, Cursor, and others) alongside this course, [Qdrant Skills](/documentation/skills/) are worth setting up early. Skills are open-source, machine-readable knowledge modules that teach your agent when and why to apply a technique, not just how to call an API. They're organized around symptoms and situations, for example "memory usage climbing" and "search quality regressed" rather than features, so your agent can diagnose a problem before prescribing a fix.

Skills are hosted at [skills.qdrant.tech](https://skills.qdrant.tech/) and can be pointed to directly by URL, with no local installation needed. For local or offline use, install them from the [qdrant/skills repository](https://github.com/qdrant/skills):

```bash
# Claude Code
/plugin marketplace add qdrant/skills

# Any agent supporting the npx skills convention
npx skills add https://github.com/qdrant/skills
```

If you just want a single assistant that can troubleshoot and advise on any Qdrant deployment, install the `qdrant-advisor` skill directly:

```bash
npx skills add qdrant/skills/meta/qdrant-advisor
```

`qdrant-advisor` doesn't answer Qdrant questions from memory. When you describe a problem — slow search, memory climbing toward an out-of-memory crash, a stuck optimizer, a scaling decision — it searches `skills.qdrant.tech` live, pulls only the branch of the skill tree that matches your symptom, and grounds its diagnosis in that current, official guidance. It gives you the likely causes in priority order, concrete steps (endpoints, metrics, config), and the documentation links it drew from, so you're always working from up-to-date advice instead of stale training data.

Read more about the motivation and design behind them in the [Qdrant Skills release post](/blog/qdrant-skills-release/).
