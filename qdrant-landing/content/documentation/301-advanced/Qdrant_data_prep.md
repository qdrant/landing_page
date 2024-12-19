---
notebook_path: 301-advanced/data_prep_webinar/Qdrant_data_prep.ipynb
reading_time_min: 60
title: 'Prerequsites:'
---

# Prerequsites:

## Qdrant Cloud Account <https://cloud.qdrant.io/>

## Open AI API Key <https://platform.openai.com/api-keys>

<img src="https://i.imgur.com/sX4332W.jpeg" alt="drawing"/>

![alt text](documentation/301-advanced/Qdrant_data_prep/900.jpg)

Credit: <https://www.bonfire.com/dont-accept-the-defaults-abel-wang/?srsltid=AfmBOoqCtOh9jQzfkDB7b9Z7E42pYi0-RMjWUXUeTkBrnQbWwRJjzz-K>

## What will I learn today?

1. What is a vector database.
1. Why you can't just put your raw data in a vector database.
1. What kind of data you can use with Qdrant and some use cases for each modality.
1. What is chunking, an overview of 5 different chunking methods, and a comparison of semantic and fixed chunking.
1. What is FastEmbed and what kind of embeddings does it work with.
1. How to put your data in Qdrant, and a demonstration using Qdrant Cloud

## What's a vector database?

![alt text](documentation/301-advanced/Qdrant_data_prep/qdrant_overview_high_level.png)

**<https://cloud.qdrant.io/>** ![Screenshot 2024-08-27 at 12.34.22 PM.png](documentation/301-advanced/Qdrant_data_prep/bf78579e67de42fc885b21ab3f1a38e4.png)

## What kind of data can you use with Qdrant?

![alt text](documentation/301-advanced/Qdrant_data_prep/How-Embeddings-Work.jpg)

### Text

![alt text](documentation/301-advanced/Qdrant_data_prep/How-Do-Embeddings-Work_.jpg)

#### Books, Tweets, Reddit posts

Text can also be something like the lyrics of a song or the transcript of a youtube video.

To get your text into a vdb, you'll first need to turn it into text.

Some examples of applications that use text data in RAG could be a chatbot for customer service, a reccomendation engine for posts on social media, or language tutor to help people learn foreign languages.

### Audio

![alt text](documentation/301-advanced/Qdrant_data_prep/2-Figure1-1.png)

#### You can also use Audio with Qdrant! Audio embeddings can capture more than the lyrics in a song, they can caputre the emotions or the volume of the audio as well! You can build a music reccodementation system or an anomaly detection system for camera audio at a facility with audio embeddings.

<https://colab.research.google.com/drive/19AJ6huaw_dM-_h7kADArdXc09K3WNgBw>

### Images

![alt text](documentation/301-advanced/Qdrant_data_prep/5accaa76-6fad-437b-8fbb-94b9544c3789_image7.png)

Credit: <https://encord.com/blog/image-embeddings-to-improve-model-performance/>

You can also use images Qdrant. Why might you need to embed an image?

Let's say you're beuilding an app to help doctors diagnose patients with skin cancer.

With the power of semantic search, medical professionals could enhance
their diagnostic capabilities and make more accurate decisions regarding skin disease diagnosis.

Another example might be image reccomendation on a photo sharing site.

<https://colab.research.google.com/drive/1SUQ5PfWlUB9kP9Em06X9sJ29GE5YFCjB>

## What is chunking and a few common chunking methods

![alt text](documentation/301-advanced/Qdrant_data_prep/1*yIMiJaQexgNqU3BXdR5WKg.png)

How do you eat an elephant? One bit at a time! Chunkinking is the process of breaking your data into smaller bites so that the model can eat it.

### Fixed Size Chunking

![Screenshot 2024-08-28 at 3.37.14 PM.png](documentation/301-advanced/Qdrant_data_prep/c61fb9ee0a64446c8016d82b3709f48c.png)

Concept: Your text is split into equal-sized segments, regardless of sentence or paragraph boundaries.

Application: Useful in scenarios where uniformity in chunk size is critical, like certain types of vector indexing or when memory constraints are strict.

Example: If you are building an application based on data where you know exactly how long each chunk will be-like a government form with a clear format.

### Recursive Chunking

![Screenshot 2024-08-28 at 3.38.09 PM.png](documentation/301-advanced/Qdrant_data_prep/927c14076d9f414c89abbcddb0b846d5.png)

Concept: The document is recursively divided into smaller chunks, starting with large sections like chapters, then splitting those into smaller units like paragraphs, then splitting those paragraphs into sentences.

Application: This method is great for hierarchical or nested documents, giving your application flexibility with chunking.

Example: A novel that has distinct chapters, or tells a non chronological story.

### Document Based Chunking

![Screenshot 2024-08-28 at 3.41.46 PM.png](documentation/301-advanced/Qdrant_data_prep/2a5240721c8841188c22224f5a095d8c.png)

Concept: The entire document is treated as a single chunk or divided at little as possible.

Application: Best for tasks requiring the processing of large texts where breaking up the document too much would lose context, such as in legal, medical or scientific document analysis.

Example: A legal document could be be chunked by charges, each charge being treated as a chunk, maintaining the document's structural integrity.

### Semantic Chunking

![Untitled-2024-08-09-0903.png](documentation/301-advanced/Qdrant_data_prep/e38eea92d36f4d67958cef06acc29797.png)

Concept: The document is divided based on meaning, so that each chunk represents a complete idea or concept.

Application: Works well for tasks where preserving the meaning is important , such as in summarization or when generating embeddings for semantic search.

Example: A stream of thought writing session. A paragraph discussing a single idea might be kept as one chunk, while the next sentence discussing another idea could be a chunk. The next chunk could be a page.

### Agentic Chunking

![alt text](documentation/301-advanced/Qdrant_data_prep/1*aHXJ5wuWuh1faf_BF7i4og.png)

Concept: Document is chunked based on the actions or intentions of an agent.

Application: Useful in narrative analysis, dialogue systems, or any context where understanding the actions and motivations of agents is crucial.

Example: In Harry Potter, each chunk would capture the story of an individual character, making sure that the story and characters are all learned by your application.

## How to find the right Chunking method for your model? Let's compare using a fixed chunk size to semantic chunking!

```python
# pip install llama_index llama-index-readers-web llama-index-embeddings-openai
```

<hr />

```python
!wget 'https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt' -O 'pg_essay.txt'
```

```
--2024-08-29 14:14:32--  https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt
Resolving raw.githubusercontent.com (raw.githubusercontent.com)... 185.199.108.133, 185.199.109.133, 185.199.110.133, ...
Connecting to raw.githubusercontent.com (raw.githubusercontent.com)|185.199.108.133|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 75042 (73K) [text/plain]
Saving to: ‘pg_essay.txt’
```

pg_essay.txt 0%[ ] 0 --.-KB/s\
pg_essay.txt 100%[===================>] 73.28K --.-KB/s in 0.02s

```
2024-08-29 14:14:33 (3.18 MB/s) - ‘pg_essay.txt’ saved [75042/75042]
```

```python
from llama_index.core import SimpleDirectoryReader

# load documents
documents = SimpleDirectoryReader(input_files=["pg_essay.txt"]).load_data()
```

<hr />

```python
from llama_index.core.node_parser import (
    SentenceSplitter,
    SemanticSplitterNodeParser,
)
from llama_index.embeddings.openai import OpenAIEmbedding

import os

os.environ["OPENAI_API_KEY"] = "insert OPEN AI API KEY"
```

<hr />

```python
embed_model = OpenAIEmbedding()
splitter = SemanticSplitterNodeParser(
    buffer_size=1, breakpoint_percentile_threshold=95, embed_model=embed_model
)

# also baseline splitter
base_splitter = SentenceSplitter(chunk_size=512)
```

<hr />

```python
nodes = splitter.get_nodes_from_documents(documents)
```

<hr />

```python
print(nodes[1].get_content())
```

```
I wrote what beginning writers were supposed to write then, and probably still are: short stories. My stories were awful. They had hardly any plot, just characters with strong feelings, which I imagined made them deep.

The first programs I tried writing were on the IBM 1401 that our school district used for what was then called "data processing." This was in 9th grade, so I was 13 or 14. The school district's 1401 happened to be in the basement of our junior high school, and my friend Rich Draves and I got permission to use it. It was like a mini Bond villain's lair down there, with all these alien-looking machines — CPU, disk drives, printer, card reader — sitting up on a raised floor under bright fluorescent lights.

The language we used was an early version of Fortran. You had to type programs on punch cards, then stack them in the card reader and press a button to load the program into memory and run it. The result would ordinarily be to print something on the spectacularly loud printer.

I was puzzled by the 1401. I couldn't figure out what to do with it. 
```

```python
print(nodes[2].get_content())
```

```
And in retrospect there's not much I could have done with it. The only form of input to programs was data stored on punched cards, and I didn't have any data stored on punched cards. The only other option was to do things that didn't rely on any input, like calculate approximations of pi, but I didn't know enough math to do anything interesting of that type. So I'm not surprised I can't remember any programs I wrote, because they can't have done much. My clearest memory is of the moment I learned it was possible for programs not to terminate, when one of mine didn't. On a machine without time-sharing, this was a social as well as a technical error, as the data center manager's expression made clear.

With microcomputers, everything changed. Now you could have a computer sitting right in front of you, on a desk, that could respond to your keystrokes as it was running instead of just churning through a stack of punch cards and then stopping. [1]

The first of my friends to get a microcomputer built it himself. It was sold as a kit by Heathkit. I remember vividly how impressed and envious I felt watching him sitting in front of it, typing programs right into the computer.

Computers were expensive in those days and it took me years of nagging before I convinced my father to buy one, a TRS-80, in about 1980. The gold standard then was the Apple II, but a TRS-80 was good enough. This was when I really started programming. I wrote simple games, a program to predict how high my model rockets would fly, and a word processor that my father used to write at least one book. There was only room in memory for about 2 pages of text, so he'd write 2 pages at a time and then print them out, but it was a lot better than a typewriter.

Though I liked programming, I didn't plan to study it in college. In college I was going to study philosophy, which sounded much more powerful. It seemed, to my naive high school self, to be the study of the ultimate truths, compared to which the things studied in other fields would be mere domain knowledge. What I discovered when I got to college was that the other fields took up so much of the space of ideas that there wasn't much left for these supposed ultimate truths. All that seemed left for philosophy were edge cases that people in other fields felt could safely be ignored.

I couldn't have put this into words when I was 18. All I knew at the time was that I kept taking philosophy courses and they kept being boring. So I decided to switch to AI.

AI was in the air in the mid 1980s, but there were two things especially that made me want to work on it: a novel by Heinlein called The Moon is a Harsh Mistress, which featured an intelligent computer called Mike, and a PBS documentary that showed Terry Winograd using SHRDLU. I haven't tried rereading The Moon is a Harsh Mistress, so I don't know how well it has aged, but when I read it I was drawn entirely into its world. It seemed only a matter of time before we'd have Mike, and when I saw Winograd using SHRDLU, it seemed like that time would be a few years at most. All you had to do was teach SHRDLU more words.

There weren't any classes in AI at Cornell then, not even graduate classes, so I started trying to teach myself. Which meant learning Lisp, since in those days Lisp was regarded as the language of AI. The commonly used programming languages then were pretty primitive, and programmers' ideas correspondingly so. The default language at Cornell was a Pascal-like language called PL/I, and the situation was similar elsewhere. Learning Lisp expanded my concept of a program so fast that it was years before I started to have a sense of where the new limits were. This was more like it; this was what I had expected college to do. It wasn't happening in a class, like it was supposed to, but that was ok. For the next couple years I was on a roll. 
```

```python
print(nodes[3].get_content())
```

```
I knew what I was going to do.

For my undergraduate thesis, I reverse-engineered SHRDLU. My God did I love working on that program. It was a pleasing bit of code, but what made it even more exciting was my belief — hard to imagine now, but not unique in 1985 — that it was already climbing the lower slopes of intelligence.

I had gotten into a program at Cornell that didn't make you choose a major. You could take whatever classes you liked, and choose whatever you liked to put on your degree. I of course chose "Artificial Intelligence." When I got the actual physical diploma, I was dismayed to find that the quotes had been included, which made them read as scare-quotes. At the time this bothered me, but now it seems amusingly accurate, for reasons I was about to discover.

I applied to 3 grad schools: MIT and Yale, which were renowned for AI at the time, and Harvard, which I'd visited because Rich Draves went there, and was also home to Bill Woods, who'd invented the type of parser I used in my SHRDLU clone. Only Harvard accepted me, so that was where I went.

I don't remember the moment it happened, or if there even was a specific moment, but during the first year of grad school I realized that AI, as practiced at the time, was a hoax. By which I mean the sort of AI in which a program that's told "the dog is sitting on the chair" translates this into some formal representation and adds it to the list of things it knows.

What these programs really showed was that there's a subset of natural language that's a formal language. But a very proper subset. It was clear that there was an unbridgeable gap between what they could do and actually understanding natural language. It was not, in fact, simply a matter of teaching SHRDLU more words. That whole way of doing AI, with explicit data structures representing concepts, was not going to work. Its brokenness did, as so often happens, generate a lot of opportunities to write papers about various band-aids that could be applied to it, but it was never going to get us Mike.

So I looked around to see what I could salvage from the wreckage of my plans, and there was Lisp. I knew from experience that Lisp was interesting for its own sake and not just for its association with AI, even though that was the main reason people cared about it at the time. So I decided to focus on Lisp. In fact, I decided to write a book about Lisp hacking. It's scary to think how little I knew about Lisp hacking when I started writing that book. But there's nothing like writing a book about something to help you learn it. The book, On Lisp, wasn't published till 1993, but I wrote much of it in grad school.

Computer Science is an uneasy alliance between two halves, theory and systems. The theory people prove things, and the systems people build things. I wanted to build things. I had plenty of respect for theory — indeed, a sneaking suspicion that it was the more admirable of the two halves — but building things seemed so much more exciting.

The problem with systems work, though, was that it didn't last. Any program you wrote today, no matter how good, would be obsolete in a couple decades at best. People might mention your software in footnotes, but no one would actually use it. And indeed, it would seem very feeble work. Only people with a sense of the history of the field would even realize that, in its time, it had been good.

There were some surplus Xerox Dandelions floating around the computer lab at one point. Anyone who wanted one to play around with could have one. I was briefly tempted, but they were so slow by present standards; what was the point? No one else wanted one either, so off they went. That was what happened to systems work.

I wanted not just to build things, but to build things that would last.

In this dissatisfied state I went in 1988 to visit Rich Draves at CMU, where he was in grad school. One day I went to visit the Carnegie Institute, where I'd spent a lot of time as a kid. While looking at a painting there I realized something that might seem obvious, but was a big surprise to me. There, right on the wall, was something you could make that would last. Paintings didn't become obsolete. Some of the best ones were hundreds of years old.

And moreover this was something you could make a living doing. Not as easily as you could by writing software, of course, but I thought if you were really industrious and lived really cheaply, it had to be possible to make enough to survive. And as an artist you could be truly independent. You wouldn't have a boss, or even need to get research funding.

I had always liked looking at paintings. Could I make them? I had no idea. 
```

```python
base_nodes = base_splitter.get_nodes_from_documents(documents)
```

<hr />

```python
print(base_nodes[1].get_content())
```

```
The only form of input to programs was data stored on punched cards, and I didn't have any data stored on punched cards. The only other option was to do things that didn't rely on any input, like calculate approximations of pi, but I didn't know enough math to do anything interesting of that type. So I'm not surprised I can't remember any programs I wrote, because they can't have done much. My clearest memory is of the moment I learned it was possible for programs not to terminate, when one of mine didn't. On a machine without time-sharing, this was a social as well as a technical error, as the data center manager's expression made clear.

With microcomputers, everything changed. Now you could have a computer sitting right in front of you, on a desk, that could respond to your keystrokes as it was running instead of just churning through a stack of punch cards and then stopping. [1]

The first of my friends to get a microcomputer built it himself. It was sold as a kit by Heathkit. I remember vividly how impressed and envious I felt watching him sitting in front of it, typing programs right into the computer.

Computers were expensive in those days and it took me years of nagging before I convinced my father to buy one, a TRS-80, in about 1980. The gold standard then was the Apple II, but a TRS-80 was good enough. This was when I really started programming. I wrote simple games, a program to predict how high my model rockets would fly, and a word processor that my father used to write at least one book. There was only room in memory for about 2 pages of text, so he'd write 2 pages at a time and then print them out, but it was a lot better than a typewriter.

Though I liked programming, I didn't plan to study it in college. In college I was going to study philosophy, which sounded much more powerful. It seemed, to my naive high school self, to be the study of the ultimate truths, compared to which the things studied in other fields would be mere domain knowledge. What I discovered when I got to college was that the other fields took up so much of the space of ideas that there wasn't much left for these supposed ultimate truths.
```

```python
print(base_nodes[2].get_content())
```

```
This was when I really started programming. I wrote simple games, a program to predict how high my model rockets would fly, and a word processor that my father used to write at least one book. There was only room in memory for about 2 pages of text, so he'd write 2 pages at a time and then print them out, but it was a lot better than a typewriter.

Though I liked programming, I didn't plan to study it in college. In college I was going to study philosophy, which sounded much more powerful. It seemed, to my naive high school self, to be the study of the ultimate truths, compared to which the things studied in other fields would be mere domain knowledge. What I discovered when I got to college was that the other fields took up so much of the space of ideas that there wasn't much left for these supposed ultimate truths. All that seemed left for philosophy were edge cases that people in other fields felt could safely be ignored.

I couldn't have put this into words when I was 18. All I knew at the time was that I kept taking philosophy courses and they kept being boring. So I decided to switch to AI.

AI was in the air in the mid 1980s, but there were two things especially that made me want to work on it: a novel by Heinlein called The Moon is a Harsh Mistress, which featured an intelligent computer called Mike, and a PBS documentary that showed Terry Winograd using SHRDLU. I haven't tried rereading The Moon is a Harsh Mistress, so I don't know how well it has aged, but when I read it I was drawn entirely into its world. It seemed only a matter of time before we'd have Mike, and when I saw Winograd using SHRDLU, it seemed like that time would be a few years at most. All you had to do was teach SHRDLU more words.

There weren't any classes in AI at Cornell then, not even graduate classes, so I started trying to teach myself. Which meant learning Lisp, since in those days Lisp was regarded as the language of AI. The commonly used programming languages then were pretty primitive, and programmers' ideas correspondingly so. The default language at Cornell was a Pascal-like language called PL/I, and the situation was similar elsewhere.
```

```python
print(base_nodes[3].get_content())
```

```
I haven't tried rereading The Moon is a Harsh Mistress, so I don't know how well it has aged, but when I read it I was drawn entirely into its world. It seemed only a matter of time before we'd have Mike, and when I saw Winograd using SHRDLU, it seemed like that time would be a few years at most. All you had to do was teach SHRDLU more words.

There weren't any classes in AI at Cornell then, not even graduate classes, so I started trying to teach myself. Which meant learning Lisp, since in those days Lisp was regarded as the language of AI. The commonly used programming languages then were pretty primitive, and programmers' ideas correspondingly so. The default language at Cornell was a Pascal-like language called PL/I, and the situation was similar elsewhere. Learning Lisp expanded my concept of a program so fast that it was years before I started to have a sense of where the new limits were. This was more like it; this was what I had expected college to do. It wasn't happening in a class, like it was supposed to, but that was ok. For the next couple years I was on a roll. I knew what I was going to do.

For my undergraduate thesis, I reverse-engineered SHRDLU. My God did I love working on that program. It was a pleasing bit of code, but what made it even more exciting was my belief — hard to imagine now, but not unique in 1985 — that it was already climbing the lower slopes of intelligence.

I had gotten into a program at Cornell that didn't make you choose a major. You could take whatever classes you liked, and choose whatever you liked to put on your degree. I of course chose "Artificial Intelligence." When I got the actual physical diploma, I was dismayed to find that the quotes had been included, which made them read as scare-quotes. At the time this bothered me, but now it seems amusingly accurate, for reasons I was about to discover.

I applied to 3 grad schools: MIT and Yale, which were renowned for AI at the time, and Harvard, which I'd visited because Rich Draves went there, and was also home to Bill Woods, who'd invented the type of parser I used in my SHRDLU clone. Only Harvard accepted me, so that was where I went.
```

<https://www.llamaindex.ai/blog/evaluating-the-ideal-chunk-size-for-a-rag-system-using-llamaindex-6207e5d3fec5>

## How to use FastEmbed: Qdrant's efficient Python library for embedding generation

![alt text](documentation/301-advanced/Qdrant_data_prep/social_preview.jpg)

In the earlier examples I used a variety of methods to embed the data. Qdrant is compatible with all embeddings, but we do offer our own Embedding library that intergrates seamlessly with FastEmbed. FastEmbed supports Dense Text Embeddings, Sparse Text Embeddings, Late Interaction Text Embeddings, and Image Embeddings.

![Screenshot 2024-08-28 at 3.53.13 PM.png](documentation/301-advanced/Qdrant_data_prep/704c6118363e46b79912e7b99e0472d9.png)

![Screenshot 2024-08-28 at 3.53.06 PM.png](documentation/301-advanced/Qdrant_data_prep/88ab85414277454999d1898aa946dad2.png)

### Dense Text Embeddings

```python
# pip install qdrant-client[fastembed]
```

```
Collecting qdrant-client[fastembed]
  Downloading qdrant_client-1.11.1-py3-none-any.whl.metadata (10 kB)
Requirement already satisfied: grpcio>=1.41.0 in /usr/local/lib/python3.10/dist-packages (from qdrant-client[fastembed]) (1.64.1)
Collecting grpcio-tools>=1.41.0 (from qdrant-client[fastembed])
  Downloading grpcio_tools-1.66.1-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (5.3 kB)
Requirement already satisfied: httpx>=0.20.0 in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.20.0->qdrant-client[fastembed]) (0.27.2)
Requirement already satisfied: numpy>=1.21 in /usr/local/lib/python3.10/dist-packages (from qdrant-client[fastembed]) (1.26.4)
Collecting portalocker<3.0.0,>=2.7.0 (from qdrant-client[fastembed])
  Downloading portalocker-2.10.1-py3-none-any.whl.metadata (8.5 kB)
Requirement already satisfied: pydantic>=1.10.8 in /usr/local/lib/python3.10/dist-packages (from qdrant-client[fastembed]) (2.8.2)
Requirement already satisfied: urllib3<3,>=1.26.14 in /usr/local/lib/python3.10/dist-packages (from qdrant-client[fastembed]) (2.0.7)
Collecting fastembed==0.3.6 (from qdrant-client[fastembed])
  Downloading fastembed-0.3.6-py3-none-any.whl.metadata (7.7 kB)
Collecting PyStemmer<3.0.0,>=2.2.0 (from fastembed==0.3.6->qdrant-client[fastembed])
  Downloading PyStemmer-2.2.0.1.tar.gz (303 kB)
[2K     [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m303.0/303.0 kB[0m [31m6.0 MB/s[0m eta [36m0:00:00[0m
[?25h  Preparing metadata (setup.py) ... [?25l[?25hdone
Requirement already satisfied: huggingface-hub<1.0,>=0.20 in /usr/local/lib/python3.10/dist-packages (from fastembed==0.3.6->qdrant-client[fastembed]) (0.23.5)
Collecting loguru<0.8.0,>=0.7.2 (from fastembed==0.3.6->qdrant-client[fastembed])
  Downloading loguru-0.7.2-py3-none-any.whl.metadata (23 kB)
Collecting mmh3<5.0,>=4.0 (from fastembed==0.3.6->qdrant-client[fastembed])
  Downloading mmh3-4.1.0-cp310-cp310-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (13 kB)
Collecting onnx<2.0.0,>=1.15.0 (from fastembed==0.3.6->qdrant-client[fastembed])
  Downloading onnx-1.16.2-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (16 kB)
Collecting onnxruntime<2.0.0,>=1.17.0 (from fastembed==0.3.6->qdrant-client[fastembed])
  Downloading onnxruntime-1.19.0-cp310-cp310-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl.metadata (4.3 kB)
Collecting pillow<11.0.0,>=10.3.0 (from fastembed==0.3.6->qdrant-client[fastembed])
  Downloading pillow-10.4.0-cp310-cp310-manylinux_2_28_x86_64.whl.metadata (9.2 kB)
Requirement already satisfied: requests<3.0,>=2.31 in /usr/local/lib/python3.10/dist-packages (from fastembed==0.3.6->qdrant-client[fastembed]) (2.32.3)
Requirement already satisfied: snowballstemmer<3.0.0,>=2.2.0 in /usr/local/lib/python3.10/dist-packages (from fastembed==0.3.6->qdrant-client[fastembed]) (2.2.0)
Requirement already satisfied: tokenizers<1.0,>=0.15 in /usr/local/lib/python3.10/dist-packages (from fastembed==0.3.6->qdrant-client[fastembed]) (0.19.1)
Requirement already satisfied: tqdm<5.0,>=4.66 in /usr/local/lib/python3.10/dist-packages (from fastembed==0.3.6->qdrant-client[fastembed]) (4.66.5)
Collecting protobuf<6.0dev,>=5.26.1 (from grpcio-tools>=1.41.0->qdrant-client[fastembed])
  Downloading protobuf-5.28.0-cp38-abi3-manylinux2014_x86_64.whl.metadata (592 bytes)
Collecting grpcio>=1.41.0 (from qdrant-client[fastembed])
  Downloading grpcio-1.66.1-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (3.9 kB)
Requirement already satisfied: setuptools in /usr/local/lib/python3.10/dist-packages (from grpcio-tools>=1.41.0->qdrant-client[fastembed]) (71.0.4)
Requirement already satisfied: anyio in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client[fastembed]) (3.7.1)
Requirement already satisfied: certifi in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client[fastembed]) (2024.7.4)
Requirement already satisfied: httpcore==1.* in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client[fastembed]) (1.0.5)
Requirement already satisfied: idna in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client[fastembed]) (3.8)
Requirement already satisfied: sniffio in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client[fastembed]) (1.3.1)
Requirement already satisfied: h11<0.15,>=0.13 in /usr/local/lib/python3.10/dist-packages (from httpcore==1.*->httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client[fastembed]) (0.14.0)
Collecting h2<5,>=3 (from httpx[http2]>=0.20.0->qdrant-client[fastembed])
  Downloading h2-4.1.0-py3-none-any.whl.metadata (3.6 kB)
Requirement already satisfied: annotated-types>=0.4.0 in /usr/local/lib/python3.10/dist-packages (from pydantic>=1.10.8->qdrant-client[fastembed]) (0.7.0)
Requirement already satisfied: pydantic-core==2.20.1 in /usr/local/lib/python3.10/dist-packages (from pydantic>=1.10.8->qdrant-client[fastembed]) (2.20.1)
Requirement already satisfied: typing-extensions>=4.6.1 in /usr/local/lib/python3.10/dist-packages (from pydantic>=1.10.8->qdrant-client[fastembed]) (4.12.2)
Collecting hyperframe<7,>=6.0 (from h2<5,>=3->httpx[http2]>=0.20.0->qdrant-client[fastembed])
  Downloading hyperframe-6.0.1-py3-none-any.whl.metadata (2.7 kB)
Collecting hpack<5,>=4.0 (from h2<5,>=3->httpx[http2]>=0.20.0->qdrant-client[fastembed])
  Downloading hpack-4.0.0-py3-none-any.whl.metadata (2.5 kB)
Requirement already satisfied: filelock in /usr/local/lib/python3.10/dist-packages (from huggingface-hub<1.0,>=0.20->fastembed==0.3.6->qdrant-client[fastembed]) (3.15.4)
Requirement already satisfied: fsspec>=2023.5.0 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub<1.0,>=0.20->fastembed==0.3.6->qdrant-client[fastembed]) (2024.6.1)
Requirement already satisfied: packaging>=20.9 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub<1.0,>=0.20->fastembed==0.3.6->qdrant-client[fastembed]) (24.1)
Requirement already satisfied: pyyaml>=5.1 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub<1.0,>=0.20->fastembed==0.3.6->qdrant-client[fastembed]) (6.0.2)
Collecting coloredlogs (from onnxruntime<2.0.0,>=1.17.0->fastembed==0.3.6->qdrant-client[fastembed])
  Downloading coloredlogs-15.0.1-py2.py3-none-any.whl.metadata (12 kB)
Requirement already satisfied: flatbuffers in /usr/local/lib/python3.10/dist-packages (from onnxruntime<2.0.0,>=1.17.0->fastembed==0.3.6->qdrant-client[fastembed]) (24.3.25)
Requirement already satisfied: sympy in /usr/local/lib/python3.10/dist-packages (from onnxruntime<2.0.0,>=1.17.0->fastembed==0.3.6->qdrant-client[fastembed]) (1.13.2)
Requirement already satisfied: charset-normalizer<4,>=2 in /usr/local/lib/python3.10/dist-packages (from requests<3.0,>=2.31->fastembed==0.3.6->qdrant-client[fastembed]) (3.3.2)
Requirement already satisfied: exceptiongroup in /usr/local/lib/python3.10/dist-packages (from anyio->httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client[fastembed]) (1.2.2)
Collecting humanfriendly>=9.1 (from coloredlogs->onnxruntime<2.0.0,>=1.17.0->fastembed==0.3.6->qdrant-client[fastembed])
  Downloading humanfriendly-10.0-py2.py3-none-any.whl.metadata (9.2 kB)
Requirement already satisfied: mpmath<1.4,>=1.1.0 in /usr/local/lib/python3.10/dist-packages (from sympy->onnxruntime<2.0.0,>=1.17.0->fastembed==0.3.6->qdrant-client[fastembed]) (1.3.0)
Downloading fastembed-0.3.6-py3-none-any.whl (55 kB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m55.6/55.6 kB[0m [31m3.5 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading grpcio_tools-1.66.1-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (2.4 MB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m2.4/2.4 MB[0m [31m19.3 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading grpcio-1.66.1-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (5.7 MB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m5.7/5.7 MB[0m [31m26.7 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading portalocker-2.10.1-py3-none-any.whl (18 kB)
Downloading qdrant_client-1.11.1-py3-none-any.whl (259 kB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m259.4/259.4 kB[0m [31m8.8 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading h2-4.1.0-py3-none-any.whl (57 kB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m57.5/57.5 kB[0m [31m2.3 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading loguru-0.7.2-py3-none-any.whl (62 kB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m62.5/62.5 kB[0m [31m1.9 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading mmh3-4.1.0-cp310-cp310-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_17_x86_64.manylinux2014_x86_64.whl (67 kB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m67.6/67.6 kB[0m [31m2.2 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading onnx-1.16.2-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (15.9 MB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m15.9/15.9 MB[0m [31m24.0 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading onnxruntime-1.19.0-cp310-cp310-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (13.2 MB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m13.2/13.2 MB[0m [31m21.3 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading pillow-10.4.0-cp310-cp310-manylinux_2_28_x86_64.whl (4.5 MB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m4.5/4.5 MB[0m [31m39.9 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading protobuf-5.28.0-cp38-abi3-manylinux2014_x86_64.whl (316 kB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m316.6/316.6 kB[0m [31m15.6 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading hpack-4.0.0-py3-none-any.whl (32 kB)
Downloading hyperframe-6.0.1-py3-none-any.whl (12 kB)
Downloading coloredlogs-15.0.1-py2.py3-none-any.whl (46 kB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m46.0/46.0 kB[0m [31m2.9 MB/s[0m eta [36m0:00:00[0m
[?25hDownloading humanfriendly-10.0-py2.py3-none-any.whl (86 kB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m86.8/86.8 kB[0m [31m5.3 MB/s[0m eta [36m0:00:00[0m
[?25hBuilding wheels for collected packages: PyStemmer
  Building wheel for PyStemmer (setup.py) ... [?25l[?25hdone
  Created wheel for PyStemmer: filename=PyStemmer-2.2.0.1-cp310-cp310-linux_x86_64.whl size=579737 sha256=bbc92ffa06a639525dc079c4923a52457559268c171e9fa33ae1d72ec0d7fd0f
  Stored in directory: /root/.cache/pip/wheels/45/7d/2c/a7ebb8319e01acc5306fa1f8558bf24063d6cec2c02de330c9
Successfully built PyStemmer
Installing collected packages: PyStemmer, mmh3, protobuf, portalocker, pillow, loguru, hyperframe, humanfriendly, hpack, grpcio, onnx, h2, grpcio-tools, coloredlogs, onnxruntime, qdrant-client, fastembed
  Attempting uninstall: protobuf
    Found existing installation: protobuf 3.20.3
    Uninstalling protobuf-3.20.3:
      Successfully uninstalled protobuf-3.20.3
  Attempting uninstall: pillow
    Found existing installation: Pillow 9.4.0
    Uninstalling Pillow-9.4.0:
      Successfully uninstalled Pillow-9.4.0
  Attempting uninstall: grpcio
    Found existing installation: grpcio 1.64.1
    Uninstalling grpcio-1.64.1:
      Successfully uninstalled grpcio-1.64.1
[31mERROR: pip's dependency resolver does not currently take into account all the packages that are installed. This behaviour is the source of the following dependency conflicts.
cudf-cu12 24.4.1 requires protobuf<5,>=3.20, but you have protobuf 5.28.0 which is incompatible.
google-ai-generativelanguage 0.6.6 requires protobuf!=3.20.0,!=3.20.1,!=4.21.0,!=4.21.1,!=4.21.2,!=4.21.3,!=4.21.4,!=4.21.5,<5.0.0dev,>=3.19.5, but you have protobuf 5.28.0 which is incompatible.
google-cloud-bigquery-storage 2.25.0 requires protobuf!=3.20.0,!=3.20.1,!=4.21.0,!=4.21.1,!=4.21.2,!=4.21.3,!=4.21.4,!=4.21.5,<5.0.0dev,>=3.19.5, but you have protobuf 5.28.0 which is incompatible.
google-cloud-datastore 2.19.0 requires protobuf!=3.20.0,!=3.20.1,!=4.21.0,!=4.21.1,!=4.21.2,!=4.21.3,!=4.21.4,!=4.21.5,<5.0.0dev,>=3.19.5, but you have protobuf 5.28.0 which is incompatible.
google-cloud-firestore 2.16.1 requires protobuf!=3.20.0,!=3.20.1,!=4.21.0,!=4.21.1,!=4.21.2,!=4.21.3,!=4.21.4,!=4.21.5,<5.0.0dev,>=3.19.5, but you have protobuf 5.28.0 which is incompatible.
tensorboard 2.17.0 requires protobuf!=4.24.0,<5.0.0,>=3.19.6, but you have protobuf 5.28.0 which is incompatible.
tensorflow 2.17.0 requires protobuf!=4.21.0,!=4.21.1,!=4.21.2,!=4.21.3,!=4.21.4,!=4.21.5,<5.0.0dev,>=3.20.3, but you have protobuf 5.28.0 which is incompatible.
tensorflow-metadata 1.15.0 requires protobuf<4.21,>=3.20.3; python_version < "3.11", but you have protobuf 5.28.0 which is incompatible.[0m[31m
[0mSuccessfully installed PyStemmer-2.2.0.1 coloredlogs-15.0.1 fastembed-0.3.6 grpcio-1.66.1 grpcio-tools-1.66.1 h2-4.1.0 hpack-4.0.0 humanfriendly-10.0 hyperframe-6.0.1 loguru-0.7.2 mmh3-4.1.0 onnx-1.16.2 onnxruntime-1.19.0 pillow-10.4.0 portalocker-2.10.1 protobuf-5.28.0 qdrant-client-1.11.1
```

```python
from fastembed import TextEmbedding
from typing import List

# Example list of documents
documents: List[str] = [
    "This is built to be faster and lighter than other embedding libraries e.g. Transformers, Sentence-Transformers, etc.",
    "fastembed is supported by and maintained by Qdrant.",
]

# This will trigger the model download and initialization
embedding_model = TextEmbedding()
print("The model BAAI/bge-small-en-v1.5 is ready to use.")

embeddings_generator = embedding_model.embed(documents)  # reminder this is a generator
embeddings_list = list(embedding_model.embed(documents))
# you can also convert the generator to a list, and that to a numpy array
len(embeddings_list[0])  # Vector of 384 dimensions
```

```
/usr/local/lib/python3.10/dist-packages/huggingface_hub/utils/_token.py:89: UserWarning: 
The secret `HF_TOKEN` does not exist in your Colab secrets.
To authenticate with the Hugging Face Hub, create a token in your settings tab (https://huggingface.co/settings/tokens), set it as secret in your Google Colab and restart your session.
You will be able to reuse this secret in all of your notebooks.
Please note that authentication is recommended but still optional to access public models or datasets.
  warnings.warn(



Fetching 5 files:   0%|          | 0/5 [00:00<?, ?it/s]


The model BAAI/bge-small-en-v1.5 is ready to use.





384
```

```python
model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
embeddings = list(model.embed(documents))
```

```
Fetching 5 files:   0%|          | 0/5 [00:00<?, ?it/s]
```

```python
index = 0
embeddings[index]
```

```
array([-0.11154678,  0.00976557,  0.00524557,  0.01951891, -0.01934949,
        0.0294345 , -0.10519082, -0.00890124,  0.01831442,  0.01486797,
       -0.05642503,  0.02561353, -0.00120164,  0.0063746 ,  0.02633463,
        0.00892209,  0.05313657,  0.03955458, -0.04400248, -0.02929408,
        0.04691843, -0.0251587 ,  0.00778646, -0.05410659, -0.04362102,
        0.012751  , -0.02304645, -0.02250822,  0.01992302, -0.19920594,
        0.01895357, -0.02651562,  0.08252291, -0.02281936, -0.05781297,
       -0.01367695, -0.0357074 ,  0.05386202, -0.10155273,  0.02097267,
        0.00652709,  0.03738068, -0.03508431, -0.00091196,  0.03425013,
       -0.0244589 , -0.00739988, -0.03084341, -0.0360513 , -0.02814267,
        0.01547158, -0.02158506,  0.02544232,  0.02438807, -0.02049713,
       -0.02665791,  0.03727328,  0.08809513,  0.02471923, -0.00851185,
       -0.02016541,  0.05734602, -0.05127534,  0.02370389, -0.02993908,
       -0.02091452, -0.03927831, -0.02315616,  0.00927734,  0.07043557,
        0.02359609, -0.01002701,  0.04758463,  0.00795123,  0.00199823,
        0.05515849,  0.01843716, -0.00297784, -0.01339655, -0.00348846,
        0.07951683, -0.06366209, -0.01295012, -0.00558425, -0.02937804,
       -0.03242923,  0.03339406,  0.01734222,  0.01248072,  0.06825154,
       -0.08455559, -0.04574723, -0.00958249,  0.05233807, -0.00915507,
       -0.06187493, -0.01228706,  0.03380495,  0.03197373,  0.351047  ,
       -0.06548347, -0.00566749,  0.05857921, -0.05616156,  0.01007558,
       -0.03780005,  0.04616218, -0.01843748, -0.09301557, -0.02079744,
       -0.04339447, -0.02648945, -0.02158683,  0.02083868,  0.0229537 ,
        0.01272579, -0.03758858,  0.0055967 , -0.06286889,  0.04843556,
        0.00935004,  0.019595  ,  0.00112755, -0.01437076,  0.01551351,
        0.03026596,  0.04408654,  0.05475584,  0.0532619 ,  0.07697894,
       -0.01663394,  0.01228551, -0.01277489,  0.03190343,  0.0299643 ,
        0.04491727, -0.0297967 , -0.03278985,  0.01730012, -0.00223153,
       -0.04579116,  0.11361726,  0.01470175, -0.04264664, -0.04399694,
        0.06602897, -0.0086776 , -0.01433716, -0.0245108 ,  0.00416826,
        0.03465071,  0.03361178,  0.04309674, -0.0571175 , -0.03614638,
       -0.01957096,  0.04611274,  0.00653189, -0.00397208, -0.03064732,
        0.00837799,  0.03048816, -0.00592958,  0.02347303,  0.01496446,
       -0.06332062, -0.03251878, -0.04869231,  0.02282277, -0.0352359 ,
        0.01058851,  0.03910526,  0.02767139,  0.06423506,  0.03829629,
       -0.06573225, -0.08320764, -0.05718217,  0.03210302,  0.02064366,
        0.10592965, -0.00394271, -0.05392285,  0.02672255,  0.00775726,
       -0.01757085,  0.01085252, -0.02709262, -0.01186663,  0.02550751,
       -0.04300734,  0.10134848, -0.05021185,  0.01615322, -0.05007042,
       -0.04070356,  0.0220633 ,  0.00786546, -0.04022967,  0.01102202,
       -0.05670198,  0.0637146 ,  0.04182269,  0.04779008,  0.00664953,
       -0.06148711,  0.00421   , -0.04121437,  0.01855405, -0.00361693,
       -0.0353744 , -0.04944496,  0.04226612, -0.03273365, -0.00653173,
       -0.0164093 , -0.04222883,  0.02018566,  0.03509492,  0.03532547,
       -0.10200296, -0.00397537,  0.03265329, -0.2789253 , -0.05658513,
        0.01701447, -0.00449947,  0.05060686, -0.06499418,  0.01190282,
        0.03217283,  0.00128892,  0.03063434,  0.07366714, -0.04893034,
       -0.01412376, -0.01474853, -0.00826356,  0.01458263,  0.03724322,
       -0.01030778, -0.02107089,  0.00781223, -0.00658979,  0.05725313,
        0.08171403, -0.05366954, -0.00367528, -0.00357442,  0.12753028,
       -0.06057396,  0.05828974, -0.0327079 ,  0.02324416, -0.00164784,
       -0.02812943, -0.07287657,  0.03745638,  0.03951742,  0.06104768,
        0.03782523,  0.05370102,  0.02615051, -0.0343913 ,  0.02340421,
        0.03635768, -0.13454738, -0.02032864, -0.04759538, -0.02616174,
       -0.05073287, -0.04013983,  0.03446068,  0.01762316, -0.02912302,
       -0.01398167,  0.02396321,  0.00132058, -0.06350204, -0.0130304 ,
       -0.00629205, -0.04972706,  0.00407772,  0.01150152, -0.06017115,
       -0.03213598, -0.01901641,  0.01318628, -0.04036628, -0.03015249,
       -0.00698372, -0.03276826,  0.05166869, -0.05484482,  0.0710554 ,
       -0.05737406,  0.01871949,  0.04634563,  0.04099835, -0.00277327,
        0.09684802, -0.02202539,  0.04704947,  0.02065702,  0.05638563,
        0.02581934, -0.02389525,  0.04793629, -0.03563442,  0.04439346,
        0.00885731, -0.04005638,  0.08745711, -0.02079477, -0.01768558,
        0.00970369,  0.00073047,  0.00834107, -0.01247691, -0.2898    ,
        0.01545556,  0.02949831, -0.04447616, -0.03082363, -0.00313923,
        0.02959311, -0.053529  ,  0.05985724,  0.01590348, -0.02330944,
        0.04883645,  0.03509056,  0.05289932,  0.0467219 , -0.01115785,
        0.14264478, -0.04142467,  0.00188216, -0.01826797, -0.04291844,
       -0.01292035,  0.18563962, -0.00567571, -0.04968628,  0.03097987,
        0.00046475, -0.02851093,  0.04891979, -0.01101997, -0.00629904,
        0.00147007,  0.02324692, -0.01115817, -0.02069092,  0.05764965,
       -0.03267062, -0.06093276,  0.03421428,  0.01529415,  0.05965804,
        0.01811415, -0.09919285, -0.00265531,  0.02271152,  0.01319533,
        0.03898048,  0.0246353 , -0.03220855,  0.00463611,  0.06515267,
       -0.00238057, -0.01171634, -0.01450325,  0.08445506, -0.00357794,
       -0.01779736,  0.03850413, -0.00440679, -0.01196052, -0.00934466,
       -0.03048337, -0.01320516,  0.05328086,  0.06424666], dtype=float32)
```

### Sparse Text Embeddings

```python
#!pip install -q fastembed

```

<hr />

```python
from fastembed import SparseTextEmbedding, SparseEmbedding
from typing import List
```

<hr />

```python
SparseTextEmbedding.list_supported_models()
```

```
[{'model': 'prithivida/Splade_PP_en_v1',
  'vocab_size': 30522,
  'description': 'Independent Implementation of SPLADE++ Model for English',
  'size_in_GB': 0.532,
  'sources': {'hf': 'Qdrant/SPLADE_PP_en_v1'},
  'model_file': 'model.onnx'},
 {'model': 'prithvida/Splade_PP_en_v1',
  'vocab_size': 30522,
  'description': 'Independent Implementation of SPLADE++ Model for English',
  'size_in_GB': 0.532,
  'sources': {'hf': 'Qdrant/SPLADE_PP_en_v1'},
  'model_file': 'model.onnx'},
 {'model': 'Qdrant/bm42-all-minilm-l6-v2-attentions',
  'vocab_size': 30522,
  'description': 'Light sparse embedding model, which assigns an importance score to each token in the text',
  'size_in_GB': 0.09,
  'sources': {'hf': 'Qdrant/all_miniLM_L6_v2_with_attentions'},
  'model_file': 'model.onnx',
  'additional_files': ['stopwords.txt'],
  'requires_idf': True},
 {'model': 'Qdrant/bm25',
  'description': 'BM25 as sparse embeddings meant to be used with Qdrant',
  'size_in_GB': 0.01,
  'sources': {'hf': 'Qdrant/bm25'},
  'model_file': 'mock.file',
  'additional_files': ['arabic.txt',
   'azerbaijani.txt',
   'basque.txt',
   'bengali.txt',
   'catalan.txt',
   'chinese.txt',
   'danish.txt',
   'dutch.txt',
   'english.txt',
   'finnish.txt',
   'french.txt',
   'german.txt',
   'greek.txt',
   'hebrew.txt',
   'hinglish.txt',
   'hungarian.txt',
   'indonesian.txt',
   'italian.txt',
   'kazakh.txt',
   'nepali.txt',
   'norwegian.txt',
   'portuguese.txt',
   'romanian.txt',
   'russian.txt',
   'slovene.txt',
   'spanish.txt',
   'swedish.txt',
   'tajik.txt',
   'turkish.txt'],
  'requires_idf': True}]
```

```python
model_name = "Qdrant/bm25"
# This triggers the model download
model = SparseTextEmbedding(model_name=model_name)
```

```
Fetching 29 files:   0%|          | 0/29 [00:00<?, ?it/s]



chinese.txt:   0%|          | 0.00/5.56k [00:00<?, ?B/s]



azerbaijani.txt:   0%|          | 0.00/967 [00:00<?, ?B/s]



arabic.txt:   0%|          | 0.00/6.35k [00:00<?, ?B/s]



basque.txt:   0%|          | 0.00/2.20k [00:00<?, ?B/s]



catalan.txt:   0%|          | 0.00/1.56k [00:00<?, ?B/s]



bengali.txt:   0%|          | 0.00/5.44k [00:00<?, ?B/s]



danish.txt:   0%|          | 0.00/424 [00:00<?, ?B/s]



dutch.txt:   0%|          | 0.00/453 [00:00<?, ?B/s]



finnish.txt:   0%|          | 0.00/1.58k [00:00<?, ?B/s]



french.txt:   0%|          | 0.00/813 [00:00<?, ?B/s]



english.txt:   0%|          | 0.00/936 [00:00<?, ?B/s]



german.txt:   0%|          | 0.00/1.36k [00:00<?, ?B/s]



greek.txt:   0%|          | 0.00/2.17k [00:00<?, ?B/s]



hinglish.txt:   0%|          | 0.00/5.96k [00:00<?, ?B/s]



hebrew.txt:   0%|          | 0.00/1.84k [00:00<?, ?B/s]



hungarian.txt:   0%|          | 0.00/1.23k [00:00<?, ?B/s]



nepali.txt:   0%|          | 0.00/3.61k [00:00<?, ?B/s]



kazakh.txt:   0%|          | 0.00/3.88k [00:00<?, ?B/s]



norwegian.txt:   0%|          | 0.00/851 [00:00<?, ?B/s]



italian.txt:   0%|          | 0.00/1.65k [00:00<?, ?B/s]



indonesian.txt:   0%|          | 0.00/6.45k [00:00<?, ?B/s]



portuguese.txt:   0%|          | 0.00/1.29k [00:00<?, ?B/s]



romanian.txt:   0%|          | 0.00/1.91k [00:00<?, ?B/s]



russian.txt:   0%|          | 0.00/1.24k [00:00<?, ?B/s]



slovene.txt:   0%|          | 0.00/16.0k [00:00<?, ?B/s]



spanish.txt:   0%|          | 0.00/2.18k [00:00<?, ?B/s]



swedish.txt:   0%|          | 0.00/559 [00:00<?, ?B/s]



tajik.txt:   0%|          | 0.00/1.82k [00:00<?, ?B/s]



turkish.txt:   0%|          | 0.00/260 [00:00<?, ?B/s]
```

```python
documents: List[str] = [
    "Chandrayaan-3 is India's third lunar mission",
    "It aimed to land a rover on the Moon's surface - joining the US, China and Russia",
    "The mission is a follow-up to Chandrayaan-2, which had partial success",
    "Chandrayaan-3 will be launched by the Indian Space Research Organisation (ISRO)",
    "The estimated cost of the mission is around $35 million",
    "It will carry instruments to study the lunar surface and atmosphere",
    "Chandrayaan-3 landed on the Moon's surface on 23rd August 2023",
    "It consists of a lander named Vikram and a rover named Pragyan similar to Chandrayaan-2. Its propulsion module would act like an orbiter.",
    "The propulsion module carries the lander and rover configuration until the spacecraft is in a 100-kilometre (62 mi) lunar orbit",
    "The mission used GSLV Mk III rocket for its launch",
    "Chandrayaan-3 was launched from the Satish Dhawan Space Centre in Sriharikota",
    "Chandrayaan-3 was launched earlier in the year 2023",
]
sparse_embeddings_list: List[SparseEmbedding] = list(
    model.embed(documents, batch_size=6)
)  # batch_size is optional, notice the generator
```

<hr />

```python
index = 0
sparse_embeddings_list[index]
```

```
SparseEmbedding(values=array([1.66528681, 1.66528681, 1.66528681, 1.66528681, 1.66528681,
       1.66528681]), indices=array([1558122631,  746093202,  691409538, 1391639301, 2042792262,
       1318831999]))
```

### Late Interaction Text Embeddings

```python
from fastembed import LateInteractionTextEmbedding

embedding_model = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")

documents = [
    "ColBERT is a late interaction text embedding model, however, there are also other models such as TwinBERT.",
    "On the contrary to the late interaction models, the early interaction models contains interaction steps at embedding generation process",
]
queries = [
    "Are there any other late interaction text embedding models except ColBERT?",
    "What is the difference between late interaction and early interaction text embedding models?",
]
```

```
Fetching 5 files:   0%|          | 0/5 [00:00<?, ?it/s]



config.json:   0%|          | 0.00/743 [00:00<?, ?B/s]



tokenizer.json:   0%|          | 0.00/466k [00:00<?, ?B/s]



tokenizer_config.json:   0%|          | 0.00/405 [00:00<?, ?B/s]



special_tokens_map.json:   0%|          | 0.00/112 [00:00<?, ?B/s]



model.onnx:   0%|          | 0.00/436M [00:00<?, ?B/s]
```

```python
document_embeddings = list(
    embedding_model.embed(documents)
)  # embed and qury_embed return generators,
# which we need to evaluate by writing them to a list
query_embeddings = list(embedding_model.query_embed(queries))
```

<hr />

```python
document_embeddings[0].shape, query_embeddings[0].shape
```

```
((26, 128), (32, 128))
```

Don't worry about query embeddings having the bigger shape in this case. ColBERT authors recommend to pad queries with [MASK] tokens to 32 tokens. They also recommends to truncate queries to 32 tokens, however we don't do that in FastEmbed, so you can put some straight into the queries.

Image Embeddings

```python
from fastembed import ImageEmbedding

model = ImageEmbedding("Qdrant/resnet50-onnx")

embeddings_generator = model.embed(
    ["tests/misc/image.jpeg", "tests/misc/small_image.jpeg"]
)
embeddings_list = list(embeddings_generator)
embeddings_list
```

```
Fetching 3 files:   0%|          | 0/3 [00:00<?, ?it/s]



config.json:   0%|          | 0.00/2.00 [00:00<?, ?B/s]



preprocessor_config.json:   0%|          | 0.00/734 [00:00<?, ?B/s]



model.onnx:   0%|          | 0.00/94.0M [00:00<?, ?B/s]



---------------------------------------------------------------------------

FileNotFoundError                         Traceback (most recent call last)

<ipython-input-18-25b60431898f> in <cell line: 8>()
      6     ["tests/misc/image.jpeg", "tests/misc/small_image.jpeg"]
      7 )
----> 8 embeddings_list = list(embeddings_generator)
      9 embeddings_list


/usr/local/lib/python3.10/dist-packages/fastembed/image/image_embedding.py in embed(self, images, batch_size, parallel, **kwargs)
     92             List of embeddings, one per document
     93         """
---> 94         yield from self.model.embed(images, batch_size, parallel, **kwargs)


/usr/local/lib/python3.10/dist-packages/fastembed/image/onnx_embedding.py in embed(self, images, batch_size, parallel, **kwargs)
    121             List of embeddings, one per document
    122         """
--> 123         yield from self._embed_images(
    124             model_name=self.model_name,
    125             cache_dir=str(self.cache_dir),


/usr/local/lib/python3.10/dist-packages/fastembed/image/onnx_image_model.py in _embed_images(self, model_name, cache_dir, images, batch_size, parallel, **kwargs)
     96         if parallel is None or is_small:
     97             for batch in iter_batch(images, batch_size):
---> 98                 yield from self._post_process_onnx_output(self.onnx_embed(batch))
     99         else:
    100             start_method = "forkserver" if "forkserver" in get_all_start_methods() else "spawn"


/usr/local/lib/python3.10/dist-packages/fastembed/image/onnx_image_model.py in onnx_embed(self, images, **kwargs)
     57     def onnx_embed(self, images: List[ImageInput], **kwargs) -> OnnxOutputContext:
     58         with contextlib.ExitStack():
---> 59             image_files = [
     60                 Image.open(image) if not isinstance(image, Image.Image) else image
     61                 for image in images


/usr/local/lib/python3.10/dist-packages/fastembed/image/onnx_image_model.py in <listcomp>(.0)
     58         with contextlib.ExitStack():
     59             image_files = [
---> 60                 Image.open(image) if not isinstance(image, Image.Image) else image
     61                 for image in images
     62             ]


/usr/local/lib/python3.10/dist-packages/PIL/Image.py in open(fp, mode, formats)
   3429 
   3430     if filename:
-> 3431         fp = builtins.open(filename, "rb")
   3432         exclusive_fp = True
   3433     else:


FileNotFoundError: [Errno 2] No such file or directory: '/content/tests/misc/image.jpeg'
```

Preprocessing is encapsulated in the ImageEmbedding class, applied operations are identical to the ones provided by Hugging Face Transformers. You don't need to think about batching, opening/closing files, resizing images, etc., Fastembed will take care of it.

## Putting Data into Qdrant

```python
from qdrant_client import QdrantClient

client = QdrantClient(
    url="insert your Qdrant URL",
    api_key="insert your Qdrant API Key",
)
```

<hr />

```python
# Initialize the client
# Prepare your documents, metadata, and IDs
docs = ["Audience Suggestion 1", "Audience suggestion 2"]
metadata = [
    {"source": "jane-doe"},
    {"source": "john-doe"},
]
ids = [42, 2]

# If you want to change the model:
client.set_model("sentence-transformers/all-MiniLM-L6-v2")
# List of supported models: https://qdrant.github.io/fastembed/examples/Supported_Models

# Use the new add() instead of upsert()
# This internally calls embed() of the configured embedding model
client.add(
    collection_name="demo_collection", documents=docs, metadata=metadata, ids=ids
)

search_result = client.query(
    collection_name="demo_collection", query_text="This is a query document"
)
print(search_result)
```

```
[QueryResponse(id=2, embedding=None, sparse_embedding=None, metadata={'document': 'Audience suggestion 2', 'source': 'Ljohn-doe'}, document='Audience suggestion 2', score=-0.0038822955), QueryResponse(id=42, embedding=None, sparse_embedding=None, metadata={'document': 'Audience Suggestion 1', 'source': 'jane-doe'}, document='Audience Suggestion 1', score=-0.0069789663)]
```
