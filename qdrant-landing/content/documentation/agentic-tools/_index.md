---
title: "Agentic Tools"
short_description: "Tools that help AI coding assistants work with Qdrant: agent skills for diagnosis and tuning, and prompt templates for design, migration, evaluation, and review."
description: "Qdrant agentic tools for AI coding assistants. Agent skills give your agent solutions architect knowledge on demand. Prompt templates give you task-shaped prompts for designing collections, migrating from other engines, evaluating search quality, and reviewing configurations."
weight: 303
partition: develop
---

# Agentic Tools

Qdrant provides tools and resources that help AI agents work with Qdrant more effectively.
Use them to give your agent task-specific guidance, troubleshoot existing deployments, design and evaluate search systems, and apply Qdrant best practices to your specific use case.

## Start Building

If you're new to Qdrant, paste this into your coding assistant.
It stands up a local instance, installs the client with local embeddings, adds the [Qdrant Advisor](/documentation/agentic-tools/skills/#the-qdrant-advisor) skill, and then builds against your own use case.

```text
Help me get started building on Qdrant.

1. Start Qdrant locally with Docker. No signup and no API key needed:
   docker run -p 6333:6333 -p 6334:6334 \
     -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \
     qdrant/qdrant
   Confirm it's running at http://localhost:6333/dashboard

2. Install the client with local embeddings, so I don't need an
   embedding provider key either:
   pip install "qdrant-client[fastembed]"

3. Install the Qdrant Advisor agent skill:
   npx skills add qdrant/skills/meta/qdrant-advisor

4. Then ask me what I'm building and what I'll search over before you
   write any code. Once you know, build the integration against my
   local instance, and get the collection right the first time:
   - Derive the vector size from the model with
     client.get_embedding_size(model_name). Never hardcode a dimension.
   - Choose the distance metric the model was trained for, and say
     which one you picked and why.
   - Create a payload index for every field I'll filter on, before I
     load data rather than after.
   Then load a small sample, run a real query, and show me the results.
```

Nothing in those four steps needs an account.
Qdrant runs in Docker and [FastEmbed](/documentation/fastembed/fastembed-quickstart/) generates embeddings on your machine, so you can go from nothing to a working search query without signing up for anything.

Step 4 does the work that matters.
A wrong collection configuration rarely fails loudly in vector search: a mismatched distance metric or a missing payload index returns plausible results and quietly costs you relevance, so it's worth making your agent commit to those choices out loud before it writes code.

## Agent Skills

[Agent skills](/documentation/agentic-tools/skills/) encode solutions architect knowledge as structured files your agent loads on demand.
They're organized around symptoms, so they answer "why is this happening, and what should I check first?"
Reach for skills when something is already running and behaving unexpectedly: slow search, growing memory, a stuck optimizer, poor relevance.

## Prompt Template Library

The [prompt template library](/documentation/agentic-tools/prompt-templates/) is a set of task-shaped prompts you fill in and hand to your agent.
They answer "how do I get a correct result for my specific case?"
Reach for templates when you're designing something new, moving from another engine, measuring whether search actually works, or reviewing a configuration before it ships.
