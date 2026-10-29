---
title: "Every RAG Obituary Was Half Right"
short_description: "Each time RAG was declared dead, something real had changed. The biggest change was letting the model decide what to look for."
description: "Long context and agents were each supposed to end RAG. Now the model helps decide what to retrieve, and I measured what that costs."
preview_dir: /articles_data/state-of-rag-2027/preview
social_preview_image: /articles_data/state-of-rag-2027/preview/social_preview.jpg
weight: -240
author: John Kupchanko
author_link: https://github.com/jkupchanko
keywords:
  - rag
  - agentic rag
  - agentic retrieval
  - retrieval benchmark
  - ai agents
date: 2026-10-26T00:00:00-07:00
draft: false
category: rag-and-agents
---

People keep saying RAG is dead. But if that's true, why are we still trying to solve the same problem it was built for?

RAG gave models a way to find information in our documents instead of relying only on what they already knew. It worked, and I think it was a necessary step in getting us to where we are today. But it also showed us something important. Finding relevant information doesn't always mean finding the right answer.

Now models can read much more information at once, and agents can search for what they need on their own. That's progress, but does it actually make them better at answering questions? Or are we introducing new problems while trying to solve the old ones? So I tested it: one search against an agent, on 1 million points in Qdrant.

## What RAG Got Right

RAG was built for one main thing: giving models access to information they weren't trained on. Store your documents, search them when a question comes in, and give the useful parts to the model.

That made it possible to answer questions using current information and update your sources without retraining. It was practical, relatively inexpensive, and it worked.

But the search was still making its best guess about what information the model needed. Sometimes it missed important context, leaving the model to answer with whatever information it was given.

And that's where things started to change.

## When the Model Started Choosing What to Look For

This is where approaches like agentic retrieval came in. Instead of searching once and relying on whatever information came back, an agent could review the results, identify what was missing, and decide what to search for next. This gave the model more control over the search process, allowing it to investigate questions that couldn't be answered with a single search.

## Why That Helped

With traditional RAG, the question came in, the system searched once, and those results were passed to the model to generate an answer. If that initial search missed something important, the model was still expected to answer using whatever information it received.

Agentic retrieval changed that by making search a tool the model could use throughout the process. Instead of relying on a single search, the model could examine the results, identify what was missing, refine its query, and search again. Each search could build on what it had already learned, making it possible to investigate more complex questions where finding one piece of information helped determine what to look for next.

It seemed like a meaningful improvement. Instead of relying on one search to find everything, models could now work through a problem and decide what information they needed along the way. But I wanted to understand whether that additional control actually translated into better answers.

## Putting It to the Test

I tested traditional RAG against agentic RAG using 1 million points in Qdrant and 200 questions across four categories. Both used the same model and data, with three runs per question. Traditional RAG searched once, while agents could search again and open additional information.

The points are chunks of Stack Exchange answers from seven technical sites. The model was Claude Sonnet 5.5, and both followed the same rule: answer only from what was retrieved, or say "not found". Traditional RAG read the top 10 results once; the agent could make up to six search or open calls.

Across questions with available answers, agentic retrieval improved overall accuracy from 56% to 86%.

Here's how the results broke down.

- **Straightforward:** traditional RAG 98%, agentic RAG 96.7%. Nearly identical.
- **Worded differently from the source:** traditional RAG 47.3%, agentic RAG 92%.
- **Needed two documents:** traditional RAG 22.7%, agentic RAG 69.3%.
- **No answer available:** traditional RAG said "not found" 100% of the time, agentic RAG 98%, but agents took about 15 seconds at the median against about 3.

{{< chart id="state-of-rag-2027/results" caption="Three runs of 50 questions per type on 1 million Stack Exchange chunks, Claude Sonnet 5.5 for both. Agentic RAG matched traditional RAG on straightforward questions and won on questions worded differently or needing two documents; with no answer available, it made about six search or open calls before saying so." >}}

## What the Results Showed

Agentic retrieval made a significant difference when questions required different wording or information from multiple sources. Agents could search again, find missing information, and connect results that traditional RAG missed.

But there was a trade-off. For straightforward questions, traditional RAG was already fast and accurate. And when information wasn't available, agents spent considerably more time searching without improving the outcome.

Going into this, I expected agentic retrieval to outperform traditional RAG across the board. After all, if a model can decide what to search for and keep looking, why would we still need a system that only searches once?

But that's not what happened. Rather than one approach replacing the other, the results showed where each one actually made a difference.

## So, Is RAG Actually Dead?

I don't think so. I think it's been modernized. RAG helped get us to where we are today, and agentic retrieval is building on that foundation rather than replacing it.

What surprised me was that even with all these improvements, traditional RAG still held up incredibly well. Agents were significantly better at finding difficult answers, but when the questions were straightforward, the additional searching didn't really improve anything. And when the answer wasn't there, agents spent considerably more time trying to find it.

I think that's what gets lost in this conversation. We get so focused on what's new that we sometimes forget why we built these systems in the first place. The goal was never to make retrieval more complicated. It was to help models find the information they need to give better answers.

So my takeaway is simple. Start with what works, and introduce complexity when the problem actually requires it. If one search can reliably answer the question, why make it more complicated? And if one search isn't enough, that's where agentic retrieval can make a real difference.

RAG didn't die. It evolved. And as engineers, I think our job is to understand when that evolution actually makes something better.

If you want to check the numbers or run it on your own data, the code, the questions, and every run are in [single-vs-agentic-rag](https://github.com/qdrant-labs/single-vs-agentic-rag).
