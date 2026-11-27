---
title: Connect to a Space
short_description: "Install the Serverless client and connect to a Qdrant Serverless space with its endpoint URL and an API key."
description: "Connect to a Qdrant Serverless space with the Serverless client for Python, Rust, Go, Java, or .NET, including the async Python client, and verify the connection."
weight: 20
---

# Connect to a Space

Serverless uses its own client, separate from the client you use with a dedicated cluster: `QdrantServerless` in Python and Rust, `serverless.Client` in Go, and `QdrantServerlessClient` in Java and .NET. Most queries work the same way, but collection management does not. See [Manage Collections](/documentation/serverless/collections/).

If you're moving an application from a dedicated cluster, review the [API Differences](/documentation/interfaces/#api-differences) first.

## What You Need

You need:

- The **endpoint URL** of the space
- An **API key** with the access you need

A global API key is created with the space, so you can connect as soon as it's ready. To scope a key to a single collection or give it an expiry, see [Secure a Space](/documentation/serverless/security/).

The endpoint is served over HTTPS on port 443, with no separate REST or gRPC ports.

## Install the Client

Install the client from its development branch.

{{< code-snippet path="/documentation/headless/snippets/serverless/install-client/" >}}

## Connect

{{< code-snippet path="/documentation/headless/snippets/serverless/connect/" >}}

Treat the API key like any other credential: keep it out of source control, and use a [read-only key](/documentation/serverless/security/#allowed-operations) wherever you don't fully control who can see it.

### Connect Asynchronously

The Rust, Java, and .NET clients are async-only, and the Go client is synchronous. Python ships both a synchronous and an async client. `AsyncQdrantServerless` takes the same arguments as the synchronous one and exposes the same methods, each awaitable.

{{< code-snippet path="/documentation/headless/snippets/serverless/connect-async/" >}}

## Verify the Connection

To verify the connection, you can list collections in the space. A new space returns an empty list rather than an error.

{{< code-snippet path="/documentation/headless/snippets/serverless/list-collections/" >}}
