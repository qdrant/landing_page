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
skills:
  - meta/qdrant-advisor
---
Help me get started building on Qdrant.

1. Start Qdrant locally with Docker. No signup and no API key needed:
   docker run -d -p 6333:6333 -p 6334:6334 -v "$(pwd)/qdrant_storage:/qdrant/storage:z" qdrant/qdrant
   Confirm it's running at http://localhost:6333/dashboard

2. Ask me which language I want to build in, then install the Qdrant client for it. If I have no preference, use Python with local embeddings so I don't need an embedding provider key either:
   pip install "qdrant-client[fastembed]"

3. Install the Qdrant Advisor agent skill:
   npx skills add qdrant/skills/meta/qdrant-advisor

4. Ask me whether I want a quick demo with sample data, or want to build against my own data.

5. If I want a demo: install qdrant-client[fastembed] for it even if I chose a different language above, download https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/ai-getting-started/demo.py and https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/ai-getting-started/menu-items.json into the same folder, and run python demo.py unmodified. Do not write your own version of this script. It creates a collection called items sized for sentence-transformers/all-MiniLM-L6-v2 (384 dimensions, cosine distance), embeds and upserts the 30 sample menu items locally, and runs three example searches. Show me the output, then ask if I want to continue by building against my own data.

6. If I want to build against my own data, or once the demo is done: ask me what I'm building and what I'll search over before you write any code. Once you know, build the integration against my local instance, and get the collection right the first time:
   - Derive the vector size from the embedding model itself. Never hardcode a dimension.
   - Choose the distance metric the model was trained for, and say which one you picked and why.
   - Create a payload index for every field I'll filter on, before I load data rather than after.
   Then load a small sample, run a real query, and show me the results.
