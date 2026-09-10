---
title: "Agentic Tools"
short_description: "Tools that help AI coding assistants work with Qdrant: a prompt to get started, and agent skills that carry solutions architect knowledge into your agent."
description: "Qdrant agentic tools for AI coding assistants. Start from a single prompt that runs Qdrant locally and installs the Qdrant Advisor, then use agent skills to diagnose and tune search, memory, scaling, and relevance in a running deployment."
weight: 303
partition: develop
---

# Agentic Tools

Qdrant provides tools and resources that help AI agents work with Qdrant more effectively.
Use them to give your agent task-specific guidance, troubleshoot existing deployments, design and evaluate search systems, and apply Qdrant best practices to your specific use case.

## Start Building

If you're new to Qdrant, paste this into your coding assistant.
It stands up a local instance, installs the client with local embeddings, adds the [Qdrant Advisor](/documentation/agentic-tools/skills/#the-qdrant-advisor) skill, and then builds against your own use case.

{{< prompt "start-building" >}}

Nothing in those four steps needs an account.
Qdrant runs in Docker and [FastEmbed](/documentation/fastembed/fastembed-quickstart/) generates embeddings on your machine, so you can go from nothing to a working search query without signing up for anything.

Step 4 does the work that matters.
A wrong collection configuration rarely fails loudly in vector search: a mismatched distance metric or a missing payload index returns plausible results and quietly costs you relevance, so it's worth making your agent commit to those choices out loud before it writes code.

## Agent Skills

[Agent skills](/documentation/agentic-tools/skills/) encode solutions architect knowledge as structured files your agent loads on demand.
They're organized around symptoms, so they answer "why is this happening, and what should I check first?"
Reach for skills when something is already running and behaving unexpectedly: slow search, growing memory, a stuck optimizer, poor relevance.
