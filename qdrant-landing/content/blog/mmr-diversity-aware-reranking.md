---
draft: false
title: Balancing Relevance and Diversity with MMR Search
slug: mmr-diversity-aware-reranking
short_description: Discover how Qdrant's Maximum Marginal Relevance (MMR) balances relevance with diversity in fashion search to avoid echo chambers of similar results.
description: Learn how to implement Maximum Marginal Relevance (MMR) with Qdrant to create diverse search results in fashion discovery. This guide shows how to balance relevance and diversity using the DeepFashion dataset and CLIP embeddings.
preview_image: /blog/mmr-diversity-aware-reranking/preview/preview.webp
social_preview_image: /blog/mmr-diversity-aware-reranking/preview/social_preview.jpg
title_preview_image: /blog/mmr-diversity-aware-reranking/preview/title.webp
date: 2025-09-04
author: Thierry Damiba
featured: true
categories:
  - Tutorial
  - Vector Search
tags:
  - MMR
  - Fashion Search
  - Diversity
  - CLIP
  - Vector Search
---

Variety is the spice of life! Yet often, with search engines, users find that the results are too similar to get value. You search for a black jacket on your favorite shopping site, and you get 5 black full zip bomber jackets. Search for a black dress and you get 5 strapless dresses. Traditional vector search focuses on returning the most relevant items, which creates an echo chamber of similar results.

![Similar black dresses](/blog/mmr-diversity-aware-reranking/mmr-food-diversity.webp)


*Problem: A search for "black dress" returns only strapless dresses*

Qdrant's native Maximum Marginal Relevance (MMR) fixes this by balancing similar results with diverse results. Instead of showing variations of the same item, MMR makes sure each result adds something novel to your search.

While MMR applies to any domain and modality, today we'll explore it through fashion search using the DeepFashion dataset. This visual approach makes the diversity benefits immediately obvious, but the same principles work whether you're searching documents, building recommendation engines, or retrieving context for AI systems.

For a different perspective on MMR with text-based movie recommendations, check out [Tarun Jain's implementation guide](https://python.plainenglish.io/understanding-maximal-marginal-relevance-mmr-a0a7a8df0a1a).

## What is Maximum Marginal Relevance?

![Standard Search returns all "bomber jacket"](/blog/mmr-diversity-aware-reranking/standard-search-results.webp)


*Note the diversity of food dishes on the right, with MMR*
MMR solves the redundancy problem by reranking search results based on two criteria:

1. **Relevance to your query** (how well does this match what you're looking for?)
2. **Diversity from already selected items** (how different is this from what you already have?)

The algorithm picks the most relevant item first, then for each subsequent item, it balances relevance against similarity to already-selected results. A lambda parameter controls this balance:

- **λ = 1.0:** Pure relevance (regular vector search)
- **λ = 0.5:** Balanced approach
- **λ = 0.0:** Pure diversity

*MMR is implemented in Qdrant as a parameter of a nearest neighbor query. Code examples can be found below.*

## Why Vector Search for Fashion Discovery?

![Fashion search demonstration](/blog/mmr-diversity-aware-reranking/fashion-search-demo.webp)

*A search for "black dress" returns only strapless dresses, showing the need for diversity in search results*

Fashion search is perfect for demonstrating MMR because visual similarity doesn't always match shopping intent. When someone searches for "black jacket," they might want to explore:

- 🏃 Bomber jacket (sporty)
- 👔 Blazer (professional)
- 🧥 Leather jacket (edgy)
- 👖 Denim jacket (casual)

Your typical search might show four black jackets that look nearly identical. MMR gives you one or two bombers plus diverse alternatives, helping users discover a wider variety of styles.

Let's take a look at a practical example.

## Setting Up the Environment
We'll need several libraries for this fashion discovery project:

```bash
pip install qdrant-client # Vector Search Engine
pip install fastembed # Fast, lightweight embedding generation with CLIP
pip install datasets # For DeepFashion data access
```

## Exploring the DeepFashion Dataset
The [DeepFashion dataset](https://huggingface.co/datasets/SaffalPoosh/deepFashion-with-masks) contains over 40,000 clothing images across different categories and styles. It includes rich metadata, such as category, color, and style attributes, that make it perfect for testing diversity algorithms.

The dataset includes realistic fashion photography: items worn by models, flat lay product shots, and detailed images. The variety of items with similar names makes this dataset perfect for testing whether MMR can distinguish between visually similar items that serve different fashion purposes.

---

## Step 1: Loading and Processing Fashion Data
```python
from datasets import load_dataset
from fastembed import ImageEmbedding, TextEmbedding
from qdrant_client import QdrantClient, models
import uuid

def load_fashion_data(sample_size=10):
    """Load fashion items from DeepFashion-with-masks dataset"""
    dataset = load_dataset("SaffalPoosh/deepFashion-with-masks", split="train")
    sample_dataset = dataset.shuffle(seed=42).select(range(sample_size))
    
    fashion_items = []
    for i, item in enumerate(sample_dataset):
        # Extract all available metadata
        metadata = {}
        for key, value in item.items():
            if key not in ["images", "mask", "mask_overlay"] and value is not None:
                metadata[key] = value
        
        fashion_items.append({
            "image": item["images"],  # PIL Image object
            **metadata
        })
    
    return fashion_items

fashion_items = load_fashion_data(sample_size=100)
```

---

## Step 2: Creating Fashion Embeddings
We'll use CLIP to create embeddings that understand both visual similarity and semantic meaning in fashion:

```python
# Create image embeddings for all fashion items
image_model = ImageEmbedding(model_name="Qdrant/clip-ViT-B-32-vision")
embeddings = list(image_model.embed([item["image"] for item in fashion_items]))
```

---

## Step 3: Setting Up Qdrant for Visual Fashion Search
Create the client and set up your collection

```python
# Initialize Qdrant client, get your credentials at https://qdrant.tech
client = QdrantClient(
     host="your-qdrant url",
     api_key="<your-qdrant-api-key>")

collection_name = "fashion_discovery"

# Create collection optimized for CLIP embeddings
client.recreate_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=512,  # CLIP embedding dimension
        distance=models.Distance.COSINE
    )
)

# Upload fashion items with embeddings
points = []
for i, (item, embedding) in enumerate(zip(fashion_items, embeddings)):
    # Remove PIL image from payload
    payload = {k: v for k, v in item.items() if k != "image"}
    payload["item_id"] = i
    
    point = models.PointStruct(
        id=str(uuid.uuid4()),
        vector=embedding.tolist(),
        payload=payload
    )
    points.append(point)

client.upsert(collection_name=collection_name, points=points)
```

---

## Step 4: Implementing Fashion Search Functions
Now let's create search functions to compare standard similarity versus MMR diversity. We'll use each function with the query: "black jacket"

### Standard Search
Standard search gives you all similar styles: bomber jacket.

```python
# Standard fashion search — often returns similar looking items

def fashion_search_standard(query_text, limit=5):
    text_model = TextEmbedding(model_name="Qdrant/clip-ViT-B-32-text")
    query_embedding = list(text_model.embed([query_text]))[0]
    
    results = client.search(
        collection_name=collection_name,
        query_vector=query_embedding.tolist(),
        limit=limit,
        with_payload=True
    )
    return results

query_text = "black jacket"

# Standard search
standard_results = fashion_search_standard(query_text)
print("\nSTANDARD FASHION SEARCH: 'black jacket'")
for i, point in enumerate(standard_results, 1):
    payload = point.payload
    print(f"{i}️⃣ Score: {point.score:.4f} | {payload.get('item_description', 'Fashion Item')}")
    print(f"   Style: {payload.get('style', 'N/A')} | Color: {payload.get('color', 'N/A')}")
    print()
```

![Standard Search returns all "bomber jacket"](/blog/mmr-diversity-aware-reranking/black-dress-problem.webp)

*Standard Search returns all "bomber jacket" - notice the lack of diversity in results*

```
STANDARD SEARCH RESULTS: "black jacket"

1️⃣ Black Bomber Jacket with Orange lining
   Style: casual | Color: black | Type: bomber jacket
   Score: 0.9234
`
2️⃣ Slim-fit Bomber Jacket with Zipper pocket
   Style: modern | Color: black | Type: bomber jacket
   Score: 0.9156

3️⃣ Lightweight Bomber Jacket with ribbed cuffs
   Style: minimalist | Color: black | Type: bomber jacket
   Score: 0.9089

4️⃣ Quilted Bomber Jacket with padded lining
   Style: classic | Color: black | Type: bomber jacket
   Score: 0.9012

5️⃣ Streamlined bomber jacket with sleek zipper
   Style: contemporary | Color: black | Type: bomber jacket
   Score: 0.8967
```

### MMR Search
MMR gives you diverse styles: a hoodie, a windbreaker, and a blazer.

```python
 # MMR fashion search — balances relevance with style diversity

def fashion_search_mmr(query_text, limit=5, diversity=0.5):
    text_model = TextEmbedding(model_name="Qdrant/clip-ViT-B-32-text")
    query_embedding = list(text_model.embed([query_text]))[0]
    
    results = client.query_points(
        collection_name=collection_name,
        query=models.NearestQuery(
            nearest=query_embedding.tolist(),
            mmr=models.Mmr(
                diversity=diversity,  # 0.0 - relevance; 1.0 - diversity
                candidates_limit=100  # num of candidates to preselect
            )
        ),
        limit=limit,
        with_payload=True
    )
    return results

query_text = "black jacket"

# MMR search with diversity=0.5
mmr_results = fashion_search_mmr(query_text, diversity=0.5)
print("\nMMR FASHION SEARCH: 'black jacket' (diversity=0.5)")
for i, point in enumerate(mmr_results.points, 1):
    payload = point.payload
    print(f"{i}️⃣ Score: {point.score:.4f} | {payload.get('item_description', 'Fashion Item')}")
    print(f"   Style: {payload.get('style', 'N/A')} | Color: {payload.get('color', 'N/A')}")
    print()
```

![MMR Search returns different styles](/blog/mmr-diversity-aware-reranking/mmr-search-results.webp)

*MMR Search returns different styles - bomber jacket, hoodie, windbreaker, and blazer for better diversity*

```
MMR SEARCH RESULTS: "black jacket" (diversity=0.5)

1️⃣ Black Bomber Jacket with Orange lining
   Style: casual | Color: black | Type: bomber jacket
   Score: 0.9234 | Selected: Most relevant

2️⃣ Black zip-up hoodie with drawstring
   Style: relaxed | Color: black | Type: hoodie
   Score: 0.8456 | Selected: Different style (hoodie vs bomber)

3️⃣ Lightweight Bomber jacket with ribbed cuffs
   Style: minimalist | Color: black | Type: bomber jacket
   Score: 0.9089 | Selected: Different aesthetic (minimalist)

4️⃣ Black Windbreaker with high collar
   Style: sporty | Color: black | Type: windbreaker
   Score: 0.8234 | Selected: Different function (windbreaker)

5️⃣ Black tailored blazer with notch lapel
   Style: classic | Color: black | Type: coat
   Score: 0.7891 | Selected: Different formality (blazer)
```

Keep in mind that MMR selects results one by one. The scores you see in Qdrant are representative of the similarity between each item and the original query. The final ranking won't be sorted by score; it will be sorted by the order in which the MMR algorithm selects each item.

---

## Step 5: Advanced Fashion Filtering with MMR
Combine MMR with Qdrant's metadata-filtering for targeted fashion discovery. In this example, we will filter on two categories. We will search for casual outerwear, but filter on casual and sporty. This allows us to diversify the results while making sure that only outdoor and sporty examples show up.

```python
def filtered_fashion_search(query_text, metadata_filter=None, limit=5, diversity=0.4):
    text_model = TextEmbedding(model_name="Qdrant/clip-ViT-B-32-text")
    query_embedding = list(text_model.embed([query_text]))[0]

    # Build filter for metadata fields
    filter_conditions = []
    if metadata_filter:
        for key, value in metadata_filter.items():
            filter_conditions.append(
                models.FieldCondition(
                    key=key,
                    match=models.MatchValue(value=value)
                )
            )

    query_filter = models.Filter(must=filter_conditions) if filter_conditions else None

    results = client.query_points(
        collection_name=collection_name,
        query=models.NearestQuery(
            nearest=query_embedding.tolist(),
            mmr=models.Mmr(
                diversity=diversity,  # 0.0 - relevance; 1.0 - diversity
                candidates_limit=100  # num of candidates to preselect
            )
        ),
        query_filter=query_filter,
        limit=limit,
        with_payload=True
    )
    return results
```

### Practical Example: Filter for women's blouses

```python
# Example: Filter for women's blouses 
results = filtered_fashion_search(
    "professional attire",
    metadata_filter={"gender": "WOMEN", "cloth_type": "Blouses_Shirts"},
    diversity=0.5)

print("FILTERED SEARCH (Women's Professional Attire):")
for point in results.points:
    payload = point.payload
    print(f"Score: {point.score:.4f}")
    print(f"Gender: {payload.get('gender', 'N/A')}")
    print(f"Cloth Type: {payload.get('cloth_type', 'N/A')}")
    print()
```

**Sample Output:**
```
FILTERED SEARCH (Women's Professional Attire):

1️⃣ White Cotton Button-Down Shirt
   Score: 0.8934 | Gender: WOMEN | Type: Blouses_Shirts
   Style: classic professional

2️⃣ Navy Silk Blouse with Bow Tie
   Score: 0.8567 | Gender: WOMEN | Type: Blouses_Shirts
   Style: elegant business

3️⃣ Striped Long-Sleeve Shirt
   Score: 0.8234 | Gender: WOMEN | Type: Blouses_Shirts
   Style: modern casual-professional
```

---

## What We Achieved

1. **Visual embeddings with CLIP** turned fashion images into searchable vectors
2. **MMR reranking** eliminated duplicate-looking recommendations
3. **Diversity control** let us tune exploration vs relevance
4. **Style filtering** combined semantic search with structured metadata for targeted discovery

The result is a fashion search that actually helps users discover new styles instead of showing variations of the same item.

---

## Where to Go Next

This pipeline opens up several possibilities:

- **Visual similarity with style diversity:** Upload a photo and find similar items in different styles
- **Outfit completion:** Given one item, find diverse pieces that create complete outfits
- **Seasonal recommendations:** Balance color preferences with seasonal appropriateness
- **Personal styling AI:** Learn user preferences and recommend diverse items within their taste profile

---

## Try It Yourself

MMR transforms fashion search from "here are similar items" to "here are diverse options you might love." The native Qdrant implementation handles everything under the hood while giving you fine control over the relevance-diversity balance.

Start with diversity=0.5 and then adjust based on whether you want more exploration (lower diversity) or precision (higher diversity).

Try it with your own fashion dataset on [Qdrant Cloud's free tier](https://cloud.qdrant.io/).

If you enjoyed this article, give me a follow on [LinkedIn](https://www.linkedin.com/in/thierrydamiba/) or [Twitter](https://twitter.com/thierrydamiba) to stay up to date with more guides involving vector search and retrieval optimization.
