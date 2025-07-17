---
title: "Evaluating Memory in Multi-Turn Agents with and without Qdrant"
short_description: "How do Agents perform on the MemoryAgentBench when they have access to a Vector Database?"
social_preview_image: /articles_data/agent-memory-comparison/preview/social_preview.jpg
preview_dir: /articles_data/agent-memory-comparison/preview
weight: -200
author: Thierry Damiba
date: 2025-07-16T00:00:00.000Z
draft: false
keywords:
  - ai agents
  - memory systems
  - performance benchmarks
  - agentic rag
  - agent architecture
category: ai-agents
---

![Garry Tan Tweet](/articles_data/agent-memory-comparison/garry-tan-tweet.png)

How much does memory impact the performance of Multi-Turn Agentic Systems? You might naturally think to yourself, a lot, and you would be right-but we also have to consider cost, speed, and accurary. Furthermore, how much does the archtecture of your agentic memory impact results?

These are the questions I set out to answer with this article. I also built an opensource website where you can explore how agents perform with different memory architetcures for youself. Check it out here: 

___
TODO: Add the demo! 
___

Before we dig into numbers, let's talk about what we mean by memory in this context. 

## The Memory Spectrum in AI Agents

In the agentic world we have 3 different kinds of memory that people often use. First, we have stateless agents. These agents don't remember anything. Imagine if every time you chatted with AI, it was your first time chatting with AI. Second, we have Session Based memory. Imagine a game where everytime you die you lose all your gear. If you don't have to start over you have memory, but the second you close the session you are starting fresh. Last but not least, we have persistent memory which never goes away(unless you delete it).

___
#TODO: This is boring-maybe make slides or a visual.
___

### Stateless Agents

Think of stateless agents like a goldfish. They don't remember what they had for breakfast, let alone what happened 5 seconds agao. Every interaction is completely fresh, and the agent has no recollection of what came before. When you ask a stateless agent for help, it's like meeting someone new every single time. This might sound limiting, but it's actually perfect for certain use cases. 

For instance, imagine a weather bot that tells you the current temperature. It doesn't need to remember that you asked about the weather yesterday, or that you prefer Celsius over Fahrenheit. It just needs to fetch the current data and respond. This simplicity makes stateless agents incredibly fast and easy to scale - there's no memory overhead to worry about. It would be easier to interact with if it knew your location-but sometimes the tradeoff is worth it.

### Session-based Memory

Session-based memory is like having a conversation with someone who remembers everything during your talk but forgets it all the moment you hang up the phone. It's the middle ground between stateless and persistent memory. 

Think about a customer service chatbot helping you troubleshoot your internet connection. During your conversation, the chatbot remembers that you've already tried restarting your router, that your model number is XYZ123, and that the problem started yesterday. This context makes the conversation flow naturally without you having to repeat yourself. But once you close that chat window? Imagine the MIB gaddget. Everything is gone. The next time you chat with the bot you 

This approach attempts to strikes a balance between functionality and resource efficiency. The agent can maintain context for meaningful interactions without the potential complexity and storage costs of permanent memory.

### Persistent Memory

Persistent memory transforms agents from helpful assistants into true learning partners. These agents remember not just your current conversation, but your entire history together. They learn your preferences, adapt to your style, and build upon past interactions.

 Picture a personal AI research assistant that you've worked with for months. It knows your research interests, remembers the papers you've found valuable, understands your writing style, and can even anticipate what kinds of sources you'll find credible. When you return after a week away, it might say, "Based on that machine learning paper you were interested in last month, I found three new publications that build on those concepts." This isn't just memory - it's relationship building-and getting exxactly to Garry Tan's tweet. These systems are the most useful!

The trade-off? Persistent memory requires storage systems,  data management, and privacy considerations. However, for applications where long-term learning and personalization matter, this will become table stakes.


## Standing on the Shoulders of Giants

About a week ago some AI Researchers from the University of California in San Diego published [Evaluating Memory in LLM Agents via Incremental Multi-Turn Interactions.](https://arxiv.org/pdf/2507.05257)

The paper correctly identifies that "Recent benchmarks for Large Language Model agents primarily focus on evaluating reasoning, planning, and execution capabilities, while another critical component—memory, encompassing how agents memorize, update, and retrieve long-term information—is under-evaluated due to the lack of benchmarks."

It introduces a new dataset built specifically for testing memory in multi-turn agents, [MemoryAgentBench](https://huggingface.co/datasets/ai-hyz/MemoryAgentBench), which evaluates four core memory competencies: 



__
#TODO Explain each metric in detail!
___

1. Accurate Retrieval

2. Test-Time Learning 

3. Long-Range Understanding

4. Conflict Resolution

__
#TODO Explain why the dataset is credible and works
___
MemoryAgent bench is the perfect dataset for testing memory because...

## Results!

The results suprised me!

Here’s a **summary of the performance** from **Table 2 (page 7)** and the detailed tables on **pages 20–21** from the paper.

---

## 1. Accurate Retrieval (AR)

| **Model / Agent**     | **Best Score**  | **Dataset**         | **Notes**                                                                |
| --------------------- | --------------- | ------------------- | ------------------------------------------------------------------------ |
| **NV-Embed-v2** (RAG) | **83.0–90.0**   | RULER-QA, ∞Bench-QA | Top-performing embedding-based retriever. Great at pinpointing snippets. |
| **BM25** (Simple RAG) | 61.0–74.6       | Most AR sets        | Outperformed some LLMs despite being non-neural.                         |
| **GPT-4.1-mini**      | 74.5 (RULER-QA) | Long-context        | Among best generalist LLMs but still behind NV-Embed in snippet recall.  |
| **MemGPT** / Mem0     | 20.8–28.0       | All AR tasks        | Underperformed due to weak fine-grained memory retrieval.                |

 *RAG methods dominate AR*, especially NV-Embed-v2 and BM25.

---

## 2. Test-Time Learning (TTL)

| **Model / Agent**               | **Best Score** | **Dataset**      | **Notes**                                                          |
| ------------------------------- | -------------- | ---------------- | ------------------------------------------------------------------ |
| **GPT-4o**                      | **96–97%**     | BANKING, CLINC   | Outstanding classification accuracy across the board.              |
| **Claude 3.7 Sonnet**           | 97.0           | BANKING77        | Best TTL performance in some categories.                           |
| **MemGPT**                      | 67.6           | Movie Rec.       | Better than expected here—possibly due to dynamic dialog handling. |
| **RAG agents** (NV-Embed, BM25) | 60–75          | All TTL datasets | Good, but consistently below long-context LLMs.                    |

*Long-context models outperform RAG agents on TTL*, thanks to better holistic understanding.

---

## 3. Long-Range Understanding (LRU)

| **Model / Agent**               | **F1 Score** | **Notes**                                                          |
| ------------------------------- | ------------ | ------------------------------------------------------------------ |
| **Claude 3.7 Sonnet**           | **52.5**     | Best summarization score (∞Bench-Sum).                             |
| **GPT-4.1-mini**                | 41.9         | Very strong overall.                                               |
| **MemGPT / Self-RAG**           | \~2.5        | Very poor performance, struggle with holistic story understanding. |
| **RAG agents (BM25, NV-Embed)** | \~20–28      | Retrieve snippets but can't form coherent summary.                 |

*Only long-context models can perform LRU well* — RAG and memory agents fail to understand full narratives.

---

## 4. Conflict Resolution (CR)

| **Model / Agent**       | **Single-Hop (SH)** | **Multi-Hop (MH)** | **Notes**                                         |
| ----------------------- | ------------------- | ------------------ | ------------------------------------------------- |
| **GPT-4o**              | **60.0**            | **5.0**            | Strongest performance, still weak on MH.          |
| **NV-Embed-v2 (RAG)**   | 55.0                | 6.0                | Best RAG agent, but still poor at conflict logic. |
| **MemGPT** / **Cognee** | 28.0 / 28.0         | 3.0 / 3.0          | Failed at prioritizing new over old info.         |
| **All models on MH**    | ≤6.0                |                    | No model succeeded—major challenge remains.       |

*Conflict Resolution is the hardest task*. Even top models fail when multi-hop reasoning is involved.

---

## Latency Tradeoffs (Page 9 & 22)

| **Model**   | **Mem Construction (512)** | **Query Exec** |
| ----------- | -------------------------- | -------------- |
| Mem0        | **14,644s**                | 1.2s           |
| Cognee      | 8,309s                     | 33.2s          |
| NV-Embed-v2 | 93.4s                      | 0.83s          |
| GPT-4o-mini | 0.07s                      | 5.1s           |

 
---

###  TL;DR 

| **Competency**           | **Top Performer(s)**     | **Challenging For**                 |
| ------------------------ | ------------------------ | ----------------------------------- |
| Accurate Retrieval       | NV-Embed-v2, BM25        | MemGPT, Cognee                      |
| Test-Time Learning       | GPT-4.1-mini, Claude 3.7 | Most RAG agents                     |
| Long-Range Understanding | Claude 3.7               | All RAG / Memory agents             |
| Conflict Resolution      | None (SH: GPT-4o)        | *Everyone* fails at Multi-Hop (≤6%) |

___
#TODO: Add some charts!
___

The paper found that for some use cases RAG systems shine and in some others it didn't do too well. I wanted to see if by using Qdrant as my agent I could get better performance on the benchmarks. 

Would Qdrant be faster, more accurate, or cheaper than alternatives? Furthermore, could we build a system with Qdrant that performs well in the categories where the RAG systems failed in the paper?

The research revealed fascinating patterns in how memory impacts agent performance. Most strikingly, persistent memory proved absolutely essential for any form of complex, multi-step planning. Agents without persistent memory simply couldn't maintain the context needed to execute plans that spanned multiple sessions or required building on previous decisions. 

What's particularly interesting is that true learning capabilities only emerged in agents with persistent memory. Session-based agents could adapt within a conversation, but they couldn't carry those adaptations forward. It's like the difference between a student who crams for each test versus one who builds knowledge throughout the semester. Meanwhile, session memory occupied a sweet spot for many use cases, providing enough context for meaningful interactions without the overhead of full persistence.

## Qdrant Results!
How did Qdrant do?

## Memory Architecture Analysis

### Vector-based Memory

Vector databases like Qdrant fundamentally change how agents remember and retrieve information. Instead of relying on exact matches or predefined categories, vector-based memory understands meaning and context. Imagine an agent helping you plan a vacation. When you mention "somewhere warm with good food," it doesn't just search for those exact words. It understands the semantic meaning and might retrieve memories about your previous trips to Italy, your love of beach destinations, or that time you raved about the street food in Thailand.

This semantic understanding makes vector databases incredibly powerful for agent memory. They can handle the messy, unstructured nature of human communication. Whether you're storing conversation snippets, user preferences, or learned behaviors, vector databases can efficiently organize and retrieve this information based on conceptual similarity rather than rigid rules. The scalability is remarkable too - vector databases can handle millions of memories while maintaining lightning-fast retrieval speeds.

### Traditional Database Memory

Traditional databases bring structure and precision to agent memory. Think of them as the agent's filing cabinet, where everything has its proper place and label. When an e-commerce agent needs to remember your order history, shipping addresses, or payment preferences, a relational database excels at storing and retrieving this structured information.

For example, a financial advisory agent might use a traditional database to track your investment portfolio, transaction history, and risk preferences. The database's ability to perform complex queries means the agent can instantly calculate your year-to-date returns, identify tax-loss harvesting opportunities, or ensure compliance with investment restrictions. The ACID properties of these databases guarantee that your financial data remains consistent and reliable, even when multiple operations happen simultaneously.

### Hybrid Approaches

The real magic happens when you combine vector and traditional databases. This hybrid approach gives agents both intuition and precision. Consider a medical assistant agent that needs to understand your symptoms (vector database for natural language descriptions) while also tracking your medical history, medications, and test results (traditional database for structured records).

In practice, this might look like an agent that can understand when you say "that weird tingling in my arm like last summer" (vector search through previous symptom descriptions) while simultaneously checking your medical records to see that "last summer" corresponds to a specific nerve condition diagnosis in July 2023 (structured database query). The vector database captures the nuance of how you describe your health, while the traditional database maintains the clinical accuracy needed for medical decisions.

## Performance Optimization Strategies

### Memory Pruning

Implementing intelligent memory pruning can significantly improve performance....WHY???????????


## Cost-Benefit Analysis

### Implementation Costs

| Memory Type | Setup Complexity | Storage Cost | Maintenance |
|-------------|------------------|--------------|-------------|
| No Memory | Low | None | Minimal |
| Session Memory | Medium | Low | Low |
| Persistent Memory | High | High | High |

### Performance Benefits

| Memory Type | Context Retention | Learning Capability | Personalization |
|-------------|-------------------|-------------------|-----------------|
| No Memory | None | None | None |
| Session Memory | Session-limited | Limited | None |
| Persistent Memory | Full | High | High |

## Recommendations

### When to Use No Memory

Stateless agents shine in scenarios where each interaction stands alone. Think of a currency converter API that serves millions of requests per day. Each conversion is independent - converting 100 USD to EUR doesn't depend on whether someone converted JPY to GBP five minutes ago. The simplicity means you can scale horizontally without worrying about session management or data consistency across servers.

Privacy-sensitive applications also benefit from the amnesia of stateless agents. A medical symptom checker that doesn't store any user data can provide valuable health information without creating a digital trail of personal health concerns. Similarly, in resource-constrained environments like edge devices or high-traffic scenarios, eliminating memory overhead can mean the difference between a responsive system and one that buckles under load.

### When to Use Session Memory

Session memory becomes invaluable when continuity matters within a bounded timeframe. Consider a travel booking assistant helping you plan a trip. Throughout your session, it needs to remember your destination preferences, budget constraints, and the flights you've already rejected. Without this context, you'd spend more time repeating information than actually planning your trip.

The sweet spot for session memory is tasks that require multiple steps but don't need long-term learning. A technical support agent walking you through a complex troubleshooting process, a shopping assistant helping you find the perfect outfit, or a tutoring bot guiding you through a math problem - all these benefit from maintaining context during the interaction without the overhead of permanent storage.

### When to Use Persistent Memory

Persistent memory transforms agents from tools into partners. When building long-term relationships matters more than transactional efficiency, persistent memory becomes essential. A personal fitness coach agent that remembers your injury history, tracks your progress over months, and adjusts recommendations based on your improving stamina provides value that grows over time.

Consider an AI writing assistant that learns your style, remembers your ongoing projects, and understands the context of your work. After months of collaboration, it doesn't just help you write - it helps you write like you. This level of personalization and accumulated knowledge simply isn't possible without persistent memory. The investment in storage and complexity pays off through deeper, more meaningful interactions that improve with every use.

## Implementation Best Practices

### Memory Design Principles

The journey to effective memory implementation starts with simplicity. Rather than building a complex persistent memory system from day one, begin with session memory to understand your use case's actual needs. 

Retrieval optimization becomes critical as your memory grows. A travel planning agent might start with a few hundred memories but quickly accumulate thousands as users plan trips. Without proper indexing and search strategies, what started as instant recall can degrade into frustrating delays. Smart chunking strategies, semantic indexing, and intelligent caching can maintain sub-second retrieval times even as data scales.

Performance monitoring shouldn't be an afterthought. Track not just retrieval speed but also memory relevance and usage patterns. You might discover that certain types of memories are never accessed, pointing to opportunities for smarter pruning strategies. Design your system with growth in mind - what works for a hundred users might crumble under the weight of a hundred thousand.

### Common Pitfalls

The allure of sophisticated memory systems can lead to over-engineering. You probably don't need to build elaborate memory architectures for chatbots that only answer FAQ questions. The added complexity slows development, increases costs, and provides zero benefit to users who just want quick answers to simple questions.

Memory bloat is another silent killer. Without thoughtful pruning strategies, agent memories can grow like digital hoarders, keeping every trivial interaction forever. Smart pruning isn't just about storage costs - it's about maintaining relevance and performance.

Perhaps most critically, privacy considerations can't be an afterthought. An agent that remembers a user mentioning their medical condition in passing needs careful consideration of data retention, access controls, and user consent. The best memory system in the world becomes a liability if it violates user trust or regulatory requirements.


## Conclusion

Memory systems can dramatically improve AI agent performance, but the benefits vary significantly based on the use case. Our analysis reveals a nuanced landscape where simple tasks see minimal benefit from memory systems - that currency converter doesn't need to remember your last calculation. However, conversational agents transform with session memory, evolving from frustrating repetition machines into helpful assistants that maintain context throughout your interaction.

The real game-changer comes with persistent memory for long-term planning and learning scenarios. These agents don't just complete tasks; they build relationships, accumulate knowledge, and improve over time. But this power comes with responsibility - implementation costs must be carefully weighed against your specific use case requirements. There's no point building a Formula One car for a trip to the grocery store.

The key is matching memory complexity to task requirements while considering implementation and maintenance costs. As AI agents become more sophisticated, memory systems will likely become increasingly important for delivering high-quality, personalized experiences.

When designing agentic systems, consider starting with session memory for most applications, then evaluating whether persistent memory is necessary based on your specific performance requirements and use cases.

## Further Reading

If you're interested in diving deeper into agent memory systems, you might want to explore our article on [What is Agentic RAG?](/articles/agentic-rag/), which examines how retrieval-augmented generation can enhance agent capabilities. For practical implementation guidance, check out [Building AI Agents with Qdrant](/articles/ai-agents/), where we walk through real-world agent architectures. And if you're looking to optimize your memory system's performance, our guide on [Vector Database Performance Optimization](/articles/vector-database-performance/) covers advanced techniques for scaling agent memory.

---

*Have questions about implementing memory systems in your AI agents? [Contact our team](https://qdrant.tech/contact-us/) or join our [Discord community](https://discord.gg/qdrant) for technical discussions.*

## Edit this page

You can [edit](https://github.com/qdrant/landing_page/tree/master/qdrant-landing/content/articles/agent-memory-comparison.md) this page on GitHub, or [create](https://github.com/qdrant/landing_page/issues/new/choose) a GitHub issue.

---

Found an issue with this article? You're welcome to [edit it on Github](https://github.com/qdrant/landing_page/tree/master/qdrant-landing/content/articles/agent-memory-comparison.md) and submit your changes. 