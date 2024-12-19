---
google_colab_link: https://githubtocolab.com/k/blob/refactor/tutorial-levels/301-advanced/colpali-and-binary-quantization/colpali_demo_binary.ipynb
reading_time_min: 6
title: 'ColPali and Qdrant: Document Retrieval with Vision Language Models and Binary Quantization'
---

<a href="https://colab.research.google.com/github/sabrinaaquino/colpali-qdrant-demo/blob/main/colpali_demo_binary.ipynb" target="_parent"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>

# ColPali and Qdrant: Document Retrieval with Vision Language Models and Binary Quantization

It’s no secret that even the most modern document retrieval systems have a hard time handling visually rich documents like PDFs, containing tables, images, and complex layouts.

ColPali introduces a multimodal retrieval approach that uses Vision Language Models (VLMs) instead of the traditional OCR and text-based extraction. By processing document images directly, it creates multi-vector embeddings from both the visual and textual content, capturing the document's structure and context more effectively. This method outperforms traditional techniques, as demonstrated by the Visual Document Retrieval Benchmark (ViDoRe) introduced in the paper.

## Standard Retrieval vs. ColPali

The standard approach starts by running OCR to extract the text from a document. Once the text is extracted, a layout detection model interprets the structure, which is followed by chunking the text into smaller sections for embedding. This method works adequately for documents where the text content is the primary focus.

![Standard Retrieval architecture](documentation/colpali_demo_binary/image-278.png)

*Standard Retrieval architecture. Image from the ColPali paper [1]*

Rather than relying on OCR, ColPali processes the entire document as an image using a Vision Encoder. It creates multi-vector embeddings that capture both the textual content and the visual structure of the document which are then passed through a Language Model (LLM), which integrates the information into a representation that retains both text and visual features.

![Colpali architecture](documentation/colpali_demo_binary/image-279.png)

*Colpali architecture. Image from the ColPali paper [1]*

The retrieval quality of ColPali is significantly higher, with an NDCG@5 score of 0.81. This comes from a benchmark created by the authors to measure how well systems handle visually rich documents. ColPali's score shows that it does a better job of capturing both text and visual elements compared to traditional methods.

| Feature                     | Standard Retrieval               | ColPali                                            |
| --------------------------- | -------------------------------- | -------------------------------------------------- |
| **Document Processing**     | OCR and text-based extraction    | Vision-based processing using a Vision Encoder     |
| **Handling Visual Content** | Limited (depends on captioning)  | Fully integrated (handles images, tables, layouts) |
| **Embedding Creation**      | Single dense embedding from text | Multi-vector embeddings from both text and visuals |
| **Speed (Offline)**         | 7.22 seconds per page            | 0.39 seconds per page                              |
| **Speed (Online)**          | 22 milliseconds per query        | 30 milliseconds per query                          |
| **Retrieval Quality**       | NDCG@5 score of 0.66             | NDCG@5 score of 0.81                               |

## Why ColPali’s Results Are So Good

One of the standout features of ColPali is its explainability. Because it uses vision transformers, it can 'understand' which parts of a document were most relevant to a specific query. For example, if you’re searching for the page in a report that mentions a specific date, it can highlight the patches of the document where that information is found. This level of transparency is incredibly useful for understanding how the model works and verifying the accuracy of its results.

Let's take a look at this chart bellow that shows the 2019 Average Hourly Generation by Fuel Type from the [original ColPali paper](https://arxiv.org/abs/2407.01449):

<img src="https://i.ibb.co/F85HmBg/image-280.png" alt="2019 Average Hourly Generation by Fuel Type" width="600"/>

*Image from the ColPali paper [1]*

In the figure below, also presented in the ColPali paper, we can see how ColPali identifies the most relevant patches of the document in response to the query "Which hour of the day had the highest overall electricity generation in 2019?" and match the query terms like “hour” and “highest generation” to the relevant sections of the document.

<img src="https://i.ibb.co/9wwRt7r/image-277.png" alt="How ColPali identifies the most relevant document image patches" width="600"/>

*Image from the ColPali paper [1]*

The highlighted zones correspond to the areas of the document that have information relevant to the query. ColPali computes a query-to-page matching score based on these highlighted regions, allowing it to retrieve the most pertinent documents from a large pre-indexed corpus.

# Getting Started: Setting Up ColPali and Qdrant

This tutorial takes inspiration from [Daniel van Strien’s guide](https://danielvanstrien.xyz/posts/post-with-code/colpali-qdrant/2024-10-02_using_colpali_with_qdrant.html) [2] on using ColPali and Qdrant for document retrieval, working with a UFO dataset that includes tables, images, and text.

We’re experimenting with **Binary Quantization** and using oversampling and rescoring to fine-tune the results.

### Step 1: Install Required Libraries

Before diving into the code, let’s install and import the libraries we're gonna be using:

```python
!pip install uv
!uv pip install --system colpali_engine>=0.3.1 datasets huggingface_hub[hf_transfer] qdrant-client transformers>=4.45.0 stamina rich
```

```
Collecting uv
  Downloading uv-0.4.26-py3-none-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (11 kB)
Downloading uv-0.4.26-py3-none-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (13.7 MB)
[2K   [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m13.7/13.7 MB[0m [31m105.6 MB/s[0m eta [36m0:00:00[0m
[?25hInstalling collected packages: uv
Successfully installed uv-0.4.26
[2mUsing Python 3.10.12 environment at /usr[0m
[2K[2mResolved [1m73 packages[0m [2min 3.57s[0m[0m
[2K[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
[2K[1A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
[2K[2A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
httpx      ------------------------------     0 B/74.60 KiB
[2K[3A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
h11        ------------------------------     0 B/56.89 KiB
httpx      ------------------------------     0 B/74.60 KiB
[2K[4A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
h2         ------------------------------     0 B/56.14 KiB
h11        ------------------------------     0 B/56.89 KiB
httpx      ------------------------------     0 B/74.60 KiB
[2K[5A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hpack      ------------------------------     0 B/31.85 KiB
h2         ------------------------------     0 B/56.14 KiB
h11        ------------------------------     0 B/56.89 KiB
httpx      ------------------------------     0 B/74.60 KiB
[2K[6A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
portalocker ------------------------------     0 B/17.99 KiB
hpack      ------------------------------     0 B/31.85 KiB
h2         ------------------------------     0 B/56.14 KiB
h11        ------------------------------     0 B/56.89 KiB
httpx      ------------------------------     0 B/74.60 KiB
[2K[7A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------     0 B/12.10 KiB
portalocker ------------------------------     0 B/17.99 KiB
hpack      ------------------------------     0 B/31.85 KiB
h2         ------------------------------     0 B/56.14 KiB
h11        ------------------------------     0 B/56.89 KiB
httpx      ------------------------------     0 B/74.60 KiB
[2K[8A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------     0 B/12.10 KiB
portalocker ------------------------------     0 B/17.99 KiB
hpack      ------------------------------     0 B/31.85 KiB
h2         ------------------------------     0 B/56.14 KiB
h11        ------------------------------     0 B/56.89 KiB
httpx      ------------------------------     0 B/74.60 KiB
httpcore   ------------------------------     0 B/76.18 KiB
[2K[9A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------     0 B/12.10 KiB
portalocker ------------------------------     0 B/17.99 KiB
hpack      ------------------------------     0 B/31.85 KiB
h2         ------------------------------     0 B/56.14 KiB
h11        ------------------------------     0 B/56.89 KiB
httpx      ------------------------------ 14.92 KiB/74.60 KiB
httpcore   ------------------------------     0 B/76.18 KiB
[2K[9A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------     0 B/12.10 KiB
portalocker ------------------------------     0 B/17.99 KiB
hpack      ------------------------------     0 B/31.85 KiB
h2         ------------------------------     0 B/56.14 KiB
h11        ------------------------------     0 B/56.89 KiB
httpx      ------------------------------ 14.92 KiB/74.60 KiB
httpcore   ------------------------------ 14.88 KiB/76.18 KiB
[2K[9A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------     0 B/12.10 KiB
portalocker ------------------------------     0 B/17.99 KiB
hpack      ------------------------------     0 B/31.85 KiB
h2         ------------------------------     0 B/56.14 KiB
h11        ------------------------------ 14.84 KiB/56.89 KiB
httpx      ------------------------------ 14.92 KiB/74.60 KiB
httpcore   ------------------------------ 14.88 KiB/76.18 KiB
[2K[9A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------     0 B/12.10 KiB
portalocker ------------------------------     0 B/17.99 KiB
hpack      ------------------------------     0 B/31.85 KiB
h2         ------------------------------ 14.84 KiB/56.14 KiB
h11        ------------------------------ 14.84 KiB/56.89 KiB
httpx      ------------------------------ 14.92 KiB/74.60 KiB
httpcore   ------------------------------ 14.88 KiB/76.18 KiB
[2K[9A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------     0 B/12.10 KiB
portalocker ------------------------------     0 B/17.99 KiB
hpack      ------------------------------ 14.84 KiB/31.85 KiB
h2         ------------------------------ 14.84 KiB/56.14 KiB
h11        ------------------------------ 14.84 KiB/56.89 KiB
httpx      ------------------------------ 14.92 KiB/74.60 KiB
httpcore   ------------------------------ 14.88 KiB/76.18 KiB
[2K[9A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------     0 B/12.10 KiB
portalocker ------------------------------ 14.91 KiB/17.99 KiB
hpack      ------------------------------ 14.84 KiB/31.85 KiB
h2         ------------------------------ 14.84 KiB/56.14 KiB
h11        ------------------------------ 14.84 KiB/56.89 KiB
httpx      ------------------------------ 14.92 KiB/74.60 KiB
httpcore   ------------------------------ 14.88 KiB/76.18 KiB
[2K[9A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------ 12.10 KiB/12.10 KiB
portalocker ------------------------------ 14.91 KiB/17.99 KiB
hpack      ------------------------------ 14.84 KiB/31.85 KiB
h2         ------------------------------ 14.84 KiB/56.14 KiB
h11        ------------------------------ 14.84 KiB/56.89 KiB
httpx      ------------------------------ 14.92 KiB/74.60 KiB
httpcore   ------------------------------ 14.88 KiB/76.18 KiB
[2K[9A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hyperframe ------------------------------ 12.10 KiB/12.10 KiB
stamina    ------------------------------     0 B/16.06 KiB
portalocker ------------------------------ 14.91 KiB/17.99 KiB
hpack      ------------------------------ 14.84 KiB/31.85 KiB
h2         ------------------------------ 14.84 KiB/56.14 KiB
h11        ------------------------------ 14.84 KiB/56.89 KiB
httpx      ------------------------------ 14.92 KiB/74.60 KiB
httpcore   ------------------------------ 14.88 KiB/76.18 KiB
[2K[10A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
stamina    ------------------------------     0 B/16.06 KiB
portalocker ------------------------------ 14.91 KiB/17.99 KiB
hpack      ------------------------------ 14.84 KiB/31.85 KiB
h2         ------------------------------ 14.84 KiB/56.14 KiB
h11        ------------------------------ 14.84 KiB/56.89 KiB
httpx      ------------------------------ 14.92 KiB/74.60 KiB
httpcore   ------------------------------ 14.88 KiB/76.18 KiB
dill       ------------------------------ 16.00 KiB/113.53 KiB
multiprocess ------------------------------     0 B/131.66 KiB
xxhash     ------------------------------     0 B/189.60 KiB
peft       ------------------------------     0 B/245.69 KiB
qdrant-client ------------------------------     0 B/260.15 KiB
protobuf   ------------------------------     0 B/309.20 KiB
datasets   ------------------------------     0 B/461.60 KiB
[2K[16A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
stamina    ------------------------------ 14.92 KiB/16.06 KiB
hpack      ------------------------------ 30.84 KiB/31.85 KiB
colpali-engine ------------------------------     0 B/36.81 KiB
h2         ------------------------------ 30.84 KiB/56.14 KiB
h11        ------------------------------ 30.84 KiB/56.89 KiB
httpx      ------------------------------ 18.89 KiB/74.60 KiB
httpcore   ------------------------------ 30.88 KiB/76.18 KiB
dill       ------------------------------ 32.00 KiB/113.53 KiB
multiprocess ------------------------------ 14.88 KiB/131.66 KiB
xxhash     ------------------------------ 14.88 KiB/189.60 KiB
peft       ------------------------------ 14.92 KiB/245.69 KiB
qdrant-client ------------------------------ 14.91 KiB/260.15 KiB
protobuf   ------------------------------ 14.88 KiB/309.20 KiB
datasets   ------------------------------ 14.92 KiB/461.60 KiB
grpcio-tools ------------------------------     0 B/2.24 MiB
tokenizers ------------------------------ 14.91 KiB/2.85 MiB
hf-transfer ------------------------------ 12.11 KiB/3.40 MiB
[2K[19A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hpack      ------------------------------ 30.84 KiB/31.85 KiB
colpali-engine ------------------------------     0 B/36.81 KiB
h2         ------------------------------ 30.84 KiB/56.14 KiB
h11        ------------------------------ 30.84 KiB/56.89 KiB
httpx      ------------------------------ 34.89 KiB/74.60 KiB
httpcore   ------------------------------ 30.88 KiB/76.18 KiB
dill       ------------------------------ 32.00 KiB/113.53 KiB
multiprocess ------------------------------ 14.88 KiB/131.66 KiB
xxhash     ------------------------------ 14.88 KiB/189.60 KiB
peft       ------------------------------ 14.92 KiB/245.69 KiB
qdrant-client ------------------------------ 14.91 KiB/260.15 KiB
protobuf   ------------------------------ 14.88 KiB/309.20 KiB
datasets   ------------------------------ 14.92 KiB/461.60 KiB
grpcio-tools ------------------------------     0 B/2.24 MiB
tokenizers ------------------------------ 14.91 KiB/2.85 MiB
hf-transfer ------------------------------ 12.11 KiB/3.40 MiB
[2K[18A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
hpack      ------------------------------ 30.84 KiB/31.85 KiB
colpali-engine ------------------------------     0 B/36.81 KiB
h2         ------------------------------ 30.84 KiB/56.14 KiB
h11        ------------------------------ 30.84 KiB/56.89 KiB
httpx      ------------------------------ 34.89 KiB/74.60 KiB
httpcore   ------------------------------ 30.88 KiB/76.18 KiB
dill       ------------------------------ 32.00 KiB/113.53 KiB
multiprocess ------------------------------ 30.88 KiB/131.66 KiB
xxhash     ------------------------------ 30.88 KiB/189.60 KiB
peft       ------------------------------ 14.92 KiB/245.69 KiB
qdrant-client ------------------------------ 30.91 KiB/260.15 KiB
protobuf   ------------------------------ 30.88 KiB/309.20 KiB
datasets   ------------------------------ 30.92 KiB/461.60 KiB
grpcio-tools ------------------------------     0 B/2.24 MiB
tokenizers ------------------------------ 14.91 KiB/2.85 MiB
hf-transfer ------------------------------ 12.11 KiB/3.40 MiB
[2K[18A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 16.00 KiB/36.81 KiB
h2         ------------------------------ 46.84 KiB/56.14 KiB
h11        ------------------------------ 46.84 KiB/56.89 KiB
httpx      ------------------------------ 34.89 KiB/74.60 KiB
httpcore   ------------------------------ 45.63 KiB/76.18 KiB
dill       ------------------------------ 48.00 KiB/113.53 KiB
multiprocess ------------------------------ 30.88 KiB/131.66 KiB
xxhash     ------------------------------ 30.88 KiB/189.60 KiB
peft       ------------------------------ 30.92 KiB/245.69 KiB
qdrant-client ------------------------------ 30.91 KiB/260.15 KiB
protobuf   ------------------------------ 30.88 KiB/309.20 KiB
datasets   ------------------------------ 30.92 KiB/461.60 KiB
grpcio-tools ------------------------------ 8.74 KiB/2.24 MiB
tokenizers ------------------------------ 14.91 KiB/2.85 MiB
hf-transfer ------------------------------ 12.11 KiB/3.40 MiB
[2K[17A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 16.00 KiB/36.81 KiB
h11        ------------------------------ 56.89 KiB/56.89 KiB
httpx      ------------------------------ 66.89 KiB/74.60 KiB
httpcore   ------------------------------ 76.18 KiB/76.18 KiB
dill       ------------------------------ 64.00 KiB/113.53 KiB
multiprocess ------------------------------ 62.77 KiB/131.66 KiB
xxhash     ------------------------------ 62.88 KiB/189.60 KiB
peft       ------------------------------ 62.92 KiB/245.69 KiB
qdrant-client ------------------------------ 62.91 KiB/260.15 KiB
protobuf   ------------------------------ 62.88 KiB/309.20 KiB
datasets   ------------------------------ 50.24 KiB/461.60 KiB
grpcio-tools ------------------------------ 24.74 KiB/2.24 MiB
tokenizers ------------------------------ 30.91 KiB/2.85 MiB
hf-transfer ------------------------------ 30.91 KiB/3.40 MiB
[2K[16A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 16.00 KiB/36.81 KiB
httpx      ------------------------------ 66.89 KiB/74.60 KiB
httpcore   ------------------------------ 76.18 KiB/76.18 KiB
dill       ------------------------------ 64.00 KiB/113.53 KiB
multiprocess ------------------------------ 62.77 KiB/131.66 KiB
xxhash     ------------------------------ 62.88 KiB/189.60 KiB
peft       ------------------------------ 62.92 KiB/245.69 KiB
qdrant-client ------------------------------ 62.91 KiB/260.15 KiB
protobuf   ------------------------------ 62.88 KiB/309.20 KiB
datasets   ------------------------------ 50.24 KiB/461.60 KiB
grpcio-tools ------------------------------ 24.74 KiB/2.24 MiB
tokenizers ------------------------------ 30.91 KiB/2.85 MiB
hf-transfer ------------------------------ 30.91 KiB/3.40 MiB
[2K[15A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 16.00 KiB/36.81 KiB
httpx      ------------------------------ 66.89 KiB/74.60 KiB
dill       ------------------------------ 64.00 KiB/113.53 KiB
multiprocess ------------------------------ 62.77 KiB/131.66 KiB
xxhash     ------------------------------ 62.88 KiB/189.60 KiB
peft       ------------------------------ 62.92 KiB/245.69 KiB
qdrant-client ------------------------------ 62.91 KiB/260.15 KiB
protobuf   ------------------------------ 62.88 KiB/309.20 KiB
datasets   ------------------------------ 50.24 KiB/461.60 KiB
grpcio-tools ------------------------------ 24.74 KiB/2.24 MiB
tokenizers ------------------------------ 46.91 KiB/2.85 MiB
hf-transfer ------------------------------ 30.91 KiB/3.40 MiB
[2K[14A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 16.00 KiB/36.81 KiB
dill       ------------------------------ 80.00 KiB/113.53 KiB
multiprocess ------------------------------ 76.40 KiB/131.66 KiB
xxhash     ------------------------------ 140.08 KiB/189.60 KiB
peft       ------------------------------ 78.92 KiB/245.69 KiB
qdrant-client ------------------------------ 78.91 KiB/260.15 KiB
protobuf   ------------------------------ 155.88 KiB/309.20 KiB
datasets   ------------------------------ 92.10 KiB/461.60 KiB
grpcio-tools ------------------------------ 136.74 KiB/2.24 MiB
tokenizers ------------------------------ 157.17 KiB/2.85 MiB
hf-transfer ------------------------------ 142.91 KiB/3.40 MiB
[2K[13A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 28.54 KiB/36.81 KiB
dill       ------------------------------ 96.00 KiB/113.53 KiB
multiprocess ------------------------------ 122.66 KiB/131.66 KiB
xxhash     ------------------------------ 188.08 KiB/189.60 KiB
peft       ------------------------------ 94.92 KiB/245.69 KiB
qdrant-client ------------------------------ 110.91 KiB/260.15 KiB
protobuf   ------------------------------ 187.88 KiB/309.20 KiB
datasets   ------------------------------ 140.10 KiB/461.60 KiB
grpcio-tools ------------------------------ 664.74 KiB/2.24 MiB
tokenizers ------------------------------ 557.17 KiB/2.85 MiB
hf-transfer ------------------------------ 688.72 KiB/3.40 MiB
[2K[13A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 28.54 KiB/36.81 KiB
dill       ------------------------------ 96.00 KiB/113.53 KiB
multiprocess ------------------------------ 131.66 KiB/131.66 KiB
peft       ------------------------------ 110.92 KiB/245.69 KiB
qdrant-client ------------------------------ 110.91 KiB/260.15 KiB
protobuf   ------------------------------ 203.88 KiB/309.20 KiB
datasets   ------------------------------ 188.10 KiB/461.60 KiB
grpcio-tools ------------------------------ 1.71 MiB/2.24 MiB
tokenizers ------------------------------ 1.77 MiB/2.85 MiB
hf-transfer ------------------------------ 1.92 MiB/3.40 MiB
[2K[12A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 28.54 KiB/36.81 KiB
dill       ------------------------------ 96.00 KiB/113.53 KiB
multiprocess ------------------------------ 131.66 KiB/131.66 KiB
peft       ------------------------------ 110.92 KiB/245.69 KiB
qdrant-client ------------------------------ 110.91 KiB/260.15 KiB
protobuf   ------------------------------ 203.88 KiB/309.20 KiB
datasets   ------------------------------ 204.10 KiB/461.60 KiB
grpcio-tools ------------------------------ 1.95 MiB/2.24 MiB
tokenizers ------------------------------ 1.97 MiB/2.85 MiB
hf-transfer ------------------------------ 2.44 MiB/3.40 MiB
[2K[12A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 28.54 KiB/36.81 KiB
dill       ------------------------------ 96.00 KiB/113.53 KiB
peft       ------------------------------ 110.92 KiB/245.69 KiB
qdrant-client ------------------------------ 110.91 KiB/260.15 KiB
protobuf   ------------------------------ 203.88 KiB/309.20 KiB
datasets   ------------------------------ 204.10 KiB/461.60 KiB
grpcio-tools ------------------------------ 1.95 MiB/2.24 MiB
tokenizers ------------------------------ 1.97 MiB/2.85 MiB
hf-transfer ------------------------------ 2.55 MiB/3.40 MiB
[2K[11A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
colpali-engine ------------------------------ 36.81 KiB/36.81 KiB
dill       ------------------------------ 96.00 KiB/113.53 KiB
peft       ------------------------------ 110.92 KiB/245.69 KiB
qdrant-client ------------------------------ 126.91 KiB/260.15 KiB
protobuf   ------------------------------ 219.88 KiB/309.20 KiB
datasets   ------------------------------ 220.10 KiB/461.60 KiB
grpcio-tools ------------------------------ 2.20 MiB/2.24 MiB
hf-transfer ------------------------------ 3.07 MiB/3.40 MiB
[2K[10A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
dill       ------------------------------ 112.00 KiB/113.53 KiB
peft       ------------------------------ 110.92 KiB/245.69 KiB
qdrant-client ------------------------------ 142.91 KiB/260.15 KiB
protobuf   ------------------------------ 235.88 KiB/309.20 KiB
datasets   ------------------------------ 220.10 KiB/461.60 KiB
grpcio-tools ------------------------------ 2.21 MiB/2.24 MiB
hf-transfer ------------------------------ 3.07 MiB/3.40 MiB
[2K[9A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
peft       ------------------------------ 166.62 KiB/245.69 KiB
qdrant-client ------------------------------ 174.91 KiB/260.15 KiB
protobuf   ------------------------------ 267.88 KiB/309.20 KiB
datasets   ------------------------------ 259.36 KiB/461.60 KiB
grpcio-tools ------------------------------ 2.24 MiB/2.24 MiB
hf-transfer ------------------------------ 3.07 MiB/3.40 MiB
[2K[8A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
peft       ------------------------------ 166.62 KiB/245.69 KiB
qdrant-client ------------------------------ 174.91 KiB/260.15 KiB
protobuf   ------------------------------ 287.88 KiB/309.20 KiB
datasets   ------------------------------ 268.10 KiB/461.60 KiB
hf-transfer ------------------------------ 3.07 MiB/3.40 MiB
[2K[7A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠙ Preparing packages... (0/21)
peft       ------------------------------ 222.92 KiB/245.69 KiB
qdrant-client ------------------------------ 260.15 KiB/260.15 KiB
protobuf   ------------------------------ 309.20 KiB/309.20 KiB
datasets   ------------------------------ 316.10 KiB/461.60 KiB
hf-transfer ------------------------------ 3.13 MiB/3.40 MiB
[2K[7A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠹ Preparing packages... (14/21)
peft       ------------------------------ 222.92 KiB/245.69 KiB
protobuf   ------------------------------ 309.20 KiB/309.20 KiB
datasets   ------------------------------ 316.10 KiB/461.60 KiB
hf-transfer ------------------------------ 3.13 MiB/3.40 MiB
[2K[6A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠹ Preparing packages... (14/21)
protobuf   ------------------------------ 309.20 KiB/309.20 KiB
datasets   ------------------------------ 316.10 KiB/461.60 KiB
hf-transfer ------------------------------ 3.13 MiB/3.40 MiB
[2K[5A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠹ Preparing packages... (14/21)
datasets   ------------------------------ 348.10 KiB/461.60 KiB
hf-transfer ------------------------------ 3.13 MiB/3.40 MiB
[2K[4A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠹ Preparing packages... (14/21)
hf-transfer ------------------------------ 3.13 MiB/3.40 MiB
[2K[3A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠹ Preparing packages... (14/21)
hf-transfer ------------------------------ 3.19 MiB/3.40 MiB
[2K[3A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠹ Preparing packages... (14/21)
[2K[2A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠹ Preparing packages... (14/21)
[2K[2A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠹ Preparing packages... (14/21)
[2K[2A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠸ Preparing packages... (19/21)
[2K[2A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠸ Preparing packages... (19/21)
[2K[2A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠸ Preparing packages... (19/21)
[2K[2A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
⠸ Preparing packages... (19/21)
[2K[2A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
[2K[1A[36m[1mBuilding[0m[39m gputil[2m==1.4.0[0m
[2K[1A   [32m[1mBuilt[0m[39m gputil[2m==1.4.0[0m
[2K[2mPrepared [1m21 packages[0m [2min 607ms[0m[0m
[2mUninstalled [1m3 packages[0m [2min 202ms[0m[0m
[2K[2mInstalled [1m21 packages[0m [2min 45ms[0m[0m
 [32m+[39m [1mcolpali-engine[0m[2m==0.3.2[0m
 [32m+[39m [1mdatasets[0m[2m==3.0.2[0m
 [32m+[39m [1mdill[0m[2m==0.3.8[0m
 [32m+[39m [1mgputil[0m[2m==1.4.0[0m
 [32m+[39m [1mgrpcio-tools[0m[2m==1.64.1[0m
 [32m+[39m [1mh11[0m[2m==0.14.0[0m
 [32m+[39m [1mh2[0m[2m==4.1.0[0m
 [32m+[39m [1mhf-transfer[0m[2m==0.1.8[0m
 [32m+[39m [1mhpack[0m[2m==4.0.0[0m
 [32m+[39m [1mhttpcore[0m[2m==1.0.6[0m
 [32m+[39m [1mhttpx[0m[2m==0.27.2[0m
 [32m+[39m [1mhyperframe[0m[2m==6.0.1[0m
 [32m+[39m [1mmultiprocess[0m[2m==0.70.16[0m
 [32m+[39m [1mpeft[0m[2m==0.11.1[0m
 [32m+[39m [1mportalocker[0m[2m==2.10.1[0m
 [31m-[39m [1mprotobuf[0m[2m==3.20.3[0m
 [32m+[39m [1mprotobuf[0m[2m==5.28.3[0m
 [32m+[39m [1mqdrant-client[0m[2m==1.12.0[0m
 [32m+[39m [1mstamina[0m[2m==24.3.0[0m
 [31m-[39m [1mtokenizers[0m[2m==0.19.1[0m
 [32m+[39m [1mtokenizers[0m[2m==0.20.1[0m
 [31m-[39m [1mtransformers[0m[2m==4.44.2[0m
 [32m+[39m [1mtransformers[0m[2m==4.46.0[0m
 [32m+[39m [1mxxhash[0m[2m==3.5.0[0m
```

```python
import os
import torch
import time
from qdrant_client import QdrantClient
from qdrant_client.http import models
from tqdm import tqdm
from datasets import load_dataset
```

## Step 2: Downloading the UFO Documents Dataset

- Item de lista
- Item de lista

We will retrieve the UFO dataset from the Hugging Face hub.

```python
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = (
    "1"  # optional setting for faster dataset downloads
)
```

<hr />

```python
dataset = load_dataset("davanstrien/ufo-ColPali", split="train")
```

```
README.md:   0%|          | 0.00/1.20k [00:00<?, ?B/s]



train-00000-of-00001.parquet:   0%|          | 0.00/293M [00:00<?, ?B/s]



Generating train split:   0%|          | 0/2243 [00:00<?, ? examples/s]
```

```python
dataset  # structure of the dataset
```

```
Dataset({
    features: ['image', 'raw_queries', 'broad_topical_query', 'broad_topical_explanation', 'specific_detail_query', 'specific_detail_explanation', 'visual_element_query', 'visual_element_explanation', 'parsed_into_json'],
    num_rows: 2243
})
```

Let's take a look at one random document from the dataset to exemplify the complexity of the data that we'll be handling

```python
dataset[439]["image"]
```

![png](documentation/colpali_demo_binary/output_14_0.png)

## Step 3: Connecting to Qdrant

For this tutorial, we'll be using a Qdrant Cloud cluster with the following specs:

DISK: 32GB
RAM: 8GB
vCPUs: 1

But don't worry! You can still follow along and perform the same searches using the \[Qdrant Cloud Free Tier\]((<https://cloud.qdrant.io/>) or in your local machine with our [Python Client](https://github.com/qdrant/qdrant-client).

```python
from google.colab import userdata
```

<hr />

```python
qdrant_client = QdrantClient(
    url="https://56486603-8c49-4917-b932-38fef2e2cca3.europe-west3-0.gcp.staging-cloud.qdrant.io",
    api_key=userdata.get("qdrantcloud"),
)
```

If you want to start testing without setting up persistent storage, you can initialize an in-memory Qdrant instance. **But keep in mind that the data won't persist after the session ends:**

```python
# qdrant_client = QdrantClient(
#     ":memory:"
# )
```

## Step 4: Setting Up ColPali

We're going to be using here a ColPali model that is fine-tuned for the UFO dataset.

```python
from colpali_engine.models import ColPali, ColPaliProcessor

# Initialize ColPali model and processor
model_name = (
    "davanstrien/finetune_colpali_v1_2-ufo-4bit"  # Use the latest version available
)
colpali_model = ColPali.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,
    device_map="cuda:0",  # Use "cuda:0" for GPU, "cpu" for CPU, or "mps" for Apple Silicon
)
colpali_processor = ColPaliProcessor.from_pretrained(
    "vidore/colpaligemma-3b-pt-448-base"
)
```

```
/usr/local/lib/python3.10/dist-packages/huggingface_hub/utils/_token.py:89: UserWarning: 
The secret `HF_TOKEN` does not exist in your Colab secrets.
To authenticate with the Hugging Face Hub, create a token in your settings tab (https://huggingface.co/settings/tokens), set it as secret in your Google Colab and restart your session.
You will be able to reuse this secret in all of your notebooks.
Please note that authentication is recommended but still optional to access public models or datasets.
  warnings.warn(



adapter_config.json:   0%|          | 0.00/750 [00:00<?, ?B/s]



config.json:   0%|          | 0.00/1.01k [00:00<?, ?B/s]



model.safetensors.index.json:   0%|          | 0.00/66.3k [00:00<?, ?B/s]



Downloading shards:   0%|          | 0/2 [00:00<?, ?it/s]



model-00001-of-00002.safetensors:   0%|          | 0.00/4.99G [00:00<?, ?B/s]



model-00002-of-00002.safetensors:   0%|          | 0.00/862M [00:00<?, ?B/s]


`config.hidden_act` is ignored, you should use `config.hidden_activation` instead.
Gemma's activation function will be set to `gelu_pytorch_tanh`. Please, use
`config.hidden_activation` if you want to override this behaviour.
See https://github.com/huggingface/transformers/pull/29402 for more details.



Loading checkpoint shards:   0%|          | 0/2 [00:00<?, ?it/s]



adapter_model.safetensors:   0%|          | 0.00/157M [00:00<?, ?B/s]



preprocessor_config.json:   0%|          | 0.00/425 [00:00<?, ?B/s]



tokenizer_config.json:   0%|          | 0.00/243k [00:00<?, ?B/s]



tokenizer.json:   0%|          | 0.00/17.8M [00:00<?, ?B/s]



special_tokens_map.json:   0%|          | 0.00/733 [00:00<?, ?B/s]
```

## Step 5: Configure your Qdrant Collection

Now let's create a collection in Qdrant. We're using binary quantization here, keeping only the quantized vectors in RAM while storing the original vectors and payloads on disk. MaxSim is being used for selecting the maximum similarity score for token-level comparisons between query and document vectors

```python
collection_name = "ufo-binary"
```

<hr />

```python
qdrant_client.create_collection(
    collection_name=collection_name,
    on_disk_payload=True,  # store the payload on disk
    vectors_config=models.VectorParams(
        size=128,
        distance=models.Distance.COSINE,
        on_disk=True,  # move original vectors to disk
        multivector_config=models.MultiVectorConfig(
            comparator=models.MultiVectorComparator.MAX_SIM
        ),
        quantization_config=models.BinaryQuantization(
            binary=models.BinaryQuantizationConfig(
                always_ram=True  # keep only quantized vectors in RAM
            ),
        ),
    ),
)
```

```
True
```

## Step 6: Uploading the vectors to Qdrant

In this step, we're indexing the vectors into our Qdrant Collection in batches.

For each batch, the images are processed and encoded using the ColPali model, turning them into multi-vector embeddings. These embeddings are then converted from tensors into lists of vectors, capturing key details from each image and creating a multi-vector representation for each document. This setup works well with Qdrant's multivector capabilities.

After processing, the vectors and any metadata are uploaded to Qdrant, gradually building up the index. You can lower or increase the `batch_size` depending on your avaliable GPU resources.

```python
import stamina


@stamina.retry(
    on=Exception, attempts=3
)  # retry mechanism if an exception occurs during the operation
def upsert_to_qdrant(batch):
    try:
        qdrant_client.upsert(
            collection_name=collection_name,
            points=points,
            wait=False,
        )
    except Exception as e:
        print(f"Error during upsert: {e}")
        return False
    return True
```

<hr />

```python
batch_size = 4  # Adjust based on your GPU memory constraints

# Use tqdm to create a progress bar
with tqdm(total=len(dataset), desc="Indexing Progress") as pbar:
    for i in range(0, len(dataset), batch_size):
        batch = dataset[i : i + batch_size]

        # The images are already PIL Image objects, so we can use them directly
        images = batch["image"]

        # Process and encode images
        with torch.no_grad():
            batch_images = colpali_processor.process_images(images).to(
                colpali_model.device
            )
            image_embeddings = colpali_model(**batch_images)

        # Prepare points for Qdrant
        points = []
        for j, embedding in enumerate(image_embeddings):
            # Convert the embedding to a list of vectors
            multivector = embedding.cpu().float().numpy().tolist()
            points.append(
                models.PointStruct(
                    id=i + j,  # we just use the index as the ID
                    vector=multivector,  # This is now a list of vectors
                    payload={
                        "source": "internet archive"
                    },  # can also add other metadata/data
                )
            )

        # Upload points to Qdrant
        try:
            upsert_to_qdrant(points)
        except Exception as e:
            print(f"Error during upsert: {e}")
            continue

        # Update the progress bar
        pbar.update(batch_size)

print("Indexing complete!")
```

```
Indexing Progress: 2244it [2:06:11,  3.37s/it]

Indexing complete!
```

```python
qdrant_client.update_collection(
    collection_name=collection_name,
    optimizer_config=models.OptimizersConfigDiff(indexing_threshold=10),
)
```

```
True
```

## Step 7: Processing the Query

So let's go ahead and prepare our search query. In this step, the text query "top secret" is processed and transformed into a tensor by the `colpali_processor.process_queries` function.

```python
query_text = "top secret"
with torch.no_grad():
    batch_query = colpali_processor.process_queries([query_text]).to(
        colpali_model.device
    )
    query_embedding = colpali_model(**batch_query)
query_embedding
```

```
tensor([[[ 0.1396, -0.0132,  0.0903,  ..., -0.0198, -0.0791, -0.0244],
         [-0.1035, -0.1079,  0.0520,  ..., -0.0151, -0.0874,  0.0854],
         [-0.1201, -0.0334,  0.0742,  ..., -0.0243, -0.0056, -0.0293],
         ...,
         [-0.0603,  0.0245,  0.0493,  ...,  0.0061,  0.0405,  0.0422],
         [-0.0708,  0.0322,  0.0413,  ...,  0.0003,  0.0435,  0.0294],
         [-0.0542,  0.0510,  0.0708,  ..., -0.0197,  0.0366,  0.0114]]],
       device='cuda:0', dtype=torch.bfloat16)
```

After generating the query embedding tensor, we need to convert it into a multivector that can be used by Qdrant for searching.

```python
multivector_query = query_embedding[0].cpu().float().numpy().tolist()
```

## Step 8: Searching and Retrieving the Documents

In this step, we perform a search to retrieve the top 10 results closer to our query multivector.

We apply rescoring to adjust and refine the initial search results by reevaluating the most relevant candidates with a more precise scoring algorithm. Oversampling is used to improve search accuracy by retrieving a larger pool of candidate results than the final number required. Finally, we measure and display how long the search process takes.

```python
start_time = time.time()
search_result = qdrant_client.query_points(
    collection_name=collection_name,
    query=multivector_query,
    limit=10,
    timeout=100,
    search_params=models.SearchParams(
        quantization=models.QuantizationSearchParams(
            ignore=False,
            rescore=True,
            oversampling=2.0,
        )
    ),
)
end_time = time.time()
# Search in Qdrant
search_result.points

elapsed_time = end_time - start_time
print(f"Search completed in {elapsed_time:.4f} seconds")
```

```
Search completed in 0.7175 seconds
```

Search completed in 0.81 seconds, nearly twice as fast as Scalar Quantization, which took 1.56 seconds according to previous tests using the same settings.

Let's now check the first match for our search query and see if we get a result similar to the original author's example, Daniel van Strien's, who used Scalar Quantization in his tutorial to see how Binary Quantization holds up in terms of accuracy and relevance.

```python
idx = search_result.points[0].id
dataset[idx]["image"]
```

![png](documentation/colpali_demo_binary/output_37_0.png)

And it's a match! Both Scalar and Binary Quantization had the same top result for the same query.

However, keep in mind that this is just a quick experiment. Performance may vary, so it's important to test binary quantization on your own datasets to see how it performs for your specific use case. That said, it's promising to see binary quantization maintaining search quality while potentially offering performance improvements with ColPali.

```python
idx = search_result.points[1].id
dataset[idx]["image"]
```

![png](documentation/colpali_demo_binary/output_39_0.png)

```python
idx = search_result.points[2].id
dataset[idx]["image"]
```

![png](documentation/colpali_demo_binary/output_40_0.png)

```python
idx = search_result.points[3].id
dataset[idx]["image"]
```

![png](documentation/colpali_demo_binary/output_41_0.png)

```python
idx = search_result.points[4].id
dataset[idx]["image"]
```

![png](documentation/colpali_demo_binary/output_42_0.png)

```python
idx = search_result.points[5].id
dataset[idx]["image"]
```

![png](documentation/colpali_demo_binary/output_43_0.png)

This is it! Feel free to experiment with your own data and settings! And remember, always evaluate both performance and quality based on your specific use case before making any final decisions.

Happy searching!

### References:

[1] Faysse, M., Sibille, H., Wu, T., Omrani, B., Viaud, G., Hudelot, C., Colombo, P. (2024). *ColPali: Efficient Document Retrieval with Vision Language Models*. arXiv. <https://doi.org/10.48550/arXiv.2407.01449>

[2] van Strien, D. (2024). *Using ColPali with Qdrant to index and search a UFO document dataset*. Published October 2, 2024. Blog post: <https://danielvanstrien.xyz/posts/post-with-code/colpali-qdrant/2024-10-02_using_colpali_with_qdrant.html>

[3] Kacper Łukawski (2024). *Any Embedding Model Can Become a Late Interaction Model... If You Give It a Chance!* Qdrant Blog, August 14, 2024. Available at: <https://qdrant.tech/articles/late-interaction-models/>
