---
title: "IrisAgent and Qdrant: Redefining Customer Support with AI" 
draft: false
slug: iris-agent-qdrant
short_description: Pushing the boundaries of AI in customer support
description: Learn how IrisAgent leverages Qdrant for RAG to automate support, and improve resolution times, transforming customer service
preview_image: /case-studies/iris/irisagent-qdrant.png

date: 2024-03-05T07:45:34-08:00
author: Manuel Mayer
featured: false
tags:
  - news
  - blog
  - irisagent
  - customer support
weight: 0 # Change this weight to change order of posts
# For more guidance, see https://github.com/qdrant/landing_page?tab=readme-ov-file#blog
---

Artificial intelligence is evolving customer support, offering unprecedented capabilities for automating interactions, understanding user needs, and enhancing the overall customer experience. [IrisAgent](https://irisagent.com/), founded by former Google product manager [Palak Dalal Bhatia](https://www.linkedin.com/in/palakdalal/), demonstrates the concrete impact of AI on customer support with its AI-powered customer support automation platform. 

Bhatia describes IrisAgent as “the system of intelligence which sits on top of existing systems of records like support tickets, engineering bugs, sales data, or product data,” with the main objective of leveraging AI and generative AI, to automatically detect the intent and tags behind customer support tickets, reply to a large number of support tickets chats improve the time to resolution and increase the deflection rate of support teams. Ultimately, IrisAgent enables support teams to more with less and be more effective in helping customers.

## The Challenge

Throughout her career Bhatia noticed a lot of manual and inefficient processes in support teams paired with information silos between important functions like customer support, product management, engineering teams, and sales teams. These silos typically prevent support teams from accurately solving customers’ pain points, as they are only able to access a fraction of the internal knowledge and don’t get the relevant information and insights that other teams have.

IrisAgent is addressing these challenges with AI and GenAI by generating meaningful customer experience insights about what the root cause of specific customer escalations or churn. “The platform allows support teams to gather these cross-functional insights and connect them to a single view of customer problems,” Bhatia says. Additionally, IrisAgent facilitates the automation of mundane and repetitive support processes. In the past, these tasks were difficult to automate effectively due to the limitations of early AI technologies. Support functions often depended on rudimentary solutions like legacy decision trees, which suffered from a lack of scalability and robustness, primarily relying on simplistic keyword matching. However, advancements in AI and GenAI technologies have now enabled more sophisticated and efficient automation of these support processes.

## The Solution

“IrisAgent provides a very holistic product profile, as we are the operating system for support teams,” Bhatia says. The platform includes features like omni-channel customer support automation, which integrates with other parts of the business, such as engineering or sales platforms, to really understand customer escalation points. Long before the advent of technologies such as ChatGPT, IrisAgeny had already been refining and advancing their AI and ML stack. This has enabled them to develop a comprehensive range of machine learning models, including both proprietary solutions and those built on cloud technologies. Through this advancement, IrisAgent was able to finetune on public and private customer data to achieve the level of accuracy that is needed to successfully deflect and resolve customer issues at scale.

![Iris GPT info](/blog/iris-agent-qdrant/iris_gpt.png)

Since IrisAgent built out a lot of their AI related processes in-house with proprietary technology, they wanted to find ways to  augment these capabilities with RAG technologies and vector databases. This strategic move was aimed at abstracting much of the technical complexity, thereby simplifying the process for engineers and data scientists on the team to interact with data and develop a variety of solutions built on top of it.

![Quote from CEO of IrisAgent](/blog/iris-agent-qdrant/iris_ceo_quote.png)

“We were looking at a lot of vector databases in the market and one of our core requirements was that the solution needed to be open source because we have a strong emphasis on data privacy and security,” Bhatia says. Also, performance played a key role for IrisAgent during their evaluation as Bhatia mentions: “Despite it being a relatively new project at the time we tested Qdrant, the performance was really good.” Additional evaluation criteria were the ease of ability to deployment, future maintainability, and the quality of available documentation. Ultimately, IrisAgent decided to build with Qdrant as their vector database of choice, given these reasons:

* **Open Source and Flexibility**: IrisAgent required a solution that was open source, to align with their data security needs and preference for self-hosting. Qdrant's open-source nature allowed IrisAgent to deploy it on their cloud infrastructure seamlessly.
* **Performance**: Early on, IrisAgent recognized Qdrant's superior performance, despite its relative newness in the market. This performance aspect was crucial for handling large volumes of data efficiently.
* **Ease of Use**: Qdrant's user-friendly SDKs and compatibility with major programming languages like Go and Python made it an ideal choice for IrisAgent's engineering team. Additionally, IrisAgent values Qdrant’s the solid documentation, which is easy to follow.
* **Maintainability**: IrisAgent prioritized future maintainability in their choice of Qdrant, notably valuing the robustness and efficiency Rust provides, ensuring a scalable and future-ready solution.

## Optimizing IrisAgent's AI Pipeline: The Evaluation and Integration of Qdrant

IrisAgent utilizes comprehensive testing and sandbox environments, ensuring no customer data is used during the testing of new features. Initially, they deployed Qdrant in these environments to evaluate its performance, leveraging their own test data and employing Qdrant’s console and SDK features to conduct thorough data exploration and apply various filters. The primary languages used in these processes are Go, for its efficiency, and Python, for its strength in data science tasks.

After the successful testing, Qdrant's outputs are now integrated into IrisAgent’s AI pipeline, enhancing a suite of proprietary AI models designed for tasks such as detecting hallucinations and similarities, and classifying customer intents. With Qdrant, IrisAgent saw significant performance and quality gains for their RAG use cases. Beyond this, IrisAgent also performs fine-tuning further in the development process.

Qdrant’s emphasis on open-source technology and support for main programming languages (Go and Python) ensures ease of use and compatibility with IrisAgent’s production environment. IrisAgent is deploying Qdrant on Google Cloud in order to fully leverage Google Cloud's robust infrastructure and innovative offerings.

![Iris agent flow chart](/blog/iris-agent-qdrant/iris_agent_flow_chart.png)

## Future of IrisAgent

Looking ahead, IrisAgent is committed to pushing the boundaries of AI in customer support, with ambitious plans to evolve their product further. The cornerstone of this vision is a feature that will allow support teams to leverage historical support data more effectively, by automating the generation of knowledge base content to redefine how FAQs and product documentation are created. This strategic initiative aims not just to reduce manual effort but also to enrich the self-service capabilities of users. As IrisAgent continues to refine its AI algorithms and expand its training datasets, the goal is to significantly elevate the support experience, making it more seamless and intuitive for end-users. 
