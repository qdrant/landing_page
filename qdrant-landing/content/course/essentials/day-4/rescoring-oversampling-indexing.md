---
title: Accuracy Recovery with Rescoring
weight: 2
---

{{< date >}} Day 4 {{< /date >}}

# Accuracy Recovery with Rescoring

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

<br/>
When we use quantization methods like Scalar, Binary, or Product Quantization, we're compressing our vectors to save memory and improve performance. However, this compression can slightly reduce the accuracy of our similarity searches because the quantized vectors are approximations of the original data. To mitigate this loss of accuracy, you can use oversampling and rescoring, which help improve the accuracy of the final search results.

So let's say we are performing a search in a collection with Binary Quantization. Qdrant retrieves the top candidates using the quantized vectors based on their similarity to the query vector, as determined by the quantized data. This step is fast because we're using the quantized vectors.

## Oversampling

Since some relevant matches could be missed in the initial search, to compensate for that we will apply oversampling. Which means that you will retrieve more candidates, increasing the chances that the most relevant vectors make it into the final results.

For example, if your desired number of results (limit) is 4 and you set an oversampling factor of 2, Qdrant will retrieve 8 candidates (4 × 2). More candidates mean a better chance of obtaining high-quality top-K results.

## Rescoring

After oversampling to gather more potential matches, each candidate is re-evaluated based on additional criteria to ensure higher accuracy and relevance to the query. The rescoring process maps the quantized vectors to their corresponding original vectors, allowing you to consider factors like context, metadata, or additional relevance that wasn't included in the initial search, leading to more accurate results.

During rescoring, one of the lower-ranked candidates from oversampling might turn out to be a better match than some of the original top-K candidates. Even though rescoring uses the original, larger vectors, the process remains much faster because only a very small number of vectors are read.

## Reranking

With the new similarity scores from rescoring, reranking is where the final top-K candidates are determined based on the updated similarity scores.

For example, in our case with a limit of 4, a candidate that ranked 6th in the initial quantized search might improve its score after rescoring because the original vectors capture more context or metadata. As a result, this candidate could move into the final top 4 after reranking, replacing a less relevant option from the initial search.

## Implementation

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://your-cluster-url.cloud.qdrant.io",
    api_key="your-api-key",
)

response = client.query_points(
    collection_name="quantized_collection",
    query=[0.12] * 1536,
    limit=10,
    search_params=models.SearchParams(
        hnsw_ef=128,
        quantization=models.QuantizationSearchParams(
            ignore=False,  # Use quantization for initial search
            rescore=True,   # Enable exact rescoring
            oversampling=3.0,  # Retrieve 3x candidates for rescoring
        ),
    ),
    with_payload=True,
)
```

If quantization is impacting performance in an application that requires high accuracy, combining oversampling with rescoring is a great choice. However, if you need faster searches and can tolerate some loss in accuracy, you might choose to use oversampling without rescoring, or adjust the oversampling factor to a lower value. 