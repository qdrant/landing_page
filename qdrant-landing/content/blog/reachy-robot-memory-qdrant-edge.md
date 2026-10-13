---
title: "Reachy Remembers: Giving a Robot a Local Semantic Memory with Qdrant Edge"
draft: false
slug: reachy-robot-memory-qdrant-edge
short_description: "A desk robot that recognizes you, recalls yesterday's conversation, and remembers what it saw, with every memory stored on its own disk. How Qdrant Edge gave Reachy Mini a memory that never leaves the robot."
description: "How we built on-device memory for Reachy Mini with Qdrant Edge: three shards, searched in under a millisecond on a Raspberry Pi."
preview_image: /blog/reachy-robot-memory-qdrant-edge/hero-image.jpg
social_preview_image: /blog/reachy-robot-memory-qdrant-edge/preview/social_preview.jpg
date: 2026-10-01
author: Sasha Denisov & Chadha Sridi
featured: true
tags:
  - qdrant-edge
  - on-device-vector-search
  - edge-ai
  - robotics
  - memory
  - vector-search
---

[Reachy Mini](https://www.pollen-robotics.com/reachy-mini/) is an open-source robot from Pollen Robotics and Hugging Face, run by a Raspberry Pi with 4 GB of RAM. We wanted it to do what a good host does: greet you by name the second time you walk in, remember what you talked about, and tell you what it saw while you were gone. A robot that talks through a language model can't do any of that on its own. The model only knows what's in its context: restart the robot and it knows nobody, talk long enough and the start of the conversation falls out, and nothing in it can be searched.

So we gave Reachy a memory of its own, stored as vectors in [Qdrant Edge](/edge/) on the robot's disk. On the robot rather than on a server, because that memory is pictures of a room and of the people in it, and it shouldn't leave the house unless you decide it can. It also means a search takes a fraction of a millisecond and keeps working when the Wi-Fi doesn't. We showed the result live on the Vector Space Stream:

<iframe width="560" height="315" src="https://www.youtube.com/embed/PxGlBlqTxJI?start=3709" title="Reachy Mini and Qdrant Edge on the Vector Space Stream" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## The Loop

Everything Reachy does runs through one loop. Whisper turns what you say into text, a detector and a face model read the camera, and Gemma 4, the dialog model, either answers or calls one of three tools: `remember` to search its memory, `camera` to take a fresh picture, and `move` to make a gesture. Memory is written without any tool call: an exchange when the context fills up, a frame when the objects in view change or Reachy is asked to look, and a face when it learns a name. Two embedding models turn all of that into vectors: SigLIP2 for pictures, and bge-small for text.

![The Reachy loop: perception feeds a dialog model that replies or calls the remember, camera, and move tools, with Qdrant Edge storing and recalling memories on the robot](/blog/reachy-robot-memory-qdrant-edge/loop.png)

Storing memories turned out to be the easy part. The work was in getting Reachy to use them, and one question taught us most of it.

## "What Did You See Today?"

**The first failure.** We asked the question a few turns into a conversation, and Reachy turned its head, took a new picture, and described the room in front of it. It had a memory and a tool to search it, and it reached for the camera instead. A small model with tools picks one from the wording alone, and "what did you see" sounded like "look." The fix was in the `remember` tool's description, where we explicitly state that anything in the past tense belongs here and quote example questions. That took the right choice from 23 to 26 out of 26 test questions, without costing `camera` any of its own.

**The second failure.** With the right tool chosen, the search itself failed. "What did you see today?" names nothing, and a vector search always returns a nearest neighbor: against Reachy's stored frames, the question scored 0.107, above the 0.09 gate we use for real matches. The answer was the last frame it had stored, and the last few frames are near-duplicates of the same scene. The choice that fixed it was to stop searching when a question has no subject and sample instead: start from the newest frame, then keep adding the stored frame least like the ones already picked, using the image vectors Qdrant already holds. Four frames of one evening went from four copies of the same picture to four different scenes.

**The recall.** Now the question works. Gemma calls `remember`, Qdrant Edge hands back several frames from across the day, and Reachy describes them. Questions that do name something, "did you see a bottle?", take the normal path: a sentence stored with each frame, built from what was detected, who was there, and where the head was looking, is searched alongside the picture itself.

![Reachy answering "What did you see today?" on the stream, with the recalled frames visible on the dashboard](/blog/reachy-robot-memory-qdrant-edge/recall.jpg)

What changed once Reachy could remember went beyond that one question. It greeted people by name when they came back into view. A conversation outlived the model's context window: the demo caps it at 1,000 tokens, and once it's full, the oldest half moves into memory instead of being dropped, so "what did we talk about?" still gets an answer an hour later.

## Where the Memory Lives

Qdrant Edge is the Qdrant vector search engine, shipped as a library you load into your own process. There's no server and no network hop; a search is a function call, and the unit of storage is a **shard**, a self-contained directory on disk. Reachy keeps three:

![Three Qdrant Edge shards on the robot: memory with a text and an image vector, people with a face multivector, and knowledge with a text multivector](/blog/reachy-robot-memory-qdrant-edge/three-shards.png)

- **`memory/`** holds exchanges and frames, told apart by a `kind` field indexed as the tenant key. A frame carries two named vectors, one from SigLIP2 and one from bge-small, so it can be found by its picture or by its words.
- **`people/`** holds one point per person, with every shot of their face in a **multivector**. MaxSim scores the face in the camera against each person's closest shot, so a new angle only has to match one of them. Above 0.35 Reachy greets you by name, below 0.25 it asks who you are, and in between it waits until it's sure.
- **`knowledge/`** holds 62 facts about Qdrant and about the robot itself, each stored with the questions it answers as a multivector. The robot never writes it. It's restored at every start from a 0.7 MB snapshot, the same format a Qdrant Cloud collection produces, so the facts could be edited in the cloud and synced to a fleet.

{{< figure src="/blog/reachy-robot-memory-qdrant-edge/memory-shard.png" alt="The memory shard: two named vectors, text and image, and two point types, an exchange with text only and a frame with a picture, words, labels, and names" caption="**Inside the memory/ shard.** An exchange has only a text vector. A frame has both a text and an image vector, plus the JPEG and what was detected in it." width="100%" >}}

When Gemma calls `remember`, it sends a `query` and an `about` label for the kind of memory the question is about. The raw question never reaches Qdrant Edge: the query is embedded first, and the label narrows which shards those vectors are searched in. `seen`, for example, searches the frames, while `anything` searches every shard. Each shard has its own score gate, so a weak nearest neighbor doesn't count as an answer. Qdrant Edge returns the matching points with their scores, and Gemma only sees their payload: an exchange's text or a fact as words, and a frame's JPEG as the picture itself.

One thing to be precise about. Gemma 4 alone weighs 2.5 GB before its KV cache, and the robot has about 3 GB of RAM free, so in this demo the models run on a laptop next to Reachy, over the local network. Storage and search stay on the robot: every vector and payload lives on its disk, and every search runs there, in about half a millisecond for the 500 memories of a demo run. Recalled pictures and text do reach the laptop, because that's where Gemma reads them. Nothing goes to the internet.

## What We Learned

You don't need a robot for any of this. The same lessons apply to a phone, a pair of glasses, or any device that keeps its own memory:

- A search always returns something. Give every store its own score gate, tune it on real questions, and when a question names nothing, don't search at all: sample from the vectors you already have.
- The tool description is part of the retrieval system. A sentence about tense did more for recall than any change to the index.
- Split shards by how data is written and searched, not by what it is. Exchanges and frames share one shard with a tenant key; the facts get their own because they're replaced whole from a snapshot; faces get their own because each person is one multivector matched with MaxSim.

## Next Steps

Next, we're packaging Reachy Remembers as a Reachy Mini App, so anyone with the robot can give it an on-device memory in one install. Until then, the code is in the [reachy-edge-memory repository](https://github.com/qdrant-labs/reachy-edge-memory), and the [technical writeup](https://medium.com/@denisov.shureg/efe223ac442b) has everything this post leaves out: the full model list, the shard configuration, and how search scales to 250,000 memories on the same Raspberry Pi.

Want to build your own? [Qdrant Edge](/edge/) is free to use, and the [Edge quickstart](/documentation/edge/edge-quickstart/) walks through creating a shard, writing points, and querying them.

The memory never leaves the robot. That was the point.
