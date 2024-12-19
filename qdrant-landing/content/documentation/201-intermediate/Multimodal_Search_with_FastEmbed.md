---
notebook_path: 201-intermediate/multimodal-search/Multimodal_Search_with_FastEmbed.ipynb
reading_time_min: 8
title:
---

### Tutorial

Install & import **Qdrant** and **FastEmbed**

We will **FastEmbed** for generating multimodal embeddings and **Qdrant** for storing and retrieving them.

```python
!python3 -m pip install --upgrade qdrant-client fastembed Pillow
```

```
Requirement already satisfied: qdrant-client in /usr/local/lib/python3.10/dist-packages (1.11.0)
Requirement already satisfied: fastembed in /usr/local/lib/python3.10/dist-packages (0.3.4)
Requirement already satisfied: Pillow in /usr/local/lib/python3.10/dist-packages (10.4.0)
Requirement already satisfied: grpcio>=1.41.0 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (1.65.5)
Requirement already satisfied: grpcio-tools>=1.41.0 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (1.65.5)
Requirement already satisfied: httpx>=0.20.0 in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.20.0->qdrant-client) (0.27.0)
Requirement already satisfied: numpy>=1.21 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (1.26.4)
Requirement already satisfied: portalocker<3.0.0,>=2.7.0 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (2.10.1)
Requirement already satisfied: pydantic>=1.10.8 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (2.8.2)
Requirement already satisfied: urllib3<3,>=1.26.14 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (2.0.7)
Requirement already satisfied: PyStemmer<3.0.0,>=2.2.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (2.2.0.1)
Requirement already satisfied: huggingface-hub<1.0,>=0.20 in /usr/local/lib/python3.10/dist-packages (from fastembed) (0.23.5)
Requirement already satisfied: loguru<0.8.0,>=0.7.2 in /usr/local/lib/python3.10/dist-packages (from fastembed) (0.7.2)
Requirement already satisfied: mmh3<5.0,>=4.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (4.1.0)
Requirement already satisfied: onnx<2.0.0,>=1.15.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (1.16.2)
Requirement already satisfied: onnxruntime<2.0.0,>=1.17.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (1.19.0)
Requirement already satisfied: requests<3.0,>=2.31 in /usr/local/lib/python3.10/dist-packages (from fastembed) (2.32.3)
Requirement already satisfied: snowballstemmer<3.0.0,>=2.2.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (2.2.0)
Requirement already satisfied: tokenizers<1.0,>=0.15 in /usr/local/lib/python3.10/dist-packages (from fastembed) (0.19.1)
Requirement already satisfied: tqdm<5.0,>=4.66 in /usr/local/lib/python3.10/dist-packages (from fastembed) (4.66.5)
Requirement already satisfied: protobuf<6.0dev,>=5.26.1 in /usr/local/lib/python3.10/dist-packages (from grpcio-tools>=1.41.0->qdrant-client) (5.27.3)
Requirement already satisfied: setuptools in /usr/local/lib/python3.10/dist-packages (from grpcio-tools>=1.41.0->qdrant-client) (71.0.4)
Requirement already satisfied: anyio in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client) (3.7.1)
Requirement already satisfied: certifi in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client) (2024.7.4)
Requirement already satisfied: httpcore==1.* in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client) (1.0.5)
Requirement already satisfied: idna in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client) (3.7)
Requirement already satisfied: sniffio in /usr/local/lib/python3.10/dist-packages (from httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client) (1.3.1)
Requirement already satisfied: h11<0.15,>=0.13 in /usr/local/lib/python3.10/dist-packages (from httpcore==1.*->httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client) (0.14.0)
Requirement already satisfied: h2<5,>=3 in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.20.0->qdrant-client) (4.1.0)
Requirement already satisfied: filelock in /usr/local/lib/python3.10/dist-packages (from huggingface-hub<1.0,>=0.20->fastembed) (3.15.4)
Requirement already satisfied: fsspec>=2023.5.0 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub<1.0,>=0.20->fastembed) (2024.6.1)
Requirement already satisfied: packaging>=20.9 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub<1.0,>=0.20->fastembed) (24.1)
Requirement already satisfied: pyyaml>=5.1 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub<1.0,>=0.20->fastembed) (6.0.2)
Requirement already satisfied: typing-extensions>=3.7.4.3 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub<1.0,>=0.20->fastembed) (4.12.2)
Requirement already satisfied: coloredlogs in /usr/local/lib/python3.10/dist-packages (from onnxruntime<2.0.0,>=1.17.0->fastembed) (15.0.1)
Requirement already satisfied: flatbuffers in /usr/local/lib/python3.10/dist-packages (from onnxruntime<2.0.0,>=1.17.0->fastembed) (24.3.25)
Requirement already satisfied: sympy in /usr/local/lib/python3.10/dist-packages (from onnxruntime<2.0.0,>=1.17.0->fastembed) (1.13.2)
Requirement already satisfied: annotated-types>=0.4.0 in /usr/local/lib/python3.10/dist-packages (from pydantic>=1.10.8->qdrant-client) (0.7.0)
Requirement already satisfied: pydantic-core==2.20.1 in /usr/local/lib/python3.10/dist-packages (from pydantic>=1.10.8->qdrant-client) (2.20.1)
Requirement already satisfied: charset-normalizer<4,>=2 in /usr/local/lib/python3.10/dist-packages (from requests<3.0,>=2.31->fastembed) (3.3.2)
Requirement already satisfied: hyperframe<7,>=6.0 in /usr/local/lib/python3.10/dist-packages (from h2<5,>=3->httpx[http2]>=0.20.0->qdrant-client) (6.0.1)
Requirement already satisfied: hpack<5,>=4.0 in /usr/local/lib/python3.10/dist-packages (from h2<5,>=3->httpx[http2]>=0.20.0->qdrant-client) (4.0.0)
Requirement already satisfied: exceptiongroup in /usr/local/lib/python3.10/dist-packages (from anyio->httpx>=0.20.0->httpx[http2]>=0.20.0->qdrant-client) (1.2.2)
Requirement already satisfied: humanfriendly>=9.1 in /usr/local/lib/python3.10/dist-packages (from coloredlogs->onnxruntime<2.0.0,>=1.17.0->fastembed) (10.0)
Requirement already satisfied: mpmath<1.4,>=1.1.0 in /usr/local/lib/python3.10/dist-packages (from sympy->onnxruntime<2.0.0,>=1.17.0->fastembed) (1.3.0)
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    ":memory:"
)  #:memory: option is suitable only for simple prototypes/demos with Python client (!)
```

Let's embed a very short selection of images and their captions in the **shared embedding space** with CLIP.

```python
from fastembed import TextEmbedding, ImageEmbedding


documents = [
    {"caption": "A photo of a cute pig", "image": "images/piggy.jpg"},
    {"caption": "A picture with a coffee cup", "image": "images/coffee.jpg"},
    {"caption": "A photo of a colourful lizard", "image": "images/lizard.jpg"},
]

text_model_name = "Qdrant/clip-ViT-B-32-text"  # CLIP text encoder
text_model = TextEmbedding(model_name=text_model_name)
text_embeddings_size = text_model._get_model_description(text_model_name)[
    "dim"
]  # dimension of text embeddings, produced by CLIP text encoder (512)
texts_embeded = list(
    text_model.embed([document["caption"] for document in documents])
)  # embedding captions with CLIP text encoder

image_model_name = "Qdrant/clip-ViT-B-32-vision"  # CLIP image encoder
image_model = ImageEmbedding(model_name=image_model_name)
image_embeddings_size = image_model._get_model_description(image_model_name)[
    "dim"
]  # dimension of image embeddings, produced by CLIP image encoder (512)
images_embeded = list(
    image_model.embed([document["image"] for document in documents])
)  # embedding images with CLIP image encoder
```

```
/usr/local/lib/python3.10/dist-packages/huggingface_hub/utils/_token.py:89: UserWarning: 
The secret `HF_TOKEN` does not exist in your Colab secrets.
To authenticate with the Hugging Face Hub, create a token in your settings tab (https://huggingface.co/settings/tokens), set it as secret in your Google Colab and restart your session.
You will be able to reuse this secret in all of your notebooks.
Please note that authentication is recommended but still optional to access public models or datasets.
  warnings.warn(



Fetching 5 files:   0%|          | 0/5 [00:00<?, ?it/s]



Fetching 3 files:   0%|          | 0/3 [00:00<?, ?it/s]
```

Create a **Collection**

```python
if not client.collection_exists("text_image"):  # creating a Collection
    client.create_collection(
        collection_name="text_image",
        vectors_config={  # Named Vectors
            "image": models.VectorParams(
                size=image_embeddings_size, distance=models.Distance.COSINE
            ),
            "text": models.VectorParams(
                size=text_embeddings_size, distance=models.Distance.COSINE
            ),
        },
    )
```

Now let's upload our images with captions to the **Collection**. Each image with its caption will create a [Point](https://qdrant.tech/documentation/concepts/points/) in Qdrant.

```python
client.upload_points(
    collection_name="text_image",
    points=[
        models.PointStruct(
            id=idx,  # unique id of a point, pre-defined by user
            vector={
                "text": texts_embeded[idx],  # embeded caption
                "image": images_embeded[idx],  # embeded image
            },
            payload=doc,  # original image and its caption
        )
        for idx, doc in enumerate(documents)
    ],
)
```

Let'see what image we will get to the query "*What would make me energetic in the morning?*"

```python
from PIL import Image

find_image = text_model.embed(
    ["What would make me energetic in the morning?"]
)  # query, we embed it, so it also becomes a vector

Image.open(
    client.search(
        collection_name="text_image",  # searching in our collection
        query_vector=(
            "image",
            list(find_image)[0],
        ),  # searching only among image vectors with our textual query
        with_payload=[
            "image"
        ],  # user-readable information about search results, we are interested to see which image we will find
        limit=1,  # top-1 similar to the query result
    )[0].payload["image"]
)
```

![png](documentation/201-intermediate/Multimodal_Search_with_FastEmbed/output_10_0.png)

Now let's do a reverse search:

Let'see what caption we will get, searching by the piglet image, which, as you can check, is not in our **Collection**:

```python
Image.open("images/piglet.jpg")  # to display what are we working with
```

![png](documentation/201-intermediate/Multimodal_Search_with_FastEmbed/output_12_0.png)

```python
find_image = image_model.embed(["images/piglet.jpg"])  # embedding our image query

client.search(
    collection_name="text_image",
    query_vector=(
        "text",
        list(find_image)[0],
    ),  # now we are searching only among text vectors with our image query
    with_payload=[
        "caption"
    ],  # user-readable information about search results, we are interested to see which caption we will get
    limit=1,
)[0].payload["caption"]
```

```
'A photo of a cute pig'
```
