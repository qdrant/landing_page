---
title: Chunking Strategies
weight: 3
---

{{< date >}} Day 1 {{< /date >}}

# Chunking Strategies

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

So far we've talked about points: what they're made of, and how Qdrant compares them for approximate nearest neighbor search using distance metrics.

## The Real Beginning: Data Structure

None of this matters until we give Qdrant something meaningful to compare. Our pipeline starts with the data and how we represent what we want to search.

In practice, this means thinking about the structure of the data we're storing. Most real-world data is messy:
- Text documents are long
- Product descriptions vary in length
- User profiles have nested attributes

We need a way to break this data down into manageable chunks.

**Together, embedding and chunking define the data that Qdrant works with.**

## From Raw Text to Search-Ready

### The Problem with Whole Documents

Storing an entire document as a single vector might seem easier, but it makes search results less precise.

**Example:** Consider a multi-page Qdrant Collection Configuration Guide covering everything from HNSW to sharding and quantization.

If a user asks: *"What does the m parameter do?"*

**With whole document embedding:**
- Qdrant returns the entire guide
- The answer is buried under unrelated content
- Language models must process unnecessary noise
- Wastes tokens and compute power

**With proper chunking:**
- Split the guide into smaller, topic-focused chunks
- Embed each chunk separately
- Qdrant returns just the relevant section about the `m` parameter
- Clear, precise answers without noise

## Why Chunking Makes All the Difference

Instead of treating documents as monolithic blocks, you break them up:
- **Paragraphs** - Natural topic boundaries
- **Headings** - Structural divisions
- **Subsections** - Logical concepts

Each chunk gets its own vector, tied to a specific idea or topic. You can add metadata to each chunk:
- Section title
- Page number
- Original source document
- Tags and categories

This enables:
- **Filtered retrieval** - "Only show results from this section"
- **Context-aware fragments** - Precise answers to specific queries
- **Efficient processing** - No wasted tokens on irrelevant content

## Chunking Strategies: The Shape Matters

How you chunk affects:
- What your embeddings capture
- What your retriever can surface
- What your LLM can reason over

There's no one-size-fits-all approach. Let's explore the options:

### 1. Fixed-Size Chunking

**The Approach:** Define a number of tokens per chunk (e.g., 200) with a small overlap buffer to preserve context.

**Pros:**
- Simple to implement
- Consistent chunk sizes
- Predictable processing

**Cons:**
- Ignores natural language boundaries
- May split mid-sentence or mid-thought
- No semantic awareness

**Best for:** Documents lacking consistent formatting

```python
def fixed_size_chunk(text, chunk_size=200, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks
```

### 2. Sentence-Based Chunking

**The Approach:** Break documents into sentences using a tokenizer, then group sentences into chunks under a specified word count.

**Implementation:**
```python
from nltk.tokenize import sent_tokenize

def sentence_chunk(text, max_words=150):
    sentences = sent_tokenize(text)
    chunks, buffer, length = [], [], 0
    
    for sent in sentences:
        count = len(sent.split())
        if length + count > max_words:
            chunks.append(" ".join(buffer))
            buffer, length = [], 0
        buffer.append(sent)
        length += count
    
    if buffer:
        chunks.append(" ".join(buffer))
    return chunks
```

**Pros:**
- Preserves complete thoughts
- Natural language boundaries
- Good semantic coherence

**Cons:**
- Irregular chunk lengths
- Sentence size varies significantly
- May not respect topic boundaries

**Best for:** RAG systems, Q&A applications, general text processing

### 3. Paragraph-Based Chunking

**The Approach:** Split on paragraph breaks, leveraging existing document structure.

**Implementation:**
```python
def paragraph_chunk(text):
    return [p.strip() for p in text.split("\n\n") if p.strip()]
```

**Pros:**
- Aligns with natural topic boundaries
- Semantically rich by default
- Respects author's organization

**Cons:**
- Unpredictable sizes (single line to whole page)
- May need token limits or fallback splitting
- Depends on clean document structure

**Best for:** Articles, blogs, documentation, books, emails

### 4. Sliding Window Chunking

**The Approach:** Create overlapping chunks to maintain context continuity.

**Implementation:**
```python
def sliding_window(text, window=200, stride=100):
    words = text.split()
    chunks = []
    for i in range(0, len(words) - window + 1, stride):
        chunk = " ".join(words[i:i + window])
        chunks.append(chunk)
    return chunks
```

**Pros:**
- Maintains context at boundaries
- Higher recall potential
- Reduces information loss

**Cons:**
- Storage redundancy
- Increased processing costs
- May return duplicate information

**Best for:** Critical applications where missing information is costly, reranking systems

### 5. Recursive Chunking

**The Approach:** Use a fallback hierarchy of separators when data doesn't follow predictable structure.

**Hierarchy:**
1. Large blocks (headings, paragraph breaks)
2. Medium blocks (lines, sentences)
3. Small blocks (words, characters)

**Implementation:**
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=100,
    separators=["\n\n", "\n", ".", " ", ""]
)

chunks = splitter.split_text(text)
```

**Pros:**
- Adapts to messy or inconsistent input
- Preserves semantic coherence when possible
- Handles various document formats

**Cons:**
- Heuristic-based, results may be inconsistent
- Complex logic
- May not work perfectly with all content types

**Best for:** Scraped web content, mixed formats, CMS exports

### 6. Semantic-Aware Chunking

**The Approach:** Use embeddings to detect meaning shifts and break at topic boundaries.

**Implementation:**
```python
from llama_index.text_splitter import SemanticSplitterNodeParser

parser = SemanticSplitterNodeParser.from_defaults()
nodes = parser.split_text(text)
```

**Process:**
1. Embed the full document
2. Analyze semantic similarity between segments
3. Identify topic transitions
4. Split at coherence boundaries

**Pros:**
- High semantic precision
- Each chunk carries coherent ideas
- Optimal for complex documents

**Cons:**
- Computationally expensive
- Requires embedding entire document upfront
- Slower processing pipeline

**Best for:** Legal documents, research papers, critical applications requiring high precision

## Chunking Strategy Comparison

| Method | Strength | Trade-off | Good For |
|--------|----------|-----------|----------|
| **Fixed-Size** | Simple, consistent size | Breaks meaning | Unstructured text |
| **Sentence** | Keeps full thoughts | Irregular length | RAG, QA systems |
| **Paragraph** | Aligns with concepts | Size varies dramatically | Docs, manuals |
| **Sliding Window** | Preserves context | Redundant, expensive | High recall, reranking |
| **Recursive** | Adapts to messy input | Heuristic, inconsistent | Scraped or mixed formats |
| **Semantic** | High precision | Slow, expensive | Legal, research, critical answers |

## Adding Meaning with Metadata

Chunks by themselves are just fragments of text. They don't tell you:
- Where they came from
- What they belong to
- How to control retrieval

**That's where metadata comes in.**

In Qdrant, this metadata lives in the **payload** - a JSON object attached to each vector that carries real structure.

### Essential Metadata Fields

```json
{
  "document_id": "collection-config-guide",
  "document_title": "What is a Vector Database",
  "section_title": "What Is a Vector",
  "chunk_index": 7,
  "url": "https://qdrant.tech/documentation/configuration/collection/hnsw/",
  "tags": ["qdrant", "vector database", "point", "vector", "payload"],
  "source_type": "article",
  "created_at": "2025-04-16T10:00:00Z",
  "content": "There are three key elements that define a vector in a vector database: the ID, the dimensions, and the payload. These components work together to represent a vector effectively within the system..."
}
```

### What Metadata Enables

**1. Filtered Search**
```python
# Only show results from this article
filter = {
    "must": [
        {"match": {"key": "document_id", "value": "collection-config-guide"}}
    ]
}
```

**2. Grouped Results**
```python
# Top result per document
group_by = "document_id"
# Get the most relevant chunk from each source
```

**3. Rich Result Display**
- Original content
- Section context
- Source links
- Creation timestamps

**4. Permission Control**
```python
# Filter by user permissions
filter = {
    "must": [
        {"match": {"key": "access_level", "value": "public"}}
    ]
}
```

## Practical Implementation

### Complete Chunking Pipeline

```python
import json
from datetime import datetime
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

def create_chunks_with_metadata(document, strategy="sentence", max_words=150):
    """Complete chunking pipeline with metadata"""
    
    # Choose chunking strategy
    if strategy == "sentence":
        chunks = sentence_chunk(document["content"], max_words)
    elif strategy == "paragraph":
        chunks = paragraph_chunk(document["content"])
    elif strategy == "sliding_window":
        chunks = sliding_window(document["content"])
    
    # Create points with metadata
    points = []
    for i, chunk in enumerate(chunks):
        # Generate embedding (using your preferred model)
        embedding = generate_embedding(chunk)
        
        # Create rich metadata
        payload = {
            "document_id": document["id"],
            "document_title": document["title"],
            "section_title": document.get("section", ""),
            "chunk_index": i,
            "chunk_count": len(chunks),
            "url": document.get("url", ""),
            "tags": document.get("tags", []),
            "source_type": document.get("type", "text"),
            "created_at": datetime.utcnow().isoformat(),
            "content": chunk,
            "word_count": len(chunk.split()),
            "char_count": len(chunk)
        }
        
        points.append(PointStruct(
            id=f"{document['id']}_chunk_{i}",
            vector=embedding,
            payload=payload
        ))
    
    return points
```

### Search with Metadata

```python
def search_with_filters(query, document_type=None, date_range=None):
    """Search with metadata filtering"""
    
    # Build filter conditions
    filter_conditions = []
    
    if document_type:
        filter_conditions.append({
            "match": {"key": "source_type", "value": document_type}
        })
    
    if date_range:
        filter_conditions.append({
            "range": {
                "key": "created_at",
                "gte": date_range["start"],
                "lte": date_range["end"]
            }
        })
    
    # Execute search
    query_filter = {"must": filter_conditions} if filter_conditions else None
    
    results = client.search(
        collection_name="documents",
        query_vector=generate_embedding(query),
        query_filter=query_filter,
        limit=5
    )
    
    return results
```

## Key Takeaways

1. **Chunking strategy directly impacts search quality** - choose based on your data and use case
2. **Smaller, focused chunks provide more precise results** than whole document embeddings
3. **Metadata is crucial** for filtering, grouping, and result presentation
4. **Different strategies have different trade-offs** - experiment to find what works
5. **Consider computational costs** - semantic chunking is powerful but expensive
6. **Overlap can help preserve context** but increases storage requirements

## What's Next

Now that you understand how to structure and prepare your data, let's put these concepts into practice. In the next section, we'll build a complete movie recommendation system that demonstrates chunking, embedding, and metadata in action.

Remember: **Qdrant doesn't make assumptions about what your data means. It compares vectors and gives you back what's closest. But what it sees—the structure, the semantics, the context—that's entirely up to you.** 