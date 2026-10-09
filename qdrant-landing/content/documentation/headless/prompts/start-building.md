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

1. Ask whether I want a free Qdrant Cloud cluster or a local Docker instance. Recommend Cloud: nothing needs to run on my machine, and Cloud Inference creates embeddings for free.

2. Create a new, empty directory named quickstart-YYYY-MM-DD with today's date, and work in it. Install the Qdrant Advisor skill there: npx skills add qdrant/skills/meta/qdrant-advisor

3. Cloud: ask me to create a free cluster at https://cloud.qdrant.io. When it's created, the console shows the cluster's endpoint and an API key. Ask me to copy both into a .env file in the directory as QDRANT_URL and QDRANT_API_KEY, and load them from there. Never ask me to paste them in chat. Add .env to .gitignore.
   A new key can take a few seconds to work. If the first request returns 403, retry.
   Local: docker run -d -p 6333:6333 -p 6334:6334 -v "$(pwd)/qdrant_storage:/qdrant/storage:z" qdrant/qdrant

4. Ask which language I want, then install the Qdrant client.
   Cloud: no embedding library. Send text as Document objects with a free model from https://qdrant.tech/documentation/cloud/inference/#qdrant-hosted-models. In Python, set cloud_inference=True. For other languages, find examples with https://skills.qdrant.tech/snippets/search?language=<LANGUAGE>&query=cloud+inference
   Local: if I have no preference, use Python with pip install "qdrant-client[fastembed]".

5. First, offer a quick demo on sample data. If I decline, go to step 6. If I accept, download demo.py and menu-items.json from https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/ai-getting-started/ and run python demo.py. If I picked another language, port demo.py to it, with the same data and queries.
   Cloud: install qdrant-client, then change only the client setup to use QDRANT_URL, QDRANT_API_KEY, and cloud_inference=True, and set EMBED_MODEL to sentence-transformers/all-minilm-l6-v2.
   Local: install qdrant-client[fastembed] and run it unmodified.
   When you show me the output, introduce it in a few sentences: what the dataset is, which text was embedded and with which model, what each query searched for, and why the top results match even when they share no words with the query.

6. Next, offer to build something on my own data. If I decline, stop. If I accept, ask what I'm building and what I'll search over before you write any code. If I don't have data yet, use menu-items.json, downloading it from the URL in step 5 if needed. Consult the Qdrant Advisor skill, and:
   - Take the vector size from the model. For Qdrant-hosted models, it's in the Dimensions column at https://qdrant.tech/documentation/cloud/inference/#qdrant-hosted-models. Never guess it.
   - Use the distance metric the model was trained for, and say why.
   - Create a payload index of the right type for every field I'll filter on, before loading data.
   - For multiple fields or hybrid search, explain the named-vector layout and its trade-offs.
   Then load a small sample, run a real query, and show me the results.
