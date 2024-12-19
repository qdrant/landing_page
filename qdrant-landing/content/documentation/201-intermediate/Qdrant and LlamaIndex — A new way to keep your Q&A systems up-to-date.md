---
google_colab_link: https://githubtocolab.com/k/blob/refactor/tutorial-levels/201-intermediate/llama_index_recency/Qdrant and LlamaIndex — A new way to keep your Q&A systems up-to-date.ipynb
reading_time_min: 13
title: Introduction
---

## Combining Qdrant and LlamaIndex to keep Q&A systems up-to-date

# Introduction

Have you ever been frustrated with an answer engine that is stuck in the past? As our world rapidly evolves, the accuracy of information changes accordingly. Traditional models can become outdated, providing answers that were once accurate but are now obsolete. The cost of outdated knowledge can be high - misinforming users, impacting decision-making, and ultimately undermining trust in your system.

Qdrant and LlamaIndex work together seamlessly, continually adapting your engine to the relentless pace of information change. By mastering these tools, you can transform your applications from static knowledge repositories into dynamic, adaptable knowledge machines. Whether you're a seasoned data scientist or an AI enthusiast, join us on this learning journey - the future of answer engines is here, and it's time to embrace it.

## Learning Outcomes

In this tutorial, you will learn the following:

- 1️⃣ How to build a question-answering system using LlamaIndex and Qdrant.
  - We will load a news dataset, store it with Qdrant client, and load the data into LlamaIndex.
- 2️⃣ How to keep the QA engine updated and improve the ranking system.
  - We will define two postprocessors: Recency and Cohere Rerank; and use these to create various query engines.
- 3️⃣ How to use Node Sources in LlamaIndex to investigate questions and sources on which the answers are based.
  - We will query these engines with various questions and compare their responses.

## Prerequisites

Main Tools

1. `llama_index`: A powerful tool for building large-scale information retrieval systems. [Learn More](https://gpt-index.readthedocs.io/en/latest/getting_started/starter_example.html)
1. `qdrant_client`: A high-performance vector database designed for storing and searching large-scale high-dimensional vectors. In this tutorial, we use Qdrant as our vector storage system.
1. `cohere`: A key reranking service to be used in postprocessing. It takes in a query and a list of texts and returns an ordered array with each text assigned a _new_ relevance score.
1. `OpenAI`: Important for answer generation, as it takes the top few candidates to produce a final answer.
1. `datasets`: Library necessary to import our dataset.
1. `pandas`: Relevant library for data manipulation and analysis.

### Install Packages

Before you start, install the required packages with pip:

```python
# !pip install llama-index cohere datasets pandas
# !pip install -U qdrant-client
```

Optional: install Rich to make error messages and stack traces easier to read.

```python
# !pip install 'rich[jupyter]'
%load_ext rich
```

Import your packages

```python
import datetime
import os
import random
from pathlib import Path
from typing import Any

import pandas as pd
from datasets import load_dataset
from IPython.display import Markdown, display_markdown
from llama_index import GPTVectorStoreIndex, ServiceContext, SimpleDirectoryReader
from llama_index.indices.postprocessor import FixedRecencyPostprocessor
from llama_index.indices.postprocessor.cohere_rerank import CohereRerank
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

Path.ls = lambda x: list(x.iterdir())
random.seed(42)  # This is the answer
```

### Retrieve API Keys:

Before you start, you must retrieve two API keys for the following services:

1. OpenAI key for LLM. [Link](https://platform.openai.com/account/api-keys)
1. Cohere key for Rerank. [Link](https://dashboard.cohere.ai/api-keys) or additionally, read [Cohere Documentation](https://docs.cohere.com/reference/key).

This tutorial by default uses the Qdrant Client, which doesn't require an API key. However, if you choose Qdrant Cloud instead, then you need a third key. You can get it [the Qdrant Cloud main control panel](https://cloud.qdrant.io/)

```python
def check_environment_keys():
    """
    Utility Function that you have the NECESSARY Keys
    """
    if os.environ.get("OPENAI_API_KEY") is None:
        raise ValueError(
            "OPENAI_API_KEY cannot be None. Set the key using os.environ['OPENAI_API_KEY']='sk-xxx'"
        )
    if os.environ.get("COHERE_API_KEY") is None:
        raise ValueError(
            "COHERE_API_KEY cannot be None. Set the key using os.environ['COHERE_API_KEY']='xxx'"
        )
    if os.environ.get("QDRANT_API_KEY") is None:
        print("[Optional] If you want to use the Qdrant Cloud, please get the Qdrant Cloud API Keys and URL")


check_environment_keys()
```

```
[Optional] If you want to use the Qdrant Cloud, please get the Qdrant Cloud API Keys and URL
```

## Architecture

Our answer engine consists of two main parts:

1. Retrieval - Done with Qdrant
1. Synthesis - Done with OpenAI API

We will use LlamaIndex to make the Query Engine and Qdrant for our Vector Store. Later, we will add components to keep the engine updated and improve ranking after retrieval

The arrow point represents the direction of data flow. The "Query Engine" box encapsulates the postprocessing step to indicate that it's a part of the query engine's function. This diagram is meant to provide a high-level understanding of the process and does not include all the details involved.

![](<documentation/Qdrant and LlamaIndex — A new way to keep your Q&A systems up-to-date/SetupFocus.png>)

# Load Sample Dataset

First we need to load our documents. In this example, we will use the [News Category Dataset v3](https://huggingface.co/datasets/heegyu/news-category-dataset). This dataset contains news articles with various fields like `headline`, `category`, `short_description`, `link`, `authors`, and date. Once we load the data, we will reformat it to suit our needs.

```python
dataset = load_dataset("heegyu/news-category-dataset", split="train")
```

```
Found cached dataset json (/Users/nirantk/.cache/huggingface/datasets/heegyu___json/heegyu--news-category-dataset-a0dcb53f17af71bf/0.0.0/e347ab1c932092252e717ff3f949105a4dd28b27e842dd53157d2f72e276c2e4)
```

```python
def get_single_text(k):
    return f"Under the category:\n{k['category']}:\n{k['headline']}\n{k['short_description']}"


df = pd.DataFrame(dataset)
df.head()
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
      <th>link</th>
      <th>headline</th>
      <th>category</th>
      <th>short_description</th>
      <th>authors</th>
      <th>date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>https://www.huffpost.com/entry/covid-boosters-...</td>
      <td>Over 4 Million Americans Roll Up Sleeves For O...</td>
      <td>U.S. NEWS</td>
      <td>Health experts said it is too early to predict...</td>
      <td>Carla K. Johnson, AP</td>
      <td>2022-09-23</td>
    </tr>
    <tr>
      <th>1</th>
      <td>https://www.huffpost.com/entry/american-airlin...</td>
      <td>American Airlines Flyer Charged, Banned For Li...</td>
      <td>U.S. NEWS</td>
      <td>He was subdued by passengers and crew when he ...</td>
      <td>Mary Papenfuss</td>
      <td>2022-09-23</td>
    </tr>
    <tr>
      <th>2</th>
      <td>https://www.huffpost.com/entry/funniest-tweets...</td>
      <td>23 Of The Funniest Tweets About Cats And Dogs ...</td>
      <td>COMEDY</td>
      <td>"Until you have a dog you don't understand wha...</td>
      <td>Elyse Wanshel</td>
      <td>2022-09-23</td>
    </tr>
    <tr>
      <th>3</th>
      <td>https://www.huffpost.com/entry/funniest-parent...</td>
      <td>The Funniest Tweets From Parents This Week (Se...</td>
      <td>PARENTING</td>
      <td>"Accidentally put grown-up toothpaste on my to...</td>
      <td>Caroline Bologna</td>
      <td>2022-09-23</td>
    </tr>
    <tr>
      <th>4</th>
      <td>https://www.huffpost.com/entry/amy-cooper-lose...</td>
      <td>Woman Who Called Cops On Black Bird-Watcher Lo...</td>
      <td>U.S. NEWS</td>
      <td>Amy Cooper accused investment firm Franklin Te...</td>
      <td>Nina Golgowski</td>
      <td>2022-09-22</td>
    </tr>
  </tbody>
</table>
</div>

```python
# Assuming `df` is your original dataframe
df["year"] = df["date"].dt.year

category_columns_to_keep = ["POLITICS", "THE WORLDPOST", "WORLD NEWS", "WORLDPOST", "U.S. NEWS"]

# Filter by category
df_filtered = df[df["category"].isin(category_columns_to_keep)]

# Sample data for each year


def sample_func(x):
    return x.sample(min(len(x), 200), random_state=42)


df_sampled = df_filtered.groupby("year").apply(sample_func).reset_index(drop=True)
```

<hr />

```python
df_sampled["year"].value_counts()
```

```
year
2014    200
2015    200
2016    200
2017    200
2018    200
2019    200
2020    200
2021    200
2022    200
Name: count, dtype: int64
```

```python
del df
```

<hr />

```python
df = df_sampled
```

<hr />

```python
df["text"] = df.apply(get_single_text, axis=1)
df["text"]
```

```
0       Under the category:\nWORLDPOST:\nAfghans Don't...
1       Under the category:\nPOLITICS:\nACLU Seeks To ...
2       Under the category:\nPOLITICS:\nWork and Worth...
3       Under the category:\nPOLITICS:\nJody Hice, Ant...
4       Under the category:\nPOLITICS:\nCapito Wins We...
                              ...                        
1795    Under the category:\nPOLITICS:\nA Hard-Right R...
1796    Under the category:\nPOLITICS:\nHerschel Walke...
1797    Under the category:\nU.S. NEWS:\nStocks Fall, ...
1798    Under the category:\nWORLD NEWS:\nPeru Court O...
1799    Under the category:\nPOLITICS:\nMichigan Secre...
Name: text, Length: 1800, dtype: object
```

```python
df["text"][9]
```

```
"Under the category:\nWORLDPOST:\nFreed Taliban Commander Tells Relative He'll Fight Americans Again\n"
```

```python
df.drop(columns=["year"], inplace=True)
```

Next, write these documents to text files in a directory. Each document will be written to a text file named after its date.

```python
%%time
write_dir = Path("../data/sample").resolve()
if write_dir.exists():
    [f.unlink() for f in write_dir.ls()]
write_dir.mkdir(exist_ok=True, parents=True)
for index, row in df.iterrows():
    date = str(row["date"]).replace("-", "_")  # replace '-' in date with '_' to avoid issues with file names
    file_path = write_dir / f"date_{date}_row_{index}.txt"
    with file_path.open("w") as f:
        f.write(row["text"])
```

```
CPU times: user 45.6 ms, sys: 116 ms, total: 161 ms
Wall time: 162 ms
```

```python
# del dataset, df
```

## Store Dataset with Qdrant Client

We'll be using Qdrant as our vector storage system. Qdrant is a high-performance vector database designed for storing and searching large-scale high-dimensional vectors.

### Local Qdrant Server/Docker + Cloud Instructions

- If you're running a local Qdrant instance with Docker, use `uri`:
  - `uri="http://<host>:<port>"`

Here I'll be using the cloud, so I am using the url set to my cloud instance

- Set the API KEY for Qdrant Cloud:
  - `api_key="<qdrant-api-key>"`
  - `url`

### Memory

- You can use `:memory:` mode for fast and lightweight experiments. It does not require Qdrant to be deployed anywhere.

```python
client = QdrantClient(":memory:")
```

## Load Data into LlamaIndex

LlamaIndex has a simple way to load documents from a directory. We can define a function to get the metadata from a file name, and pass this function to the `SimpleDirectoryReader` class.

```python
def get_file_metadata(file_name: str):
    """Get file metadata."""
    date_str = Path(file_name).stem.split("_")[1:4]
    return {"date": "-".join(date_str)}


documents = SimpleDirectoryReader(input_files=write_dir.ls(), file_metadata=get_file_metadata).load_data()
```

<hr />

```python
len(documents)
```

```
1800
```

Let's look at the date ranges in our dataset:

```python
dates, years = [], []

for document in documents:
    dt = datetime.datetime.fromisoformat(document.extra_info["date"])
    #     print(d)
    try:
        dates.append(dt)
        years.append(dt.year)
    except Exception:
        print(dt)
```

This `date` key is *necessary* for the Recency Postprocessor that we are going to use later.

We have to parse these documents into nodes and create our QdrantVectorStore:

```python
# define service context (wrapper container around current classes)
service_context = ServiceContext.from_defaults(chunk_size_limit=512)
vector_store = QdrantVectorStore(client=client, collection_name="NewsCategoryv3PoliticsSample")
```

Next, we will create our `GPTVectorStoreIndex` from the documents. This operation might take some time as it's creating the index from the documents.

```python
%%time
index = GPTVectorStoreIndex.from_documents(
    documents, vector_store=vector_store, service_context=service_context
)
```

## Run a Test Query

We have made an index. But as we saw in the diagram, we also need some added functionality to do 3 things:

1. Retrieval
   - Convert the text query into embedding
   - Find the most similar documents
1. Synthesis
   - The LLM (here, OpenAI) texts the question, similar documents and a prompt to give you an answer

```python
query_engine = index.as_query_engine(similarity_top_k=10)
```

<hr />

```python
response = query_engine.query("Who is the US President?")
print(response)
```

```
The US President is Joe Biden.
```

```python
response = query_engine.query("Who is the current US President?")
print(response)
```

```
The current US President is Joe Biden.
```

# Adding Postprocessors

LlamaIndex excels at composing Retrieval and Ranking steps.

The intention behind this is to improve answer quality. Let's see if we can use Postprocessors to improve answer quality by using two approaches:

1. Selecting the most recent nodes (Recency).
1. Reranking using a different model (Cohere Rerank).

![](<documentation/Qdrant and LlamaIndex — A new way to keep your Q&A systems up-to-date/RankFocus.png>)

Here is what the diagram represents:

1. The user issues a query to the query engine.
1. The query engine, which has been configured with certain postprocessors, performs a search on the vector store based on the query.
1. The query engine then postprocesses the results.
1. The postprocessed results are then returned to the user

### Define a Recency Postprocessor

LlamaIndex allows us to add postprocessors to our query engine. These postprocessors can modify the results of our queries after they are returned from the index. Here, we'll add a recency postprocessor to our query engine. This postprocessor will prioritize recent documents in the results.

We'll define a single type of recency postprocessor: `FixedRecencyPostprocessor`.

```python
recency_postprocessor = FixedRecencyPostprocessor(service_context=service_context, top_k=1)
```

### Rerank with Cohere

Cohere Rerank works on the top K results which the Retrieval step from Qdrant returns. While Qdrant works on your entire corpus (here thousands, but Qdrant is designed to work with millions) -- Cohere works with the result from Qdrant. This can improve the search results since it's working on smaller number of entries.

![](<documentation/Qdrant and LlamaIndex — A new way to keep your Q&A systems up-to-date/RerankFocus.png>)

Rerank endpoint takes in a query and a list of texts and produces an ordered array with each text assigned a relevance score. We'll define a `CohereRerank` postprocessor and add it to our query engine.

## Defining Query Engines

We'll define four query engines for this tutorial:

1. Just the Vector Store i.e. Qdrant here
1. A recency query engine
1. A reranking query engine
1. And a combined query engine.

The recency query engine uses the `FixedRecencyPostprocessor`, the reranking query engine uses the `CohereRerank` postprocessor, and the combined query engine uses both.

```python
top_k = 10  # set one, reuse from now on, ensures consistency
```

<hr />

```python
index_query_engine = index.as_query_engine(
    similarity_top_k=top_k,
)
```

<hr />

```python
recency_query_engine = index.as_query_engine(
    similarity_top_k=top_k,
    node_postprocessors=[recency_postprocessor],
)
```

<hr />

```python
cohere_rerank = CohereRerank(api_key=os.environ["COHERE_API_KEY"], top_n=top_k)
reranking_query_engine = index.as_query_engine(
    similarity_top_k=top_k,
    node_postprocessors=[cohere_rerank],
)
```

<hr />

```python
query_engine = index.as_query_engine(
    similarity_top_k=top_k,
    node_postprocessors=[cohere_rerank, recency_postprocessor],
)
```

## Querying the Engine

Finally, we can query our engine. Let's ask it "Who is the current US President?" and see the results from each query engine.

```python
# question = "Who is the current US President?"
response = index_query_engine.query("Who is the US President?")
print(response)
```

```
The US President is Joe Biden.
```

The `response` object has a few interesting attributes which help us quickly debug and understand what happened in each of our steps:

1. What source nodes (similar to Document Chunks in Langchain) were used to answer the question
1. What `extra_info` does the index have which we can use? This could also be sent as a payload to Qdrant to filter on (via epoch time) -- but Llama Index does not

Let's unpack that a bit, and we'll use what we learn from `response` to improve our understanding of the query engines and post processors themselves.

Note that `10` which is the top-k parameter we set. This confirms that we retrieved the 10 documents most similar to the question (or more correct: 10 nearest neighbours to the question) and a confidence score.

Can we show this in a more human-readable way?

```python
print(response.get_formatted_sources()[:318])
```

```
> Source (Doc id: 24ec05e1-cb35-492e-8741-fdfe2c582e43): date: 2017-01-28 00:00:00

Under the category:
THE WORLDPOST:
World Leaders React To The Reality ...

> Source (Doc id: 098c2482-ce52-4e31-aa1c-825a385b56a1): date: 2015-01-18 00:00:00

Under the category:
POLITICS:
The Issue That's Looming Over The Final ...
```

Let's check what is stored in the `extra_info` attribute.

```python
response.extra_info
```

```
{'24ec05e1-cb35-492e-8741-fdfe2c582e43': {'date': '2017-01-28 00:00:00'},
 '098c2482-ce52-4e31-aa1c-825a385b56a1': {'date': '2015-01-18 00:00:00'},
 'a3993bb5-64a4-46ce-aa15-0e0672f0994f': {'date': '2014-08-21 00:00:00'},
 'e48f4521-1bf3-45a3-b00b-fd6a03855d6f': {'date': '2018-12-26 00:00:00'},
 '2a13360c-2c18-4917-aef8-1002931d6a3c': {'date': '2016-06-24 00:00:00'},
 '77bd45bf-5418-4eee-bc47-33d2942e2fb8': {'date': '2014-05-31 00:00:00'},
 '51ab3ea9-67af-48a0-864a-5fa1559b2a63': {'date': '2017-06-29 00:00:00'},
 '023a5a27-1f92-4028-aea6-38e681ff2032': {'date': '2014-12-03 00:00:00'},
 '360fac77-ff67-475e-96d8-1480f2447971': {'date': '2014-12-20 00:00:00'},
 '95f092f4-0bed-46de-bae0-4107b775d603': {'date': '2022-03-26 00:00:00'}}
```

This has a `date` key-value as a string against the `doc id`

Let's setup some tools to have a question, answer and the responses from the index engine in the same object - this will come handy in a bit for explaining a wrong answer.

```python
def mprint(text: str):
    display_markdown(Markdown(text))


class QAInfo:
    """This class is used to store the question, correct answer and responses from different query engines."""

    def __init__(self, question: str, correct_answer: str, query_engines: dict[str, Any]):
        self.question = question
        self.query_engines = query_engines
        self.correct_answer = correct_answer
        self.responses = {}

    def add_response(self, engine: str, response: str):
        # This method is used to add the response of a query engine to the responses dictionary.
        self.responses[engine] = response

    def compare_responses(self):
        """This function takes in a QAInfo object and a dictionary of query engines, and runs the question through each query engine.
        The responses from each engine are added to the QAInfo object."""
        mprint(f"### Question: {self.question}")

        for engine_name, engine in query_engines.items():
            response = engine.query(self.question)
            self.add_response(engine_name, response)
            mprint(f"**{engine_name.title()}**: {response}")

        mprint(f"Correct Answer is: {self.correct_answer}")

    def node_print(self, index, preview_count=5):
        source_nodes = self.responses[index].source_nodes
        for i in range(preview_count):
            mprint(f"- {source_nodes[i].node.text}")


query_engines = {
    "qdrant": index_query_engine,
    "recency": recency_query_engine,
    "reranking": reranking_query_engine,
    "both": query_engine,
}
```

<hr />

```python
question = "Who is the US President?"
correct_answer = "Joe Biden"  # This would normally be determined programmatically.
president_qa_info = QAInfo(question=question, correct_answer=correct_answer, query_engines=query_engines)
president_qa_info.compare_responses()
```

### Question: Who is the US President?

**Qdrant**:
The US President is Joe Biden.

**Recency**:
The US President is Joe Biden.

**Reranking**:
The US President is Barack Obama.

**Both**:
The US President is Joe Biden.

Correct Answer is: Joe Biden

```python
president_qa_info.node_print(index="recency", preview_count=1)
```

- Under the category:
  WORLD NEWS:
  Biden On Putin: 'For God's Sake, This Man Cannot Remain In Power'
  President Joe Biden visited Poland's capital on Saturday to speak with refugees who've been displaced amid Russia's attack on Ukraine.

```python
president_qa_info.node_print(index="qdrant", preview_count=1)
```

- Under the category:
  THE WORLDPOST:
  World Leaders React To The Reality Of A Trump Presidency
  Many of the presidential memorandums and executive decisions will fundamentally affect countries around the globe.

## Impact of how a question is asked

```python
question = "Who is US President in 2022?"
correct_answer = "Joe Biden"  # This would normally be determined programmatically.
current_president_qa_info = QAInfo(
    question=question, correct_answer=correct_answer, query_engines=query_engines
)
current_president_qa_info.compare_responses()
```

### Question: Who is US President in 2022?

**Qdrant**:
Joe Biden is the US President in 2022.

**Recency**:
The US President in 2022 is unknown at this time.

**Reranking**:
Joe Biden is the US President in 2022.

**Both**:
The US President in 2022 is unknown at this time.

Correct Answer is: Joe Biden

### Investigating for Ranking Challenges

We pull the few top documents which from each query engine. To make them easy to read, we've a utility `node_print` here.

💡 We notice that Qdrant (using embeddings) correctly pulls out a few mentions of "2024", "Joe Biden" and "President Joe Biden"

💡 Cohere also re-orders the top 10 candidates to give the top 3 which mention "President Joe Biden".

With Recency, we get an undetermined answer. This is because we're only using the one, most recent result.

## 🎓 Try this now:

> Change the `top_k` value passed to `llama_index` and see how that changes the answers

```python
current_president_qa_info.node_print(index="qdrant", preview_count=3)
```

- Under the category:
  POLITICS:
  Joe Biden Says He 'Can't Picture' U.S. Troops Being In Afghanistan In 2022
  The president doubled down on his promise to end America's longest-running war at a Thursday press conference, though he said a May 1 deadline seemed unlikely.

- Under the category:
  POLITICS:
  How A Crowded GOP Field Could Bolster A Trump 2024 Campaign
  As Donald Trump considers another White House run, polls show he's the most popular figure in the Republican Party.

- Under the category:
  POLITICS:
  Biden To Give First State Of The Union Address At Fraught Moment
  President Joe Biden aims to navigate the country out a pandemic, reboot his stalled domestic agenda and confront Russia’s aggression.

```python
current_president_qa_info.node_print(index="recency", preview_count=1)
```

- Under the category:
  POLITICS:
  GOP Senators Refuse To Rule Out Supporting Donald Trump Again — Even If He's Indicted
  With the ex-president reportedly under criminal investigation, many Senate Republicans are taking a wait-and-hope-it-doesn’t-happen stance.

```python
current_president_qa_info.node_print(index="reranking", preview_count=3)
```

- Under the category:
  POLITICS:
  Biden To Give First State Of The Union Address At Fraught Moment
  President Joe Biden aims to navigate the country out a pandemic, reboot his stalled domestic agenda and confront Russia’s aggression.

- Under the category:
  WORLD NEWS:
  Biden On Putin: 'For God's Sake, This Man Cannot Remain In Power'
  President Joe Biden visited Poland's capital on Saturday to speak with refugees who've been displaced amid Russia's attack on Ukraine.

- Under the category:
  POLITICS:
  Joe Biden Says He 'Can't Picture' U.S. Troops Being In Afghanistan In 2022
  The president doubled down on his promise to end America's longest-running war at a Thursday press conference, though he said a May 1 deadline seemed unlikely.

## Add a specific Year

That looks interesting. Let's try this question after specifying the year:

```python
question = "Who was the US President in 2010?"
correct_answer = "Barack Obama"  # This would normally be determined programmatically.
president_2010_qa_info = QAInfo(question=question, correct_answer=correct_answer, query_engines=query_engines)
president_2010_qa_info.compare_responses()
```

### Question: Who was the US President in 2010?

**Qdrant**:
The US President in 2010 was Barack Obama.

**Recency**:
In 2010, the US President was Barack Obama.

**Reranking**:
The US President in 2010 was Barack Obama.

**Both**:
In 2010, the US President was Barack Obama.

Correct Answer is: Barack Obama

Let's try a different variant of this question, specify a year and see what happens?

```python
question = "Who was the Finance Minister of India under Manmohan Singh Govt?"
correct_answer = "P. Chidambaram"  # This would normally be determined programmatically.
prime_minister_jan2014 = QAInfo(question=question, correct_answer=correct_answer, query_engines=query_engines)
prime_minister_jan2014.compare_responses()
```

### Question: Who was the Finance Minister of India under Manmohan Singh Govt?

**Qdrant**:
The Finance Minister of India under Manmohan Singh Govt was Palaniappan Chidambaram.

**Recency**:
The Finance Minister of India under Manmohan Singh Govt was Palaniappan Chidambaram.

**Reranking**:
The Finance Minister of India under Manmohan Singh Govt was Palaniappan Chidambaram.

**Both**:
The Finance Minister of India under Manmohan Singh Govt was Palaniappan Chidambaram.

Correct Answer is: P. Chidambaram

### Observation

In this question: All the engines give the correct answer!

This is despite the fact that the Recency Postprocessor response does not even talk about the Indian Prime Minister! ❌

Qdrant via OpenAI Embeddings and Cohere Rerank do not do that much better

The correct answer comes from OpenAI LLM's knowledge of the world!

```python
prime_minister_jan2014.node_print(index="qdrant", preview_count=10)
```

- Under the category:
  POLITICS:
  Robbing Main Street to Prop Up Wall Street: Why Jerry Brown's Rainy Day Fund Is a Bad Idea
  There is no need to sequester funds urgently needed by Main Street to pay for Wall Street's malfeasance. Californians can have their cake and eat it too - with a state-owned bank.

- Under the category:
  WORLDPOST:
  Cities Need To Get Smarter -- And India's On It

- Under the category:
  POLITICS:
  It Takes Just 4 Charts To Show A Big Part Of What's Wrong With Congress

- Under the category:
  WORLD NEWS:
  Arundhati Roy's New Novel Lays India Bare, Unveiling Worlds Within Our Worlds
  Malavika Binny, Jawaharlal Nehru University Wearing two hats at once can be an uncomfortable fit, but it does not seem to

- Under the category:
  POLITICS:
  The World Bank Must Commit to Food Security
  Much will be said about bringing roads, electricity and infrastructure to underdeveloped regions. But how committed is the World Bank to the planet as a whole when it is doling out its loans?

- Under the category:
  WORLDPOST:
  Former Prime Minister: Japan Should Shelve the Islands Dispute With China to Avoid A Spiral into Conflict

- Under the category:
  POLITICS:
  Senate Delays Vote On $1.1 Trillion Spending Bill

- Under the category:
  WORLDPOST:
  Sweden Election Results Offer Uncertain Future For Austerity

- Under the category:
  THE WORLDPOST:
  Greece Demands IMF Explain 'Disaster' Remarks In Explosive Leak
  A letter from Greek prime minister Alexis Tsipras questions whether the country "can trust" the lender.

- Under the category:
  WORLDPOST:
  Comedians Send Powerful Message Against Sexual Harassment In India

```python
prime_minister_jan2014.node_print(index="recency", preview_count=1)
```

- Under the category:
  WORLD NEWS:
  Arundhati Roy's New Novel Lays India Bare, Unveiling Worlds Within Our Worlds
  Malavika Binny, Jawaharlal Nehru University Wearing two hats at once can be an uncomfortable fit, but it does not seem to

```python
prime_minister_jan2014.node_print(index="reranking", preview_count=10)
```

- Under the category:
  WORLDPOST:
  Comedians Send Powerful Message Against Sexual Harassment In India

- Under the category:
  WORLD NEWS:
  Arundhati Roy's New Novel Lays India Bare, Unveiling Worlds Within Our Worlds
  Malavika Binny, Jawaharlal Nehru University Wearing two hats at once can be an uncomfortable fit, but it does not seem to

- Under the category:
  POLITICS:
  It Takes Just 4 Charts To Show A Big Part Of What's Wrong With Congress

- Under the category:
  WORLDPOST:
  Sweden Election Results Offer Uncertain Future For Austerity

- Under the category:
  WORLDPOST:
  Cities Need To Get Smarter -- And India's On It

- Under the category:
  WORLDPOST:
  Former Prime Minister: Japan Should Shelve the Islands Dispute With China to Avoid A Spiral into Conflict

- Under the category:
  POLITICS:
  Senate Delays Vote On $1.1 Trillion Spending Bill

- Under the category:
  POLITICS:
  The World Bank Must Commit to Food Security
  Much will be said about bringing roads, electricity and infrastructure to underdeveloped regions. But how committed is the World Bank to the planet as a whole when it is doling out its loans?

- Under the category:
  POLITICS:
  Robbing Main Street to Prop Up Wall Street: Why Jerry Brown's Rainy Day Fund Is a Bad Idea
  There is no need to sequester funds urgently needed by Main Street to pay for Wall Street's malfeasance. Californians can have their cake and eat it too - with a state-owned bank.

- Under the category:
  THE WORLDPOST:
  Greece Demands IMF Explain 'Disaster' Remarks In Explosive Leak
  A letter from Greek prime minister Alexis Tsipras questions whether the country "can trust" the lender.

# Recap

- 1️⃣ Crafting a Q&A bot with LlamaIndex and Qdrant
  - We dumped a news dataset, kicked up a Qdrant client, and stuffed our data into a LlamaIndex
- 2️⃣ Keeping our Q&A bot fresh and cranking up the ranking goodness
  - We used a recency postprocessor and a Cohere reranking postprocessor, and put them to work building different query engines
- 3️⃣ Using Node Sources in Llama Index to dig into the Q&A trails
  - We threw a bunch of questions at these engines and saw how they stacked up!

We figured out that recency postprocessing has its perks, but it can leave us hanging when we narrow down the info too much. Plugging in a reranking postprocessor like Cohere can help sort the responses better.
