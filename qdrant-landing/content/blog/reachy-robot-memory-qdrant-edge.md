---
title: "Reachy Remembers: Giving a Robot a Local Semantic Memory with Qdrant Edge"
draft: false
slug: reachy-robot-memory-qdrant-edge
short_description: "A desk robot that recognizes you, recalls yesterday's conversation, and remembers what it saw, with every memory stored on its own disk. How Qdrant Edge gave Reachy Mini a memory that never leaves the robot."
description: "How we built on-device memory for Reachy Mini with Qdrant Edge: three shards, searched in under a millisecond on a Raspberry Pi."
preview_image: /blog/reachy-robot-memory-qdrant-edge/hero.jpg
social_preview_image: /blog/reachy-robot-memory-qdrant-edge/hero.jpg
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

<iframe width="560" height="315" src="https://www.youtube.com/embed/PxGlBlqTxJI?start=3709" title="Reachy Mini and Qdrant Edge on the Vector Space Stream" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Imagine you bring a Reachy Mini home to keep your father company. You want the robot to be useful, not just cute on a shelf. For that, it has to remember. It has to know his face and name, that the grandchildren call on Sundays, and that the spare key is under the blue pot by the door.

Now think about where that memory lives. If it lives on a server, all those details leave the house: his face, his routine, where the key is, and every frame captured by the camera. That information should stay local, on the robot itself: on the edge, where nothing leaves unless you decide it can. Privacy is not the only reason to keep memory on the edge: on-device search avoids network round trips, taking a fraction of a millisecond, and memory keeps working without connectivity.

That was the idea behind Reachy Remembers, a demo we showed on the Vector Space Stream with [Reachy Mini](https://www.pollen-robotics.com/reachy-mini/). We gave it a **persistent semantic memory** beyond the model’s context, storing what it heard, what it saw, and who was there as vectors in [Qdrant Edge](/edge/), running in-process on the robot’s own disk.

## The Loop: Perceive, Think, Remember, Act 

Everything Reachy does runs through one big loop. The microphone and camera pick up what you say, who is in front of the robot, and what objects are around it. All of that goes to Gemma 4, the dialog model that acts as the robot's brain. On each turn, Gemma either answers directly or reaches for one of three tools:

- `remember` searches the robot's memory in Qdrant Edge.
- `camera` takes a fresh picture, with the head turned if asked.
- `move` nods, shows an emotion, or dances when asked to.

Memory is written automatically, without a tool call: turns are saved when the context fills up, frames when the objects in view change or the robot is asked to look, and faces when Reachy learns a name.

![The Reachy loop: perception feeds a dialog model that replies or calls the remember, camera, and move tools, with Qdrant Edge storing and recalling memories on the robot](/blog/reachy-robot-memory-qdrant-edge/loop.png)

## The Models Behind the Loop

Eight models make up the loop:

- **Whisper** turns speech into text.
- **Gemma 4 E2B** holds the conversation, reads pictures, and decides when to reach for tools.
- **Inflect Nano v2** turns the reply into speech.
- **YOLO26n** detects and labels objects in a frame.
- **YuNet** detects faces.
- **An iResNet trained on HSFace10K** embeds a face into a 512-dimensional vector for recognition.
- **SigLIP2** embeds a picture into a 768-dimensional vector, and a text query into the same space, so words can find pictures.
- **bge-small** embeds conversation exchanges, the words attached to each frame, and facts into a 384-dimensional vector.

Gemma 4 E2B alone weighs 2.5 GB before its KV cache, while the robot has about 3 GB of RAM free, shared with the daemon that drives the motors, camera, and voice loop. In this demo, we therefore run the models on a laptop connected to Reachy over the local network. The memory lives entirely on the robot’s disk, inference runs on hardware you own, and nothing goes to the Internet.

## Qdrant Edge: Where the Memory Lives

Qdrant Edge is the Qdrant vector search engine, shipped as a library you load into your application process. There is no server, no background service, and no network hop. A search is a function call, with data stored and queried directly on the device.

The unit you work with is a **shard**: a self-contained directory on disk holding vectors, payload, the write-ahead log, and segments. Inside a shard you can define multiple named vectors, allowing the same point to have both text and image embeddings.
A shard uses the same snapshot format as a Qdrant server, so you can [restore a shard from a server collection, or sync it back](/documentation/edge/edge-synchronization-guide/) when you want to.

This is how Reachy's main memory shard is created: two named vectors, and a keyword index on `kind` marked as the tenant key:

```python
import os

from qdrant_edge import (Distance, EdgeConfig, EdgeShard, EdgeVectorParams,
                         KeywordIndexParams, UpdateOperation)

config = EdgeConfig(
    vectors={
        "text": EdgeVectorParams(size=384, distance=Distance.Cosine),   # bge-small
        "image": EdgeVectorParams(size=768, distance=Distance.Cosine),  # SigLIP2
    }
)

os.makedirs("memory", exist_ok=True)  # create() wants the directory to exist
memory = EdgeShard.create("memory", config)

# exchanges and frames share the shard, told apart by "kind"
memory.update(UpdateOperation.create_field_index(
    "kind", KeywordIndexParams(is_tenant=True)))
```

## Three Shards on the Robot's Disk

Reachy’s memory is split across three shards based on how each type of data is written and searched.

![Three Qdrant Edge shards on the robot: memory for exchanges and frames, people for faces, and knowledge for facts, each with its own vectors and write and read triggers](/blog/reachy-robot-memory-qdrant-edge/three-shards.png)

### memory/: Remembering Conversations and Scenes

The `memory/` shard holds two kinds of points: exchanges and frames, told apart by the tenant-indexed `kind` field.

- An **exchange** is one pair of what you said and what Reachy answered, embedded with bge-small into the `text` vector. Exchanges move into the shard when the context window fills up. In the demo we cap the window at 1,000 tokens so the audience can watch memory take over: once it's over budget, the oldest half of the conversation goes into `memory/`. Nothing is lost; it becomes searchable instead of resident.

- A **frame** is a picture with both vectors: SigLIP2 embeds the image into `image`, and bge-small embeds a textual description into `text`. The payload stores the JPEG, timestamp, head direction, detected objects, recognized people, and any description Reachy gave when asked to look. These details are combined into a sentence for the text vector.
Frames are written on events: something changes in the scene, Reachy turns its head, someone presents an object, or the camera tool is called. We don't store every frame the robot sees; most are near-identical, which would only add noise to retrieval.

![The memory shard: two named vectors, text and image, and two point types, an exchange with text only and a frame with a picture, words, labels, and names](/blog/reachy-robot-memory-qdrant-edge/memory-shard.png)

### people/: Recognizing People

Faces are the most sensitive thing Reachy stores. Each person is one point, with an ID derived from their name, so meeting Sasha twice updates the same point instead of creating a second one.

A face is stored as a **multivector**: a list of face embeddings, one per shot. When Reachy meets someone new, it collects five shots and asks for their name. When a known person appears at an angle that doesn't match their existing shots, the new pose is appended (up to 10 shots per run). The payload stores their name, when they were first met, when their face multivector was last updated, and the number of shots.

Recognition runs every turn: the current face is compared against every stored person with MaxSim, using the closest matching shot. Scores above 0.35 identify the person; below 0.25 trigger the enrollment flow; scores in between are ignored.

![The people shard: one point per person holding a multivector of face shots, scored with MaxSim against the face in the camera, with scores above 0.35 known, below 0.25 new, and silence in between](/blog/reachy-robot-memory-qdrant-edge/people-shard.png)

### knowledge/: Static Knowledge

The third shard is the one the robot never writes. It holds 62 facts about Qdrant and how the robot itself is built. Each fact is paired with several phrasings of the questions it answers, stored as a multivector on the same point.

The shard is built on the laptop from a text file, and shipped as a 0.7 MB snapshot. At startup, the robot calls `unpack_snapshot` to restore it as a shard. Because the snapshot uses the same format as a Qdrant server collection, the same setup could instead be hosted in Qdrant Cloud, edited there, and synced to a fleet of robots.

![The knowledge shard: a facts file embedded on the laptop into a snapshot, unpacked on the robot, with the same snapshot available from a Qdrant Cloud collection](/blog/reachy-robot-memory-qdrant-edge/knowledge-shard.png)

## One Question, End to End

Say you ask: “Do you remember what you saw on your left?”

Whisper transcribes the question. The current frame goes through YuNet and the face model, and the robot searches `people/` to decide whether to greet you or ask your name. Gemma reads the question and calls `remember`. The query is embedded on the laptop, while the search runs in the robot’s own `memory/` shard, on its own disk, in-process. Matching frames come back to Gemma as pictures, and Gemma describes what it saw. Inflect speaks the answer. If the context is over budget, the oldest half of the conversation is moved into `memory/`.

Of all these steps, the search is the fastest.


## The Search Is the Cheap Part

The demo ran with about 500 memories. Searching them all (384-dimensional vectors with cosine distance) takes 0.46 ms on the robot's Raspberry Pi CM4. Everything else in the turn, from speech recognition to the dialog model and speech synthesis, takes seconds. Next to that, retrieval is negligible.

Writing to memory is different. Embedding a turn of text takes under 100 ms on the robot, so it can happen every turn. Embedding a frame takes a couple of seconds, which is why frames are embedded only when something changes. Faces are embedded only when Reachy needs to recognize or learn someone.

We also tested how search scales on the same CM4:

![One search against stores from 1,000 to 250,000 vectors, with three strategies: a full scan that compares every vector exactly, binary quantization that scans a 1-bit copy in RAM and rechecks the best 300 exactly, and an HNSW index walked toward the query with ef=32](/blog/reachy-robot-memory-qdrant-edge/latency.png)

At small scale, a full scan is competitive with HNSW and requires no index. As the memory grows, HNSW keeps search under a millisecond, reaching 250,000 vectors at 0.68 ms. Building that index took about six minutes on the CM4 and added roughly 5% on disk. For a robot accumulating memories over weeks, that's a one-time cost; the indexed shard can also be [built on a server and synced back](/documentation/edge/edge-synchronization-guide/).

## What Was Hard

The memory itself was straightforward. The constraints around it shaped the design, and the [technical writeup](https://medium.com/@denisov.shureg/efe223ac442b) walks through all of them:

- The context fills up quickly, so old turns move into Qdrant Edge and come back when they're needed instead of being summarized or dropped.
- Deep into a conversation, a small model with tools can reach for the camera when you ask what it *saw*. So there is one `remember` tool: the model says what the question is about, and the tense tells it whether to retrieve or look again.
- “What did you see today?” names nothing a vector can match. Frames therefore carry searchable text from their own metadata.

## What To Take From This

You don't need a robot to replicate this. The same patterns apply to a phone, a pair of glasses, or any other device that needs local memory. The shard does one thing: find what resembles the query. The rest is the harness around it: when to write, which shard to search, and what counts as an answer.

- Split shards by how the data lives and is searched. Data that only differs by type can share a shard with a tenant key.
- Use one named vector per embedding model, so a single point can carry both text and image embeddings and be searched through either.
- Use a multivector when one entity has many views. A person is a set of face shots, a fact answers a set of questions, and MaxSim scores the query against the best-matching representation.
- Ship static knowledge as a snapshot. Build it where you have compute, then restore it on the device.
- Don't build an index under about 10,000 vectors. Scan. Above that, HNSW keeps search under a millisecond on a Raspberry Pi.
- Give every shard its own threshold, and tune it on live questions. A search always returns a nearest neighbor, even for a question with no answer, and every embedding model has its own scale.

## Try It Yourself

The code is in the [reachy-edge-memory repository](https://github.com/qdrant-labs/reachy-edge-memory), and the [technical writeup](https://medium.com/@denisov.shureg/efe223ac442b) covers the constraints we ran into and what they forced.

Want to build your own? [Qdrant Edge](/edge/) is free to use and in beta. The [Edge quickstart](/documentation/edge/edge-quickstart/) walks through creating a shard, writing points, and querying them. The [Edge API reference](/documentation/edge/edge-api/) covers named vectors, multivectors, and [snapshots](/documentation/edge/edge-api/snapshots/).

The memory never leaves the robot. That was the point.
