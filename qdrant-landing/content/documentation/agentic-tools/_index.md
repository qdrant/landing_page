---
title: "Agentic Tools"
short_description: "Tools that help AI coding assistants work with Qdrant: a prompt to get started, agent skills that carry solutions architect knowledge, and prompts embedded across the documentation."
description: "Qdrant agentic tools for AI coding assistants. Start from a single prompt that sets up a free Qdrant Cloud cluster or a local instance and installs the Qdrant Advisor, then use agent skills to diagnose and tune search, memory, scaling, and relevance in a running deployment."
weight: 303
partition: develop
---

# Agentic Tools

Qdrant provides tools and resources that help AI agents work with Qdrant more effectively.
Use them to give your agent task-specific guidance, troubleshoot existing deployments, design and evaluate search systems, and apply Qdrant best practices to your specific use case.

## Start Building

If you're new to Qdrant, the Start building on Qdrant prompt takes your coding assistant from an empty project to a working search query.
It sets up a free Qdrant Cloud cluster (recommended) or a local Docker instance, installs the client and the [Qdrant Advisor](/documentation/agentic-tools/skills/#the-qdrant-advisor) skill, and then either runs a quick demo on sample data or builds against your own use case.

{{< prompt "start-building" >}}

With Qdrant Cloud, nothing needs to run on your machine and you don't need a credit card. **Cloud Inference creates embeddings for free** with the [free Qdrant-hosted models](/documentation/cloud/inference/#qdrant-hosted-models), so you don't need an embedding library or an embedding provider key.

Locally, Qdrant runs in Docker and [FastEmbed](/documentation/fastembed/fastembed-quickstart/) generates embeddings on your machine, so you don't need to sign up for anything.

Collection configuration is important. A mismatched distance metric or a missing payload index can result in slower or lower quality search.
The prompt is written to make your assistant ask what you are building, then commit to those choices out loud before it writes any code.

## Agent Skills

[Agent skills](/documentation/agentic-tools/skills/) encode solutions architect knowledge as structured files your agent loads on demand.
They're organized around symptoms, so they answer "why is this happening, and what should I check first?"
Reach for skills when something is already running and behaving unexpectedly: slow search, growing memory, a stuck optimizer, poor relevance.

## Prompts in the Docs

Short, ready-to-use prompts appear directly on the documentation pages where they are relevant, so you can use the prompts when you need them instead of looking for them elsewhere.
Each prompt points to the agent skill your assistant should load. The prompt gets the task started; the skill provides the deeper Qdrant-specific guidance.
The [prompt index](/documentation/agentic-tools/prompts/) lists all available prompts.
