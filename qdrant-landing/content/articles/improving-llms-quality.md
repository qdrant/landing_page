---
title: On improving LLMs quality
short_description: "TBD"
description: "TBD"
social_preview_image: /articles_data/improving-llms-quality/social_preview.png
small_preview_image: /articles_data/improving-llms-quality/icon.svg
preview_dir: /articles_data/improving-llms-quality/preview
weight: 7
author: Kacper Łukawski
author_link: https://medium.com/@lukawskikacper
date: 2023-10-03T10:38:00+01:00
draft: false
keywords:
  - llm
  - large language model
  - retrieval augmented generation
  - rag
  - openai
  - embeddings
  - semantic search
  - knowledge base
  - prompt engineering
---

Large Language Models are not search engines. Those intelligent at-first-sight creatures cannot access all the knowledge 
of humanity but can produce text that sounds like a human wrote it. Our expectations have been set so high, but things 
started to change while discovering ChatGPT-like systems' flaws. Hopefully, we have already passed the peak of the hype 
and can start producing useful tools using them. At the end of the day, *[what the large language models are good at is 
saying what an answer should sound like, which is different from what an answer should be](https://futurism.com/the-byte/ai-expert-chatgpt-way-stupider)*. 
For many use cases that's completely enough, but we need to redefine the way of using LLMs.

## Issues with Large Language Models

While each LLM has its specific flaws, there are some common issues that we can observe in all of them. The most important 
one is that they are prone to hallucinations. **Hallucination** is a confident response by an AI that does not seem to be 
justified by its input source. Even though, [confabulation might be a better term for this phenomenon
](https://community.openai.com/t/hallucination-vs-confabulation/172639), no matter how we call it, it effectively limits
the applicability of LLMs if we want to use them for generating text that is supposed to be true.

### A brief lesson of history

If you didn't pay much attention in your history classes, you might be shocked that up to 1990 Germany was divided into two
countries. Right now Berlin is the capital of the unified Germany, but two countries obviously had two capitals. If you wanted 
to know the former one of the West Germany, you could ask an LLM of your choice.

![](/articles_data/improving-llms-quality/hallucination-example.png)

At the first glance, the text sounds like a reasonable answer to the question. However, it is not true. If you spend just
a few seconds and try to find the actual answer using Google, here is your result:

![](/articles_data/improving-llms-quality/germany-capital.png)

A model with access to internet could possibly find the real answer. Still, if the question was related to your private data,
none of the existing models would handle such a case. You could possibly fine-tune a model on your data, but it is neither
fast nor cheap. Moreover, adding some new facts would require to continuously retrain the model over and over again with
some new facts, and that process cannot be done in a rapidly changing environment. 

### The Reversal Curse

One of the recent studies evaluated the abilities of LLMs to answer questions about relations between entities. The idea
presented in *[The Reversal Curse: LLMs trained on “A is B” fail to learn “B is A”](https://arxiv.org/abs/2309.12288)* 
paper was to check if the ordering of the information does matter. In a nutshell, the authors checked if the model trained
on the fact that "A is B" is able to answer not only the question "What is A?" but also "What is B?". Based on their
analysis, the answer is no. The model does not generalize well to the reversed order of the information.

![The Reversal Curse](/articles_data/improving-llms-quality/the-reversal-curse.png)

But there is probably more than that. We're still learning how to use LLMs, and we're still discovering what works and what
does not. One common thing of all issues is the reason they occur for. And that comes directly from the training process.

## The root causes

The [State of GPT](https://www.youtube.com/watch?v=bZQun8Y4L2A) is an excellent presentation by [Andrej Karpathy](https://karpathy.ai/).
It covers an end-to-end process of training a system, including the tokenization of the input data and all the other important
steps required to build a Large Language Model. 

### Tokenization

Let's speak tokenization. It is an important piece to understand how the model works and how it actually interacts with text.
If you worked with NLP, you might be used to dividing the text into words. However, LLMs work on a different level. It's not 
about words, but even smaller units, called tokens - common sequences of characters found in text. 

![Tokenization](/articles_data/improving-llms-quality/tokenization.png)

LLMs operate on the tokens, and the overall idea is, they predict the next token in a sequence. However, neither the input 
nor the output of the network is text. What the model actually sees is a sequence of numbers - tokens' ids.

![Token IDs](/articles_data/improving-llms-quality/tokenization-ids.png)

During the training, our model takes a tokenized input and tries to predict the next token in a sequence. Actually, it produces 
the probability that each token id is the next one and then samples from that distribution. The output of the sampling is then 
attached to the input, and the process repeats. Counterintuitively to all the ChatGPT users, the model is not an assistant that 
answers our questions, but rather a tool that completes the document we provide.

### Phases of training

When it comes to the training process, here is how we can roughly divide it:

![](/articles_data/improving-llms-quality/stages-of-training.png)

There are four significant stages of training an LLM, with pretraining being the first and the most time-consuming. During that phase, 
the model is introduced on a vast dataset, which some people call "the internet". The truth is that it includes a lot of well-known datasets, 
such as CommonCrawl, Wikipedia, or GitHub. The data is of a low quality, yet big quantity. This is an important step, allowing the model to 
learn the language, its structure, and some facts. At least, this is supposedly what happens, as without knowing the internals, we can only 
judge that the model can generate text that sounds like a human wrote it. Internally, **this model does nothing more than predict the next 
token in a sequence**. But that is already some statistical knowledge about the language and the world.

The result of the pretraining phase is a **base model**, which, when properly trained, might already be a powerful tool. Taking our model to 
the next level requires different means. The next phase, the supervised finetuning, focuses more on high quality data, with significantly 
lower quantity. Contractors provide pairs of prompts and ideal responses to them, which are used to uptrain the model. Still, the model 
predicts a single token at the time, nothing more.

We can improve the model even further, by incorporating the strategy of Reinforcement Learning from Human Feedback (RLHF). The idea is to
build one model, a reward model, that can judge the quality of different answers to the same prompt, and then use it to finetune the LLM 
model in a way that maximizes the reward during choosing the next token. Again, this is done on human-annotated data, so its quality is high. 
The whole process still relies on predicting the next token.

[//]: # (TODO: add graphics of predicting the next token)

The [State of GPT](https://www.youtube.com/watch?v=bZQun8Y4L2A) explains the whole process in detail, but the most important thing is that 
there is no reasoning being done by the Large Language Models. They are just predicting the next token in a sequence, and that's it. 
All the issues, such as hallucinations or the reversal curse, come from the fact LLMs do not have a real memory they could use to store
and recall any information. The parameters of the network encode just the statistical relationships between tokens and what we perceive as 
knowledge is just a side effect of it. With billions of parameters, they can encode a lot of those relationships in multiple contexts, so
we might be fooled that we interact with something beyond the statistical parrot. Not even a creative one. A single prompt usually results in 
non-deterministic outputs if we call the model multiple times. Those different responses are just caused by the sampling done on the next 
token probabilities. That being said, GPT-like models are still impressive, but we need to be aware of their limitations.

## Knowledge-oriented tasks vs language tasks

Now that we know what are the limitations of LLMs, we need to figure a way to overcome them. Finding the former capital of Germany would 
be way easier to be solved by the model, if we provided some useful context.

![Former capital of Germany in context](/articles_data/improving-llms-quality/germany-capital-context.png)

With relevant information being added to the prompt, the model can extract the answer from that context, instead of trying to create it
using its own parameters. The original task is also redefined, so we no longer ask the model to generate the response, but rather to find it
in the context. By these means, we **switch knowledge-oriented into language task**, which is what LLMs are good at. In our example, it was
enough to put the first paragraph from the Wikipedia article about Germany. However, in a real-world scenario, we might need to provide more
information, and that's where the problems start.

## Retrieval Augmented Generation

The idea of Retrieval Augmented Generation (RAG) is to use the knowledge base to provide the context for the model. The knowledge base is
a collection of facts we know to be true. Those facts are incorporated into the prompt, so the model can use them to generate the response.
Without applying RAG, we would simply send the user prompt directly to LLM and hope the model won't make up an answer.

![LLMs without RAG](/articles_data/improving-llms-quality/llms-without-rag.png)

With RAG, we use the original prompt to perform search over the knowledge base and build a new prompt based on the original one and the set 
of relevant facts. I said search, not semantic search, as that depends on the queries we expect the system to handle. However, the whole idea
of LLMs is to enable natural language interactions, so semantic search is a natural choice.

![LLMs with RAG](/articles_data/improving-llms-quality/llms-with-rag.png)

Designing the RAG pipeline requires setting up the semantic search stack, including an embedding model and vector search engine, such as 
Qdrant. Retrieval Augmented Generation is strongly related to the challenge of search, and is solved with similar means. 

Implementing a Retrieval Augmented Generation pipeline might be achieved with frameworks such as [Langchain](https://www.langchain.com/), 
[LlamaIndex](https://www.llamaindex.ai/), or [Haystack](https://haystack.deepset.ai/). However, they all come in handy, but with some overhead, 
while it is also relatively easy to set everything up using pure SDKs of the vector database and embedding model. We have an example of how to 
[implement RAG using Qdrant, FastEmbed and OpenAI](https://github.com/qdrant/examples/blob/8d0a678cf495a71ef1ed76658dbf7da34956e9d6/rag-openai-qdrant/rag-openai-qdrant.ipynb)
with just a few lines of code. Long story short, it's all about building a metaprompt that combines the original prompt and the result of 
semantic search done on our vector DB, using the same prompt as a query.

```python
metaprompt = f"""
You are a software architect. Answer the following question using the provided context. 
If you can't find the answer, do not pretend you know it, but answer "I don't know".

Question: {prompt}

Context: 
{context}

Answer:
"""
```

### Prompt engineering

It's also undeniable that the quality of the prompt is crucial for the quality of the response. It's not only about extending it with context
required to solve the task, but also about the way we ask the question. A model asked to do a certain job will do it, but the results might not 
be exactly what we expected.

![Simple prompt example](/articles_data/improving-llms-quality/countries-simple-prompt.png)

There are various strategies to improve the quality of the responses, by forcing some constraints on the model, including:

1. **Putting a role.** A model may prefer using a different language style, depending on the role it is supposed to play. If we ask the model
   to be a teacher, it might be more likely to provide a more formal response, than if we ask it to be a friend.
2. **Allowing the model to not provide an answer, if the context does not contain it.** Models are trained to solve tasks, so they quite often
   prefer making up an answer instead of saying they don't know. If we do not have relevant facts to answer the question, we should not expect
   the model to do it for us.
3. **Asking the model to provide a step-by-step reasoning scheme, so called Chain-of-Thoughts.** That gives us a chain of actions required to 
   solve the task, which is a more reliable way, as we can trace all the steps and spot the errors. However, it doesn't mean the model performed 
   those actions to get to the final answer. It's rather an instruction for a human to follow.
4. **Except to provide the sources used to generate the response.** Similarly to the Chain-of-Thoughts, it gives more traceability and a way
   to link to the original source of the information. Again, it is not a guarantee that the model actually used those sources to generate the
   response, but just a way to check it. 

![Relaxed prompt](/articles_data/improving-llms-quality/countries-relaxed-prompt.png)

Prompt engineering is not one time process, and usually requires some iterations to get the best results. Prompt versioning became a thing, and
is already being broadly discussed as one of the strategies. If we see the model fails under some circumstances, we need to update the prompt to
mitigate the issue.

![Strict prompt](/articles_data/improving-llms-quality/countries-strict-prompt.png)

There is more to it, and definitely more to come regarding prompt engineering. It's a new field, and we're still learning how to use it.

### Know your prompt

The problem with some of the high level frameworks is, they have some built-in default prompts which work well in demos, but might cause you
a headache in real-life scenarios. If you ever face your RAG returning the name of Michael Jackson, even though your data does not contain it, 
and you are a Langchain user, you might be a victim of the [default prompt](https://github.com/langchain-ai/langchain/blob/master/libs/langchain/langchain/chains/qa_with_sources/stuff_prompt.py).

```python
from langchain.prompts import PromptTemplate

template = """Given the following extracted parts of a long document and a question, create a final answer with references ("SOURCES"). 
If you don't know the answer, just say that you don't know. Don't try to make up an answer.
ALWAYS return a "SOURCES" part in your answer.
...

QUESTION: What did the president say about Michael Jackson?
=========
Content: Madam Speaker, Madam Vice President, our First Lady and Second Gentleman. ...
Source: 0-pl
...
=========
FINAL ANSWER: The president did not mention Michael Jackson.
SOURCES:

QUESTION: {question}
=========
{summaries}
=========
FINAL ANSWER:"""
PROMPT = PromptTemplate(template=template, input_variables=["summaries", "question"])
```

Passing a custom prompt downstream is not a problem, but it is not obvious that you need to do it. Pure SDKs do not have such issues, as you
are explicitly responsible for building the prompt yourself.

### Quality assurance in the world of LLMs

[//]: # (TODO: Evals)

[//]: # (TODO: Guardrails)
