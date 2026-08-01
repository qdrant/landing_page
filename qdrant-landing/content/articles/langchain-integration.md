---
title: "Question Answering with LangChain and Qdrant"
short_description: "Build a retrieval-augmented question answering pipeline with just a few lines of code."
description: "We combined LangChain, a modern chat model like Claude or GPT, FastEmbed & Qdrant to create a question answering system with just a few lines of code. Learn more!"
social_preview_image: /articles_data/langchain-integration/preview/social_preview.jpg
preview_dir: /articles_data/langchain-integration/preview
weight: 40
author: Manas Chopra
author_link: https://www.linkedin.com/in/themanasai/
date: 2026-07-30T10:00:00+03:00
draft: false
keywords:
  - vector search
  - langchain
  - llm
  - large language models
  - question answering
  - openai
  - anthropic
  - claude
  - fastembed
  - embeddings
category: demos-and-tutorials
---

<div style="display: flex; align-items: center; gap: 8px;">
  <strong>Follow along in Colab:</strong>
  <a href="https://colab.research.google.com/github/qdrant/examples/blob/add-langchain-integration/langchain-integration/langchain_integration.ipynb"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"></a>
</div>

Building applications with Large Language Models doesn't have to be complicated. A lot has been going on recently to simplify the development,
so you can utilize already pre-trained models and support even complex pipelines with a few lines of code. [LangChain](https://docs.langchain.com/oss/python/langchain/overview)
provides unified interfaces to different libraries, so you can avoid writing boilerplate code and focus on the value you want to bring.

## Why Use Qdrant for Question Answering with LangChain?

It has been reported millions of times, but let's say it again. Modern LLMs, whether that's Claude, GPT, or any other chat model, still struggle to
generate factual statements if no context is provided. They have some general knowledge but cannot guarantee to produce a valid answer consistently. Thus,
it is better to provide some facts we know are actual, so it can just choose the valid parts and extract them from all the provided contextual data to give
a comprehensive answer. A [vector search engine, such as Qdrant](https://qdrant.tech/), is of great help here, as its ability to perform a
[semantic search](https://qdrant.tech/documentation/tutorials/search-beginners/) over a huge knowledge base is crucial to preselect some possibly valid
documents, so they can be provided into the LLM. This pattern is commonly known as retrieval-augmented generation, and it is one of the core building
blocks of [LangChain](https://qdrant.tech/documentation/frameworks/langchain/), which got Qdrant integrated as a first-class vector store, so it might be
used to build such pipelines effortlessly.

### The Two-Model Approach

Surprisingly enough, there will be two models required to set things up. First of all, we need an embedding model that will convert the set of facts into
vectors, and store those into Qdrant. That's an identical process to any other semantic search application. We're going to use
[FastEmbed](https://qdrant.tech/articles/fastembed/), Qdrant's own lightweight embedding library, so it can be hosted locally without pulling in a full
PyTorch or TensorFlow stack. The embeddings created by that model will be put into Qdrant and used to retrieve the most similar documents, given the query.

However, when we receive a query, there are two steps involved. First of all, we ask Qdrant to provide the most relevant documents and simply combine all
of them into a single text. Then, we build a prompt to the chat model (in our examples below, either [Anthropic's Claude](https://www.anthropic.com/claude)
or [OpenAI's GPT](https://openai.com/)), including those documents as a context, of course together with the question asked. So the input to the LLM
looks like the following:

```text
Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
It's as certain as 2 + 2 = 4
...

Question: How much is 2 + 2?
Helpful Answer:
```

There might be several context documents combined, and it is solely up to the LLM to choose the right piece of content. But our expectation is, the model
should respond with just `4`.

## Why do we need two different models?
Both solve some different tasks. The first model performs feature extraction, by converting the text into vectors, while
the second one helps in text generation or summarization. Disclaimer: this is not the only way to solve that task with LangChain. Since we simply stuff
all the retrieved documents into a single prompt, this pattern is often called a **stuff** chain.

![](/articles_data/langchain-integration/flow-diagram.png)

Enough theory! This sounds like a pretty complex application, as it involves several systems. But with LangChain, it might be implemented in just a few
lines of code, thanks to the integration with [Qdrant](https://qdrant.tech/). We're not even going to work directly with `QdrantClient`, as everything is
already done in the background by LangChain.

## How to Implement Question Answering with LangChain and Qdrant

### Step 1: Configuration

Before anything else, install the packages this pipeline touches - LangChain's Qdrant integration, FastEmbed, the `datasets` library for loading Natural
Questions, and whichever chat model provider you'd like to call:

```shell
pip install langchain langchain-qdrant fastembed datasets langchain-anthropic langchain-openai
```

A journey of a thousand miles begins with a single step, in our case with the configuration of all the services. We'll be using [Qdrant
Cloud](https://cloud.qdrant.io), so we need a URL and an API key. On the generation side, you can plug in whichever chat model you prefer - an API key
from [Anthropic](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/) is all you need, since LangChain exposes the same interface for
both.

```python
import os

os.environ["QDRANT_URL"] = "https://xxxxxx-xxxxxx.xxx.aws.cloud.qdrant.io"
os.environ["QDRANT_API_KEY"] = "<your-qdrant-api-key>"

# Pick whichever provider you'd like to use for generating the answers
os.environ["ANTHROPIC_API_KEY"] = "<your-anthropic-api-key>"  # for Claude
os.environ["OPENAI_API_KEY"] = "<your-openai-api-key>"        # for GPT
```

### Step 2: Building the knowledge base

We also need some facts from which the answers will be generated. There is plenty of public datasets available, and
[Natural Questions](https://ai.google.com/research/NaturalQuestions/visualization) is one of them - a collection of real Google search queries paired
with the relevant passage from Wikipedia that answers them. Rather than parsing the raw, HTML-heavy release ourselves, we can pull the
already-cleaned `query`/`answer` pairs published on the Hugging Face Hub, which gets us two lists of strings - one for questions and the other one for
the answers - in a single call.

```python
from datasets import load_dataset

dataset = load_dataset("sentence-transformers/natural-questions", split="train")
# 100 pairs is enough to experiment with; drop the .select() call entirely to index all 100k+ rows
dataset = dataset.select(range(100))

questions = dataset["query"]
answers = dataset["answer"]
```

The answers have to be vectorized with our embedding model. FastEmbed defaults to
[`BAAI/bge-small-en-v1.5`](https://huggingface.co/BAAI/bge-small-en-v1.5), a small, quantized model that runs comfortably on CPU, but there are
[several other models](https://qdrant.github.io/fastembed/examples/Supported_Models/) to pick from. `langchain-community`, which used to ship a
`FastEmbedEmbeddings` wrapper, is [being sunset](https://github.com/langchain-ai/langchain-community/issues/674), so instead we wrap FastEmbed's
`TextEmbedding` directly with LangChain's `Embeddings` interface - it's a handful of lines, and it keeps the pipeline free of a deprecated dependency.
LangChain will still handle vectorizing the documents and creating the Qdrant collection in a single function call.

```python
from typing import List

from fastembed import TextEmbedding
from langchain_core.embeddings import Embeddings
from langchain_qdrant import QdrantVectorStore


class FastEmbedEmbeddings(Embeddings):
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self._model = TextEmbedding(model_name=model_name)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [vector.tolist() for vector in self._model.embed(texts)]

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]


embeddings = FastEmbedEmbeddings()

doc_store = QdrantVectorStore.from_texts(
    answers,
    embeddings,
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
    collection_name="natural-questions",
)
```

### Step 3: Setting up the retrieval chain

With the knowledge base in place, the only thing left is to combine the retriever with a chat model. [`init_chat_model`](https://docs.langchain.com/oss/python/langchain/models)
lets us pass in the name of any supported model - Claude, GPT, or otherwise - without changing the rest of the pipeline. We then compose the retriever, the
prompt, and the model using LangChain's expression language (LCEL), so the whole chain is defined with a single `|`-piped expression.

```python
from langchain.chat_models import init_chat_model
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

retriever = doc_store.as_retriever()

prompt = ChatPromptTemplate.from_template(
    """Use the following pieces of context to answer the question at the end. If you don't know the answer, just
say that you don't know, don't try to make up an answer.

{context}

Question: {question}
Helpful Answer:"""
)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# Swap the model name for any other provider LangChain supports, e.g. "gpt-5.1"
llm = init_chat_model("claude-sonnet-4-5", model_provider="anthropic")

chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
```

## Step 4: Testing out the chain

And that's it! We can put in some queries, and LangChain will perform all the required processing to find the answer in the provided context. Since we
already have a `questions` list from the dataset, let's just sample a handful of them and see how the chain responds:

```python
import random

random.seed(76)
selected_questions = random.choices(questions, k=5)
for question in selected_questions:
    print(">", question)
    print(chain.invoke(question), end="\n\n")
```

The exact wording will vary depending on which chat model you plug in, but running the chain against the same knowledge base as the original experiment
produces answers along these lines:

```text
> what kind of music is scott joplin most famous for
 Scott Joplin is most famous for composing ragtime music.

> who died from the band faith no more
 Chuck Mosley

> when does maggie come on grey's anatomy
 Maggie first appears in season 10, episode 1, which aired on September 26, 2013.

> can't take my eyes off you lyrics meaning
 I don't know.

> who lasted the longest on alone season 2
 David McIntyre lasted the longest on Alone season 2, with a total of 66 days.
```

The great thing about such a setup is that the knowledge base might be easily extended with some new facts and those will be included in the prompts
sent to the LLM later on. Of course, assuming their similarity to the given question will be in the top results returned by Qdrant.
