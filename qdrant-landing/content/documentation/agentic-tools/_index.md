---
title: "Agentic Tools"
short_description: "Tools that help AI coding assistants work with Qdrant: agent skills for diagnosis and tuning, and prompt templates for design, migration, evaluation, and review."
description: "Qdrant agentic tools for AI coding assistants. Agent skills give your agent solutions architect knowledge on demand. Prompt templates give you task-shaped prompts for designing collections, migrating from other engines, evaluating search quality, and reviewing configurations."
weight: 303
partition: develop
---

# Agentic Tools

Most people now reach Qdrant through an AI coding assistant rather than through the documentation directly. Agentic tools are built for that path: they give your agent the context and the judgment it needs to configure vector search correctly, instead of leaving it to infer both from API reference.

There are two, and they answer different questions.

## Agent Skills

[Agent skills](/documentation/agentic-tools/skills/) encode solutions architect knowledge as structured files your agent loads on demand. They're organized around symptoms, so they answer "why is this happening, and what should I check first?" Reach for skills when something is already running and behaving unexpectedly: slow search, growing memory, a stuck optimizer, poor relevance.

## Prompt Template Library

The [prompt template library](/documentation/agentic-tools/prompt-templates/) is a set of task-shaped prompts you fill in and hand to your agent. They answer "how do I get a correct result for my specific case?" Reach for templates when you're designing something new, moving from another engine, measuring whether search actually works, or reviewing a configuration before it ships.
