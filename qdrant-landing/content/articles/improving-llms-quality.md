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

## Issues with LLMs

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

The result of the pretraining phase is a base model, which, when properly trained, might already be a powerful tool. The training of the 
best models available out there does not stop here, though. 

[//]: # (TODO: continue on training)

## Prompting LLMs

[//]: # (# TODO: Know your prompt)
