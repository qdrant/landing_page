---
notebook_path: 301-advanced/code-search/code-search.ipynb
reading_time_min: 25
title: Code search with Qdrant
---

# Code search with Qdrant

This is a notebook demonstrating how to implement a code search mechanism using two different neural encoders - one general purpuse, and another trained specifically for code. Let's start with installing all the required dependencies.

```python
!pip install qdrant-client inflection sentence-transformers optimum onnx
```

```
Collecting qdrant-client
  Downloading qdrant_client-1.7.3-py3-none-any.whl (206 kB)
[?25l     [90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m [32m0.0/206.3 kB[0m [31m?[0m eta [36m-:--:--[0m
```

\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m206.3/206.3 kB\[0m \[31m6.6 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hCollecting inflection
Downloading inflection-0.5.1-py2.py3-none-any.whl (9.5 kB)
Collecting sentence-transformers
Downloading sentence_transformers-2.5.1-py3-none-any.whl (156 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m156.5/156.5 kB\[0m \[31m13.9 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hCollecting optimum
Downloading optimum-1.17.1-py3-none-any.whl (407 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m407.1/407.1 kB\[0m \[31m9.5 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hCollecting onnx
Downloading onnx-1.15.0-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (15.7 MB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m15.7/15.7 MB\[0m \[31m36.3 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: grpcio>=1.41.0 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (1.62.0)
Collecting grpcio-tools>=1.41.0 (from qdrant-client)
Downloading grpcio_tools-1.62.0-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (2.8 MB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m2.8/2.8 MB\[0m \[31m44.2 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hCollecting httpx[http2]>=0.14.0 (from qdrant-client)
Downloading httpx-0.27.0-py3-none-any.whl (75 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m75.6/75.6 kB\[0m \[31m11.6 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: numpy>=1.21 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (1.25.2)
Collecting portalocker\<3.0.0,>=2.7.0 (from qdrant-client)
Downloading portalocker-2.8.2-py3-none-any.whl (17 kB)
Requirement already satisfied: pydantic>=1.10.8 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (2.6.3)
Requirement already satisfied: urllib3\<3,>=1.26.14 in /usr/local/lib/python3.10/dist-packages (from qdrant-client) (2.0.7)
Requirement already satisfied: transformers\<5.0.0,>=4.32.0 in /usr/local/lib/python3.10/dist-packages (from sentence-transformers) (4.38.1)
Requirement already satisfied: tqdm in /usr/local/lib/python3.10/dist-packages (from sentence-transformers) (4.66.2)
Requirement already satisfied: torch>=1.11.0 in /usr/local/lib/python3.10/dist-packages (from sentence-transformers) (2.1.0+cu121)
Requirement already satisfied: scikit-learn in /usr/local/lib/python3.10/dist-packages (from sentence-transformers) (1.2.2)
Requirement already satisfied: scipy in /usr/local/lib/python3.10/dist-packages (from sentence-transformers) (1.11.4)
Requirement already satisfied: huggingface-hub>=0.15.1 in /usr/local/lib/python3.10/dist-packages (from sentence-transformers) (0.20.3)
Requirement already satisfied: Pillow in /usr/local/lib/python3.10/dist-packages (from sentence-transformers) (9.4.0)
Collecting coloredlogs (from optimum)
Downloading coloredlogs-15.0.1-py2.py3-none-any.whl (46 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m46.0/46.0 kB\[0m \[31m6.6 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: sympy in /usr/local/lib/python3.10/dist-packages (from optimum) (1.12)
Requirement already satisfied: packaging in /usr/local/lib/python3.10/dist-packages (from optimum) (23.2)
Collecting datasets (from optimum)
Downloading datasets-2.18.0-py3-none-any.whl (510 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m510.5/510.5 kB\[0m \[31m31.8 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: protobuf>=3.20.2 in /usr/local/lib/python3.10/dist-packages (from onnx) (3.20.3)
Collecting protobuf>=3.20.2 (from onnx)
Downloading protobuf-4.25.3-cp37-abi3-manylinux2014_x86_64.whl (294 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m294.6/294.6 kB\[0m \[31m36.3 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: setuptools in /usr/local/lib/python3.10/dist-packages (from grpcio-tools>=1.41.0->qdrant-client) (67.7.2)
Requirement already satisfied: anyio in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant-client) (3.7.1)
Requirement already satisfied: certifi in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant-client) (2024.2.2)
Collecting httpcore==1.\* (from httpx[http2]>=0.14.0->qdrant-client)
Downloading httpcore-1.0.4-py3-none-any.whl (77 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m77.8/77.8 kB\[0m \[31m11.0 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: idna in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant-client) (3.6)
Requirement already satisfied: sniffio in /usr/local/lib/python3.10/dist-packages (from httpx[http2]>=0.14.0->qdrant-client) (1.3.1)
Collecting h2\<5,>=3 (from httpx[http2]>=0.14.0->qdrant-client)
Downloading h2-4.1.0-py3-none-any.whl (57 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m57.5/57.5 kB\[0m \[31m8.3 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hCollecting h11\<0.15,>=0.13 (from httpcore==1.\*->httpx[http2]>=0.14.0->qdrant-client)
Downloading h11-0.14.0-py3-none-any.whl (58 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m58.3/58.3 kB\[0m \[31m8.9 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: filelock in /usr/local/lib/python3.10/dist-packages (from huggingface-hub>=0.15.1->sentence-transformers) (3.13.1)
Requirement already satisfied: fsspec>=2023.5.0 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub>=0.15.1->sentence-transformers) (2023.6.0)
Requirement already satisfied: requests in /usr/local/lib/python3.10/dist-packages (from huggingface-hub>=0.15.1->sentence-transformers) (2.31.0)
Requirement already satisfied: pyyaml>=5.1 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub>=0.15.1->sentence-transformers) (6.0.1)
Requirement already satisfied: typing-extensions>=3.7.4.3 in /usr/local/lib/python3.10/dist-packages (from huggingface-hub>=0.15.1->sentence-transformers) (4.10.0)
Requirement already satisfied: annotated-types>=0.4.0 in /usr/local/lib/python3.10/dist-packages (from pydantic>=1.10.8->qdrant-client) (0.6.0)
Requirement already satisfied: pydantic-core==2.16.3 in /usr/local/lib/python3.10/dist-packages (from pydantic>=1.10.8->qdrant-client) (2.16.3)
Requirement already satisfied: networkx in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence-transformers) (3.2.1)
Requirement already satisfied: jinja2 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence-transformers) (3.1.3)
Requirement already satisfied: triton==2.1.0 in /usr/local/lib/python3.10/dist-packages (from torch>=1.11.0->sentence-transformers) (2.1.0)
Requirement already satisfied: regex!=2019.12.17 in /usr/local/lib/python3.10/dist-packages (from transformers\<5.0.0,>=4.32.0->sentence-transformers) (2023.12.25)
Requirement already satisfied: tokenizers\<0.19,>=0.14 in /usr/local/lib/python3.10/dist-packages (from transformers\<5.0.0,>=4.32.0->sentence-transformers) (0.15.2)
Requirement already satisfied: safetensors>=0.4.1 in /usr/local/lib/python3.10/dist-packages (from transformers\<5.0.0,>=4.32.0->sentence-transformers) (0.4.2)
Requirement already satisfied: sentencepiece!=0.1.92,>=0.1.91 in /usr/local/lib/python3.10/dist-packages (from transformers\<5.0.0,>=4.32.0->sentence-transformers) (0.1.99)
Collecting humanfriendly>=9.1 (from coloredlogs->optimum)
Downloading humanfriendly-10.0-py2.py3-none-any.whl (86 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m86.8/86.8 kB\[0m \[31m12.2 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: pyarrow>=12.0.0 in /usr/local/lib/python3.10/dist-packages (from datasets->optimum) (14.0.2)
Requirement already satisfied: pyarrow-hotfix in /usr/local/lib/python3.10/dist-packages (from datasets->optimum) (0.6)
Collecting dill\<0.3.9,>=0.3.0 (from datasets->optimum)
Downloading dill-0.3.8-py3-none-any.whl (116 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m116.3/116.3 kB\[0m \[31m16.8 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: pandas in /usr/local/lib/python3.10/dist-packages (from datasets->optimum) (1.5.3)
Requirement already satisfied: xxhash in /usr/local/lib/python3.10/dist-packages (from datasets->optimum) (3.4.1)
Collecting multiprocess (from datasets->optimum)
Downloading multiprocess-0.70.16-py310-none-any.whl (134 kB)
\[2K \[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\[0m \[32m134.8/134.8 kB\[0m \[31m19.5 MB/s\[0m eta \[36m0:00:00\[0m
\[?25hRequirement already satisfied: aiohttp in /usr/local/lib/python3.10/dist-packages (from datasets->optimum) (3.9.3)
Requirement already satisfied: joblib>=1.1.1 in /usr/local/lib/python3.10/dist-packages (from scikit-learn->sentence-transformers) (1.3.2)
Requirement already satisfied: threadpoolctl>=2.0.0 in /usr/local/lib/python3.10/dist-packages (from scikit-learn->sentence-transformers) (3.3.0)
Requirement already satisfied: mpmath>=0.19 in /usr/local/lib/python3.10/dist-packages (from sympy->optimum) (1.3.0)
Requirement already satisfied: aiosignal>=1.1.2 in /usr/local/lib/python3.10/dist-packages (from aiohttp->datasets->optimum) (1.3.1)
Requirement already satisfied: attrs>=17.3.0 in /usr/local/lib/python3.10/dist-packages (from aiohttp->datasets->optimum) (23.2.0)
Requirement already satisfied: frozenlist>=1.1.1 in /usr/local/lib/python3.10/dist-packages (from aiohttp->datasets->optimum) (1.4.1)
Requirement already satisfied: multidict\<7.0,>=4.5 in /usr/local/lib/python3.10/dist-packages (from aiohttp->datasets->optimum) (6.0.5)
Requirement already satisfied: yarl\<2.0,>=1.0 in /usr/local/lib/python3.10/dist-packages (from aiohttp->datasets->optimum) (1.9.4)
Requirement already satisfied: async-timeout\<5.0,>=4.0 in /usr/local/lib/python3.10/dist-packages (from aiohttp->datasets->optimum) (4.0.3)
Collecting hyperframe\<7,>=6.0 (from h2\<5,>=3->httpx[http2]>=0.14.0->qdrant-client)
Downloading hyperframe-6.0.1-py3-none-any.whl (12 kB)
Collecting hpack\<5,>=4.0 (from h2\<5,>=3->httpx[http2]>=0.14.0->qdrant-client)
Downloading hpack-4.0.0-py3-none-any.whl (32 kB)
Requirement already satisfied: charset-normalizer\<4,>=2 in /usr/local/lib/python3.10/dist-packages (from requests->huggingface-hub>=0.15.1->sentence-transformers) (3.3.2)
Requirement already satisfied: exceptiongroup in /usr/local/lib/python3.10/dist-packages (from anyio->httpx[http2]>=0.14.0->qdrant-client) (1.2.0)
Requirement already satisfied: MarkupSafe>=2.0 in /usr/local/lib/python3.10/dist-packages (from jinja2->torch>=1.11.0->sentence-transformers) (2.1.5)
Requirement already satisfied: python-dateutil>=2.8.1 in /usr/local/lib/python3.10/dist-packages (from pandas->datasets->optimum) (2.8.2)
Requirement already satisfied: pytz>=2020.1 in /usr/local/lib/python3.10/dist-packages (from pandas->datasets->optimum) (2023.4)
Requirement already satisfied: six>=1.5 in /usr/local/lib/python3.10/dist-packages (from python-dateutil>=2.8.1->pandas->datasets->optimum) (1.16.0)
Installing collected packages: protobuf, portalocker, inflection, hyperframe, humanfriendly, hpack, h11, dill, onnx, multiprocess, httpcore, h2, grpcio-tools, coloredlogs, httpx, datasets, sentence-transformers, qdrant-client, optimum
Attempting uninstall: protobuf
Found existing installation: protobuf 3.20.3
Uninstalling protobuf-3.20.3:
Successfully uninstalled protobuf-3.20.3
\[31mERROR: pip's dependency resolver does not currently take into account all the packages that are installed. This behaviour is the source of the following dependency conflicts.
tensorflow-metadata 1.14.0 requires protobuf\<4.21,>=3.20.3, but you have protobuf 4.25.3 which is incompatible.\[0m\[31m
\[0mSuccessfully installed coloredlogs-15.0.1 datasets-2.18.0 dill-0.3.8 grpcio-tools-1.62.0 h11-0.14.0 h2-4.1.0 hpack-4.0.0 httpcore-1.0.4 httpx-0.27.0 humanfriendly-10.0 hyperframe-6.0.1 inflection-0.5.1 multiprocess-0.70.16 onnx-1.15.0 optimum-1.17.1 portalocker-2.8.2 protobuf-4.25.3 qdrant-client-1.7.3 sentence-transformers-2.5.1

We are going to work with [Qdrant source code](https://github.com/qdrant/qdrant) that has been already converted into chunks. If you want to do it for a different project, please consider using one of the [LSP implementations](https://microsoft.github.io/language-server-protocol/) for your programming language. It should be fairly easy to build similar structures with the help of these tools.

```python
!wget https://storage.googleapis.com/tutorial-attachments/code-search/structures.jsonl
```

```
--2024-03-05 11:08:28--  https://storage.googleapis.com/tutorial-attachments/code-search/structures.jsonl
Resolving storage.googleapis.com (storage.googleapis.com)... 108.177.119.207, 108.177.127.207, 172.217.218.207, ...
Connecting to storage.googleapis.com (storage.googleapis.com)|108.177.119.207|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 4921256 (4.7M) [application/json]
Saving to: ‘structures.jsonl’

structures.jsonl    100%[===================>]   4.69M  20.4MB/s    in 0.2s    

2024-03-05 11:08:29 (20.4 MB/s) - ‘structures.jsonl’ saved [4921256/4921256]
```

```python
import json

structures = []
with open("structures.jsonl", "r") as fp:
    for i, row in enumerate(fp):
        entry = json.loads(row)
        structures.append(entry)

structures[0]
```

```
{'name': 'InvertedIndexRam',
 'signature': '# [doc = " Inverted flatten index from dimension id to posting list"] # [derive (Debug , Clone , PartialEq)] pub struct InvertedIndexRam { # [doc = " Posting lists for each dimension flattened (dimension id -> posting list)"] # [doc = " Gaps are filled with empty posting lists"] pub postings : Vec < PostingList > , # [doc = " Number of unique indexed vectors"] # [doc = " pre-computed on build and upsert to avoid having to traverse the posting lists."] pub vector_count : usize , }',
 'code_type': 'Struct',
 'docstring': '= " Inverted flatten index from dimension id to posting list"',
 'line': 15,
 'line_from': 13,
 'line_to': 22,
 'context': {'module': 'inverted_index',
  'file_path': 'lib/sparse/src/index/inverted_index/inverted_index_ram.rs',
  'file_name': 'inverted_index_ram.rs',
  'struct_name': None,
  'snippet': '/// Inverted flatten index from dimension id to posting list\n#[derive(Debug, Clone, PartialEq)]\npub struct InvertedIndexRam {\n    /// Posting lists for each dimension flattened (dimension id -> posting list)\n    /// Gaps are filled with empty posting lists\n    pub postings: Vec<PostingList>,\n    /// Number of unique indexed vectors\n    /// pre-computed on build and upsert to avoid having to traverse the posting lists.\n    pub vector_count: usize,\n}\n'}}
```

We will use two different neural encoders - `all-MiniLM-L6-v2` and `jina-embeddings-v2-base-code`. Since the first one is trained for general purposes, and more natural language, there is a need to convert code into more human-friendly text representation. This normalization gets rid of language specifics, so the output looks more like a description of the particular code structure.

```python
import inflection
import re

from typing import Dict, Any


def textify(chunk: Dict[str, Any]) -> str:
    """
    Convert the code structure into natural language like representation.

    Args:
        chunk (dict): Dictionary-like representation of the code structure
            Example: {
                "name":"await_ready_for_timeout",
                "signature":"fn await_ready_for_timeout (& self , timeout : Duration) -> bool",
                "code_type":"Function",
                "docstring":"= \" Return `true` if ready, `false` if timed out.\"",
                "line":44,
                "line_from":43,
                "line_to":51,
                "context":{
                    "module":"common",
                    "file_path":"lib/collection/src/common/is_ready.rs",
                    "file_name":"is_ready.rs",
                    "struct_name":"IsReady",
                    "snippet":"    /// Return `true` if ready, `false` if timed out.\n    pub fn await_ready_for_timeout(&self, timeout: Duration) -> bool {\n        let mut is_ready = self.value.lock();\n        if !*is_ready {\n            !self.condvar.wait_for(&mut is_ready, timeout).timed_out()\n        } else {\n            true\n        }\n    }\n"
                }
            }

    Returns:
        str: A simplified natural language like description of the structure with some context info
            Example: "Function Await ready for timeout that does Return true if ready false if timed out defined as Fn await ready for timeout self timeout duration bool defined in struct Isready module common file is_ready rs"
    """
    # Get rid of all the camel case / snake case
    # - inflection.underscore changes the camel case to snake case
    # - inflection.humanize converts the snake case to human readable form
    name = inflection.humanize(inflection.underscore(chunk["name"]))
    signature = inflection.humanize(inflection.underscore(chunk["signature"]))

    # Check if docstring is provided
    docstring = ""
    if chunk["docstring"]:
        docstring = f"that does {chunk['docstring']} "

    # Extract the location of that snippet of code
    context = (
        f"module {chunk['context']['module']} " f"file {chunk['context']['file_name']}"
    )
    if chunk["context"]["struct_name"]:
        struct_name = inflection.humanize(
            inflection.underscore(chunk["context"]["struct_name"])
        )
        context = f"defined in struct {struct_name} {context}"

    # Combine all the bits and pieces together
    text_representation = (
        f"{chunk['code_type']} {name} "
        f"{docstring}"
        f"defined as {signature} "
        f"{context}"
    )

    # Remove any special characters and concatenate the tokens
    tokens = re.split(r"\W", text_representation)
    tokens = filter(lambda x: x, tokens)
    return " ".join(tokens)
```

Here is how the same structure looks like, after performing the normalization step:

```python
textify(structures[0])
```

```
'Struct Inverted index ram that does Inverted flatten index from dimension id to posting list defined as doc inverted flatten index from dimension id to posting list derive debug clone partial eq pub struct inverted index ram doc posting lists for each dimension flattened dimension id posting list doc gaps are filled with empty posting lists pub postings vec posting list doc number of unique indexed vectors doc pre computed on build and upsert to avoid having to traverse the posting lists pub vector count usize module inverted_index file inverted_index_ram rs'
```

Let's do it for all the structures at once:

```python
text_representations = list(map(textify, structures))
```

Created text representations might be directly used as an input to the `all-MiniLM-L6-v2` model.

```python
from sentence_transformers import SentenceTransformer

nlp_model = SentenceTransformer("all-MiniLM-L6-v2")
nlp_embeddings = nlp_model.encode(
    text_representations,
    show_progress_bar=True,
)
nlp_embeddings.shape
```

```
modules.json:   0%|          | 0.00/349 [00:00<?, ?B/s]



config_sentence_transformers.json:   0%|          | 0.00/116 [00:00<?, ?B/s]



README.md:   0%|          | 0.00/10.7k [00:00<?, ?B/s]



sentence_bert_config.json:   0%|          | 0.00/53.0 [00:00<?, ?B/s]



config.json:   0%|          | 0.00/612 [00:00<?, ?B/s]



pytorch_model.bin:   0%|          | 0.00/90.9M [00:00<?, ?B/s]


/usr/local/lib/python3.10/dist-packages/torch/_utils.py:831: UserWarning: TypedStorage is deprecated. It will be removed in the future and UntypedStorage will be the only storage class. This should only matter to you if you are using storages directly.  To access UntypedStorage directly, use tensor.untyped_storage() instead of tensor.storage()
  return self.fget.__get__(instance, owner)()



tokenizer_config.json:   0%|          | 0.00/350 [00:00<?, ?B/s]



vocab.txt:   0%|          | 0.00/232k [00:00<?, ?B/s]



tokenizer.json:   0%|          | 0.00/466k [00:00<?, ?B/s]



special_tokens_map.json:   0%|          | 0.00/112 [00:00<?, ?B/s]



1_Pooling/config.json:   0%|          | 0.00/190 [00:00<?, ?B/s]



Batches:   0%|          | 0/148 [00:00<?, ?it/s]





(4723, 384)
```

As a next step, we are going to extract all the code snippets to a separate list. This will be an input to the different model we want to use.

```python
code_snippets = [structure["context"]["snippet"] for structure in structures]
code_snippets[0]
```

```
'/// Inverted flatten index from dimension id to posting list\n#[derive(Debug, Clone, PartialEq)]\npub struct InvertedIndexRam {\n    /// Posting lists for each dimension flattened (dimension id -> posting list)\n    /// Gaps are filled with empty posting lists\n    pub postings: Vec<PostingList>,\n    /// Number of unique indexed vectors\n    /// pre-computed on build and upsert to avoid having to traverse the posting lists.\n    pub vector_count: usize,\n}\n'
```

The `jina-embeddings-v2-base-code` model is available for free, but requires accepting the rules on [the model page](https://huggingface.co/jinaai/jina-embeddings-v2-base-code). Please do it first, and put the key below.

```python
# You have to accept the conditions in order to be able to access Jina embedding
# model. Please visit https://huggingface.co/jinaai/jina-embeddings-v2-base-code
# to accept the rules and generate the access token in your account settings:
# https://huggingface.co/settings/tokens

HF_TOKEN = "THIS_IS_YOUR_TOKEN"
```

Once the token is ready, we can pass the code snippets through the second model. Please mind we set the `trust_remote_code` flag to `True` so the library can download and run some code from the remote server. This is required to run the model, so in general be aware of the potential security risks and make sure you trust the source.

```python
code_model = SentenceTransformer(
    "jinaai/jina-embeddings-v2-base-code", token=HF_TOKEN, trust_remote_code=True
)
code_model.max_seq_length = 8192  # increase the context length window
code_embeddings = code_model.encode(
    code_snippets,
    batch_size=4,
    show_progress_bar=True,
)
code_embeddings.shape
```

```
modules.json:   0%|          | 0.00/229 [00:00<?, ?B/s]



README.md:   0%|          | 0.00/7.67k [00:00<?, ?B/s]



sentence_bert_config.json:   0%|          | 0.00/99.0 [00:00<?, ?B/s]



config.json:   0%|          | 0.00/1.22k [00:00<?, ?B/s]



configuration_bert.py:   0%|          | 0.00/8.23k [00:00<?, ?B/s]


A new version of the following files was downloaded from https://huggingface.co/jinaai/jina-bert-v2-qk-post-norm:
- configuration_bert.py
. Make sure to double-check they do not contain any added malicious code. To avoid downloading new versions of the code file, you can pin a revision.



modeling_bert.py:   0%|          | 0.00/96.0k [00:00<?, ?B/s]


A new version of the following files was downloaded from https://huggingface.co/jinaai/jina-bert-v2-qk-post-norm:
- modeling_bert.py
. Make sure to double-check they do not contain any added malicious code. To avoid downloading new versions of the code file, you can pin a revision.



pytorch_model.bin:   0%|          | 0.00/322M [00:00<?, ?B/s]



tokenizer_config.json:   0%|          | 0.00/493 [00:00<?, ?B/s]



vocab.json:   0%|          | 0.00/971k [00:00<?, ?B/s]



tokenizer.json:   0%|          | 0.00/2.56M [00:00<?, ?B/s]



special_tokens_map.json:   0%|          | 0.00/280 [00:00<?, ?B/s]



1_Pooling/config.json:   0%|          | 0.00/191 [00:00<?, ?B/s]



Batches:   0%|          | 0/1181 [00:00<?, ?it/s]





(4723, 768)
```

Created embeddings have to be indexed in a Qdrant collection. For that, we need a running instance. The easiest way is to deploy it using the [Qdrant Cloud](https://cloud.qdrant.io/). There is a free tier 1GB cluster available, but you can alternatively use [a local Docker container](https://qdrant.tech/documentation/quick-start/), but running it in Google Colab might require installing Docker first.

```python
QDRANT_URL = "https://my-cluster.cloud.qdrant.io:6333"  # http://localhost:6333 for local instance
QDRANT_API_KEY = "THIS_IS_YOUR_API_KEY"  # None for local instance
```

<hr />

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(QDRANT_URL, api_key=QDRANT_API_KEY)
client.create_collection(
    "qdrant-sources",
    vectors_config={
        "text": models.VectorParams(
            size=nlp_embeddings.shape[1],
            distance=models.Distance.COSINE,
        ),
        "code": models.VectorParams(
            size=code_embeddings.shape[1],
            distance=models.Distance.COSINE,
        ),
    },
)
```

```
True
```

Our collection should be created already. As you may see, we configured so called **[named vectors](https://qdrant.tech/documentation/concepts/points/)**, to have two different embeddings stored in the same collection.

Let's finally index all the data.

```python
import uuid

points = [
    models.PointStruct(
        id=uuid.uuid4().hex,
        vector={
            "text": text_embedding,
            "code": code_embedding,
        },
        payload=structure,
    )
    for text_embedding, code_embedding, structure in zip(
        nlp_embeddings, code_embeddings, structures
    )
]
len(points)
```

```
4723
```

```python
client.upload_points(
    "qdrant-sources",
    points=points,
    batch_size=64,
)
```

If you want to check if all the points were sent, counting them might be the easiest idea.

```python
client.count("qdrant-sources")
```

```
CountResult(count=4723)
```

If you, however, want to know how the count endpoint works internally in the Qdrant server, that might be a question to ask.

```python
query = "How do I count points in a collection?"
```

First of all, let's use one model at a time. Let's start with the general purpose one.

```python
hits = client.search(
    "qdrant-sources",
    query_vector=("text", nlp_model.encode(query).tolist()),
    limit=5,
)
for hit in hits:
    print(
        "| ",
        hit.payload["context"]["module"],
        " | ",
        hit.payload["context"]["file_name"],
        " | ",
        hit.score,
        " | `",
        hit.payload["signature"],
        "` |",
    )
```

```
|  toc  |  point_ops.rs  |  0.59448624  | ` async fn count (& self , collection_name : & str , request : CountRequestInternal , read_consistency : Option < ReadConsistency > , shard_selection : ShardSelectorInternal ,) -> Result < CountResult , StorageError > ` |
|  operations  |  types.rs  |  0.5493385  | ` # [doc = " Count Request"] # [doc = " Counts the number of points which satisfy the given filter."] # [doc = " If filter is not provided, the count of all points in the collection will be returned."] # [derive (Debug , Deserialize , Serialize , JsonSchema , Validate)] # [serde (rename_all = "snake_case")] pub struct CountRequestInternal { # [doc = " Look only for points which satisfies this conditions"] # [validate] pub filter : Option < Filter > , # [doc = " If true, count exact number of points. If false, count approximate number of points faster."] # [doc = " Approximate count might be unreliable during the indexing process. Default: true"] # [serde (default = "default_exact_count")] pub exact : bool , } ` |
|  collection_manager  |  segments_updater.rs  |  0.5121002  | ` fn upsert_points < 'a , T > (segments : & SegmentHolder , op_num : SeqNumberType , points : T ,) -> CollectionResult < usize > where T : IntoIterator < Item = & 'a PointStruct > , ` |
|  collection  |  point_ops.rs  |  0.5063539  | ` async fn count (& self , request : CountRequestInternal , read_consistency : Option < ReadConsistency > , shard_selection : & ShardSelectorInternal ,) -> CollectionResult < CountResult > ` |
|  map_index  |  mod.rs  |  0.49973983  | ` fn get_points_with_value_count < Q > (& self , value : & Q) -> Option < usize > where Q : ? Sized , N : std :: borrow :: Borrow < Q > , Q : Hash + Eq , ` |
```

The results obtained with the code specific model should be different.

```python
hits = client.search(
    "qdrant-sources",
    query_vector=("code", code_model.encode(query).tolist()),
    limit=5,
)
for hit in hits:
    print(
        "| ",
        hit.payload["context"]["module"],
        " | ",
        hit.payload["context"]["file_name"],
        " | ",
        hit.score,
        " | `",
        hit.payload["signature"],
        "` |",
    )
```

```
|  field_index  |  geo_index.rs  |  0.73278356  | ` fn count_indexed_points (& self) -> usize ` |
|  numeric_index  |  mod.rs  |  0.7254975  | ` fn count_indexed_points (& self) -> usize ` |
|  map_index  |  mod.rs  |  0.7124739  | ` fn count_indexed_points (& self) -> usize ` |
|  map_index  |  mod.rs  |  0.7124739  | ` fn count_indexed_points (& self) -> usize ` |
|  fixtures  |  payload_context_fixture.rs  |  0.7062038  | ` fn total_point_count (& self) -> usize ` |
```

In reality, we implemented the system with two different models, as we want to combine the results coming from both of them. We can do it with a batch request, so there is just a single call to Qdrant.

```python
results = client.search_batch(
    "qdrant-sources",
    requests=[
        models.SearchRequest(
            vector=models.NamedVector(
                name="text", vector=nlp_model.encode(query).tolist()
            ),
            with_payload=True,
            limit=5,
        ),
        models.SearchRequest(
            vector=models.NamedVector(
                name="code", vector=code_model.encode(query).tolist()
            ),
            with_payload=True,
            limit=5,
        ),
    ],
)
for hits in results:
    for hit in hits:
        print(
            "| ",
            hit.payload["context"]["module"],
            " | ",
            hit.payload["context"]["file_name"],
            " | ",
            hit.score,
            " | `",
            hit.payload["signature"],
            "` |",
        )
```

```
|  toc  |  point_ops.rs  |  0.59448624  | ` async fn count (& self , collection_name : & str , request : CountRequestInternal , read_consistency : Option < ReadConsistency > , shard_selection : ShardSelectorInternal ,) -> Result < CountResult , StorageError > ` |
|  operations  |  types.rs  |  0.5493385  | ` # [doc = " Count Request"] # [doc = " Counts the number of points which satisfy the given filter."] # [doc = " If filter is not provided, the count of all points in the collection will be returned."] # [derive (Debug , Deserialize , Serialize , JsonSchema , Validate)] # [serde (rename_all = "snake_case")] pub struct CountRequestInternal { # [doc = " Look only for points which satisfies this conditions"] # [validate] pub filter : Option < Filter > , # [doc = " If true, count exact number of points. If false, count approximate number of points faster."] # [doc = " Approximate count might be unreliable during the indexing process. Default: true"] # [serde (default = "default_exact_count")] pub exact : bool , } ` |
|  collection_manager  |  segments_updater.rs  |  0.5121002  | ` fn upsert_points < 'a , T > (segments : & SegmentHolder , op_num : SeqNumberType , points : T ,) -> CollectionResult < usize > where T : IntoIterator < Item = & 'a PointStruct > , ` |
|  collection  |  point_ops.rs  |  0.5063539  | ` async fn count (& self , request : CountRequestInternal , read_consistency : Option < ReadConsistency > , shard_selection : & ShardSelectorInternal ,) -> CollectionResult < CountResult > ` |
|  map_index  |  mod.rs  |  0.49973983  | ` fn get_points_with_value_count < Q > (& self , value : & Q) -> Option < usize > where Q : ? Sized , N : std :: borrow :: Borrow < Q > , Q : Hash + Eq , ` |
|  field_index  |  geo_index.rs  |  0.73278356  | ` fn count_indexed_points (& self) -> usize ` |
|  numeric_index  |  mod.rs  |  0.7254975  | ` fn count_indexed_points (& self) -> usize ` |
|  map_index  |  mod.rs  |  0.7124739  | ` fn count_indexed_points (& self) -> usize ` |
|  map_index  |  mod.rs  |  0.7124739  | ` fn count_indexed_points (& self) -> usize ` |
|  fixtures  |  payload_context_fixture.rs  |  0.7062038  | ` fn total_point_count (& self) -> usize ` |
```

Last but not least, if we want to improve the diversity of the results, grouping them by the module might be a good idea.

```python
results = client.search_groups(
    "qdrant-sources",
    query_vector=("code", code_model.encode(query).tolist()),
    group_by="context.module",
    limit=5,
    group_size=1,
)
for group in results.groups:
    for hit in group.hits:
        print(
            "| ",
            hit.payload["context"]["module"],
            " | ",
            hit.payload["context"]["file_name"],
            " | ",
            hit.score,
            " | `",
            hit.payload["signature"],
            "` |",
        )
```

```
|  field_index  |  geo_index.rs  |  0.73278356  | ` fn count_indexed_points (& self) -> usize ` |
|  numeric_index  |  mod.rs  |  0.7254975  | ` fn count_indexed_points (& self) -> usize ` |
|  map_index  |  mod.rs  |  0.7124739  | ` fn count_indexed_points (& self) -> usize ` |
|  fixtures  |  payload_context_fixture.rs  |  0.7062038  | ` fn total_point_count (& self) -> usize ` |
|  hnsw_index  |  graph_links.rs  |  0.6998417  | ` fn num_points (& self) -> usize ` |
```

For a more detailed guide, please check our [code search tutorial](https://qdrant.tech/documentation/tutorials/code-search/) and [code search demo](https://github.com/qdrant/demo-code-search).
