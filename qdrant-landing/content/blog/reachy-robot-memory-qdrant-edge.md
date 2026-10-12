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

[Reachy Mini](https://www.pollen-robotics.com/reachy-mini/) is an open-source robot from Pollen Robotics and Hugging Face, run by a Raspberry Pi with 4 GB of RAM. Imagine you bring it home to keep your father company. To be useful, not just cute on a shelf, it has to remember: his face and name, that the grandchildren call on Sundays, and that the spare key is under the pot by the door.

But a robot that talks through a language model only knows what's in the model's context: restart the robot and it knows nobody. To remember, it needs a memory of its own.
If that memory lives on a server, all those details leave the house. Keeping it on the edge means nothing leaves unless you decide it can. Privacy isn't the only reason: on-device search takes a fraction of a millisecond, and memory keeps working without connectivity.

We gave Reachy a **persistent semantic memory**, stored as vectors in [Qdrant Edge](/edge/) on the robot's own disk. It recognizes the people it has met, recalls what you talked about, and remembers what it saw. We showed it on the Vector Space Stream:

<iframe width="560" height="315" src="https://www.youtube.com/embed/PxGlBlqTxJI?start=3709" title="Reachy Mini and Qdrant Edge on the Vector Space Stream" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## The Loop: Perceive, Think, Remember, Act

Everything Reachy does runs through one big loop. The microphone and camera pick up what you say, who is in front of the robot, and what objects are around it. All of that goes to Gemma 4, the dialog model that acts as the robot's brain. On each turn, Gemma either answers directly or reaches for one of three tools:

- `remember` searches the robot's memory in Qdrant Edge.
- `camera` takes a fresh picture, with the head turned if asked.
- `move` nods, shows an emotion, or dances when asked to.

Memory is written automatically, without a tool call: turns are saved when the context fills up, frames when the objects in view change or the robot is asked to look, and faces when Reachy learns a name.

![The Reachy loop: perception feeds a dialog model that replies or calls the remember, camera, and move tools, with Qdrant Edge storing and recalling memories on the robot](/blog/reachy-robot-memory-qdrant-edge/loop.png)

## What Was Hard

We asked Reachy: "What did you see today?" Getting that one question right shaped most of the memory design. The [technical writeup](https://medium.com/@denisov.shureg/efe223ac442b) walks through every constraint; these three matter most:

- **Routing between tools.** A small model has to choose between `camera` and `remember` from the wording alone, and deep in a conversation it reached for `camera` when asked what it *saw*. The fix was in the tool description, where we explicitly state that "anything in the past tense belongs here" and quote example questions. That took the right choice from 23 to 26 out of 26 test questions.
- **The question names nothing to match.** "What did you see today?" contains no object a vector can find. So every frame carries searchable words built from its own metadata, and a question about the whole day returns its most different frames instead of the single closest one.
- **The context fills up fast.** Old turns move into Qdrant Edge and come back when they're needed, instead of being summarized or dropped.

With those changes, the question works: Reachy pulls several distinct frames out of its own memory and describes its day.

![Reachy answering "What did you see today?" on the stream, with the recalled frames visible on the dashboard](/blog/reachy-robot-memory-qdrant-edge/recall.jpg)

## The Models Behind the Loop

Eight models make up the loop:

- **Whisper**: speech to text
- **Gemma 4 E2B**: the dialog LLM, which holds the conversation, reads pictures, and calls tools
- **Inflect Nano v2**: text to speech
- **YOLO26n**: object detection and recognition
- **YuNet**: face detection
- **An iResNet trained on HSFace10K**: face embeddings for recognition, as 512-dimensional vectors
- **SigLIP2**: image embeddings, as 768-dimensional vectors in the same space as text queries, so words can find pictures
- **bge-small**: text embeddings for exchanges, frame descriptions, and facts, as 384-dimensional vectors

Gemma 4 E2B alone weighs 2.5 GB before its KV cache, while the robot has about 3 GB of RAM free, shared with the daemon that drives the motors, camera, and voice loop. In this demo, we therefore run the models on a laptop connected to Reachy over the local network. Privacy still holds: the memory lives entirely on the robot's disk, inference runs on hardware you own, and nothing goes to the Internet.

## Qdrant Edge: Where the Memory Lives

Qdrant Edge is the Qdrant vector search engine, shipped as a library you load into your application process. There is no server, no background service, and no network hop. A search is a function call, with data stored and queried directly on the device.

The unit you work with is a **shard**: a self-contained directory on disk holding vectors, payload, the write-ahead log, and segments. A shard uses the same snapshot format as a Qdrant server, so you can [restore a shard from a server collection, or sync it back](/documentation/edge/edge-synchronization-guide/) when you want to.

Reachy's main memory shard has one named vector per embedding model, and a keyword index on `kind` marked as the tenant key:

```python
import os

from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeShard,
    EdgeVectorParams,
    KeywordIndexParams,
    UpdateOperation,
)

cosine = Distance.Cosine
config = EdgeConfig(
    vectors={
        # text: bge-small, image: SigLIP2
        "text": EdgeVectorParams(size=384, distance=cosine),
        "image": EdgeVectorParams(size=768, distance=cosine),
    }
)

# create() needs the directory to exist
os.makedirs("memory", exist_ok=True)
memory = EdgeShard.create("memory", config)

# exchanges and frames share the shard, told apart by "kind"
memory.update(
    UpdateOperation.create_field_index(
        "kind", KeywordIndexParams(is_tenant=True)
    )
)
```

## Three Shards on the Robot's Disk

Reachy's memory is split across three shards based on how each type of data is written and searched, and the `remember` tool decides which ones to search. When Gemma calls it, it sends a `query` and an `about` label for the kind of memory the question is about. The raw question never reaches Qdrant Edge: the query is embedded first, with bge-small for text and SigLIP2 for pictures, and the label narrows where those vectors are searched. `seen`, for example, searches the frames in `memory/`, while `anything` searches every shard. Qdrant Edge returns the matching points with their scores, and Gemma only sees their payload: an exchange's text or a fact as words, and a frame's JPEG as the picture itself.

![Three Qdrant Edge shards on the robot: memory with a text and an image vector, people with a face multivector, and knowledge with a text multivector](/blog/reachy-robot-memory-qdrant-edge/three-shards.png)

### memory/: Remembering Conversations and Scenes

`memory/` holds exchanges and frames, told apart by `kind`. An exchange is one turn of conversation. The demo caps the context window at 1,000 tokens so the audience can watch memory take over: once it's full, the oldest half of the conversation moves here, searchable instead of resident. A frame is a picture plus one sentence built from what was detected, who was there, and where the head was looking. Frames are written only on events, because most of what the camera sees is near-identical and would only add noise to retrieval.

![The memory shard: two named vectors, text and image, and two point types, an exchange with text only and a frame with a picture, words, labels, and names](/blog/reachy-robot-memory-qdrant-edge/memory-shard.png)

### people/: Recognizing People

Faces are the most sensitive thing Reachy stores. Each person is one point, with an ID derived from their name, and their face is a **multivector**: five shots taken when Reachy first meets them, plus new poses as it sees them from other angles. MaxSim scores the face in the camera against each person's closest shot, so a new angle only has to match one of them. Above 0.35, Reachy greets you by name; below 0.25, it asks who you are; in between, it waits until it's sure.

![The people shard: one point per person holding a multivector of face shots, scored with MaxSim against the face in the camera, with scores above 0.35 known, below 0.25 new, and silence in between](/blog/reachy-robot-memory-qdrant-edge/people-shard.png)

### knowledge/: Static Knowledge

The third shard is the one the robot never writes: 62 facts about Qdrant and about how the robot itself is built, each stored with several phrasings of the questions it answers, as a multivector on one point. It's built on the laptop and restored at startup from a 0.7 MB snapshot. That snapshot uses the same format as a Qdrant server collection, so the facts could instead live in Qdrant Cloud, be edited there, and sync to a fleet of robots.

![The knowledge shard: a facts file embedded on the laptop into a snapshot, unpacked on the robot, with the same snapshot available from a Qdrant Cloud collection](/blog/reachy-robot-memory-qdrant-edge/knowledge-shard.png)

## The Search Is the Cheap Part

The demo ran with about 500 memories. The query is embedded on the laptop, but the search runs in-process on the robot's Raspberry Pi CM4, and it takes 0.46 ms over all of them (384-dimensional vectors, cosine distance). Everything else in the turn, from speech recognition to the dialog model and speech synthesis, takes seconds. Next to that, retrieval is negligible.

Writing to memory is different. Embedding a turn of text takes under 100 ms on the robot, so it can happen every turn. Embedding a frame takes a couple of seconds, which is why frames are embedded only when something changes. Faces are embedded only when Reachy needs to recognize or learn someone.

We also tested how search scales on the same CM4:

{{< chart id="reachy-edge-memory/search-latency" caption="At 1,000 vectors a full scan is as fast as HNSW (0.75 ms against 0.72 ms). At 250,000, HNSW still answers in 0.68 ms while a full scan takes 112 ms. Binary quantization needs no index but slows down as the store grows." >}}

At small scale, a full scan is competitive with HNSW and requires no index. As the memory grows, HNSW keeps search around a millisecond, reaching 250,000 vectors at 0.68 ms. Building that index took about six minutes on the CM4 and added roughly 5% on disk. For a robot accumulating memories over weeks, that's a one-time cost; the indexed shard can also be [built on a server and synced back](/documentation/edge/edge-synchronization-guide/).

## What To Take From This

You don't need a robot to replicate this. The same patterns apply to a phone, a pair of glasses, or any other device that needs local memory.

- Split shards by how data lives and is searched. Qdrant's usual advice is one collection with a tenant key, and that's how exchanges and frames share memory/. A separate shard pays off only when data behaves differently: the facts are replaced whole from a snapshot at every start, and each person is one point whose face shots keep growing, matched with MaxSim. 
- Use a multivector when one entity has many views. A person is a set of face shots, a fact answers a set of questions, and MaxSim scores the query against the best-matching representation.
- Give every shard its own threshold, and tune it on live questions. A search always returns a nearest neighbor, even for a question with no answer.

## Next Steps

Next, we're packaging Reachy Remembers as a Reachy Mini App, so anyone with the robot can give it an on-device memory in one install. Until then, the code is in the [reachy-edge-memory repository](https://github.com/qdrant-labs/reachy-edge-memory), and the [technical writeup](https://medium.com/@denisov.shureg/efe223ac442b) covers the constraints we ran into and what they forced.

Want to build your own? [Qdrant Edge](/edge/) is free to use. The [Edge quickstart](/documentation/edge/edge-quickstart/) walks through creating a shard, writing points, and querying them.

The memory never leaves the robot. That was the point.
