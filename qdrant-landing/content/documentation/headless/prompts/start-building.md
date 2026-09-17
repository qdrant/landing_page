---
title: "Start building on Qdrant"
page: /documentation/agentic-tools/
# Expanded because this prompt is the point of the hub page. Do not copy
# this to an in-page prompt; those are always collapsed.
#
# This is the one prompt whose line breaks are structure rather than wrapping,
# so it keeps them. Two rules follow from that, both about pre-wrap wrapping a
# second time on a narrow screen:
#   - Commands go on one line, however long. A backslash continuation wraps
#     again and lands the continuation under the wrong column.
#   - Prose inside a step is one line per step or bullet, never hard-wrapped.
#     A 65-column source wrap colliding with a 37-column screen wrap leaves
#     orphan fragments on their own lines.
open: true
skill: meta/qdrant-advisor
---
Help me get started building on Qdrant.

1. Start Qdrant locally with Docker. No signup and no API key needed:
   docker run -d -p 6333:6333 -p 6334:6334 -v "$(pwd)/qdrant_storage:/qdrant/storage:z" qdrant/qdrant
   Confirm it's running at http://localhost:6333/dashboard

2. Install the client with local embeddings, so I don't need an embedding provider key either:
   pip install "qdrant-client[fastembed]"

3. Install the Qdrant Advisor agent skill:
   npx skills add qdrant/skills/meta/qdrant-advisor

4. Then ask me what I'm building and what I'll search over before you write any code. Once you know, build the integration against my local instance, and get the collection right the first time:
   - Derive the vector size from the model with client.get_embedding_size(model_name). Never hardcode a dimension.
   - Choose the distance metric the model was trained for, and say which one you picked and why.
   - Create a payload index for every field I'll filter on, before I load data rather than after.
   Then load a small sample, run a real query, and show me the results.
