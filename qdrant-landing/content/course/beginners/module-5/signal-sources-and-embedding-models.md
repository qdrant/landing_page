---
title: "Signal Sources and Embedding Models"
short_description: "Module 5 of the Beginner Course: three named vectors, two models, and why captions matter."
description: "Two models cover every signal in the capstone. Learn why the collection declares three named vectors rather than five, and what CLIP puts in one space."
weight: 3
isLesson: true
---

{{< date >}} Module 5 {{< /date >}}

# Signal Sources and Embedding Models

Two models cover every signal here, and both run through FastEmbed exactly as in Modules 3 and 4: name the model, pass the content, and the client embeds it locally before upload.

| Signal source | Modality | Embedding model | Vectors it produces |
|---------------|----------|-----------------|---------------------|
| News articles | text | all-MiniLM-L6-v2 and Qdrant/bm25 | `text_dense`, `text_sparse` |
| Financial filings | text | all-MiniLM-L6-v2 and Qdrant/bm25 | `text_dense`, `text_sparse` |
| Earnings-call transcripts | text, transcribed | all-MiniLM-L6-v2 and Qdrant/bm25 | `text_dense`, `text_sparse` |
| Satellite imagery | image and caption | clip-ViT-B-32-vision, and the two text models on the caption | `image`, `text_dense`, `text_sparse` |

Satellite captures are the row worth reading twice. The caption is what gives an image its text vectors, and [Clustering Risk Signals](/course/beginners/module-5/clustering-risk-signals/) depends on those: an uncaptioned image can never join a text cluster.

Everything in this module installs with one line:

```bash
pip install "qdrant-client[fastembed]" scikit-learn numpy
```

### Text: Dense and Sparse

News articles, filings, and transcripts each get two text vectors, a dense one for meaning and a sparse one for exact tokens: the hybrid pairing from Module 3, using the same two models that module used.

```python
from qdrant_client import QdrantClient, models

DENSE_MODEL  = "sentence-transformers/all-MiniLM-L6-v2"   # Module 3's model, 384 dimensions
SPARSE_MODEL = "Qdrant/bm25"

# CLIP is a pair of encoders sharing one space: images go through the vision
# side, and a text query searching those images goes through the text side.
IMAGE_MODEL      = "Qdrant/clip-ViT-B-32-vision"
IMAGE_TEXT_MODEL = "Qdrant/clip-ViT-B-32-text"
```

`all-MiniLM-L6-v2` reads at most 256 tokens and silently drops the rest, so anything longer than a few paragraphs is chunked first. Roughly 150 words fits inside that budget with room to spare:

```python
def chunk_text(text: str, size: int = 150, overlap: int = 30) -> list[str]:
    """
    Fixed-size word windows with overlap, the Module 2 strategy.
    150 words stays under all-MiniLM-L6-v2's 256-token limit; the overlap keeps
    a sentence split across two chunks readable in both.
    """
    words = text.split()
    if len(words) <= size:
        return [text]
    step = size - overlap
    return [" ".join(words[i:i + size]) for i in range(0, len(words), step)]
```

### Images: CLIP Through FastEmbed

Satellite imagery of supplier facilities is embedded with CLIP (Contrastive Language-Image Pre-training). CLIP is trained on image and caption pairs, which puts pictures and text in one shared vector space, and that shared space is what makes a text query like "smoke above factory" match a satellite photo with no caption attached.

FastEmbed exposes the two halves as two model names, so there is no separate image library to install and no tensors to handle:

```python
# At ingestion: the picture itself becomes the `image` vector.
satellite_input = models.Image(
    image="captures/haiphong-2026-07-15.jpg",
    model=IMAGE_MODEL,
)

# At query time: the search phrase has to be embedded by CLIP's *text* encoder
# so it lands in the same space. CLIP truncates text at 77 tokens, so keep
# image queries to a phrase rather than a paragraph.
image_query = models.Document(
    text="smoke above factory roof",
    model=IMAGE_TEXT_MODEL,
)
```

Neither of those holds numbers yet. `models.Image` and `models.Document` record what to embed and which model to use, and the client turns them into vectors when you hand them to `upsert` or `query_points`.

Using `DENSE_MODEL` for that second call is the mistake to avoid. It produces a perfectly good 384-dimensional vector in the wrong space, and the query either errors on dimension or returns noise.

### The Same Pattern Extends to Audio and Video

Nothing above is specific to articles and satellite tiles. An earnings call becomes text once it is transcribed, and video becomes images once frames are sampled, and both then take a path this module already covers: a transcript is chunked and handed to `models.Document` like an article, a frame is handed to `models.Image` like a satellite tile. That is why the collection declares three named vectors rather than five.

Transcription itself is outside the course. Whisper is the usual choice, and it needs the `ffmpeg` command-line tool installed alongside the Python package, so the transcripts here arrive as plain strings instead of an audio pipeline:

```python
# Two excerpts from a quarterly call, already transcribed. Swap in Whisper
# output when you have ffmpeg on the machine; the ingestion path is identical.
EARNINGS_CALL_EXCERPTS = [
    "On the Haiphong question: the line was halted for four days after the fire "
    "and two of the three shifts are running again as of this week.",
    "We are not guiding to a shortage. The backlog at the port adds a week to "
    "inbound components and we have qualified a second supplier for the housing.",
]
```
