---
google_colab_link: https://githubtocolab.com/k/blob/refactor/tutorial-levels/101-foundations/data-migration/from-pinecone-to-qdrant.ipynb
reading_time_min: 1
title:
---

## Migrating Data From Pinecone to Qdrant

In this notebook, you will migrate your data into [Qdrant](https://qdrant.to/cloud) from another vector database.
You will use [Vector-io](https://github.com/AI-Northstar-Tech/vector-io), a library that makes it easy to migrate, transform, and manage your data across different vector databases.

Vector-io uses a standard format called Vector Dataset Format (VDF). This format ensures consistency in the data structure, regardless of the destination database.

To illustrate, let's consider a Pinecone index that contains several data from a [PubMed dataset](https://huggingface.co/datasets/llamafactory/PubMedQA) generated using the 1536-dimensional OpenAI "text-embedding-3-small" embedding model.

!["Pinecone"](documentation/from-pinecone-to-qdrant/pinecone.png)

## Initialize the Environment

```python
import os
from dotenv import load_dotenv
from datasets import load_dataset

load_dotenv()
```

```
True
```

## Load the Data

```python
data = load_dataset("llamafactory/PubMedQA", split="train")
data = data.to_pandas()
data.head()
```

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
      <th>instruction</th>
      <th>input</th>
      <th>output</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Answer the question based on the following con...</td>
      <td>Question: Is naturopathy as effective as conve...</td>
      <td>Naturopathy appears to be an effective alterna...</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Answer the question based on the following con...</td>
      <td>Question: Can randomised trials rely on existi...</td>
      <td>Routine data have the potential to support hea...</td>
    </tr>
    <tr>
      <th>2</th>
      <td>Answer the question based on the following con...</td>
      <td>Question: Is laparoscopic radical prostatectom...</td>
      <td>The results of our non-randomized study show t...</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Answer the question based on the following con...</td>
      <td>Question: Does bacterial gastroenteritis predi...</td>
      <td>Symptoms consistent with IBS and functional di...</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Answer the question based on the following con...</td>
      <td>Question: Is early colonoscopy after admission...</td>
      <td>No significant association is apparent between...</td>
    </tr>
  </tbody>
</table>
</div>

```python
MAX_ROWS = 1000
OUTPUT = "output"
subset_data = data.head(MAX_ROWS)

chunks = subset_data[OUTPUT].to_list()
```

## Create a Pinecone Index

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
```

<hr />

```python
# create index
pc.create_index(
    name="pubmed",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(
        cloud=os.getenv("PINECONE_CLOUD"), region=os.getenv("PINECONE_REGION")
    ),
)
```

<hr />

```python
# set embedding model
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")

index = pc.Index("pubmed")


def embed(docs: list[str]) -> list[list[float]]:
    res = openai.embeddings.create(input=docs, model="text-embedding-3-small")
    doc_embeds = [r.embedding for r in res.data]
    return doc_embeds
```

<hr />

```python
# upsert data to index
from tqdm.auto import tqdm

batch_size = 100

for i in tqdm(range(0, len(chunks), batch_size)):
    i_end = min(len(chunks), i + batch_size)
    ids = [str(x) for x in range(i, i_end)]
    metadatas = [{"text": chunk} for chunk in chunks[i:i_end]]
    embeds = embed(chunk for chunk in chunks[i:i_end])
    records = list(zip(ids, embeds, metadatas))
    index.upsert(vectors=records)
```

```
  0%|          | 0/10 [00:00<?, ?it/s]
```

## Migrate from Pinecone to Qdrant

First you must install the library:

```shell
$ pip install vdf-io
```

### Export Data From Pinecone

```shell
$ export_vdf pinecone --serverless -c aws --region us-east-1 -i pubmed --namespace ""
Exporting index 'pubmed'
Iterating namespace ''
Collected 1000 IDs using list_points with implicit pagination.
Fetching namespaces: 100%|████████████████████████████████████████████████████████████| 1/1 [00:05<00:00,  5.52s/it]
Final Step: Fetching vectors: 2000it [00:04, 470.57it/s]
Exporting pubmed: 100%|███████████████████████████████████████████████████████████████| 1/1 [00:06<00:00,  6.29s/it]
{
    "version": "0.1.246",
    "file_structure": [
        "vdf_20240510_001325_88ae5/pubmed/i1.parquet/1.parquet",
        "vdf_20240510_001325_88ae5/VDF_META.json"
    ],
    "author": "infoslack",
    "exported_from": "pinecone",
    "indexes": {
        "pubmed": [
            {
                "namespace": "",
                "index_name": "pubmed",
                "total_vector_count": 1000,
                "exported_vector_count": 1000,
                "dimensions": 1536,
                "model_name": "NOT_PROVIDED",
                "model_map": null,
                "vector_columns": [
                    "vector"
                ],
                "data_path": "pubmed/i1.parquet",
                "metric": "Cosine",
                "index_config": null,
                "schema_dict_str": "id: string\nvector: list<element: double>\n  child 0, element: double\ntext: string\n-- schema metadata --\npandas: '{\"index_columns\": [{\"kind\": \"range\", \"name\": null, \"start\": 0, \"' + 592"
            }
        ]
    },
    "exported_at": "2024-05-10T00:13:31.858158-03:00",
    "id_column": null
}
Export to disk completed. Exported to: vdf_20240509_145419_88ae5/
Time taken to export data:  00:00:06
```

### Import Data to Qdrant

```shell
$ import_vdf qdrant -u $QDRANT_HOST

Enter the directory of vector dataset to be imported: vdf_20240509_145419_88ae5
ImportVDB initialized successfully.
Importing data for index 'pubmed'
/Users/infoslack/Projects/vector-migration/vdf_20240509_145419_88ae5/pubmed/i1.parquet/1.parquet read successfully. len(df)=1000 rows
Extracting vectors: 100%|█████████████████████████████████████████████████████████████████| 1000/1000 [00:00<00:00, 6349.32it/s]
Metadata was parsed to JSON
Uploading points in batches of 64 in 5 threads: 100%|██████████████████████████████████████| 1000/1000 [00:03<00:00, 280.44it/s]
Iterating parquet files: 100%|████████████████████████████████████████████████████████████████████| 1/1 [00:04<00:00,  4.14s/it]
Index 'pubmed' has 1000 vectors after import
1000 vectors were imported
Importing namespaces: 100%|███████████████████████████████████████████████████████████████████████| 1/1 [00:05<00:00,  5.55s/it]
Importing indexes: 100%|██████████████████████████████████████████████████████████████████████████| 1/1 [00:05<00:00,  5.55s/it]
Data import completed successfully.
Time taken: 5.62 seconds
```

### Verify Data Migration

!["Qdrant Cloud"](documentation/from-pinecone-to-qdrant/qdrant.png)

```python

```
