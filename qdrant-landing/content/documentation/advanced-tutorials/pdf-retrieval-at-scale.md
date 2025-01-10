---
title: Scaling PDF Retrieval with Qdrant
aliases:
  - /documentation/tutorials/pdf-retrieval-at-scale/
short_description: "Optimizing PDF retrieval at scale with Qdrant and Vision Large Language Models (VLLMs) such as ColPali and ColQwen."
description: "Optimizing PDF retrieval at scale with Qdrant and Vision Large Language Models (VLLMs) such as ColPali and ColQwen. Two-stage retrieval with multivector representations mean pooling."
weight: 4
---

# Scaling PDF Retrieval with Qdrant

| Time: 30 min | Level: Intermediate |Output: [GitHub](https://github.com/qdrant/examples/blob/master/pdf-retrieval-at-scale/ColPali_ColQwen_Tutorial.ipynb)|[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/pdf-retrieval-at-scale/ColPali_ColQwen_Tutorial.ipynb)   |
| --- | ----------- | ----------- | ----------- |

Efficient PDF documents retrieval is a common requirement in tasks like **(agentic) retrieval-augmented generation (RAG)** and many other search-based applications. At the same time, setting up PDF documents retrieval is rarely possible without additional challenges. 

Many traditional PDF retrieval solutions rely on **optical character recognition (OCR)** together with use case-specific heuristics to handle visually complex elements like tables, images and charts. These algorithms are often non-transferable -- even within the same domain -- with their task-customized parsing and chunking strategies, labor-intensive, prone to errors, and difficult to scale.

Recent advancements in **Vision Large Language Models (VLLMs)**, such as [**ColPali**](https://huggingface.co/blog/manu/colpali) and its successor [**ColQwen**](https://huggingface.co/vidore/colqwen2-v0.1), started the transformation of the PDF retrieval. These multimodal models work directly with PDF pages as inputs, no pre-processing required. Anything that can be converted into an **image** (think of PDFs as screenshots of document pages) can be effectively processed by these models. Being far simpler in use, VLLMs achieve state-of-the-art performance in PDF retrieval benchmarks like the [Visual Document Retrieval (ViDoRe) Benchmark](https://huggingface.co/spaces/vidore/vidore-leaderboard).

### How VLLMs Work for PDF Retrieval

VLLMs like **ColPali** and **ColQwen** generate **multivector representations** for each PDF page; the representations are stored and indexed in a vector database. During the retrieval process, models dynamically create multivector representations for (textual) user queries, and precise retrieval -- matching between PDF pages and queries -- is achieved through [late-interaction mechanism](https://qdrant.tech/blog/qdrant-colpali/#how-colpali-works-under-the-hood).

<aside role="status"> Qdrant supports <a href="https://qdrant.tech/documentation/concepts/vectors/#multivectors">multivector representations</a>, making it well-suited for using embedding models such as ColPali, ColQwen, or <a href="https://qdrant.tech/documentation/fastembed/fastembed-colbert/">ColBERT</a></aside>

### Challenges of Scaling VLLMs

The heavy multivector representations produced by VLLMs make PDF retrieval at scale computationally intensive. These models are inefficient for large-scale PDF retrieval tasks if used without optimization.

### Math Behind the Scaling

**ColPali** generates over **1,000 vectors per PDF page**, and its successor, **ColQwen**, generates up to **768 vectors**, dynamically based on the image size. Typically, **ColQwen** produces **~700 vectors per page**.

To understand the impact, consider the construction of an [**HNSW**](https://qdrant.tech/articles/what-is-a-vector-database/#1-indexing-hnsw-index-and-sending-data-to-qdrant), a common indexing algorithm for vector databases. Although HNSW is built with optimization over a number of comparisons, let’s assume a worst-case scenario where every vector is compared to every other vector to construct the index.

Example:
- **Number of pages:** 20,000
- **Vectors per page:** ~700 (ColQwen) or ~1,000 (ColPali)
- **Vector dimensions:** 128

The number of comparisons required to construct the index for **ColQwen** is:

$$
700 \times 700 \times 128 \times 20,000 = 1.25 \ \text{ trillion comparisons!}
$$

For **ColPali**, this number doubles. This number leads to:
- **Slow Index Construction:** Building or updating the index takes an immense amount of time.
- **Inefficient Retrieval:** Even with a successfully constructed index, retrieval times are slow.

### Our Solution

We recommend reducing the number of vectors in a PDF page representation for the **first-stage retrieval**. After the first stage retrieval with a reduced amount of vectors, we propose to **rerank** retrieved subset with the original uncompressed representation.

The reduction of vectors can be achieved by applying a **mean pooling operation** to the multivector VLLM-generated outputs. Mean pooling averages the values across all vectors within a selected subgroup, condensing multiple vectors into a single representative vector. If done right, it allows the preservation of important information from the original page while significantly reducing the number of vectors.

VLLMs generate vectors corresponding to patches that represent different portions of a PDF page. These patches can be grouped in columns and rows of a PDF page.

For example:
- ColPali divides PDF page into **1,024 patches**.
- Applying mean pooling by rows (or columns) of this patch matrix reduces the page representation to just **32 vectors**.

![ColPali patching of a PDF page](/documentation/tutorials/pdf-retrieval-at-scale/pooling-by-rows.png)

We tested this approach with the ColPali model, mean pooling its multivectors by PDF page rows. The results showed:
- **13x speedup in retrieval time.**
- **Retrieval quality comparable to the original model**

For details of this experiment refer to our ["ColPali retrieval optimization demo" gitHub repository](https://github.com/qdrant/demo-colpali-optimized), [ColPali optimization blog post](https://qdrant.tech/blog/colpali-qdrant-optimization/) or [webinar "PDF Retrieval at Scale"](https://www.youtube.com/watch?v=_h6SN1WwnLs)

### Flexibility in Application

1. **Pooling by rows or columns:** While our experiments tested pooling by rows, pooling by columns may be more effective for certain datasets or use cases. Both approaches are included in this tutorial.
   
2. **Applicability to ColQwen:** Although our experiments were conducted on ColPali, we believe the same approach applies to ColQwen. This tutorial includes instructions for optimizing retrieval with both models.

### Goal of This Tutorial

In this tutorial, we will demonstrate a scalable approach to PDF retrieval using **Qdrant** and **ColPali** & **ColQwen2** VLLMs.
The presented approach is **highly recommended** to avoid the common pitfalls of long indexing times and slow retrieval speeds.

In the following sections, we will demonstrate an optimized retrieval algorithm born out of our successful experimentation:

**First-Stage Retrieval with Mean-Pooled Vectors:**
   - Construct an HNSW index using **only mean-pooled vectors**.
   - Use them for the first-stage retrieval.

**Reranking with Original Model Multivectors:**
   - Use the original multivectors from ColPali or ColQwen2 **to rerank** the results retrieved in the first stage.

### Setup
Install & import required libraries

```python
from colpali_engine.models import ColPali, ColPaliProcessor, ColQwen2, ColQwen2Processor
from datasets import load_dataset 
from qdrant_client import QdrantClient
from qdrant_client.http import models
import torch
from tqdm import tqdm
import uuid
```

To run these experiments, we’re using a **Qdrant cluster**. If you’re just getting started, you can set up a **free-tier cluster** for testing and exploration. Follow the instructions in the documentation ["How to Create a Free-Tier Qdrant Cluster"](https://qdrant.tech/documentation/cloud/create-cluster/?q=free+tier#free-clusters)

```python
client = QdrantClient(
    url=<YOUR CLUSTER URL>,
    api_key=<YOUR API KEY>
)
```

Download **ColQwen** and **ColPali** models along with their input processors. Make sure to select the backend that suits your setup.

```python
colqwen_model = ColQwen2.from_pretrained(
        "vidore/colqwen2-v0.1",
        torch_dtype=torch.bfloat16,
        device_map="mps", # Use "cuda:0" for GPU, "cpu" for CPU, or "mps" for Apple Silicon
    ).eval()

colqwen_processor = ColQwen2Processor.from_pretrained("vidore/colqwen2-v0.1")

colpali_model = ColPali.from_pretrained(
        "vidore/colpali-v1.3",
        torch_dtype=torch.bfloat16,
        device_map="mps",  # Use "cuda:0" for GPU, "cpu" for CPU, or "mps" for Apple Silicon
    ).eval()

colpali_processor = ColPaliProcessor.from_pretrained("vidore/colpali-v1.3")
```

### Create Qdrant Collections

We will create two separate collections: one for the **ColQwen** model and one for the **ColPali** model. Each collection will include **mean pooled** by rows and columns representations of a PDF page.

<aside role="status"> For the original multivectors generated by the models, we will disable HNSW index construction </aside>

```python
for collection_name in ["colpali_tutorial", "colqwen_tutorial"]:
    client.create_collection(
        collection_name=collection_name,
        vectors_config={
            "original": 
                models.VectorParams( #switch off HNSW
                      size=128,
                      distance=models.Distance.COSINE,
                      multivector_config=models.MultiVectorConfig(
                          comparator=models.MultiVectorComparator.MAX_SIM
                      ),
                      hnsw_config=models.HnswConfigDiff(
                          m=0 #switching off HNSW
                      )
                ),
            "mean_pooling_columns": models.VectorParams(
                    size=128,
                    distance=models.Distance.COSINE,
                    multivector_config=models.MultiVectorConfig(
                        comparator=models.MultiVectorComparator.MAX_SIM
                    )
                ),
            "mean_pooling_rows": models.VectorParams(
                    size=128,
                    distance=models.Distance.COSINE,
                    multivector_config=models.MultiVectorConfig(
                        comparator=models.MultiVectorComparator.MAX_SIM
                    )
                )
        }
    )
```
### Choose a dataset

We’ll use the **UFO Dataset** by Daniel van Strien for this tutorial. It’s available on Hugging Face; you can download it directly from there. 

```python
ufo_dataset = "davanstrien/ufo-ColPali"
dataset = load_dataset(ufo_dataset, split="train")
```

### Embedding and Mean Pooling

We'll use a function that generates multivector representations and their mean pooled versions of each PDF page (aka image) in batches.
For complete understanding, it's important to consider the following specifics of **ColPali** and **ColQwen**:

**ColPali:**
In theory, ColPali is designed to generate 1,024 vectors per PDF page, but in practice, it produces 1,030 vectors. This discrepancy is due to ColPali's pre-processor, which appends the text `<bos>Describe the image.` to each input. This additional text generates an extra 6 multivectors.

**ColQwen:**
ColQwen dynamically determines the number of patches in "rows and columns" of a PDF page based on its size. Consequently, the number of multivectors can vary between inputs. ColQwen pre-processor prepends `<|im_start|>user<|vision_start|>` and appends `<|vision_end|>Describe the image.<|im_end|><|endoftext|>`.

We choose to **preserve these additional vectors**. Our **pooling** operation compresses the multivectors representing **the image tokens** based on the number of rows and columns determined by the model (static 32x32 for ColPali, dynamic XxY for ColQwen). Function retains and integrates the additional multivectors produced by the model back to pooled representations.

```python
def get_patches(image_size, model_processor, model, model_name):
    if model_name == "colPali":
        return model_processor.get_n_patches(image_size, 
                                             patch_size=model.patch_size)
    elif model_name == "colQwen":
        return model_processor.get_n_patches(image_size, 
                                             patch_size=model.patch_size,
                                             spatial_merge_size=model.spatial_merge_size)
    return None, None

def embed_and_mean_pool_batch(image_batch, model_processor, model, model_name):
    #embed
    with torch.no_grad():
        processed_images = model_processor.process_images(image_batch).to(model.device) 
        image_embeddings = model(**processed_images)

    image_embeddings_batch = image_embeddings.cpu().float().numpy().tolist()
    
    #mean pooling
    pooled_by_rows_batch = []
    pooled_by_columns_batch = []
    
    
    for image_embedding, tokenized_image, image in zip(image_embeddings, 
                                                       processed_images.input_ids, 
                                                       image_batch):
        x_patches, y_patches = get_patches(image.size, model_processor, model, model_name)
        #print(f"{model_name} model divided this PDF page in {x_patches} rows and {y_patches} columns")

        image_tokens_mask = (tokenized_image == model_processor.image_token_id)
        
        image_tokens = image_embedding[image_tokens_mask].view(x_patches, y_patches, model.dim)
        pooled_by_rows = torch.mean(image_tokens, dim=0)
        pooled_by_columns = torch.mean(image_tokens, dim=1)

        image_token_idxs = torch.nonzero(image_tokens_mask.int(), as_tuple=False)
        first_image_token_idx = image_token_idxs[0].cpu().item()
        last_image_token_idx = image_token_idxs[-1].cpu().item()
        
        prefix_tokens = image_embedding[:first_image_token_idx]
        postfix_tokens = image_embedding[last_image_token_idx + 1:]
        
        #print(f"There are {len(prefix_tokens)} prefix tokens and {len(postfix_tokens)} in a {model_name} PDF page embedding")

        #adding back prefix and postfix special tokens
        pooled_by_rows = torch.cat((prefix_tokens, pooled_by_rows, postfix_tokens), dim=0).cpu().float().numpy().tolist()
        pooled_by_columns = torch.cat((prefix_tokens, pooled_by_columns, postfix_tokens), dim=0).cpu().float().numpy().tolist()
        
        pooled_by_rows_batch.append(pooled_by_rows)
        pooled_by_columns_batch.append(pooled_by_columns)


    return image_embeddings_batch, pooled_by_rows_batch, pooled_by_columns_batch
```
### Batch uploading to Qdrant
Below is the function to batch upload multivectors into the collections created earlier to Qdrant.
```python
def upload_batch(original_batch, pooled_by_rows_batch, pooled_by_columns_batch, payload_batch, collection_name):
    try:
        client.upsert(
            collection_name=collection_name,
            points=models.Batch( #batch upsert
                ids=[str(uuid.uuid4()) for i in range(len(original_batch))],
                payloads=payload_batch,
                vectors={
                    "mean_pooling_columns": pooled_by_columns_batch,
                    "original": original_batch,
                    "mean_pooling_rows": pooled_by_rows_batch
                    }
            )
        )
    except Exception as e:
        print(f"Error during upsert: {e}")
```
Now you can test the uploading process of the **UFO dataset**, pre-processed according to our approach by `embed_and_mean_pool_batch` function.

### For ColPali

```python
batch_size = 1 #based on available compute
dataset_source = ufo_dataset
collection_name = "colpali_tutorial"

with tqdm(total=len(dataset), desc=f"Uploading progress of \"{dataset_source}\" dataset to \"{collection_name}\" collection") as pbar:
    for i in range(0, len(dataset), batch_size):
        batch = dataset[i : i + batch_size]
        image_batch = batch["image"]
        current_batch_size = len(image_batch)
        try:
            original_batch, pooled_by_rows_batch, pooled_by_columns_batch = embed_and_mean_pool_batch(image_batch, 
                                                                                          colpali_processor, 
                                                                                          colpali_model, 
                                                                                          "colPali")
        except Exception as e:
            print(f"Error during embed: {e}")
            continue
        try:
            upload_batch(
                original_batch,
                pooled_by_rows_batch,
                pooled_by_columns_batch,
                [
                    {
                        "source": dataset_source, 
                        "index": j
                    }
                    for j in range(i, i + current_batch_size)
                ],
                collection_name
            )
        except Exception as e:
            print(f"Error during upsert: {e}")
            continue
        # Update the progress bar
        pbar.update(current_batch_size)
print("Uploading complete!")
```


### For ColQwen2
```python
batch_size = 1 #based on available compute
dataset_source = ufo_dataset
collection_name = "colqwen_tutorial"

with tqdm(total=len(dataset), desc=f"Uploading progress of \"{dataset_source}\" dataset to \"{collection_name}\" collection") as pbar:
    for i in range(0, len(dataset), batch_size):
        batch = dataset[i : i + batch_size]
        image_batch = batch["image"]
        current_batch_size = len(image_batch)
        try:
            original_batch, pooled_by_rows_batch, pooled_by_columns_batch = embed_and_mean_pool_batch(image_batch, 
                                                                                          colqwen_processor, 
                                                                                          colqwen_model, 
                                                                                          "colQwen")
        except Exception as e:
            print(f"Error during embed: {e}")
            continue
        try:
            upload_batch(
                original_batch,
                pooled_by_rows_batch,
                pooled_by_columns_batch,
                [
                    {
                        "source": dataset_source, 
                        "index": j
                    }
                    for j in range(i, i + current_batch_size)
                ],
                collection_name
            )
        except Exception as e:
            print(f"Error during upsert: {e}")
            continue
        # Update the progress bar
        pbar.update(current_batch_size)
print("Uploading complete!")
```
### Querying PDFs

After indexing PDF documents, we can move on to querying them using our two-stage retrieval approach.

```python
def batch_embed_query(query_batch, model_processor, model):
    with torch.no_grad():
        processed_queries = model_processor.process_queries(query_batch).to(model.device)
        query_embeddings_batch = model(**processed_queries)
    return query_embeddings_batch.cpu().float().numpy()
```
Let's select some random batch of queries from the "UFO dataset" for testing.
```python
import random

query_batch = random.sample(dataset['specific_detail_query'], 4)
colpali_query_batch = batch_embed_query(query_batch, colpali_processor, colpali_model)
colqwen_query_batch = batch_embed_query(query_batch, colqwen_processor, colqwen_model)

print(f"ColPali embedded query \"{query_batch[0]}\" with {len(colpali_query_batch[0])} multivectors of dim {len(colpali_query_batch[0][0])}")
print(f"ColQwen embedded query \"{query_batch[0]}\" with {len(colqwen_query_batch[0])} multivectors of dim {len(colqwen_query_batch[0][0])}")
```
For example, our random batch had this query within:
```bash
ColPali embedded query "Lee Harvey Oswald's involvement in the JFK assassination" with 27 multivectors of dim 128
ColQwen embedded query "Lee Harvey Oswald's involvement in the JFK assassination" with 25 multivectors of dim 128
```
Now let's design a function for the two-stage retrieval with multivectors produced by VLLMs:

- **Step 1:** Prefetch results using a compressed multivector representation & HNSW index.
- **Step 2:** Re-rank the prefetched results using the original multivector representation.

This function supports batch querying.
```python
def reranking_search_batch(query_batch,
                           named_vector_prefetch,
                           collection_name,
                           search_limit=20, #adjust based on your requirements
                           prefetch_limit=200, #adjust based on your requirements
                           timeout=10):
    search_queries = [
      models.QueryRequest(
          query=query,
          prefetch=models.Prefetch(
              query=query,
              limit=prefetch_limit,
              using=named_vector_prefetch
          ),
          params=models.SearchParams(
              exact=True #no HNSW needed
          ),
          limit=search_limit,
          with_payload=True,
          with_vector=False,
          using="original"
      ) for query in query_batch
    ]
    return client.query_batch_points(
        collection_name=collection_name,
        requests=search_queries,
        timeout=timeout
    )
```
Let's query our collections using mean pooled by columns representations for the first stage of retrieval.
```python
batch_answer_colpali = reranking_search_batch(colpali_query_batch, "mean_pooling_columns", "colpali_tutorial")
batch_answer_colqwen = reranking_search_batch(colqwen_query_batch, "mean_pooling_columns", "colqwen_tutorial")
```
And check the top retrieved result to our query *"Lee Harvey Oswald's involvement in the JFK assassination"*.

### Results, ColPali
```python
dataset[batch_answer_colpali[0].points[0].payload['index']]['image']
```
![Results, ColPali](/documentation/tutorials/pdf-retrieval-at-scale/result-VLLMs.png)

### Results, ColQwen2
```python
dataset[batch_answer_colqwen[0].points[0].payload['index']]['image']
```

![Results, ColQwen2](/documentation/tutorials/pdf-retrieval-at-scale/result-VLLMs.png)

### Conclusion

In this tutorial, we demonstrated an optimized approach using **Qdrant for PDF retrieval at scale** with VLLMs producing **heavy multivector representations** like **ColPali** and **ColQwen2**.

Without such optimization, the performance of retrieval systems can degrade severely, both in terms of indexing time and query latency, especially as the dataset size grows.

We **strongly recommend** implementing this approach in your workflows to ensure efficient and scalable PDF retrieval. Neglecting to optimize the retrieval process could result in unacceptably slow performance, hindering the usability of your system.

Start scaling your PDF retrieval today!
