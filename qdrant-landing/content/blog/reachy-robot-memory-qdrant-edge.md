---
title: "Reachy Remembers: Giving a Robot a Local Semantic Memory with Qdrant Edge"
draft: false
slug: reachy-robot-memory-qdrant-edge
short_description: "A desk robot that recognizes you, recalls yesterday's conversation, and remembers what it saw, with every memory stored on its own disk. How Qdrant Edge gave Reachy Mini a memory that never leaves the robot."
description: "How we built on-device memory for the Reachy Mini robot with Qdrant Edge: three in-process shards for conversations, faces, and facts, searched in under a millisecond on a Raspberry Pi CM4."
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

Imagine you bring a Reachy Mini home to keep your father company. He lives alone, and you want the robot to be useful to him, not just cute on a shelf. For that, it has to remember. It has to know his face and his name, that he takes his tea without sugar, and that the grandchildren call on Sundays. It has to know that his blood pressure pills are in the kitchen drawer and the spare key is under the blue pot by the door.

Now think about where that memory lives. If it lives on a server, every one of those details leaves the house: his face, his routine, his medication, where the key is, and every frame the camera kept of his living room and of whoever walked through it. All of it should stay local, on the robot itself: on the edge, where nothing leaves unless you decide it can.

That was the idea behind Reachy Remembers, a demo we showed on the Vector Space Stream with [Reachy Mini](https://www.pollen-robotics.com/reachy-mini/), an open robot from Pollen Robotics and Hugging Face built around a Raspberry Pi, with a camera, a microphone, a speaker, and 4 GB of RAM. 
To give Reachy its memory, we made it store what it heard, what it saw, and who was there as vectors in [Qdrant Edge](https://qdrant.tech/edge/), running in-process on the robot's own disk. 
For a multitude of applications, privacy is the first reason memory should live on the edge. It isn't the only one. A search on the device takes a fraction of a millisecond, and doesn't have to wait for the network round trip. And the memory works with no connectivity, which matters wherever a dropped link is a risk you can't take, or where there is no network to begin with, like a pharmaceutical cleanroom.

<!-- PLACEHOLDER hero: a photo of Reachy Mini on the desk during the stream, or the title slide (slide 01). Suggested path: /blog/reachy-robot-memory-qdrant-edge/hero.jpg -->
![Reachy Mini on a desk, looking at the camera](/blog/reachy-robot-memory-qdrant-edge/hero.jpg)

In the rest of this article, we walk you through how we built that memory with Qdrant Edge. A fair question first: doesn't an assistant already have a memory, the model's context? Not the kind that counts. Context ends with the session, so restart the robot and it knows nobody again. It can't be searched, only re-read from the start. And every token in it is read again on every turn, which you pay for in the pause before the first word. Memory is what the robot can still find a month later, without having it in context.

## The Loop: Perceive, Think, Act, Remember

Everything Reachy does runs through one big loop. The microphone and camera pick up what you say, who is in front of the robot, and what objects are around it. All of that goes to Gemma 4, the dialog model that acts as the robot's brain. On each turn, Gemma either answers directly or reaches for one of three tools:

- `remember` stores a memory or searches for one.
- `camera` takes a fresh picture, with the head turned if asked.
- `move` nods, shows an emotion, or dances.

Ask "what's on your left?" and Gemma calls `move` to turn the head, `camera` to take the picture, and `remember` to store the picture and its caption as vectors. Ask "how are you doing today?" and it answers without touching a tool.

The Remember box in this loop is Qdrant Edge, and it works in both directions. Faces, frames, and conversation are written to it as embeddings with metadata. When Reachy needs to recall something, it searches it.

<!-- PLACEHOLDER: slide 02, the Perceive / Think / Act / Remember pipeline diagram. Suggested path: /blog/reachy-robot-memory-qdrant-edge/loop.png -->
![The Reachy loop: perception feeds a dialog model that replies or calls the remember, camera, and move tools, with Qdrant Edge storing and recalling memories on the robot](/blog/reachy-robot-memory-qdrant-edge/loop.png)

## The Models Behind the Loop

Eight models take part in one turn of conversation:

- **Whisper** turns speech into text.
- **Gemma 4 E2B** holds the conversation, reads pictures, and decides when to reach for memory. It returns a reply or a tool call.
- **Inflect Nano v2** turns the reply into speech.
- **YOLO26n** detects and labels objects in a frame.
- **YuNet** detects faces.
- **HSFace** embeds a face into a 512-dimensional vector for recognition.
- **SigLIP2** embeds a picture and what was said about it into a 768-dimensional vector.
- **bge-small** embeds conversation exchanges and facts into a 384-dimensional vector.

Not all of this fits on the robot. Gemma 4 E2B alone weighs 2.5 GB before its KV cache, and the robot has about 3 GB of RAM free, shared with the daemon that drives the motors, the camera, and the voice loop. The Pi's graphics core is too weak to help, so a single frame through SigLIP2 takes a couple of seconds on the CPU. So the models run on a laptop next to the robot, over the local network. Nothing goes to the internet; the laptop does the computing itself, and it's hardware you own. The memory, every vector and every payload, lives on the robot's disk and nowhere else. The embeddings can be computed on either side, and bge-small already runs on the robot. The robot can remember without the laptop. It can't talk without it.

<!-- PLACEHOLDER (optional): slide 05, the grid of eight models with their roles and output types. Suggested path: /blog/reachy-robot-memory-qdrant-edge/models.png -->

## What Is Qdrant Edge

Qdrant Edge is the Qdrant vector search engine, written in Rust, shipped as a library you load into your own process. There is no server, no background service, and no network hop. A search is a function call. Data is stored and queried on the device, so it works with no connection at all.

The unit you work with is a shard. There are no collections in Edge. A shard is a self-contained directory on disk that holds the vectors, the payload, the write-ahead log, and the segments. Inside a shard you can define several named vectors, one per embedding model, which is how one shard can hold both text and image embeddings for the same point.

A shard also speaks the same snapshot format as a Qdrant server, so you can [restore a shard from a server collection, or sync it back](/documentation/edge/edge-synchronization-guide/) when you want to.

This is the configuration of Reachy's main memory shard, two named vectors and nothing else:

```python
from qdrant_edge import Distance, EdgeConfig, EdgeShard, EdgeVectorParams

config = EdgeConfig(
    vectors={
        "text": EdgeVectorParams(size=384, distance=Distance.Cosine),   # bge-small
        "image": EdgeVectorParams(size=768, distance=Distance.Cosine),  # SigLIP2
    }
)

memory = EdgeShard.create("memory/", config)
```

## Three Shards on the Robot's Disk

Reachy's memory is three shards, split by how long the data lives. Qdrant's usual advice is one collection with a tenant key in the payload, and that's how exchanges and frames share `memory/`: they pile up during a conversation and are wiped together when the demo starts over. `people/` accumulates across runs. `knowledge/` is replaced whole, and only from outside. Put all of it in one store and you can't clean or update one kind without touching the other two. All three shards together take under 50 MB on the robot's disk.

<!-- PLACEHOLDER: slide 06, the three-shard overview (memory/, people/, knowledge/) with vectors, what each holds, and when it's written and read. Suggested path: /blog/reachy-robot-memory-qdrant-edge/three-shards.png -->
![Three Qdrant Edge shards on the robot: memory for exchanges and frames, people for faces, and knowledge for facts, each with its own vectors and write and read triggers](/blog/reachy-robot-memory-qdrant-edge/three-shards.png)

### memory/: What Was Said and What Was Seen

The `memory/` shard holds two kinds of points, told apart by a `type` field with a keyword index.

An **exchange** is one pair of what you said and what Reachy answered, embedded with bge-small into the `text` vector. It has no image vector. Exchanges are written when the model's context window fills up: Gemma 4 E2B has 4,096 tokens of context, and the prompt and the tool definitions take a sixth of them before anyone speaks. When the window is over budget, the oldest half of the conversation moves into the shard. The conversation doesn't get lost; it becomes searchable instead of resident.

A **frame** is a picture. It carries both vectors: SigLIP2 embeds the image into `image`, and bge-small embeds the frame's caption into `text`. The payload holds the JPEG, a timestamp, which way the head was looking, the object labels from YOLO, the names of the people recognized in it, and a caption Gemma wrote, such as "On my left. I saw chair, person. Sasha was there. I see a window." Frames are written on events: the head turned, something in the scene changed, someone held an object up, or the `camera` tool was called. The camera delivers four frames a second, and most of them are an empty room; store them all and every question comes back with a dozen near-identical pictures.

The caption matters more than it looks. "What did you see today?" names nothing a vector can match, so every frame gets words from its own metadata, and a question about the day is answered with the day's most different pictures.

<!-- PLACEHOLDER: slide 07, the memory/ shard with its EdgeConfig and the two example points (exchange and frame). Suggested path: /blog/reachy-robot-memory-qdrant-edge/memory-shard.png -->
![The memory shard: two named vectors, text and image, and two point types, an exchange with text only and a frame with a picture, caption, labels, and names](/blog/reachy-robot-memory-qdrant-edge/memory-shard.png)

### people/: One Point Per Person

Faces are the most sensitive thing Reachy stores, and also the simplest shard. Each person is one point, with an ID derived from their name, so meeting Sasha twice updates the same point instead of creating a second one.

The face vector is a multivector: a list of HSFace embeddings, one per shot. When Reachy meets someone new, it collects five shots while asking for their name. When a known person shows up at an angle that didn't match, the new pose gets appended, up to 10 per run. The payload keeps the name, when they were first met, when they were last taught, and the number of shots.

Recognition runs every turn. One query vector, the face in the camera right now, is scored against every point with MaxSim, so a person scores by their closest shot. A new angle only has to be close to one of them. Above 0.35, Reachy knows you ("Hello again, Sasha!") and your name goes on every frame it stores from then on. Below it, you're someone new.

<!-- PLACEHOLDER: slide 08, the people/ shard with the multivector point and the 0.35 threshold diagram. Suggested path: /blog/reachy-robot-memory-qdrant-edge/people-shard.png -->
![The people shard: one point per person holding a multivector of face shots, scored with MaxSim against the face in the camera, with a 0.35 threshold between known and new](/blog/reachy-robot-memory-qdrant-edge/people-shard.png)

### knowledge/: Built Once, Shipped as a Snapshot

The third shard is the one the robot never writes. It holds 62 facts about Qdrant and about how the robot itself is built. A fact is not stored alone: with it sit several phrasings of the questions it answers, as a multivector, the same way a person's face shots sit on one point. A short question like "how do you work?" has no subject word for the embedding model to hold on to and never reaches the threshold against the long fact, but it does find its closest phrasing. Only the fact is ever spoken.

The shard is built on the laptop from a text file, one line per fact, and shipped with the code as a 0.28 MB snapshot. At startup the robot calls `unpack_snapshot` and the file becomes the shard. That snapshot is the same file a Qdrant server produces for a collection, so the facts could live in a Qdrant Cloud collection, be edited there, and reach every robot through the same call, with no deploy. The demo restores the local file today; the cloud path is the same API, not yet wired in.

<!-- PLACEHOLDER: slide 09, the knowledge/ pipeline: facts file on the laptop, build, 0.28 MB snapshot, unpack_snapshot on the robot, and the Qdrant Cloud row with the same API. Suggested path: /blog/reachy-robot-memory-qdrant-edge/knowledge-shard.png -->
![The knowledge shard: a facts file embedded on the laptop into a snapshot, unpacked on the robot, with the same snapshot available from a Qdrant Cloud collection](/blog/reachy-robot-memory-qdrant-edge/knowledge-shard.png)

## One Question, End to End

Say you ask: "Do you remember what you saw on your left?"

Whisper returns the text. The turn's frame goes through YuNet and HSFace, and the robot searches `people/` to decide whether to greet you or ask your name. Gemma reads the question and calls `remember`. The query is embedded on the laptop, and the search runs in the robot's own `memory/` shard, on its own disk, in-process. The matching frames come back to Gemma as pictures, and Gemma describes what it saw. Inflect speaks the answer, and a second pass picks a nod or a gesture to go with it. If the context is over budget by then, the oldest half of the conversation goes into `memory/`.

Of all those steps, the search is the one that takes no time.

## The Search Is the Cheap Part

The demo ran with about 500 memories in the shard. A search over all of them, 384-dimensional vectors with cosine distance, takes 0.46 ms on the robot's Raspberry Pi CM4. Everything else in the turn, from speech recognition to the dialog model to speech synthesis, is measured in seconds. Next to that, retrieval is negligible. It is the one component in the loop you never have to think about.

The expensive part of memory is writing to it, and specifically turning things into vectors. On the robot, embedding a turn of text costs under 100 ms and can happen every turn. Embedding a frame costs a couple of seconds, which is why frames are only embedded on events, and a face only when there is a "who is this" to answer. Count vectors, not searches.

We also measured how far that holds, on the same CM4, with the same kind of query. The following table shows one search against stores from 1,000 to 250,000 vectors, with three strategies: a full scan that compares every vector exactly, binary quantization that scans a 1-bit copy in RAM and rechecks the best 300 exactly, and an HNSW index walked toward the query with `ef=32`. The last column is the shard's size on disk with the HNSW graph.

| Vectors | Full scan | Binary | HNSW | On disk (HNSW) |
| --- | --- | --- | --- | --- |
| 500 (the demo) | 0.46 ms | | | |
| 1,000 | 0.75 ms | 0.76 ms | 0.72 ms | 1.7 MB |
| 10,000 | 5.0 ms | 1.8 ms | 1.06 ms | 16 MB |
| 50,000 | 23.6 ms | 5.8 ms | 0.90 ms | 77 MB |
| 100,000 | 45.2 ms | 11.0 ms | 0.77 ms | 154 MB |
| 250,000 | 112 ms | 26 ms | 0.68 ms | 385 MB |

Two things fall out of this. Under about 10,000 vectors, the index buys you nothing: a plain scan is within a hair of HNSW at 1,000, and nothing has to be built. Above that, HNSW takes over and stays under a millisecond all the way to a quarter of a million memories, while the scan climbs to 112 ms. Building the graph for 250,000 vectors took about six minutes on the CM4 and added roughly 5% on disk. For a robot that will remember for weeks, that's a one-time cost, and you can also [offload the indexing to a server](/documentation/edge/edge-synchronization-guide/) and sync the indexed shard back.

<!-- PLACEHOLDER (optional, the table carries the data): slide 10, "A quarter of a million memories, under a millisecond". Suggested path: /blog/reachy-robot-memory-qdrant-edge/latency.png -->

## What Was Hard, Briefly

The memory was the easy part. The constraints around it were not, and the [writeup](https://medium.com/@denisov.shureg/efe223ac442b) walks through all of them. Three shaped the memory design directly:

- A 4,096-token context fills fast, which is why old turns move into Qdrant Edge and come back only when asked for, instead of being summarized or dropped.
- A small model with tools, deep in a conversation, reaches for the camera when you ask what it *saw*. So there's one `remember` tool and the model only says what the question is about; the tense settles the rest.
- "What did you see today?" has no vector to match, which is why frames get captions from their own metadata.

And it's a robot: a battery that lasts a day, Wi-Fi that drops, and a camera only one process may own. Qdrant Edge is in beta and preallocates its files: the write-ahead log alone takes 32 MB, so the 62-fact knowledge shard looks like over 100 MB on disk while using under a megabyte of it. Copy shards with tools that understand sparse files.

## What You Can Take From This

You don't need a robot to use any of this. The same patterns apply to a phone, a pair of glasses, or a kiosk that should remember without uploading. The shard answers one question, what here resembles this, and the rest is the harness around it: when to write, which shard to search, and what counts as an answer.

- Split shards by how long the data lives. Data that is wiped per session, data that accumulates, and data that is replaced whole from outside don't belong in one store.
- Use one named vector per embedding model inside a shard, so a single point can carry a text embedding and an image embedding and be found through either.
- Use a multivector when one thing has many views. A person is a set of face shots, a fact is a set of questions, and MaxSim lets a query match any one of them.
- Ship static knowledge as a snapshot. Build it where you have compute, restore it on the device, and update it from a Qdrant collection when it changes.
- Don't build an index under about 10,000 vectors. Scan. Above that, HNSW keeps search under a millisecond on a Raspberry Pi.
- Give every shard its own threshold, and tune it on live questions. A search always returns a nearest neighbor, even for a question with no answer, and every embedding model has its own scale.
- Put the context window's overflow into the shard instead of throwing it away. The conversation stays searchable long after it leaves the model.

## Get Started

Qdrant Edge is free to use and in beta. You can open your first shard in a few lines:

```bash
pip install qdrant-edge-py   # Python
cargo add qdrant-edge        # Rust
```

The [Edge quickstart](/documentation/edge/edge-quickstart/) walks through creating a shard, writing points, and querying them. The [Edge API reference](/documentation/edge/edge-api/) covers named vectors, multivectors, and [snapshots](/documentation/edge/edge-api/snapshots/). For the full story of Reachy, including every constraint and what each one forced, read [the technical writeup](https://medium.com/@denisov.shureg/efe223ac442b). The code is in the demo's repository, and it installs with one `uv sync`.

<!-- PLACEHOLDER: link the words "the demo's repository" to the GitHub repo once it's public (the writeup still has LINK-TO-REPO). -->

The memory never leaves the robot. That was the point.
