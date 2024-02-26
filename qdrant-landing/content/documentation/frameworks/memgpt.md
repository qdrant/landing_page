---
title: MemGPT
weight: 2400
---

# MemGPT

[MemGPT](https://memgpt.ai/) is a system that enables LLMs to manage their own memory and overcome limited context windows to

- Create perpetual chatbots that learn about you and change their own personalities over time.
- Create perpetual chatbots that can interface with large data stores.

Qdrant is available as a storage backend in MemGPT for storing and semantically retrieving data.

## Usage

You can configure MemGPT to use either a Qdrant server or an in-memory instance with the `memgpt configure` command.

#### Configuring the Qdrant server

When you run `memgpt configure`, go through the prompts as described in the [MemGPT configuration documentation](https://memgpt.readme.io/docs/config).
After you address several `memgpt` questions, you come to the following `memgpt` prompts:

```console
? Select storage backend for archival data: qdrant
? Select Qdrant backend: server
? Enter the Qdrant instance URI (Default: localhost:6333): https://xyz-example.eu-central.aws.cloud.qdrant.io
```

You can set an API key for authentication using the `QDRANT_API_KEY` environment variable.

#### Configuring an in-memory instance

```console
? Select storage backend for archival data: qdrant
? Select Qdrant backend: local
```

The data is persisted at the defautl MemGPT storage directory.

## Further Reading

MemGPT [Documentation](https://memgpt.readme.io/docs/index).
