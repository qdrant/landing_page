---
draft: false
title: "AskNews and Qdrant: Grounding AI in News with Vector Search"
short_description: "Powering multilingual news aggregation, efficient indexing, and context-aware AI applications."
description: "AskNews uses Qdrant for vector search to aggregate news, filter metadata, and provide multilingual context with quantization and HITL systems."
preview_image: /blog/case-study-asknews/preview.png
social_preview_image: /blog/case-study-asknews/preview.png
date: 2024-10-26T00:02:00Z
author: David Myriel
featured: false
tags:
  - asknews
  - qdrant
  - vector search
  - multilingual news
  - on-disk indexing
  - human-in-the-loop
---


# Navigating the Future of AI News and Applications: Insights from AskNews and Qdrant

<iframe width="560" height="315" src="https://www.youtube.com/embed/yEwRpY_77w0?si=kPNdeHx385U3m1Ol" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

In an insightful webinar hosted by Thierry Damiba from Qdrant and Robert Caulk, the founder of **AskNews**, we explored cutting-edge topics on AI, vector databases, multilingual news retrieval, quantization, and career advice for those looking to break into the AI space. Below are key insights from the session that covered the intersection of AI-driven apps, transparent journalism, and the power of on-disk indexing in Qdrant.

---

## **Why Grounding AI in News Matters**

Rob started by introducing **AskNews**: an innovative news aggregation tool designed to provide **unbiased, multilingual context alignment**. Instead of labeling news sources with bias, AskNews tracks **alignment across perspectives and contradictions across continents**. Their aim? To allow users to engage with diverse viewpoints rather than being funneled into echo chambers. 

### **Grounding vs. Ground Truth**

Ground truth in AI systems can sometimes be binary (like predicting the weather or sports results), but news is nuanced. AskNews emphasizes “**grounding**” rather than absolute truths, surfacing competing perspectives from multiple languages and regions to provide better context. As Rob puts it, “It’s damn hard to get multiple languages across the globe to agree on the same incorrect fact.” This method offers **richer insights for LLMs**, feeding them structured information with less hallucination risk. 

---

## **Leveraging Qdrant for Prototyping and Scaling Applications**

At the heart of AskNews’ infrastructure lies **Qdrant**, a high-performance vector database written in **Rust**. Rob highlighted how Qdrant’s **on-disk indexing** has been a game-changer. Instead of committing all metadata to RAM, which is expensive, Qdrant offers a **flexible disk-based index**. This allows startups to **prototype quickly**—testing metadata configurations with minimal cost—before scaling up with RAM if the use case proves valuable. 

### **Prototyping on Disk: Like Renting Before Buying**

Rob drew a brilliant analogy:  
*"It’s like renting an apartment in a new city before deciding to buy a house. You test neighborhoods, gather information, and figure out what works for you without making an expensive commitment."* 

This flexibility allows startups like AskNews to iterate rapidly and respond to customer feedback, ensuring that only the most valuable features are scaled.

---

## **The Role of Human-in-the-Loop in AI Development**

Despite the advances in automation, **human-in-the-loop (HITL)** processes remain indispensable, especially when curating news data. Rob explained that AskNews doesn’t automate quality entirely. They have an **editor-in-chief** (a veteran from the Rocky Mountain News) who curates what qualifies as objective or analytical information. In tandem with **entity extraction models** and **metadata filtering through Qdrant**, this human oversight ensures the highest standard for the information they deliver.

*"We can’t fully automate away human judgment,"* Rob said, highlighting the value of HITL in fine-tuning AI-driven systems. 

This aligns with a growing trend across industries: while AI automates repetitive tasks, **human expertise** remains critical for nuanced decisions—especially in journalism.

---

## **Harnessing Quantization for Efficient Vector Search**

AskNews optimizes storage and speed by leveraging **quantization**—a process that reduces vector precision to save memory and improve performance. This works well for news applications, where **slightly lower precision** (e.g., 8-bit instead of 32-bit floats) still provides **meaningful similarity scores**. 

*"Even if we lose 5–10% accuracy, we’re still hitting a dense neighborhood of hyper-relevant content,"* Rob explained. 

This trade-off between **speed, cost, and precision** allows AskNews to store massive amounts of archived news without compromising usability.

---

## **Evaluating Models and Embeddings: A Practical Approach**

When asked about **embedding models**, Rob stressed the importance of **trial and error**:  
*"There is no one-size-fits-all embedding model—it depends entirely on your data and goals."* 

David (from Qdrant) shared that he is currently working on a **semantic cache** project to further optimize embedding retrievals. The goal is to design **heuristics for caching**, ensuring that frequently accessed queries are stored efficiently without becoming stale.

Another exciting project discussed was **embedding model evaluation**. David is building a platform to test various embedding models, benchmarking them on **correlation matrices, similarity scores, and performance metrics**. This will empower developers to quickly identify the best embedding model for their specific use case—saving time and reducing costs.

---

## **Art, AI, and the Role of Creativity**

In a philosophical detour, the conversation turned toward **AI-generated art**. Rob expressed skepticism about AI art without a human story behind it:  
*"Great art often comes with a story—think of Picasso or Van Gogh. If the story is just ‘a robot made this in 13 milliseconds,’ it loses its soul."*  

David agreed, adding that AI-generated content may lead to a heightened appreciation for **human creativity**. As people become more adept at distinguishing between **authentic work and automated output**, **classical arts** could see a resurgence in value.

---

## **Career Advice: How to Stand Out in AI and Tech**

For those looking to break into AI, Rob shared some actionable advice:  
1. **Contribute to open-source projects.** Find a relevant project and start solving issues through PRs. Many companies, including Qdrant, actively hire contributors from their open-source communities.
2. **Showcase your passion through small projects.** A well-written blog post or demo project, even if contrived, can demonstrate your skills and spark interest.
3. **Engage with developer communities.** Whether through Discord servers, GitHub discussions, or webinars, interacting with like-minded developers gives you visibility and helps you learn from others.

David echoed Rob’s sentiment, mentioning that he landed his role at Qdrant by building a **semantic cache solution**—his passion project.

*"It’s hard to overlook someone who has solved a real problem for your company in an open-source setting,"* Rob added. 

---

## **The Future of News and AI Applications**

The session ended with a glimpse into the future. AskNews is building the **largest news knowledge graph on the planet**, feeding structured context into LLMs for enhanced reasoning. As news content continues to grow exponentially, tools like AskNews will be essential for filtering relevant information and mitigating misinformation.

---

## **Final Thoughts**

This webinar offered a fascinating exploration of **how AI tools like AskNews and Qdrant** are shaping the future of journalism, embedding models, and efficient data retrieval. From leveraging **on-disk indexing** to embracing **human-in-the-loop systems**, the insights shared provide a clear path for developers building next-gen applications.

If you’d like to explore further, you can:  
- **Check out AskNews** at [AskNews.app](https://asknews.app)  
- **Join Qdrant’s Discord** to dive deeper into vector search discussions  
- **Contribute to FreakAI** on GitHub for hands-on experience in open-source AI projects  

