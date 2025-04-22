---
draft: false
title: "Pathwork Optimizes Life Insurance Underwriting with Precision Vector Search"
short_description: "Pathwork increased underwriting accuracy and efficiency through precise vector search powered by Qdrant."
description: "Learn how Pathwork leveraged Qdrant's vector search capabilities to significantly reduce errors, cut latency by 78%, and drive substantial month-over-month user growth in life insurance underwriting."
preview_image: /blog/case-study-pathwork/social_preview_pathwork.jpg
social_preview_image: /blog/case-study-pathwork/social_preview_pathwork.jpg
date: 2025-04-22T00:00:00Z
author: "Daniel Azoulai"
featured: true

tags:
- Pathwork
- insurance technology
- underwriting accuracy
- vector search
- AI in insurance
- case study
---


## **Pathwork Optimizes Life Insurance Underwriting with Precision Vector Search**

![Pathwork Optimizes Life Insurance Underwriting with Precision Vector Search](/blog/case-study-pathwork/case-study-pathwork-summary-dark-b.jpg)

### **About Pathwork**

Pathwork is redesigning life and health insurance workflows for the age of AI. Brokerages and insurance carriers utilize Pathwork's advanced agentic system to automate their underwriting processes and enhance back-office sales operations. Pathwork's solution drastically reduces errors, completes tasks up to 70 times faster, and significantly conserves human capital.

### **The Challenge: Accuracy Above All**

Life insurance underwriting demands exceptional accuracy. Traditionally, underwriting involves extensive manual input, subjective judgment, and frequent errors. These errors, such as misclassifying risk based on incomplete or misunderstood health data, often result in lost sales and customer dissatisfaction due to sudden premium changes.

"Accuracy is paramount—every error can mean hundreds of dollars per month in difference to customers or waiting months longer for coverage," explains Blake Butterworth, co-founder of Pathwork.

### **Pathwork’s Innovative Solution**

Pathwork addresses these issues with an AI-powered underwriting tool. The platform uses vector search and retrieval augmented generation (RAG) techniques, enabling brokers to rapidly match customers with precise risk classes and insurance products based on live broker inputs collected during the quoting process via conversation or document upload.

Initially, Pathwork explored various solutions, including Amazon S3, OpenSearch, and other vector databases. However, none provided the necessary combination of performance, ease of use, and reliability. Ultimately, Pathwork chose Qdrant Cloud due to its strong documentation and developer-friendly environment.

### **Why Pathwork Chose Qdrant**

"We landed on Qdrant after extensive trial and error," Blake shared. "Our engineers found Qdrant’s documentation and support significantly better than other solutions. At critical junctures, Qdrant’s support felt like having an additional principal engineer on our team. Fantastic service through their helpdesk was a standout experience."

### **The Impact: Increased Accuracy and User Adoption**

After implementing Qdrant, Pathwork rapidly saw significant improvements:

* **Accuracy Improvements:** Pathwork achieved significant precision gains, nearly halving mean squared error (MSE) from 3.5 to 1.8 in February alone. These improvements were driven by enhancements such as scalar quantization, hybrid search, and advanced filter utilization. Accuracy is measured by how closely the predictions match the final risk class assigned by licensed underwriters.  
* **Performance Enhancements:** Latency was drastically reduced from 9 seconds to just 2 seconds per query, thanks to optimizations including storing vectors in RAM rather than on disk and improved scaling methods (replicas, shards, nodes).  
* **Rapid Growth:** Usage has grown 50% month-over-month, with thousands of insurance cases processed in the last month alone. To maintain low-latency retrieval at scale, Pathwork expanded its Qdrant deployment with additional nodes, implemented sharding to distribute load, and introduced replicas to support high-concurrency read operations. These scaling changes ensured consistent performance as usage surged.  
* **User Satisfaction:** Accurate, consistent underwriting results drove significant user adoption. As accuracy surpassed a critical threshold, word-of-mouth recommendations propelled user growth.

"We knew we'd achieved something significant when brokers began confidently testing edge cases live during demos, resulting in immediate adoption," Blake remarked.

### **Looking Ahead**

Pathwork aims to become the central hub for life insurance underwriting. Future plans involve deeper integration with insurance carriers, further enhancing underwriting accuracy, scalability, and efficiency. Pathwork’s commitment to precision, supported by Qdrant’s reliable vector search capabilities, is setting a new industry standard for accuracy and efficiency in life insurance underwriting.

**"Every aspect of our system depends on precision, and Qdrant has been instrumental in achieving our goals," says Blake Butterworth.**