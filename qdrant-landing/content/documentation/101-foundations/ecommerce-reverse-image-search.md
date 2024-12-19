---
notebook_path: 101-foundations/ecommerce_reverse_image_search/ecommerce-reverse-image-search.ipynb
reading_time_min: 43
title: 'Ecommerce: reverse image search'
---

# Ecommerce: reverse image search

All e-commerce platforms need a search mechanism. The built-in methods usually rely on some variation of full-text search which finds the relevant documents based on the presence of the words used in a query. In some cases, it might be enough, but there are ways to improve that mechanism and increase sales. If your customer can easily find a product they need, they are more likely to buy it.

Semantic search is one of the possibilities. It relies not only on keywords but considers the meaning and intention of the query. However, reverse image search might be a way to go if you want to enable non-textual search capabilities. Your customers may struggle to express themselves, so why don't you ease that and start accepting images as your search queries?

# Amazon product dataset 2020

We will use the [Amazon product dataset 2020](https://www.kaggle.com/datasets/promptcloud/amazon-product-dataset-2020/) and see how to enable visual queries for it. The following lines will download it from the cloud and create a directory structure so you can reproduce the results independently.

```python
!mkdir data
!mkdir data/images
!mkdir queries
!wget -nc --directory-prefix=data/ "https://storage.googleapis.com/qdrant-examples/amazon-product-dataset-2020.zip"
!wget -nc --directory-prefix=queries/ "https://storage.googleapis.com/qdrant-examples/ecommerce-reverse-image-search-queries.zip"
!unzip -u -d queries queries/ecommerce-reverse-image-search-queries.zip
```

```
mkdir: cannot create directory ‘data’: File exists
mkdir: cannot create directory ‘data/images’: File exists
mkdir: cannot create directory ‘queries’: File exists
File ‘data/amazon-product-dataset-2020.zip’ already there; not retrieving.

File ‘queries/ecommerce-reverse-image-search-queries.zip’ already there; not retrieving.

Archive:  queries/ecommerce-reverse-image-search-queries.zip
```

```python
!pip install jupyter pandas sentence_transformers "qdrant_client~=1.1.1" pyarrow fastembed
```

```
Requirement already satisfied: jupyter in /usr/local/lib/python3.10/dist-packages (1.0.0)
Requirement already satisfied: pandas in /usr/local/lib/python3.10/dist-packages (2.0.3)
Requirement already satisfied: sentence_transformers in /usr/local/lib/python3.10/dist-packages (3.0.1)
Collecting qdrant_client~=1.1.1
  Downloading qdrant_client-1.1.7-py3-none-any.whl (127 kB)
[2K     [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m127.8/127.8 kB[0m [31m1.4 MB/s[0m eta [36m0:00:00[0m
[?25hRequirement already satisfied: pyarrow in /usr/local/lib/python3.10/dist-packages (14.0.2)
Requirement already satisfied: fastembed in /usr/local/lib/python3.10/dist-packages (0.3.3)
Requirement already satisfied: notebook in /usr/local/lib/python3.10/dist-packages (from jupyter) (6.5.5)
Requirement already satisfied: qtconsole in /usr/local/lib/python3.10/dist-packages (from jupyter) (5.5.2)
Requirement already satisfied: jupyter-console in /usr/local/lib/python3.10/dist-packages (from jupyter) (6.1.0)
Requirement already satisfied: nbconvert in /usr/local/lib/python3.10/dist-packages (from jupyter) (6.5.4)
Requirement already satisfied: ipykernel in /usr/local/lib/python3.10/dist-packages (from jupyter) (5.5.6)
Requirement already satisfied: ipywidgets in /usr/local/lib/python3.10/dist-packages (from jupyter) (7.7.1)
Requirement already satisfied: python-dateutil>=2.8.2 in /usr/local/lib/python3.10/dist-packages (from pandas) (2.8.2)
Requirement already satisfied: pytz>=2020.1 in /usr/local/lib/python3.10/dist-packages (from pandas) (2023.4)
Requirement already satisfied: tzdata>=2022.1 in /usr/local/lib/python3.10/dist-packages (from pandas) (2024.1)
Requirement already satisfied: numpy>=1.21.0 in /usr/local/lib/python3.10/dist-packages (from pandas) (1.25.2)
Requirement already satisfied: transformers<5.0.0,>=4.34.0 in /usr/local/lib/python3.10/dist-packages (from sentence_transformers) (4.41.2)
Requirement already satisfied: tqdm in /usr/local/lib/python3.10/dist-packages (from sentence_transformers) (4.66.4)
Requirement already satisfied: torch>=1.11.0 in /usr/local/lib/python3.10/dist-packages (from sentence_transformers) (2.3.0+cu121)
Requirement already satisfied: scikit-learn in /usr/local/lib/python3.10/dist-packages (from sentence_transformers) (1.2.2)
Requirement already satisfied: scipy in /usr/local/lib/python3.10/dist-packages (from sentence_transformers) (1.11.4)
Requirement already satisfied: huggingface-hub>=0.15.1 in /usr/local/lib/python3.10/dist-packages (from sentence_transformers) (0.23.4)
Requirement already satisfied: Pillow in /usr/local/lib/python3.10/dist-packages (from sentence_transformers) (10.4.0)
Requirement already satisfied: grpcio>=1.41.0 in /usr/local/lib/python3.10/dist-packages (from qdrant_client~=1.1.1) (1.64.1)
Requirement already satisfied: grpcio-tools>=1.41.0 in /usr/local/lib/python3.10/dist-packages (from qdrant_client~=1.1.1) (1.64.1)
Requirement already satisfied: httpx[http2]>=0.14.0 in /usr/local/lib/python3.10/dist-packages (from qdrant_client~=1.1.1) (0.27.0)
Requirement already satisfied: portalocker<3.0.0,>=2.7.0 in /usr/local/lib/python3.10/dist-packages (from qdrant_client~=1.1.1) (2.10.0)
Collecting pydantic<2.0,>=1.8 (from qdrant_client~=1.1.1)
  Downloading pydantic-1.10.17-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (3.1 MB)
[2K     [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m3.1/3.1 MB[0m [31m18.1 MB/s[0m eta [36m0:00:00[0m
[?25hRequirement already satisfied: typing-extensions<5.0.0,>=4.0.0 in /usr/local/lib/python3.10/dist-packages (from qdrant_client~=1.1.1) (4.12.2)
Requirement already satisfied: urllib3<2.0.0,>=1.26.14 in /usr/local/lib/python3.10/dist-packages (from qdrant_client~=1.1.1) (1.26.19)
Requirement already satisfied: PyStemmer<3.0.0,>=2.2.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (2.2.0.1)
Requirement already satisfied: loguru<0.8.0,>=0.7.2 in /usr/local/lib/python3.10/dist-packages (from fastembed) (0.7.2)
Requirement already satisfied: mmh3<5.0,>=4.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (4.1.0)
Requirement already satisfied: onnx<2.0.0,>=1.15.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (1.16.1)
Requirement already satisfied: onnxruntime<2.0.0,>=1.17.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (1.18.1)
Requirement already satisfied: requests<3.0,>=2.31 in /usr/local/lib/python3.10/dist-packages (from fastembed) (2.31.0)
Requirement already satisfied: snowballstemmer<3.0.0,>=2.2.0 in /usr/local/lib/python3.10/dist-packages (from fastembed) (2.2.0)
Requirement already satisfied: tokenizers<1.0,>=0.15 in /usr/local/lib/python3.10/dist-packages (from fastembed) (0.19.1)
Requirement already satisfied: protobuf<6.0dev,>=5.26.1 in /usr/local/lib/python3.10/dist-packages (from grpcio-tools>=1.41.0->qdrant_client~=1.1.1) (5.27.2)
Requirement already satisfied: setuptools in /usr/local/lib/python3.10/dist-packages (from grpcio-tools>=1.41.0->qdrant_client~=1.1.1) (67.7.2)
Requirement already satisfied: anyio in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (3.7.1)
Requirement already satisfied: certifi in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (2024.6.2)
Requirement already satisfied: httpcore==1.* in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (1.0.5)
Requirement already satisfied: idna in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (3.7)
Requirement already satisfied: sniffio in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (1.3.1)
Requirement already satisfied: h2<5,>=3 in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (4.1.0)
Requirement already satisfied: h11<0.15,>=0.13 in /usr/local/lib/python3.10/dist-packages (from httpcore==1.*->httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (0.14.0)
Requirement already satisfied: filelock in /usr/local/lib/python3.10/dist-packages (from huggingface-hub>=0.15.1->sentence_transformers) (3.15.4)
Requirement already satisfied: fsspec>=2023.5.0 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub>=0.15.1->sentence_transformers) (2023.6.0)
Requirement already satisfied: packaging>=20.9 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub>=0.15.1->sentence_transformers) (24.1)
Requirement already satisfied: pyyaml>=5.1 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub>=0.15.1->sentence_transformers) (6.0.1)
Requirement already satisfied: coloredlogs in /usr/local/lib/python3.10/dist-packages (from onnxruntime<2.0.0,>=1.17.0->fastembed) (15.0.1)
Requirement already satisfied: flatbuffers in /usr/local/lib/python3.10/dist-packages (from onnxruntime<2.0.0,>=1.17.0->fastembed) (24.3.25)
Requirement already satisfied: sympy in /usr/local/lib/python3.10/dist-packages (from onnxruntime<2.0.0,>=1.17.0->fastembed) (1.12.1)
Requirement already satisfied: six>=1.5 in /usr/local/lib/python3.10/dist-packages (from python-dateutil>=2.8.2->pandas) (1.16.0)
Requirement already satisfied: charset-normalizer<4,>=2 in /usr/local/lib/python3.10/dist-packages (from requests<3.0,>=2.31->fastembed) (3.3.2)
Requirement already satisfied: networkx in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (3.3)
Requirement already satisfied: jinja2 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (3.1.4)
Requirement already satisfied: nvidia-cuda-nvrtc-cu12==12.1.105 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (12.1.105)
Requirement already satisfied: nvidia-cuda-runtime-cu12==12.1.105 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (12.1.105)
Requirement already satisfied: nvidia-cuda-cupti-cu12==12.1.105 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (12.1.105)
Requirement already satisfied: nvidia-cudnn-cu12==8.9.2.26 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (8.9.2.26)
Requirement already satisfied: nvidia-cublas-cu12==12.1.3.1 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (12.1.3.1)
Requirement already satisfied: nvidia-cufft-cu12==11.0.2.54 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (11.0.2.54)
Requirement already satisfied: nvidia-curand-cu12==10.3.2.106 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (10.3.2.106)
Requirement already satisfied: nvidia-cusolver-cu12==11.4.5.107 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (11.4.5.107)
Requirement already satisfied: nvidia-cusparse-cu12==12.1.0.106 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (12.1.0.106)
Requirement already satisfied: nvidia-nccl-cu12==2.20.5 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (2.20.5)
Requirement already satisfied: nvidia-nvtx-cu12==12.1.105 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (12.1.105)
Requirement already satisfied: triton==2.3.0 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence_transformers) (2.3.0)
Requirement already satisfied: nvidia-nvjitlink-cu12 in /usr/local/lib/python3.10/dist-packages (from nvidia-cusolver-cu12==11.4.5.107->torch>=1.11.0->sentence_transformers) (12.5.82)
Requirement already satisfied: regex!=2019.12.17 in /usr/local/lib/python3.10/dist-packages (from transformers<5.0.0,>=4.34.0->sentence_transformers) (2024.5.15)
Requirement already satisfied: safetensors>=0.4.1 in /usr/local/lib/python3.10/dist-packages (from transformers<5.0.0,>=4.34.0->sentence_transformers) (0.4.3)
Requirement already satisfied: ipython-genutils in /usr/local/lib/python3.10/dist-packages (from ipykernel->jupyter) (0.2.0)
Requirement already satisfied: ipython>=5.0.0 in /usr/local/lib/python3.10/dist-packages (from ipykernel->jupyter) (7.34.0)
Requirement already satisfied: traitlets>=4.1.0 in /usr/local/lib/python3.10/dist-packages (from ipykernel->jupyter) (5.7.1)
Requirement already satisfied: jupyter-client in /usr/local/lib/python3.10/dist-packages (from ipykernel->jupyter) (6.1.12)
Requirement already satisfied: tornado>=4.2 in /usr/local/lib/python3.10/dist-packages (from ipykernel->jupyter) (6.3.3)
Requirement already satisfied: widgetsnbextension~=3.6.0 in /usr/local/lib/python3.10/dist-packages (from ipywidgets->jupyter) (3.6.6)
Requirement already satisfied: jupyterlab-widgets>=1.0.0 in /usr/local/lib/python3.10/dist-packages (from ipywidgets->jupyter) (3.0.11)
Requirement already satisfied: prompt-toolkit!=3.0.0,!=3.0.1,<3.1.0,>=2.0.0 in /usr/local/lib/python3.10/dist-packages (from jupyter-console->jupyter) (3.0.47)
Requirement already satisfied: pygments in /usr/local/lib/python3.10/dist-packages (from jupyter-console->jupyter) (2.16.1)
Requirement already satisfied: lxml in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (4.9.4)
Requirement already satisfied: beautifulsoup4 in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (4.12.3)
Requirement already satisfied: bleach in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (6.1.0)
Requirement already satisfied: defusedxml in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (0.7.1)
Requirement already satisfied: entrypoints>=0.2.2 in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (0.4)
Requirement already satisfied: jupyter-core>=4.7 in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (5.7.2)
Requirement already satisfied: jupyterlab-pygments in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (0.3.0)
Requirement already satisfied: MarkupSafe>=2.0 in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (2.1.5)
Requirement already satisfied: mistune<2,>=0.8.1 in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (0.8.4)
Requirement already satisfied: nbclient>=0.5.0 in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (0.10.0)
Requirement already satisfied: nbformat>=5.1 in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (5.10.4)
Requirement already satisfied: pandocfilters>=1.4.1 in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (1.5.1)
Requirement already satisfied: tinycss2 in /usr/local/lib/python3.10/dist-packages (from nbconvert->jupyter) (1.3.0)
Requirement already satisfied: pyzmq<25,>=17 in /usr/local/lib/python3.10/dist-packages (from notebook->jupyter) (24.0.1)
Requirement already satisfied: argon2-cffi in /usr/local/lib/python3.10/dist-packages (from notebook->jupyter) (23.1.0)
Requirement already satisfied: nest-asyncio>=1.5 in /usr/local/lib/python3.10/dist-packages (from notebook->jupyter) (1.6.0)
Requirement already satisfied: Send2Trash>=1.8.0 in /usr/local/lib/python3.10/dist-packages (from notebook->jupyter) (1.8.3)
Requirement already satisfied: terminado>=0.8.3 in /usr/local/lib/python3.10/dist-packages (from notebook->jupyter) (0.18.1)
Requirement already satisfied: prometheus-client in /usr/local/lib/python3.10/dist-packages (from notebook->jupyter) (0.20.0)
Requirement already satisfied: nbclassic>=0.4.7 in /usr/local/lib/python3.10/dist-packages (from notebook->jupyter) (1.1.0)
Requirement already satisfied: qtpy>=2.4.0 in /usr/local/lib/python3.10/dist-packages (from qtconsole->jupyter) (2.4.1)
Requirement already satisfied: joblib>=1.1.1 in /usr/local/lib/python3.10/dist-packages (from scikit-learn->sentence_transformers) (1.4.2)
Requirement already satisfied: threadpoolctl>=2.0.0 in /usr/local/lib/python3.10/dist-packages (from scikit-learn->sentence_transformers) (3.5.0)
Requirement already satisfied: hyperframe<7,>=6.0 in /usr/local/lib/python3.10/dist-packages (from h2<5,>=3->httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (6.0.1)
Requirement already satisfied: hpack<5,>=4.0 in /usr/local/lib/python3.10/dist-packages (from h2<5,>=3->httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (4.0.0)
Requirement already satisfied: jedi>=0.16 in /usr/local/lib/python3.10/dist-packages (from ipython>=5.0.0->ipykernel->jupyter) (0.19.1)
Requirement already satisfied: decorator in /usr/local/lib/python3.10/dist-packages (from ipython>=5.0.0->ipykernel->jupyter) (4.4.2)
Requirement already satisfied: pickleshare in /usr/local/lib/python3.10/dist-packages (from ipython>=5.0.0->ipykernel->jupyter) (0.7.5)
Requirement already satisfied: backcall in /usr/local/lib/python3.10/dist-packages (from ipython>=5.0.0->ipykernel->jupyter) (0.2.0)
Requirement already satisfied: matplotlib-inline in /usr/local/lib/python3.10/dist-packages (from ipython>=5.0.0->ipykernel->jupyter) (0.1.7)
Requirement already satisfied: pexpect>4.3 in /usr/local/lib/python3.10/dist-packages (from ipython>=5.0.0->ipykernel->jupyter) (4.9.0)
Requirement already satisfied: platformdirs>=2.5 in /usr/local/lib/python3.10/dist-packages (from jupyter-core>=4.7->nbconvert->jupyter) (4.2.2)
Requirement already satisfied: notebook-shim>=0.2.3 in /usr/local/lib/python3.10/dist-packages (from nbclassic>=0.4.7->notebook->jupyter) (0.2.4)
Requirement already satisfied: fastjsonschema>=2.15 in /usr/local/lib/python3.10/dist-packages (from nbformat>=5.1->nbconvert->jupyter) (2.20.0)
Requirement already satisfied: jsonschema>=2.6 in /usr/local/lib/python3.10/dist-packages (from nbformat>=5.1->nbconvert->jupyter) (4.19.2)
Requirement already satisfied: wcwidth in /usr/local/lib/python3.10/dist-packages (from prompt-toolkit!=3.0.0,!=3.0.1,<3.1.0,>=2.0.0->jupyter-console->jupyter) (0.2.13)
Requirement already satisfied: ptyprocess in /usr/local/lib/python3.10/dist-packages (from terminado>=0.8.3->notebook->jupyter) (0.7.0)
Requirement already satisfied: exceptiongroup in /usr/local/lib/python3.10/dist-packages (from anyio->httpx[http2]>=0.14.0->qdrant_client~=1.1.1) (1.2.1)
Requirement already satisfied: argon2-cffi-bindings in /usr/local/lib/python3.10/dist-packages (from argon2-cffi->notebook->jupyter) (21.2.0)
Requirement already satisfied: soupsieve>1.2 in /usr/local/lib/python3.10/dist-packages (from beautifulsoup4->nbconvert->jupyter) (2.5)
Requirement already satisfied: webencodings in /usr/local/lib/python3.10/dist-packages (from bleach->nbconvert->jupyter) (0.5.1)
Requirement already satisfied: humanfriendly>=9.1 in /usr/local/lib/python3.10/dist-packages (from coloredlogs->onnxruntime<2.0.0,>=1.17.0->fastembed) (10.0)
Requirement already satisfied: mpmath<1.4.0,>=1.1.0 in /usr/local/lib/python3.10/dist-packages (from sympy->onnxruntime<2.0.0,>=1.17.0->fastembed) (1.3.0)
Requirement already satisfied: parso<0.9.0,>=0.8.3 in /usr/local/lib/python3.10/dist-packages (from jedi>=0.16->ipython>=5.0.0->ipykernel->jupyter) (0.8.4)
Requirement already satisfied: attrs>=22.2.0 in /usr/local/lib/python3.10/dist-packages (from jsonschema>=2.6->nbformat>=5.1->nbconvert->jupyter) (23.2.0)
Requirement already satisfied: jsonschema-specifications>=2023.03.6 in /usr/local/lib/python3.10/dist-packages (from jsonschema>=2.6->nbformat>=5.1->nbconvert->jupyter) (2023.12.1)
Requirement already satisfied: referencing>=0.28.4 in /usr/local/lib/python3.10/dist-packages (from jsonschema>=2.6->nbformat>=5.1->nbconvert->jupyter) (0.35.1)
Requirement already satisfied: rpds-py>=0.7.1 in /usr/local/lib/python3.10/dist-packages (from jsonschema>=2.6->nbformat>=5.1->nbconvert->jupyter) (0.18.1)
Requirement already satisfied: jupyter-server<3,>=1.8 in /usr/local/lib/python3.10/dist-packages (from notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook->jupyter) (1.24.0)
Requirement already satisfied: cffi>=1.0.1 in /usr/local/lib/python3.10/dist-packages (from argon2-cffi-bindings->argon2-cffi->notebook->jupyter) (1.16.0)
Requirement already satisfied: pycparser in /usr/local/lib/python3.10/dist-packages (from cffi>=1.0.1->argon2-cffi-bindings->argon2-cffi->notebook->jupyter) (2.22)
Requirement already satisfied: websocket-client in /usr/local/lib/python3.10/dist-packages (from jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook->jupyter) (1.8.0)
Installing collected packages: pydantic, qdrant_client
  Attempting uninstall: pydantic
    Found existing installation: pydantic 2.8.0
    Uninstalling pydantic-2.8.0:
      Successfully uninstalled pydantic-2.8.0
  Attempting uninstall: qdrant_client
    Found existing installation: qdrant-client 1.3.2
    Uninstalling qdrant-client-1.3.2:
      Successfully uninstalled qdrant-client-1.3.2
[31mERROR: pip's dependency resolver does not currently take into account all the packages that are installed. This behaviour is the source of the following dependency conflicts.
google-cloud-aiplatform 1.57.0 requires protobuf!=3.20.0,!=3.20.1,!=4.21.0,!=4.21.1,!=4.21.2,!=4.21.3,!=4.21.4,!=4.21.5,<5.0.0dev,>=3.19.5, but you have protobuf 5.27.2 which is incompatible.[0m[31m
[0mSuccessfully installed pydantic-1.10.17 qdrant_client-1.1.7
```

The dataset is provided as a CSV file and contains multiple attributes of the products, including URLs of the product images. That gives us a real case to work on. Let's check the dataset structure and prepare it for further processing.

**For the testing purposes, we can use only a small subset of the dataset. It's enough to show the concept, but you can easily scale it to the whole dataset. The variable below is a fraction of the dataset that will be used for the rest of the notebook. Feel free to change it to `1.0` if you want to use the whole dataset.**

```python
DATASET_FRACTION = 0.1
```

Now, we can load the dataset and see what it contains.

```python
import pandas as pd
import zipfile

with zipfile.ZipFile("./data/amazon-product-dataset-2020.zip", "r") as z:
    with z.open(
        "home/sdf/marketing_sample_for_amazon_com-ecommerce__20200101_20200131__10k_data.csv"
    ) as f:
        dataset_df = pd.read_csv(f).sample(frac=DATASET_FRACTION)

dataset_df.sample(n=5).T
```

<div id="df-874e77c7-35bf-4c69-9c13-63a948f5607f" class="colab-df-container">
    <div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

```
.dataframe tbody tr th {
    vertical-align: top;
}

.dataframe thead th {
    text-align: right;
}
```

</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>4248</th>
      <th>5784</th>
      <th>8839</th>
      <th>9128</th>
      <th>3981</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Uniq Id</th>
      <td>8fef5093eb479b4d6e57e9da43a7f2c6</td>
      <td>95eae46a6d1531897b36b4533571e401</td>
      <td>2bb3761b6fe3bbba43eca93ebe735678</td>
      <td>aa1ee02920a0175c5f924b95d58b83fe</td>
      <td>88165b349420bf28bdad83d297142e86</td>
    </tr>
    <tr>
      <th>Product Name</th>
      <td>Eureka Classroom Supplies Learn to Count Count...</td>
      <td>Rockland Luggage 17 Inch Rolling Backpack, Ban...</td>
      <td>Losi High Endurance Clutch Bell, 14T: 2.0, LOS...</td>
      <td>Hygloss Products Emoji Emoticon Stickers - 240...</td>
      <td>In the Breeze Thin Patriot Tails, 24-Inch</td>
    </tr>
    <tr>
      <th>Brand Name</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Asin</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Category</th>
      <td>NaN</td>
      <td>Clothing, Shoes &amp; Jewelry | Luggage &amp; Travel G...</td>
      <td>Toys &amp; Games | Hobbies | Remote &amp; App Controll...</td>
      <td>Toys &amp; Games | Arts &amp; Crafts | Stickers</td>
      <td>Toys &amp; Games | Sports &amp; Outdoor Play | Kites &amp;...</td>
    </tr>
    <tr>
      <th>Upc Ean Code</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>List Price</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Selling Price</th>
      <td>$10.36</td>
      <td>$28.00</td>
      <td>$21.99</td>
      <td>$8.17</td>
      <td>$8.60</td>
    </tr>
    <tr>
      <th>Quantity</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Model Number</th>
      <td>867470</td>
      <td>R01-BANDANA</td>
      <td>LOSA9127</td>
      <td>1896</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>About Product</th>
      <td>Make sure this fits by entering your model num...</td>
      <td>Make sure this fits by entering your model num...</td>
      <td>Losi High Endurance Clutch Bell, 14T: 2.0, LOS...</td>
      <td>Make sure this fits by entering your model num...</td>
      <td>Make sure this fits by entering your model num...</td>
    </tr>
    <tr>
      <th>Product Specification</th>
      <td>ASIN:B000T2YKIM|ShippingWeight:7.4ounces(Views...</td>
      <td>ProductDimensions:13x10x17inches|ItemWeight:10...</td>
      <td>ProductDimensions:4x2.1x1.2inches|ItemWeight:0...</td>
      <td>ProductDimensions:7.8x4.6x0.1inches|ItemWeight...</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Technical Details</th>
      <td>Color:Animal Counters show up to 2 reviews by ...</td>
      <td>Go to your orders and start the return Select ...</td>
      <td>0.8 ounces (View shipping rates and policies) ...</td>
      <td>Go to your orders and start the return Select ...</td>
      <td>Go to your orders and start the return Select ...</td>
    </tr>
    <tr>
      <th>Shipping Weight</th>
      <td>7.4 ounces</td>
      <td>3.8 pounds</td>
      <td>0.8 ounces</td>
      <td>0.8 ounces</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Dimensions</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Image</th>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
    </tr>
    <tr>
      <th>Variants</th>
      <td>https://www.amazon.com/Eureka-Classroom-Suppli...</td>
      <td>https://www.amazon.com/Rockland-Luggage-Rollin...</td>
      <td>NaN</td>
      <td>https://www.amazon.com/Hygloss-Products-Emoji-...</td>
      <td>https://www.amazon.com/Breeze-Thin-Patriot-Tai...</td>
    </tr>
    <tr>
      <th>Sku</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Url</th>
      <td>https://www.amazon.com/Eureka-Classroom-Suppli...</td>
      <td>https://www.amazon.com/Rockland-Luggage-Rollin...</td>
      <td>https://www.amazon.com/Team-Losi-High-Enduranc...</td>
      <td>https://www.amazon.com/Hygloss-Products-Emoji-...</td>
      <td>https://www.amazon.com/Breeze-Thin-Patriot-Tai...</td>
    </tr>
    <tr>
      <th>Stock</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Details</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Dimensions</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Color</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Ingredients</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Direction To Use</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Is Amazon Seller</th>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
    </tr>
    <tr>
      <th>Size Quantity Variant</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Description</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
  </tbody>
</table>
</div>
    <div class="colab-df-buttons">

<div class="colab-df-container">
    <button class="colab-df-convert" onclick="convertToInteractive('df-874e77c7-35bf-4c69-9c13-63a948f5607f')"
            title="Convert this dataframe to an interactive table."
            style="display:none;">

<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960">
    <path d="M120-120v-720h720v720H120Zm60-500h600v-160H180v160Zm220 220h160v-160H400v160Zm0 220h160v-160H400v160ZM180-400h160v-160H180v160Zm440 0h160v-160H620v160ZM180-180h160v-160H180v160Zm440 0h160v-160H620v160Z"/>
  </svg>
    </button>

<style>
    .colab-df-container {
      display:flex;
      gap: 12px;
    }

    .colab-df-convert {
      background-color: #E8F0FE;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: none;
      fill: #1967D2;
      height: 32px;
      padding: 0 0 0 0;
      width: 32px;
    }

    .colab-df-convert:hover {
      background-color: #E2EBFA;
      box-shadow: 0px 1px 2px rgba(60, 64, 67, 0.3), 0px 1px 3px 1px rgba(60, 64, 67, 0.15);
      fill: #174EA6;
    }

    .colab-df-buttons div {
      margin-bottom: 4px;
    }

    [theme=dark] .colab-df-convert {
      background-color: #3B4455;
      fill: #D2E3FC;
    }

    [theme=dark] .colab-df-convert:hover {
      background-color: #434B5C;
      box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
      filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
      fill: #FFFFFF;
    }
  </style>

```
<script>
  const buttonEl =
    document.querySelector('#df-874e77c7-35bf-4c69-9c13-63a948f5607f button.colab-df-convert');
  buttonEl.style.display =
    google.colab.kernel.accessAllowed ? 'block' : 'none';

  async function convertToInteractive(key) {
    const element = document.querySelector('#df-874e77c7-35bf-4c69-9c13-63a948f5607f');
    const dataTable =
      await google.colab.kernel.invokeFunction('convertToInteractive',
                                                [key], {});
    if (!dataTable) return;

    const docLinkHtml = 'Like what you see? Visit the ' +
      '<a target="_blank" href=https://colab.research.google.com/notebooks/data_table.ipynb>data table notebook</a>'
      + ' to learn more about interactive tables.';
    element.innerHTML = '';
    dataTable['output_type'] = 'display_data';
    await google.colab.output.renderOutput(dataTable, element);
    const docLink = document.createElement('div');
    docLink.innerHTML = docLinkHtml;
    element.appendChild(docLink);
  }
</script>
```

</div>

<div id="df-1278c137-8089-4f9a-be7d-08b21acde8f4">
  <button class="colab-df-quickchart" onclick="quickchart('df-1278c137-8089-4f9a-be7d-08b21acde8f4')"
            title="Suggest charts"
            style="display:none;">

\<svg xmlns="<http://www.w3.org/2000/svg>" height="24px"viewBox="0 0 24 24"
width="24px">
<g>
<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
</g>
</svg>
</button>

<style>
  .colab-df-quickchart {
      --bg-color: #E8F0FE;
      --fill-color: #1967D2;
      --hover-bg-color: #E2EBFA;
      --hover-fill-color: #174EA6;
      --disabled-fill-color: #AAA;
      --disabled-bg-color: #DDD;
  }

  [theme=dark] .colab-df-quickchart {
      --bg-color: #3B4455;
      --fill-color: #D2E3FC;
      --hover-bg-color: #434B5C;
      --hover-fill-color: #FFFFFF;
      --disabled-bg-color: #3B4455;
      --disabled-fill-color: #666;
  }

  .colab-df-quickchart {
    background-color: var(--bg-color);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    fill: var(--fill-color);
    height: 32px;
    padding: 0;
    width: 32px;
  }

  .colab-df-quickchart:hover {
    background-color: var(--hover-bg-color);
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    fill: var(--button-hover-fill-color);
  }

  .colab-df-quickchart-complete:disabled,
  .colab-df-quickchart-complete:disabled:hover {
    background-color: var(--disabled-bg-color);
    fill: var(--disabled-fill-color);
    box-shadow: none;
  }

  .colab-df-spinner {
    border: 2px solid var(--fill-color);
    border-color: transparent;
    border-bottom-color: var(--fill-color);
    animation:
      spin 1s steps(1) infinite;
  }

  @keyframes spin {
    0% {
      border-color: transparent;
      border-bottom-color: var(--fill-color);
      border-left-color: var(--fill-color);
    }
    20% {
      border-color: transparent;
      border-left-color: var(--fill-color);
      border-top-color: var(--fill-color);
    }
    30% {
      border-color: transparent;
      border-left-color: var(--fill-color);
      border-top-color: var(--fill-color);
      border-right-color: var(--fill-color);
    }
    40% {
      border-color: transparent;
      border-right-color: var(--fill-color);
      border-top-color: var(--fill-color);
    }
    60% {
      border-color: transparent;
      border-right-color: var(--fill-color);
    }
    80% {
      border-color: transparent;
      border-right-color: var(--fill-color);
      border-bottom-color: var(--fill-color);
    }
    90% {
      border-color: transparent;
      border-bottom-color: var(--fill-color);
    }
  }
</style>

<script>
    async function quickchart(key) {
      const quickchartButtonEl =
        document.querySelector('#' + key + ' button');
      quickchartButtonEl.disabled = true;  // To prevent multiple clicks.
      quickchartButtonEl.classList.add('colab-df-spinner');
      try {
        const charts = await google.colab.kernel.invokeFunction(
            'suggestCharts', [key], {});
      } catch (error) {
        console.error('Error during call to suggestCharts:', error);
      }
      quickchartButtonEl.classList.remove('colab-df-spinner');
      quickchartButtonEl.classList.add('colab-df-quickchart-complete');
    }
    (() => {
      let quickchartButtonEl =
        document.querySelector('#df-1278c137-8089-4f9a-be7d-08b21acde8f4 button');
      quickchartButtonEl.style.display =
        google.colab.kernel.accessAllowed ? 'block' : 'none';
    })();
  </script>

</div>

```
</div>
```

</div>

```python
dataset_df.shape
```

```
(1000, 28)
```

```python
dataset_df.iloc[0]["Image"]
```

```
'https://images-na.ssl-images-amazon.com/images/I/41SiG59Kt%2BL.jpg|https://images-na.ssl-images-amazon.com/images/I/51gvvBRjG5L.jpg|https://images-na.ssl-images-amazon.com/images/I/51WofS2WwHL.jpg|https://images-na.ssl-images-amazon.com/images/I/51Dk-9h2XEL.jpg|https://images-na.ssl-images-amazon.com/images/I/31tjBvZmVEL.jpg|https://images-na.ssl-images-amazon.com/images/I/31mH8F6HYyL.jpg|https://images-na.ssl-images-amazon.com/images/I/31DVHiEty%2BL.jpg|https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/transparent-pixel.jpg'
```

It turns out a single product may have several images. They are stored in a pipe-separated string.

```python
dataset_df.iloc[0]["Image"].split("|")
```

```
['https://images-na.ssl-images-amazon.com/images/I/41SiG59Kt%2BL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/51gvvBRjG5L.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/51WofS2WwHL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/51Dk-9h2XEL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/31tjBvZmVEL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/31mH8F6HYyL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/31DVHiEty%2BL.jpg',
 'https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/transparent-pixel.jpg']
```

The last entry is common for multiple products, so we can simply remove it.

```python
dataset_df["Image"] = dataset_df["Image"].map(lambda x: x.split("|")[:-1])
```

<hr />

```python
dataset_df.iloc[0]["Image"]
```

```
['https://images-na.ssl-images-amazon.com/images/I/41SiG59Kt%2BL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/51gvvBRjG5L.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/51WofS2WwHL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/51Dk-9h2XEL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/31tjBvZmVEL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/31mH8F6HYyL.jpg',
 'https://images-na.ssl-images-amazon.com/images/I/31DVHiEty%2BL.jpg']
```

```python
dataset_df = dataset_df.explode("Image").dropna(subset=["Image"])
dataset_df.sample(n=5).T
```

<div id="df-344fa27d-f9d7-418c-a03b-be445b7affe2" class="colab-df-container">
    <div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

```
.dataframe tbody tr th {
    vertical-align: top;
}

.dataframe thead th {
    text-align: right;
}
```

</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>7646</th>
      <th>1705</th>
      <th>1656</th>
      <th>6934</th>
      <th>2912</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Uniq Id</th>
      <td>c87f138612fe395f96266d0a1597faf7</td>
      <td>a3daad923af839e1e0c4adf447f1b0d8</td>
      <td>925f24d67d03a19f33f83015c759c23a</td>
      <td>83177fad1c5979dc0a5b46bbb9580260</td>
      <td>78d3087cc7035ed78eeb102366a76e02</td>
    </tr>
    <tr>
      <th>Product Name</th>
      <td>Amscan Dream Big Disposable Paper Dessert Plat...</td>
      <td>12 Inch Trolls Girls' Bike</td>
      <td>Home Dynamix Harper Ash Accent Rug, 48" Round,...</td>
      <td>FanWraps Star Wars Resistance Droids Passenger...</td>
      <td>MightySkins Skin Compatible with Hover-1 H1 Ho...</td>
    </tr>
    <tr>
      <th>Brand Name</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Asin</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Category</th>
      <td>Home &amp; Kitchen | Event &amp; Party Supplies | Tabl...</td>
      <td>Sports &amp; Outdoors | Outdoor Recreation | Cycli...</td>
      <td>Home &amp; Kitchen | Home Décor | Kids' Room Décor...</td>
      <td>NaN</td>
      <td>Sports &amp; Outdoors | Outdoor Recreation | Skate...</td>
    </tr>
    <tr>
      <th>Upc Ean Code</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>List Price</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Selling Price</th>
      <td>$12.89</td>
      <td>$99.99</td>
      <td>$52.39</td>
      <td>$19.99</td>
      <td>$9.86 - $11.86</td>
    </tr>
    <tr>
      <th>Quantity</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Model Number</th>
      <td>741377</td>
      <td>8008-50ZTJ</td>
      <td>NaN</td>
      <td>FW 1221</td>
      <td>HOVH1-Laughing Skulls</td>
    </tr>
    <tr>
      <th>About Product</th>
      <td>Make sure this fits by entering your model num...</td>
      <td>Make sure this fits by entering your model num...</td>
      <td>Make sure this fits by entering your model num...</td>
      <td>Make sure this fits by entering your model num...</td>
      <td>SET THE TREND: Show off your own unique style ...</td>
    </tr>
    <tr>
      <th>Product Specification</th>
      <td>ProductDimensions:7x7x2.3inches|ItemWeight:0.3...</td>
      <td>Product Dimensions:         28.2 x 6.8 x 15 in...</td>
      <td>NaN</td>
      <td>ProductDimensions:19.8x13.8x0.1inches|ItemWeig...</td>
      <td>ProductDimensions:13x0.1x12inches|ItemWeight:0...</td>
    </tr>
    <tr>
      <th>Technical Details</th>
      <td>Dream big graduate! Share them to your guests ...</td>
      <td>Go to your orders and start the return Select ...</td>
      <td>Go to your orders and start the return Select ...</td>
      <td>show up to 2 reviews by default Made from perf...</td>
      <td>Do You Want Your Hover-1 Ultra Hover board Sco...</td>
    </tr>
    <tr>
      <th>Shipping Weight</th>
      <td>9.6 ounces</td>
      <td>23.1 pounds</td>
      <td>NaN</td>
      <td>5 ounces</td>
      <td>0.96 ounces</td>
    </tr>
    <tr>
      <th>Product Dimensions</th>
      <td>NaN</td>
      <td>28.2 x 6.8 x 15 inches  20.3 pounds</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Image</th>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
    </tr>
    <tr>
      <th>Variants</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>https://www.amazon.com/Home-Dynamix-Harper-Acc...</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Sku</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Url</th>
      <td>https://www.amazon.com/Disposable-Dessert-Grad...</td>
      <td>https://www.amazon.com/Trolls-12-Inch-Girls-Bi...</td>
      <td>https://www.amazon.com/Home-Dynamix-Harper-Acc...</td>
      <td>https://www.amazon.com/FanWraps-Resistance-Dro...</td>
      <td>https://www.amazon.com/MightySkins-Hover-1-Ult...</td>
    </tr>
    <tr>
      <th>Stock</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Details</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Dimensions</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Color</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Ingredients</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Direction To Use</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Is Amazon Seller</th>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
      <td>N</td>
    </tr>
    <tr>
      <th>Size Quantity Variant</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Description</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
  </tbody>
</table>
</div>
    <div class="colab-df-buttons">

<div class="colab-df-container">
    <button class="colab-df-convert" onclick="convertToInteractive('df-344fa27d-f9d7-418c-a03b-be445b7affe2')"
            title="Convert this dataframe to an interactive table."
            style="display:none;">

<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960">
    <path d="M120-120v-720h720v720H120Zm60-500h600v-160H180v160Zm220 220h160v-160H400v160Zm0 220h160v-160H400v160ZM180-400h160v-160H180v160Zm440 0h160v-160H620v160ZM180-180h160v-160H180v160Zm440 0h160v-160H620v160Z"/>
  </svg>
    </button>

<style>
    .colab-df-container {
      display:flex;
      gap: 12px;
    }

    .colab-df-convert {
      background-color: #E8F0FE;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: none;
      fill: #1967D2;
      height: 32px;
      padding: 0 0 0 0;
      width: 32px;
    }

    .colab-df-convert:hover {
      background-color: #E2EBFA;
      box-shadow: 0px 1px 2px rgba(60, 64, 67, 0.3), 0px 1px 3px 1px rgba(60, 64, 67, 0.15);
      fill: #174EA6;
    }

    .colab-df-buttons div {
      margin-bottom: 4px;
    }

    [theme=dark] .colab-df-convert {
      background-color: #3B4455;
      fill: #D2E3FC;
    }

    [theme=dark] .colab-df-convert:hover {
      background-color: #434B5C;
      box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
      filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
      fill: #FFFFFF;
    }
  </style>

```
<script>
  const buttonEl =
    document.querySelector('#df-344fa27d-f9d7-418c-a03b-be445b7affe2 button.colab-df-convert');
  buttonEl.style.display =
    google.colab.kernel.accessAllowed ? 'block' : 'none';

  async function convertToInteractive(key) {
    const element = document.querySelector('#df-344fa27d-f9d7-418c-a03b-be445b7affe2');
    const dataTable =
      await google.colab.kernel.invokeFunction('convertToInteractive',
                                                [key], {});
    if (!dataTable) return;

    const docLinkHtml = 'Like what you see? Visit the ' +
      '<a target="_blank" href=https://colab.research.google.com/notebooks/data_table.ipynb>data table notebook</a>'
      + ' to learn more about interactive tables.';
    element.innerHTML = '';
    dataTable['output_type'] = 'display_data';
    await google.colab.output.renderOutput(dataTable, element);
    const docLink = document.createElement('div');
    docLink.innerHTML = docLinkHtml;
    element.appendChild(docLink);
  }
</script>
```

</div>

<div id="df-5dc0a224-9cda-4bd1-a4b4-54ab308a464f">
  <button class="colab-df-quickchart" onclick="quickchart('df-5dc0a224-9cda-4bd1-a4b4-54ab308a464f')"
            title="Suggest charts"
            style="display:none;">

\<svg xmlns="<http://www.w3.org/2000/svg>" height="24px"viewBox="0 0 24 24"
width="24px">
<g>
<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
</g>
</svg>
</button>

<style>
  .colab-df-quickchart {
      --bg-color: #E8F0FE;
      --fill-color: #1967D2;
      --hover-bg-color: #E2EBFA;
      --hover-fill-color: #174EA6;
      --disabled-fill-color: #AAA;
      --disabled-bg-color: #DDD;
  }

  [theme=dark] .colab-df-quickchart {
      --bg-color: #3B4455;
      --fill-color: #D2E3FC;
      --hover-bg-color: #434B5C;
      --hover-fill-color: #FFFFFF;
      --disabled-bg-color: #3B4455;
      --disabled-fill-color: #666;
  }

  .colab-df-quickchart {
    background-color: var(--bg-color);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    fill: var(--fill-color);
    height: 32px;
    padding: 0;
    width: 32px;
  }

  .colab-df-quickchart:hover {
    background-color: var(--hover-bg-color);
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    fill: var(--button-hover-fill-color);
  }

  .colab-df-quickchart-complete:disabled,
  .colab-df-quickchart-complete:disabled:hover {
    background-color: var(--disabled-bg-color);
    fill: var(--disabled-fill-color);
    box-shadow: none;
  }

  .colab-df-spinner {
    border: 2px solid var(--fill-color);
    border-color: transparent;
    border-bottom-color: var(--fill-color);
    animation:
      spin 1s steps(1) infinite;
  }

  @keyframes spin {
    0% {
      border-color: transparent;
      border-bottom-color: var(--fill-color);
      border-left-color: var(--fill-color);
    }
    20% {
      border-color: transparent;
      border-left-color: var(--fill-color);
      border-top-color: var(--fill-color);
    }
    30% {
      border-color: transparent;
      border-left-color: var(--fill-color);
      border-top-color: var(--fill-color);
      border-right-color: var(--fill-color);
    }
    40% {
      border-color: transparent;
      border-right-color: var(--fill-color);
      border-top-color: var(--fill-color);
    }
    60% {
      border-color: transparent;
      border-right-color: var(--fill-color);
    }
    80% {
      border-color: transparent;
      border-right-color: var(--fill-color);
      border-bottom-color: var(--fill-color);
    }
    90% {
      border-color: transparent;
      border-bottom-color: var(--fill-color);
    }
  }
</style>

<script>
    async function quickchart(key) {
      const quickchartButtonEl =
        document.querySelector('#' + key + ' button');
      quickchartButtonEl.disabled = true;  // To prevent multiple clicks.
      quickchartButtonEl.classList.add('colab-df-spinner');
      try {
        const charts = await google.colab.kernel.invokeFunction(
            'suggestCharts', [key], {});
      } catch (error) {
        console.error('Error during call to suggestCharts:', error);
      }
      quickchartButtonEl.classList.remove('colab-df-spinner');
      quickchartButtonEl.classList.add('colab-df-quickchart-complete');
    }
    (() => {
      let quickchartButtonEl =
        document.querySelector('#df-5dc0a224-9cda-4bd1-a4b4-54ab308a464f button');
      quickchartButtonEl.style.display =
        google.colab.kernel.accessAllowed ? 'block' : 'none';
    })();
  </script>

</div>

```
</div>
```

</div>

## Downloading the images

We want to create the embeddings out of the images, but we need to have them downloaded in the first place.

```python
from typing import Optional

import urllib
import os


def download_file(url: str) -> Optional[str]:
    basename = os.path.basename(url)
    target_path = f"./data/images/{basename}"
    if not os.path.exists(target_path):
        try:
            urllib.request.urlretrieve(url, target_path)
        except urllib.error.HTTPError:
            return None
    return target_path
```

<hr />

```python
import numpy as np

# Our download_file function returns None in case of any HTTP issues.
# We can use that property to filter out the problematic images.
dataset_df["LocalImage"] = (
    dataset_df["Image"].map(download_file).replace({None: np.nan})
)
dataset_df = dataset_df.dropna(subset=["LocalImage"])
dataset_df.sample(n=5).T
```

<div id="df-5fa5faa3-ba0b-4312-b0a1-a8154a42ddca" class="colab-df-container">
    <div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

```
.dataframe tbody tr th {
    vertical-align: top;
}

.dataframe thead th {
    text-align: right;
}
```

</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>64</th>
      <th>2591</th>
      <th>3483</th>
      <th>3045</th>
      <th>7589</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Uniq Id</th>
      <td>b4358a38037a7e7fbcd7fe16970e7bff</td>
      <td>853ae53d4c3dd833d07787f452e3c13a</td>
      <td>cb7e81a2574c42628feb2ea88cc465c8</td>
      <td>76cd3a9b8a05103b70fefe3766459d60</td>
      <td>10801e1b6ef7e39eb8875234a49b7d70</td>
    </tr>
    <tr>
      <th>Product Name</th>
      <td>DC Collectibles DCTV: Black Lightning Resin St...</td>
      <td>Click N' Play Set of 8 Kids Pretend Play Beaut...</td>
      <td>Application DC Comics Originals Justice League...</td>
      <td>Suck UK TV Lunch Box I Food Storage Containers...</td>
      <td>LEGO Disney Ariel’s Seaside Castle 41160 4+ Bu...</td>
    </tr>
    <tr>
      <th>Brand Name</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Asin</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Category</th>
      <td>Toys &amp; Games | Collectible Toys | Statues, Bob...</td>
      <td>Toys &amp; Games | Dress Up &amp; Pretend Play | Beaut...</td>
      <td>Toys &amp; Games | Arts &amp; Crafts</td>
      <td>Home &amp; Kitchen | Kitchen &amp; Dining | Storage &amp; ...</td>
      <td>Toys &amp; Games | Building Toys | Building Sets</td>
    </tr>
    <tr>
      <th>Upc Ean Code</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>List Price</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Selling Price</th>
      <td>$17.75</td>
      <td>$19.99</td>
      <td>$6.99</td>
      <td>$18.48</td>
      <td>$19.78 $ 19 . 78</td>
    </tr>
    <tr>
      <th>Quantity</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Model Number</th>
      <td>DEC170420</td>
      <td>CNP01008</td>
      <td>P-DC-0136-S</td>
      <td>SK LUNCHTV3</td>
      <td>6250992</td>
    </tr>
    <tr>
      <th>About Product</th>
      <td>Make sure this fits by entering your model num...</td>
      <td>Make sure this fits by entering your model num...</td>
      <td>Make sure this fits by entering your model num...</td>
      <td>Make sure this fits by entering your model num...</td>
      <td>Make sure this fits by entering your model num...</td>
    </tr>
    <tr>
      <th>Product Specification</th>
      <td>ProductDimensions:3x3x12.4inches|ItemWeight:2p...</td>
      <td>ProductDimensions:12x12x2inches|ItemWeight:11....</td>
      <td>ProductDimensions:4.8x0x6inches|ItemWeight:0.8...</td>
      <td>ProductDimensions:3.9x8.1x7.7inches|ItemWeight...</td>
      <td>ProductDimensions:10.3x7.5x2.4inches|ItemWeigh...</td>
    </tr>
    <tr>
      <th>Technical Details</th>
      <td>show up to 2 reviews by default Jefferson Pier...</td>
      <td>Go to your orders and start the return Select ...</td>
      <td>show up to 2 reviews by default C&amp;D Visionary ...</td>
      <td>Go to your orders and start the return Select ...</td>
      <td>show up to 2 reviews by default Let your child...</td>
    </tr>
    <tr>
      <th>Shipping Weight</th>
      <td>3.7 pounds</td>
      <td>11.2 ounces</td>
      <td>0.8 ounces</td>
      <td>15.5 ounces</td>
      <td>11.2 ounces</td>
    </tr>
    <tr>
      <th>Product Dimensions</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Image</th>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
    </tr>
    <tr>
      <th>Variants</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>https://www.amazon.com/Suck-UK-Storage-Contain...</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Sku</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Url</th>
      <td>https://www.amazon.com/DC-Collectibles-DCTV-Li...</td>
      <td>https://www.amazon.com/Click-Play-Pretend-Hair...</td>
      <td>https://www.amazon.com/Application-Comics-Orig...</td>
      <td>https://www.amazon.com/Suck-UK-Storage-Contain...</td>
      <td>https://www.amazon.com/LEGO-Disney-Ariels-Seas...</td>
    </tr>
    <tr>
      <th>Stock</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Details</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Dimensions</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Color</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Ingredients</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Direction To Use</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Is Amazon Seller</th>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
    </tr>
    <tr>
      <th>Size Quantity Variant</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Description</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>LocalImage</th>
      <td>./data/images/41vJ5amvKeL.jpg</td>
      <td>./data/images/51sNsHAae4L.jpg</td>
      <td>./data/images/61g66OGcaaL.jpg</td>
      <td>./data/images/41EULQJ9LxL.jpg</td>
      <td>./data/images/41Np1paMBvL.jpg</td>
    </tr>
  </tbody>
</table>
</div>
    <div class="colab-df-buttons">

<div class="colab-df-container">
    <button class="colab-df-convert" onclick="convertToInteractive('df-5fa5faa3-ba0b-4312-b0a1-a8154a42ddca')"
            title="Convert this dataframe to an interactive table."
            style="display:none;">

<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960">
    <path d="M120-120v-720h720v720H120Zm60-500h600v-160H180v160Zm220 220h160v-160H400v160Zm0 220h160v-160H400v160ZM180-400h160v-160H180v160Zm440 0h160v-160H620v160ZM180-180h160v-160H180v160Zm440 0h160v-160H620v160Z"/>
  </svg>
    </button>

<style>
    .colab-df-container {
      display:flex;
      gap: 12px;
    }

    .colab-df-convert {
      background-color: #E8F0FE;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: none;
      fill: #1967D2;
      height: 32px;
      padding: 0 0 0 0;
      width: 32px;
    }

    .colab-df-convert:hover {
      background-color: #E2EBFA;
      box-shadow: 0px 1px 2px rgba(60, 64, 67, 0.3), 0px 1px 3px 1px rgba(60, 64, 67, 0.15);
      fill: #174EA6;
    }

    .colab-df-buttons div {
      margin-bottom: 4px;
    }

    [theme=dark] .colab-df-convert {
      background-color: #3B4455;
      fill: #D2E3FC;
    }

    [theme=dark] .colab-df-convert:hover {
      background-color: #434B5C;
      box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
      filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
      fill: #FFFFFF;
    }
  </style>

```
<script>
  const buttonEl =
    document.querySelector('#df-5fa5faa3-ba0b-4312-b0a1-a8154a42ddca button.colab-df-convert');
  buttonEl.style.display =
    google.colab.kernel.accessAllowed ? 'block' : 'none';

  async function convertToInteractive(key) {
    const element = document.querySelector('#df-5fa5faa3-ba0b-4312-b0a1-a8154a42ddca');
    const dataTable =
      await google.colab.kernel.invokeFunction('convertToInteractive',
                                                [key], {});
    if (!dataTable) return;

    const docLinkHtml = 'Like what you see? Visit the ' +
      '<a target="_blank" href=https://colab.research.google.com/notebooks/data_table.ipynb>data table notebook</a>'
      + ' to learn more about interactive tables.';
    element.innerHTML = '';
    dataTable['output_type'] = 'display_data';
    await google.colab.output.renderOutput(dataTable, element);
    const docLink = document.createElement('div');
    docLink.innerHTML = docLinkHtml;
    element.appendChild(docLink);
  }
</script>
```

</div>

<div id="df-609642a7-3ada-4b9b-8e7d-7abd459ba343">
  <button class="colab-df-quickchart" onclick="quickchart('df-609642a7-3ada-4b9b-8e7d-7abd459ba343')"
            title="Suggest charts"
            style="display:none;">

\<svg xmlns="<http://www.w3.org/2000/svg>" height="24px"viewBox="0 0 24 24"
width="24px">
<g>
<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
</g>
</svg>
</button>

<style>
  .colab-df-quickchart {
      --bg-color: #E8F0FE;
      --fill-color: #1967D2;
      --hover-bg-color: #E2EBFA;
      --hover-fill-color: #174EA6;
      --disabled-fill-color: #AAA;
      --disabled-bg-color: #DDD;
  }

  [theme=dark] .colab-df-quickchart {
      --bg-color: #3B4455;
      --fill-color: #D2E3FC;
      --hover-bg-color: #434B5C;
      --hover-fill-color: #FFFFFF;
      --disabled-bg-color: #3B4455;
      --disabled-fill-color: #666;
  }

  .colab-df-quickchart {
    background-color: var(--bg-color);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    fill: var(--fill-color);
    height: 32px;
    padding: 0;
    width: 32px;
  }

  .colab-df-quickchart:hover {
    background-color: var(--hover-bg-color);
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    fill: var(--button-hover-fill-color);
  }

  .colab-df-quickchart-complete:disabled,
  .colab-df-quickchart-complete:disabled:hover {
    background-color: var(--disabled-bg-color);
    fill: var(--disabled-fill-color);
    box-shadow: none;
  }

  .colab-df-spinner {
    border: 2px solid var(--fill-color);
    border-color: transparent;
    border-bottom-color: var(--fill-color);
    animation:
      spin 1s steps(1) infinite;
  }

  @keyframes spin {
    0% {
      border-color: transparent;
      border-bottom-color: var(--fill-color);
      border-left-color: var(--fill-color);
    }
    20% {
      border-color: transparent;
      border-left-color: var(--fill-color);
      border-top-color: var(--fill-color);
    }
    30% {
      border-color: transparent;
      border-left-color: var(--fill-color);
      border-top-color: var(--fill-color);
      border-right-color: var(--fill-color);
    }
    40% {
      border-color: transparent;
      border-right-color: var(--fill-color);
      border-top-color: var(--fill-color);
    }
    60% {
      border-color: transparent;
      border-right-color: var(--fill-color);
    }
    80% {
      border-color: transparent;
      border-right-color: var(--fill-color);
      border-bottom-color: var(--fill-color);
    }
    90% {
      border-color: transparent;
      border-bottom-color: var(--fill-color);
    }
  }
</style>

<script>
    async function quickchart(key) {
      const quickchartButtonEl =
        document.querySelector('#' + key + ' button');
      quickchartButtonEl.disabled = true;  // To prevent multiple clicks.
      quickchartButtonEl.classList.add('colab-df-spinner');
      try {
        const charts = await google.colab.kernel.invokeFunction(
            'suggestCharts', [key], {});
      } catch (error) {
        console.error('Error during call to suggestCharts:', error);
      }
      quickchartButtonEl.classList.remove('colab-df-spinner');
      quickchartButtonEl.classList.add('colab-df-quickchart-complete');
    }
    (() => {
      let quickchartButtonEl =
        document.querySelector('#df-609642a7-3ada-4b9b-8e7d-7abd459ba343 button');
      quickchartButtonEl.style.display =
        google.colab.kernel.accessAllowed ? 'block' : 'none';
    })();
  </script>

</div>

```
</div>
```

</div>

## Creating the embeddings

There are various options for creating the embeddings out of our images. But do not even think about training your neural encoder from scratch! Plenty of pre-trained models are available, and some may already give you some decent results in your domain. And if not, you can use them as a base for the fine-tuning that might be done way faster than the full training.

### Available options

Using the pretrained models is easy if you choose a library that exposes them with a convenient interface. Some of the possibilities are:

- [torchvision](https://pytorch.org/vision/stable/index.html) - part of PyTorch
- [embetter](https://koaning.github.io/embetter/) - if you prefer using pandas-like API, that's a great choice
- [Sentence-Transformers](https://www.sbert.net/examples/applications/image-search/README.html) - one of the standard libraries for NLP exposes OpenAI CLIP model as well
- [FastEmbed](https://github.com/qdrant/fastembed) - Light-weight, CPU-first library to generate vector embeddings using the [ONNX runtime](https://onnxruntime.ai/) by Qdrant.

### Choosing the right model

If you run an e-commerce business, you probably already have a standard full-text search mechanism. Reverse image search is one option to enrich the user experience, but if you also want to experiment with [hybrid search](https://qdrant.tech/articles/hybrid-search/), you should keep that in mind from the beginning. If that's your scenario, it's better to consider multimodality from day one. Such a model can encode texts and images in the same vector space.

For that reason, we are going to use the OpenAI CLIP model, so in the future, we can extend our search mechanism with a semantic search using the same component.

```python
from fastembed import ImageEmbedding

model = ImageEmbedding(model_name="Qdrant/clip-ViT-B-32-vision")
```

```
Fetching 3 files:   0%|          | 0/3 [00:00<?, ?it/s]
```

```python
from PIL import Image

image = Image.open(dataset_df.iloc[0]["LocalImage"])
image
```

![png](documentation/101-foundations/ecommerce-reverse-image-search/output_21_0.png)

```python
image_embedding = next(model.embed([dataset_df.iloc[0]["LocalImage"]]))
image_embedding.shape
```

```
(512,)
```

```python
image_embedding
```

That's what a single embedding look like. But we need to calculate them for each image in our dataset.

```python
from typing import List


def calculate_embedding(image_path: str) -> Optional[List[float]]:
    try:
        return next(model.embed([image_path])).tolist()
    except Exception:
        return None
```

<hr />

```python
# Again, our helper function returns None in case of any error, such as
# unsupported image format. We need to remove those entries.
dataset_df["Embedding"] = dataset_df["LocalImage"].map(calculate_embedding)
dataset_df["Embedding"] = dataset_df["Embedding"].replace({None: np.nan})
dataset_df = dataset_df.dropna(subset=["Embedding"])
dataset_df.sample(n=5).T
```

<div id="df-fc636be5-2c7e-4800-9283-db3ff5359fb8" class="colab-df-container">
    <div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

```
.dataframe tbody tr th {
    vertical-align: top;
}

.dataframe thead th {
    text-align: right;
}
```

</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>8688</th>
      <th>2453</th>
      <th>7846</th>
      <th>9192</th>
      <th>642</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Uniq Id</th>
      <td>4f870803642cd124be4b6f0c89e9d4bf</td>
      <td>1b038ee56304c43ba0feb5e405c05c47</td>
      <td>0b65e29108345f6d68e9eb18fd1ee020</td>
      <td>c4ebd4572a2a0710b3b074fd4302bd10</td>
      <td>198651a0f2df856435f4e7401d2329ca</td>
    </tr>
    <tr>
      <th>Product Name</th>
      <td>Safescan ScanSafe Concierge Card Case with RFI...</td>
      <td>Playgro 0184557 Bendy Ball for Baby Infant Tod...</td>
      <td>EPIKGO Sport Balance Board Self Balance Scoote...</td>
      <td>Rubie's Costume Men's Batman Arkham City Adult...</td>
      <td>DJI Smart Controller</td>
    </tr>
    <tr>
      <th>Brand Name</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Asin</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Category</th>
      <td>Toys &amp; Games | Novelty &amp; Gag Toys</td>
      <td>Baby Products | Baby Care | Pacifiers, Teether...</td>
      <td>Sports &amp; Outdoors | Outdoor Recreation | Skate...</td>
      <td>Clothing, Shoes &amp; Jewelry | Costumes &amp; Accesso...</td>
      <td>Toys &amp; Games | Hobbies | Remote &amp; App Controll...</td>
    </tr>
    <tr>
      <th>Upc Ean Code</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>List Price</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Selling Price</th>
      <td>$8.32</td>
      <td>$12.03</td>
      <td>$199.00</td>
      <td>$38.00</td>
      <td>$718.98</td>
    </tr>
    <tr>
      <th>Quantity</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Model Number</th>
      <td>SCON-TEA</td>
      <td>0184557</td>
      <td>EPIKGO Sport</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>About Product</th>
      <td>Make sure this fits by entering your model num...</td>
      <td>Rattle sounds for baby's auditory stimulation ...</td>
      <td>Make sure this fits by entering your model num...</td>
      <td>100% Synthetic | Imported | Hand Wash | Printe...</td>
      <td>Make sure this fits by entering your model num...</td>
    </tr>
    <tr>
      <th>Product Specification</th>
      <td>ProductDimensions:4.1x3x0.2inches|ItemWeight:0...</td>
      <td>NaN</td>
      <td>Product Dimensions:         31 x 12 x 12 inche...</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Technical Details</th>
      <td>Color:Teal  |  Size:One Size show up to 2 revi...</td>
      <td>Style:Bendy Ball show up to 2 reviews by defau...</td>
      <td>Introducing the EPIKGO SPORTS Self-Balancing B...</td>
      <td>With costumes designed for toddlers through pl...</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Shipping Weight</th>
      <td>0.64 ounces</td>
      <td>9.1 ounces</td>
      <td>41.2 pounds</td>
      <td>10.7 ounces</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Dimensions</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>31 x 12 x 12 inches  33 pounds</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Image</th>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
      <td>https://images-na.ssl-images-amazon.com/images...</td>
    </tr>
    <tr>
      <th>Variants</th>
      <td>https://www.amazon.com/Scansafe-Concierge-Card...</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>https://www.amazon.com/Rubies-Batman-Arkham-Mu...</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Sku</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Url</th>
      <td>https://www.amazon.com/Scansafe-Concierge-Card...</td>
      <td>https://www.amazon.com/Playgro-0184557-Childre...</td>
      <td>https://www.amazon.com/EPIKGO-Sport-All-Terrai...</td>
      <td>https://www.amazon.com/Rubies-Batman-Arkham-Mu...</td>
      <td>https://www.amazon.com/DJI-CP-MA-00000080-01-S...</td>
    </tr>
    <tr>
      <th>Stock</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Details</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Dimensions</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Color</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Ingredients</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Direction To Use</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Is Amazon Seller</th>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
      <td>Y</td>
    </tr>
    <tr>
      <th>Size Quantity Variant</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Product Description</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>LocalImage</th>
      <td>./data/images/51Sws0v1GkL.jpg</td>
      <td>./data/images/416vTIPTJDL.jpg</td>
      <td>./data/images/51pCEz-LL0L.jpg</td>
      <td>./data/images/51p0gDolMyL.jpg</td>
      <td>./data/images/41Y6SkFMnTL.jpg</td>
    </tr>
    <tr>
      <th>Embedding</th>
      <td>[-0.01141652837395668, 0.014521843753755093, 0...</td>
      <td>[0.004719291348010302, 0.0180919598788023, -0....</td>
      <td>[-0.01707524061203003, -0.008010529913008213, ...</td>
      <td>[0.009645373560488224, 0.0459967665374279, 0.0...</td>
      <td>[0.017103899270296097, 0.009327375330030918, 0...</td>
    </tr>
  </tbody>
</table>
</div>
    <div class="colab-df-buttons">

<div class="colab-df-container">
    <button class="colab-df-convert" onclick="convertToInteractive('df-fc636be5-2c7e-4800-9283-db3ff5359fb8')"
            title="Convert this dataframe to an interactive table."
            style="display:none;">

<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960">
    <path d="M120-120v-720h720v720H120Zm60-500h600v-160H180v160Zm220 220h160v-160H400v160Zm0 220h160v-160H400v160ZM180-400h160v-160H180v160Zm440 0h160v-160H620v160ZM180-180h160v-160H180v160Zm440 0h160v-160H620v160Z"/>
  </svg>
    </button>

<style>
    .colab-df-container {
      display:flex;
      gap: 12px;
    }

    .colab-df-convert {
      background-color: #E8F0FE;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: none;
      fill: #1967D2;
      height: 32px;
      padding: 0 0 0 0;
      width: 32px;
    }

    .colab-df-convert:hover {
      background-color: #E2EBFA;
      box-shadow: 0px 1px 2px rgba(60, 64, 67, 0.3), 0px 1px 3px 1px rgba(60, 64, 67, 0.15);
      fill: #174EA6;
    }

    .colab-df-buttons div {
      margin-bottom: 4px;
    }

    [theme=dark] .colab-df-convert {
      background-color: #3B4455;
      fill: #D2E3FC;
    }

    [theme=dark] .colab-df-convert:hover {
      background-color: #434B5C;
      box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
      filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
      fill: #FFFFFF;
    }
  </style>

```
<script>
  const buttonEl =
    document.querySelector('#df-fc636be5-2c7e-4800-9283-db3ff5359fb8 button.colab-df-convert');
  buttonEl.style.display =
    google.colab.kernel.accessAllowed ? 'block' : 'none';

  async function convertToInteractive(key) {
    const element = document.querySelector('#df-fc636be5-2c7e-4800-9283-db3ff5359fb8');
    const dataTable =
      await google.colab.kernel.invokeFunction('convertToInteractive',
                                                [key], {});
    if (!dataTable) return;

    const docLinkHtml = 'Like what you see? Visit the ' +
      '<a target="_blank" href=https://colab.research.google.com/notebooks/data_table.ipynb>data table notebook</a>'
      + ' to learn more about interactive tables.';
    element.innerHTML = '';
    dataTable['output_type'] = 'display_data';
    await google.colab.output.renderOutput(dataTable, element);
    const docLink = document.createElement('div');
    docLink.innerHTML = docLinkHtml;
    element.appendChild(docLink);
  }
</script>
```

</div>

<div id="df-527214cd-e66c-4240-bac5-5a9629fc4f01">
  <button class="colab-df-quickchart" onclick="quickchart('df-527214cd-e66c-4240-bac5-5a9629fc4f01')"
            title="Suggest charts"
            style="display:none;">

\<svg xmlns="<http://www.w3.org/2000/svg>" height="24px"viewBox="0 0 24 24"
width="24px">
<g>
<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
</g>
</svg>
</button>

<style>
  .colab-df-quickchart {
      --bg-color: #E8F0FE;
      --fill-color: #1967D2;
      --hover-bg-color: #E2EBFA;
      --hover-fill-color: #174EA6;
      --disabled-fill-color: #AAA;
      --disabled-bg-color: #DDD;
  }

  [theme=dark] .colab-df-quickchart {
      --bg-color: #3B4455;
      --fill-color: #D2E3FC;
      --hover-bg-color: #434B5C;
      --hover-fill-color: #FFFFFF;
      --disabled-bg-color: #3B4455;
      --disabled-fill-color: #666;
  }

  .colab-df-quickchart {
    background-color: var(--bg-color);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    fill: var(--fill-color);
    height: 32px;
    padding: 0;
    width: 32px;
  }

  .colab-df-quickchart:hover {
    background-color: var(--hover-bg-color);
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    fill: var(--button-hover-fill-color);
  }

  .colab-df-quickchart-complete:disabled,
  .colab-df-quickchart-complete:disabled:hover {
    background-color: var(--disabled-bg-color);
    fill: var(--disabled-fill-color);
    box-shadow: none;
  }

  .colab-df-spinner {
    border: 2px solid var(--fill-color);
    border-color: transparent;
    border-bottom-color: var(--fill-color);
    animation:
      spin 1s steps(1) infinite;
  }

  @keyframes spin {
    0% {
      border-color: transparent;
      border-bottom-color: var(--fill-color);
      border-left-color: var(--fill-color);
    }
    20% {
      border-color: transparent;
      border-left-color: var(--fill-color);
      border-top-color: var(--fill-color);
    }
    30% {
      border-color: transparent;
      border-left-color: var(--fill-color);
      border-top-color: var(--fill-color);
      border-right-color: var(--fill-color);
    }
    40% {
      border-color: transparent;
      border-right-color: var(--fill-color);
      border-top-color: var(--fill-color);
    }
    60% {
      border-color: transparent;
      border-right-color: var(--fill-color);
    }
    80% {
      border-color: transparent;
      border-right-color: var(--fill-color);
      border-bottom-color: var(--fill-color);
    }
    90% {
      border-color: transparent;
      border-bottom-color: var(--fill-color);
    }
  }
</style>

<script>
    async function quickchart(key) {
      const quickchartButtonEl =
        document.querySelector('#' + key + ' button');
      quickchartButtonEl.disabled = true;  // To prevent multiple clicks.
      quickchartButtonEl.classList.add('colab-df-spinner');
      try {
        const charts = await google.colab.kernel.invokeFunction(
            'suggestCharts', [key], {});
      } catch (error) {
        console.error('Error during call to suggestCharts:', error);
      }
      quickchartButtonEl.classList.remove('colab-df-spinner');
      quickchartButtonEl.classList.add('colab-df-quickchart-complete');
    }
    (() => {
      let quickchartButtonEl =
        document.querySelector('#df-527214cd-e66c-4240-bac5-5a9629fc4f01 button');
      quickchartButtonEl.style.display =
        google.colab.kernel.accessAllowed ? 'block' : 'none';
    })();
  </script>

</div>

```
</div>
```

</div>

```python
dataset_df.to_parquet("./data/amazon-with-embeddings.parquet")
```

## Indexing embeddings in Qdrant

Reverse image search compares the embeddings of the image used as a query and the embeddings of the indexed pictures. That can be theoretically done in a naive way by comparing the query to every single item from our store, but that won't scale if we even go beyond a few hundred. That's what the vector search engines are designed for. Qdrant acts as a fast retrieval layer that performs an efficient search for the closest vectors in the space.

There are various ways to start using Qdrant, and even though the local mode in Python SDK is possible, it should be running as a service in production. The easiest way is to use a Docker container, which we'll do.

```python
!docker run -d -p "6333:6333" -p "6334:6334" --name "reverse_image_search" qdrant/qdrant:v1.10.1
```

```
/bin/bash: line 1: docker: command not found
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest

try:
    client = QdrantClient("localhost")
    collections = client.get_collections()
except Exception:
    # Docker is unavailable in Google Colab so we switch to local
    # mode available in Python SDK
    client = QdrantClient(":memory:")
    collections = client.get_collections()

collections
```

```
CollectionsResponse(collections=[])
```

```python
client.recreate_collection(
    collection_name="amazon",
    vectors_config=rest.VectorParams(
        size=512,
        distance=rest.Distance.COSINE,
    ),
)
```

```
True
```

It's a good practice to use batching while inserting the vectors into the collection. Python SDK has a utility method that performs it automatically. For the purposes of our demo, we're going to store vectors with the product id, name, and description as a payload.

```python
payloads = (
    dataset_df[["Uniq Id", "Product Name", "About Product", "Image", "LocalImage"]]
    .fillna("Unknown")
    .rename(
        columns={
            "Uniq Id": "ID",
            "Product Name": "Name",
            "About Product": "Description",
            "LocalImage": "Path",
        }
    )
    .to_dict("records")
)
payloads[0]
```

```
{'ID': 'ec13f3287da541a31f72f5a047ec2e36',
 'Name': 'Btswim NFL Pool Noodles (Pack of 3)',
 'Description': 'Make sure this fits by entering your model number. | Includes: 3 high quality pool noodles measuring 57" x 3" | Removable and re-washable spandex-like cover | 3 unique styles per team',
 'Image': 'https://images-na.ssl-images-amazon.com/images/I/41SiG59Kt%2BL.jpg',
 'Path': './data/images/41SiG59Kt%2BL.jpg'}
```

```python
import uuid

client.upload_collection(
    collection_name="amazon",
    vectors=list(map(list, dataset_df["Embedding"].tolist())),
    payload=payloads,
    ids=[uuid.uuid4().hex for _ in payloads],
)
```

<hr />

```python
client.count("amazon")
```

```
CountResult(count=3359)
```

## Running the reverse image search

As soon as we have the data indexed in Qdrant, it may already start acting as our reverse image search mechanism. Our queries no longer can be just textual, but we can freely use images to find similar items. For that, we surely need a query, and that will rarely be an image from the dataset. Let's find some different examples - for example from [Unsplash](https://unsplash.com), which is a source of freely usable images.

```python
from io import BytesIO

import base64


def pillow_image_to_base64(image: Image) -> str:
    """
    Convert a Pillow image to a base64 encoded string that can be used as an image
    source in HTML.
    :param image:
    :return:
    """
    buffered = BytesIO()
    image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{img_str}"
```

<hr />

```python
from IPython.display import display, HTML

import glob

query_image_paths = list(glob.glob("./queries/*.jpg"))
images_html = "".join(
    f"<td><img src='{pillow_image_to_base64(Image.open(path))}' width=150></td>"
    for path in query_image_paths
)
display(HTML(f"<table><tr>{images_html}</tr></table>"))
```

<table><tr><td><img src='data:image/jpeg;base64,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' width=150></td><td><img src='data:image/jpeg;base64,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' width=150></td><td><img src='data:image/jpeg;base64,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' width=150></td><td><img src='data:image/jpeg;base64,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' width=150></td></tr></table>

```python
for query_image_path in query_image_paths:
    query_embedding = next(model.embed(query_image_path)).tolist()

    results = client.query_points(
        collection_name="amazon",
        query=query_embedding,
        with_payload=True,
        limit=5,
    ).points

    output_images = [
        pillow_image_to_base64(Image.open(query_image_path)),
    ]
    for result in results:
        output_images.append(result.payload["Image"])

    images_html = "".join(
        f"<td><img src='{path}' width=150></td>" for path in output_images
    )
    display(HTML(f"<table><tr>{images_html}</tr></table>"))
```

We've implemented a reverse image search mechanism for e-commerce within a single notebook. We can kill the running Docker container for now, so nothing is left dangling in our environment.

```python
!docker kill reverse_image_search
!docker rm reverse_image_search
```

```
reverse_image_search
reverse_image_search
```

## Futher steps

The notebook shows the general pipeline of encoding the inventory and using Qdrant to perform the reverse image search. There are, however, some challenges you may encounter while trying to implement it in the real world:

1. Pretrained models are great to start with but may struggle for some specific kinds of inventory if not trained on similar examples. You can always fine-tune them with small amounts of data to avoid a full training cycle.
1. Models should not be hosted within Jupyter notebooks, but there are some ways to serve them efficiently. We're going to describe the possibilities in a separate tutorial.
1. If you don't want to worry about maintaining another system in your stack, please consider using [Qdrant Cloud](https://cloud.qdrant.io/), our managed solution. Our tier is free forever and available to everyone - no credit card is required.

```python

```
