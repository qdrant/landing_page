---
title: Code search
weight: 22
---

# Use semantic search to navigate your codebase

| Time: 45 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

Engineers can enrich their applications with semantic search experience using Qdrant, but they might be not only the 
creators but also the beneficiaries of this technology. In this tutorial, we will show how to use Qdrant to navigate a 
project's codebase, so you can find the relevant code snippets easier, even if you have never contributed to the project
before. As an example, we will use the [Qdrant](https://github.com/qdrant/qdrant) source code itself, which is mostly
written in Rust.

## The approach

There are at least two ways in which we would like to search the codebase. Navigating an unknown project is easier if
we can search for the code by its semantics, using natural-like queries. On the other hand, we might want to find the
code that is similar to the one we already have, in terms of the logic they both perform. Both of these tasks can be 
solved with the help of embeddings, but may require different means:

1. General usage neural encoder for natural-like queries, in our case `all-MiniLM-L6-v2` from the
   [sentence-transformers](https://www.sbert.net/docs/pretrained_models.html) library.
2. Specialized embeddings for code-to-code similarity search. The `jina-embeddings-v2-base-code` model is a good
   candidate for this task.

The latter model supports multiple programming languages and should also be able to generalize to unknown languages, of 
course, if they are not too [esoteric](https://en.wikipedia.org/wiki/Esoteric_programming_language) (do not expect to 
have an out-of-the-box support for Brainfuck or Befunge, but [Mojo](https://www.modular.com/max/mojo) shouldn't be a big 
deal). Regarding `all-MiniLM-L6-v2`, we will perform some additional data preprocessing to convert the code to more 
natural language like text.

## Data preparation

Chunking the application sources into smaller parts is non-trivial task on its own. If you follow good coding practices, 
you might have a well-structured codebase, what makes chunking way easier. If you don't, splitting the codebase into 
smaller parts might be a challenge itself. **The presented approach might not work if all you have is a spaghetti code. 
In that case please consider refactoring the project first.**

In general, functions, class methods, structs, enums, and all the other language-specific constructs are good candidates 
for chunks. They are big enough to contain some meaningful information, but small enough to be processed by embedding
models with a limited context window. Also, docstrings, comments, and other metadata can be used to enrich the chunks
with additional information.

![Code chunking strategy](/documentation/tutorials/code-search/data-chunking.png)

### Parsing the codebase

Rust is our main focus here, but the same approach can be applied to any other language. Parsing the code is easiest
with a [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) (**LSP**) compatible tool. It 
can build a graph of the codebase, which can be used to extract the chunks. We are not going to cover the LSP part here, 
but our experiments were done with the help of the [rust-analyzer](https://rust-analyzer.github.io/). We exported the
parsed codebase into the [LSIF](https://microsoft.github.io/language-server-protocol/specifications/lsif/0.4.0/specification/) 
format, which is a standard for code intelligence data like the ones implemented in your favorite IDE. Then, we used
the created LSIF dump to navigate the codebase and extract the chunks. This process is implemented in our [code search 
demo](https://github.com/qdrant/demo-code-search) if you want to see the details.

<aside role="status">
If you want to implement code search for your own non-Rust project, you can use the same approach. There is 
<a href="https://microsoft.github.io/language-server-protocol/implementors/servers/">plenty of implementations available
</a>, so you should be able to find a proper one, no matter the language of your choice.
</aside>

As a result of that whole process we exported the chunks into JSON documents with not only the code itself, but also
broader context to know where the code is located in the project. For example, here is how the description of the 
`await_ready_for_timeout` function from the `IsReady` struct in the `common` module looks like:

```json
{
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
```

All the Qdrant structures, parsed to JSON, are stored as lines in the [`structures.jsonl` 
file](https://storage.googleapis.com/tutorial-attachments/code-search/structures.jsonl) on our Google Cloud Storage 
bucket. Let's download it and use it as a source of data for our code search.

```shell
wget https://storage.googleapis.com/tutorial-attachments/code-search/structures.jsonl
```

As a next step, we are going to load the file and parse all the lines into a list of dictionaries:

```python
import json

structures = []
with open("structures.jsonl", "r") as fp:
    for i, row in enumerate(fp):
        entry = json.loads(row)
        structures.append(entry)
```

### Code to *natural language* conversion

Each programming language has its own syntax which is not a part of the natural language. Thus, a general-purpose model
probably won't be able to understand the code as it is. We can, however, do something that data scientists were doing
for a long time - perform some normalization, by getting rid of the code specifics and including some additional 
context, such as module, class, function, and file name. Here are the steps we are going to take:

1. Extract the signature of the function, method, or other code construct.
2. Divide camel case and snake case names into separate words.
3. Take the docstring, comments, and other important metadata.
4. Build a sentence from the extracted data using a predefined template.
5. Remove the special characters and replace them with spaces.

As an input, we are going to expect dictionaries with the same structure as above. Let's define a `textify` function
that will do the conversion for us. We'll use an `inflection` library to convert with different naming conventions.

```shell
pip install inflection
```

Once all the dependencies are installed, we can finally define the `textify` function:

```python
import inflection
import re

from typing import Dict, Any

def textify(chunk: Dict[str, Any]) -> str:
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
        f"module {chunk['context']['module']} "
        f"file {chunk['context']['file_name']}"
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

Now we can use the `textify` function to convert all the chunks into text representations:

```python
text_representations = list(map(textify, structures))
```

This is how the `await_ready_for_timeout` function description looks like:

```text
Function Await ready for timeout that does Return true if ready false if timed out defined as Fn await ready for timeout self timeout duration bool defined in struct Is ready module common file is_ready rs
```

## Ingestion pipeline

The next steps to build the code search engine are vectorizing the data and setting up a semantic search mechanism for 
both embedding models.

### Natural language embeddings

Our text representations might be easily encoded through the `all-MiniLM-L6-v2` model from the `sentence-transformers`.
There are some additional dependencies required by our second model, so let's install them all at once first:

```shell
pip install sentence-transformers optimum onnx
```

Then we can use the model to encode the text representations:

```python
from sentence_transformers import SentenceTransformer

nlp_model = SentenceTransformer("all-MiniLM-L6-v2")
nlp_embeddings = nlp_model.encode(
    text_representations, show_progress_bar=True,
)
```

### Code embeddings

The `jina-embeddings-v2-base-code` model is a good candidate for this task. It is also available through the 
`sentence-transformers` library, but you have to accept the conditions in order to be able to access it. Please visit 
[the model page](https://huggingface.co/jinaai/jina-embeddings-v2-base-code) to accept the rules and generate the access 
token in your[account settings](https://huggingface.co/settings/tokens). Once you have the token, you can use the model 
as follows:

```python
HF_TOKEN = "THIS_IS_YOUR_TOKEN"

# Extract the code snippets from the structures to a separate list
code_snippets = [
    structure["context"]["snippet"] for structure in structures
]

code_model = SentenceTransformer(
    "jinaai/jina-embeddings-v2-base-code",
    token=HF_TOKEN,
    trust_remote_code=True
)
code_model.max_seq_length = 8192  # increase the context length window
code_embeddings = code_model.encode(
    code_snippets, batch_size=4, show_progress_bar=True,
)
```

Do not forget to set the `trust_remote_code` parameter to `True`. Otherwise, the model will still produce some vectors, 
but they won't be meaningful.

Now, when we have both the natural language and code embeddings, we can store them in the Qdrant collection.

### Building Qdrant collection

We are going to use the `qdrant-client` library to interact with the Qdrant server. Let's install it first:

```shell
pip install qdrant-client
```

Of course, we need to have a running Qdrant server for vector search. If you don't have one, you can [use a local Docker 
container](https://qdrant.tech/documentation/quick-start/) or deploy it using the [Qdrant Cloud](https://cloud.qdrant.io/). 
There is a free tier 1GB cluster available, so you can use it to follow this tutorial. Let's configure the connection parameters:

```python
QDRANT_URL = "https://my-cluster.cloud.qdrant.io:6333" # http://localhost:6333 for local instance
QDRANT_API_KEY = "THIS_IS_YOUR_API_KEY" # None for local instance
```

Then we can use the library to create a collection:

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
    }
)
```

Our newly created collection is ready to accept the data. Let's upload the embeddings:
 
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
    for text_embedding, code_embedding, structure in zip(nlp_embeddings, code_embeddings, structures)
]

client.upload_points("qdrant-sources", points=points, batch_size=64)
```

Uploaded points are immediately available for search. Let's move to the next step and query the collection to find some
relevant code snippets.

## Querying the codebase

In the simplest case, we can use one of the models to search the collection. Let's start with text embeddings and check 
what are the results for the query "*How do I count points in a collection?*":

```python
query = "How do I count points in a collection?"

hits = client.search(
    "qdrant-sources",
    query_vector=(
        "text", nlp_model.encode(query).tolist()
    ),
    limit=5,
)
```

Output:

| module             | file_name           | score      | signature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|--------------------|---------------------|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| toc                | point_ops.rs        | 0.59448624 | ` async fn count (& self , collection_name : & str , request : CountRequestInternal , read_consistency : Option < ReadConsistency > , shard_selection : ShardSelectorInternal ,) -> Result < CountResult , StorageError > `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| operations         | types.rs            | 0.5493385  | ` # [doc = " Count Request"] # [doc = " Counts the number of points which satisfy the given filter."] # [doc = " If filter is not provided, the count of all points in the collection will be returned."] # [derive (Debug , Deserialize , Serialize , JsonSchema , Validate)] # [serde (rename_all = "snake_case")] pub struct CountRequestInternal { # [doc = " Look only for points which satisfies this conditions"] # [validate] pub filter : Option < Filter > , # [doc = " If true, count exact number of points. If false, count approximate number of points faster."] # [doc = " Approximate count might be unreliable during the indexing process. Default: true"] # [serde (default = "default_exact_count")] pub exact : bool , } ` |
| collection_manager | segments_updater.rs | 0.5121002  | ` fn upsert_points < 'a , T > (segments : & SegmentHolder , op_num : SeqNumberType , points : T ,) -> CollectionResult < usize > where T : IntoIterator < Item = & 'a PointStruct > , `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| collection         | point_ops.rs        | 0.5063539  | ` async fn count (& self , request : CountRequestInternal , read_consistency : Option < ReadConsistency > , shard_selection : & ShardSelectorInternal ,) -> CollectionResult < CountResult > `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| map_index          | mod.rs              | 0.49973983 | ` fn get_points_with_value_count < Q > (& self , value : & Q) -> Option < usize > where Q : ? Sized , N : std :: borrow :: Borrow < Q > , Q : Hash + Eq , `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

It seems we were able to find some relevant code structures. Let's try the same with the code embeddings:

```python
hits = client.search(
    "qdrant-sources",
    query_vector=(
        "code", code_model.encode(query).tolist()
    ),
    limit=5,
)
```

Output:

| module        | file_name                  | score      | signature                                     |
|---------------|----------------------------|------------|-----------------------------------------------|
| field_index   | geo_index.rs               | 0.73278356 | ` fn count_indexed_points (& self) -> usize ` |
| numeric_index | mod.rs                     | 0.7254976  | ` fn count_indexed_points (& self) -> usize ` |
| map_index     | mod.rs                     | 0.7124739  | ` fn count_indexed_points (& self) -> usize ` |
| map_index     | mod.rs                     | 0.7124739  | ` fn count_indexed_points (& self) -> usize ` |
| fixtures      | payload_context_fixture.rs | 0.706204   | ` fn total_point_count (& self) -> usize `    |

Scores retrieved by different models are not comparable, but we can see that the results are different. It seems that 
code and text embeddings are able to capture different aspects of the codebase. We can use both models to query the
collection and then combine the results to get the most relevant code snippets. All that, in a single batch request.

```python
results = client.search_batch(
    "qdrant-sources",
    requests=[
        models.SearchRequest(
            vector=models.NamedVector(
                name="text",
                vector=nlp_model.encode(query).tolist()
            ),
            with_payload=True,
            limit=5,
        ),
        models.SearchRequest(
            vector=models.NamedVector(
                name="code",
                vector=code_model.encode(query).tolist()
            ),
            with_payload=True,
            limit=5,
        ),
    ]
)
```

Output:

| module             | file_name                  | score      | signature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|--------------------|----------------------------|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| toc                | point_ops.rs               | 0.59448624 | ` async fn count (& self , collection_name : & str , request : CountRequestInternal , read_consistency : Option < ReadConsistency > , shard_selection : ShardSelectorInternal ,) -> Result < CountResult , StorageError > `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| operations         | types.rs                   | 0.5493385  | ` # [doc = " Count Request"] # [doc = " Counts the number of points which satisfy the given filter."] # [doc = " If filter is not provided, the count of all points in the collection will be returned."] # [derive (Debug , Deserialize , Serialize , JsonSchema , Validate)] # [serde (rename_all = "snake_case")] pub struct CountRequestInternal { # [doc = " Look only for points which satisfies this conditions"] # [validate] pub filter : Option < Filter > , # [doc = " If true, count exact number of points. If false, count approximate number of points faster."] # [doc = " Approximate count might be unreliable during the indexing process. Default: true"] # [serde (default = "default_exact_count")] pub exact : bool , } ` |
| collection_manager | segments_updater.rs        | 0.5121002  | ` fn upsert_points < 'a , T > (segments : & SegmentHolder , op_num : SeqNumberType , points : T ,) -> CollectionResult < usize > where T : IntoIterator < Item = & 'a PointStruct > , `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| collection         | point_ops.rs               | 0.5063539  | ` async fn count (& self , request : CountRequestInternal , read_consistency : Option < ReadConsistency > , shard_selection : & ShardSelectorInternal ,) -> CollectionResult < CountResult > `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| map_index          | mod.rs                     | 0.49973983 | ` fn get_points_with_value_count < Q > (& self , value : & Q) -> Option < usize > where Q : ? Sized , N : std :: borrow :: Borrow < Q > , Q : Hash + Eq , `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| field_index        | geo_index.rs               | 0.73278356 | ` fn count_indexed_points (& self) -> usize `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| numeric_index      | mod.rs                     | 0.7254976  | ` fn count_indexed_points (& self) -> usize `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| map_index          | mod.rs                     | 0.7124739  | ` fn count_indexed_points (& self) -> usize `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| map_index          | mod.rs                     | 0.7124739  | ` fn count_indexed_points (& self) -> usize `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| fixtures           | payload_context_fixture.rs | 0.706204   | ` fn total_point_count (& self) -> usize `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |


This is just a naive example of using different models and combining the results. In a real-world scenario, you might
want to perform some reranking and deduplication, as well as some additional processing of the results. 

### Grouping the results

One interesting technique to improve the search results, provided by Qdrant, is to group the results by the payload
properties. In our case, it may be useful to group the results by the module, as we see there are multiple results from
the `map_index` module, if we use the code embeddings. Let's group the results and assume just a single result per
module:

```python
results = client.search_groups(
    "qdrant-sources",
    query_vector=(
        "code", code_model.encode(query).tolist()
    ),
    group_by="context.module",
    limit=5,
    group_size=1,
)
```

Output:

| module        | file_name                  | score      | signature                                     |
|---------------|----------------------------|------------|-----------------------------------------------|
| field_index   | geo_index.rs               | 0.73278356 | ` fn count_indexed_points (& self) -> usize ` |
| numeric_index | mod.rs                     | 0.7254976  | ` fn count_indexed_points (& self) -> usize ` |
| map_index     | mod.rs                     | 0.7124739  | ` fn count_indexed_points (& self) -> usize ` |
| fixtures      | payload_context_fixture.rs | 0.706204   | ` fn total_point_count (& self) -> usize `    |
| hnsw_index    | graph_links.rs             | 0.6998417  | ` fn num_points (& self) -> usize `           |

Using the grouping feature, we were able to get more diverse results.

## Summary

In this tutorial, we have shown how to use Qdrant to navigate a project's codebase. If you want to see an end-to-end
implementation of the presented approach, you can check the [code search notebook]().

TODO: add link to Google Colab notebook
