---
title: Pipedream
aliases: [ ../frameworks/pipedream/ ]
---

# Pipedream

[Pipedream](https://pipedream.com/) is a development platform that allows developers to connect many different applications, data sources, and APIs in order to build automated cross-platform workflows. It also offers code-level control with Node.js, Python, Go, or Bash if required.

You can use the [Qdrant app](https://pipedream.com/apps/qdrant) in Pipedream to add vector search capabilities to your workflows.

## Prerequisites

1. A Qdrant instance to connect to. You can get a free cloud instance at [cloud.qdrant.io](https://cloud.qdrant.io/).
2. A [Pipedream project](https://pipedream.com/) to develop your workflows.

## Setting Up

Search for the Qdrant app in your workflow apps.

![Qdrant Pipedream App](/documentation/frameworks/pipedream/qdrant-app.png)

The Qdrant app offers extensible API interface and pre-built actions.

![Qdrant App Features](/documentation/frameworks/pipedream/app-features.png)

Select any of the actions of the app to set up a connection.

![Qdrant Connect Account](/documentation/frameworks/pipedream/app-upsert-action.png)

Configure connection with the credentials of your Qdrant instance.

![Qdrant Connection Credentials](/documentation/frameworks/pipedream/app-connection.png)

You can verify your credentials using the "Test Connection" button.

Once a connection is set up, you can use the app to build workflows with the [2000+ apps supported by Pipedream](https://pipedream.com/apps/).

## Further Reading

- [Pipedream Documentation](https://pipedream.com/docs).
- [Qdrant Cloud Authentication](https://qdrant.tech/documentation/cloud/authentication/).
- [Source Code](https://github.com/PipedreamHQ/pipedream/tree/master/components/qdrant)
