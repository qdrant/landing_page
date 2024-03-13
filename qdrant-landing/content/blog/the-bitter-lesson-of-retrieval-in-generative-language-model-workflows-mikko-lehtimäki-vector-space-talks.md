---
draft: false
title: The Bitter Lesson of Retrieval in Generative Language Model Workflows -
  Mikko Lehtimäki | Vector Space Talks
slug: bitter-lesson-generative-language-model
short_description: Mikko Lehtimäki discusses the challenges and techniques in
  implementing retrieval augmented generation for Yokot AI
description: Mikko Lehtimäki delves into the intricate world of
  retrieval-augmented generation, discussing how Yokot AI manages vast diverse
  data inputs and how focusing on re-ranking can massively improve LLM workflows
  and output quality.
preview_image: /blog/from_cms/mikko-lehtimäki-cropped.png
date: 2024-01-29T16:31:02.511Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - generative language model
  - Retrieval Augmented Generation
  - Softlandia
---
> *"If you haven't heard of the bitter lesson, it's actually a theorem. It's based on a blog post by Ricard Sutton, and it states basically that based on what we have learned from the development of machine learning and artificial intelligence systems in the previous decades, the methods that can leverage data and compute tends to or will eventually outperform the methods that are designed or handcrafted by humans.”*\
-- Mikko Lehtimäki
> 

Dr. Mikko Lehtimäki is a data scientist, researcher and software engineer. He has delivered a range of data-driven solutions, from machine vision for robotics in circular economy to generative AI in journalism. Mikko is a co-founder of Softlandia, an innovative AI solutions provider. There, he leads the development of YOKOTAI, an LLM-based productivity booster that connects to enterprise data. 

Recently, Mikko has contributed software to Llama-index and Guardrails-AI, two leading open-source initiatives in the LLM space. He completed his PhD in the intersection of computational neuroscience and machine learning, which gives him a unique perspective on the design and implementation of AI systems. With Softlandia, Mikko also hosts chill hybrid-format data science meetups where everyone is welcome to participate.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/5hAnDq7MH9qjjtYVjmsGrD?si=zByq7XXGSjOdLbXZDXTzoA), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/D8lOvz5xp5c).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/D8lOvz5xp5c?si=k9tIcDf31xqjqiv1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/The-Bitter-Lesson-of-Retrieval-in-Generative-Language-Model-Workflows---Mikko-Lehtimki--Vector-Space-Talk-011-e2evek4/a-aat2k24" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Aren’t you curious about what the bitter lesson is and how it plays out in generative language model workflows?

Check it out as Mikko delves into the intricate world of retrieval-augmented generation, discussing how Yokot AI manages vast diverse data inputs and how focusing on re-ranking can massively improve LLM workflows and output quality.

5 key takeaways you’ll get from this episode:

1. **The Development of Yokot AI:** Mikko detangles the complex web of how Softlandia's in-house stack is changing the game for language model applications. 
2. **Unpacking Retrieval-Augmented Generation:** Learn the rocket science behind uploading documents and scraping the web for that nugget of insight, all through the prowess of Yokot AI's LLMs. 
3. **The "Bitter Lesson" Theory:** Dive into the theorem that's shaking the foundations of AI, suggesting the supremacy of data and computing over human design. 
4. **High-Quality Content Generation:** Understand how the system's handling of massive data inputs is propelling content quality to stratospheric heights. 
5. **Future Proofing with Re-Ranking:** Discover why improving the re-ranking component might be akin to discovering a new universe within our AI landscapes. 

> Fun Fact: Yokot AI incorporates a retrieval augmented generation mechanism to facilitate the retrieval of relevant information, which allows users to upload and leverage their own documents or scrape data from the web.
> 

## Show notes:

00:00 Talk on retrieval for language models and Yokot AI platform.\
06:24 Data flexibility in various languages leads progress.\
10:45 User inputs document, system converts to vectors.\
13:40 Enhance data quality, reduce duplicates, streamline processing.\
19:20 Reducing complexity by focusing on re-ranker.\
21:13 Retrieval process enhances efficiency of language model.\
24:25 Information retrieval methods evolving, leveraging data, computing.\
28:11 Optimal to run lightning on local hardware.

## More Quotes from Mikko:

"*We used to build image analysis on this type of features that we designed manually... Whereas now we can just feed a bunch of images to a transformer, and we'll get beautiful bounding boxes and semantic segmentation outputs without building rules into the system.*”\
-- Mikko Lehtimäki

*"We cannot just leave it out and hope that someday soon we will have a language model that doesn't require us fetching the data for it in such a sophisticated manner. The reranker is a component that can leverage data and compute quite efficiently, and it doesn't require that much manual craftmanship either.”*\
-- Mikko Lehtimäki

*"We can augment the data we store, for example, by using multiple chunking strategies or generating question answer pairs from the user's documents, and then we'll embed those and look them up when the queries come in.”*\
-- Mikko Lehtimäki in improving data quality in rack stack

## Transcript:
Demetrios:
What is happening? Everyone, it is great to have you here with us for yet another vector space talks. I have the pleasure of being joined by Mikko today, who is the co founder of Softlandia, and he's also lead data scientist. He's done all kinds of great software engineering and data science in his career, and currently he leads the development of Yokot AI, which I just learned the pronunciation of, and he's going to tell us all about it. But I'll give you the TLDR. It's an LLM based productivity booster that can connect to your data. What's going on, Mikko? How you doing, bro?

Mikko Lehtimäki:
Hey, thanks. Cool to be here. Yes.

Demetrios:
So, I have to say, I said it before we hit record or before we started going live, but I got to say it again. The talk title is spot on. Your talk title is the bitter lessons of retrieval in generative language model workflows.

Mikko Lehtimäki:
Exactly.

Demetrios:
So I'm guessing you've got a lot of hardship that you've been through, and you're going to hopefully tell us all about it so that we do not have to make the same mistakes as you did. We can be wise and learn from your mistakes before we have to make them ourselves, right? All right. That's a great segue into you getting into it, man. I know you got to talk. I know you got some slides to share, so feel free to start throwing those up on the screen. And for everyone that is here joining, feel free to add some questions in the chat. I'll be monitoring it so that in case you have any questions, I can jump in and make sure that Mikko answers them before he moves on to the next slide. All right, Mikko, I see your screen, bro.

Demetrios:
This is good stuff.

Mikko Lehtimäki:
Cool. So, shall we get into? Yeah. My name is Mikko. I'm the chief data scientist here at Softlandia. I finished my phd last summer and have been doing the Softlandia for two years now. I'm also a contributor to some open source AI LLM libraries like Llama index and cartrails AI. So if you haven't checked those out ever, please do. Here at Softlandia, we are primarily an AI consultancy that focuses on end to end AI solutions, but we've also developed our in house stack for large language model applications, which I'll be discussing today.

Mikko Lehtimäki:
So the topic of the talk is a bit provocative. Maybe it's a bitter lesson of retrieval for large language models, and it really stems from our experience in building production ready retrieval augmented generation solutions. I just want to say it's not really a lecture, so I'm going to tell you to do this or do that. I'll just try to walk you through the thought process that we've kind of adapted when we develop rack solutions, and we'll see if that resonates with you or not. So our LLM solution is called Yokot AI. It's really like a platform where enterprises can upload their own documents and get language model based insights from them. The typical example is question answering from your documents, but we're doing a bit more than that. For example, users can generate long form documents, leveraging their own data, and worrying about the token limitations that you typically run in when you ask an LLM to output something.

Mikko Lehtimäki:
Here you see just a snapshot of the data management view that we have built. So users can bring their own documents or scrape the web, and then access the data with LLMS right away. This is the document generation output. It's longer than you typically see, and each section can be based on different data sources. We've got different generative flows, like we call them, so you can take your documents and change the style using llms. And of course, the typical chat view, which is really like the entry point, to also do these workflows. And you can see the sources that the language model is using when you're asking questions from your data. And this is all made possible with retrieval augmented generation.

Mikko Lehtimäki:
That happens behind the scenes. So when we ask the LLM to do a task, we're first fetching data from what was uploaded, and then everything goes from there. So we decide which data to pull, how to use it, how to generate the output, and how to present it to the user so that they can keep on conversing with the data or export it to their desired format, whatnot. But the primary challenge with this kind of system is that it is very open ended. So we don't really set restrictions on what kind of data the users can upload or what language the data is in. So, for example, we're based in Finland. Most of our customers are here in the Nordics. They talk, speak Finnish, Swedish.

Mikko Lehtimäki:
Most of their data is in English, because why not? And they can just use whatever language they feel with the system. So we don't want to restrict any of that. The other thing is the chat view as an interface, it really doesn't set much limits. So the users have the freedom to do the task that they choose with the system. So the possibilities are really broad that we have to prepare for. So that's what we are building. Now, if you haven't heard of the bitter lesson, it's actually a theorem. It's based on a blog post by Ricard Sutton, and it states basically that based on what we have learned from the development of machine learning and artificial intelligence systems in the previous decades, the methods that can leverage data and compute tends to or will eventually outperform the methods that are designed or handcrafted by humans.

Mikko Lehtimäki:
So for example, I have an illustration here showing how this has manifested in image analysis. So on the left hand side, you see the output from an operation that extracts gradients from images. We used to build image analysis on this type of features that we designed manually. We would run some kind of edge extraction, we would count corners, we would compute the edge distances and design the features by hand in order to work with image data. Whereas now we can just feed a bunch of images to a transformer, and we'll get beautiful bounding boxes and semantic segmentation outputs without building rules into the system. So that's a prime example of the bitter lesson in action. Now, if we take this to the context of rack or retrieval augmented generation, let's have a look first at the simple rack architecture. Why do we do this in the first place? Well, it's because the language models themselves, they don't have up to date data because they've been trained a while ago.

Mikko Lehtimäki:
You don't really even know when. So we need to give them access to more recent data, and we need a method for doing that. And the other thing is problems like hallucinations. We found that if you just ask the model a question that is in the training data, you won't get always reliable results. But if you can crown the model's answers with data, you will get more factual results. So this is what can be done with the rack as well. And the final thing is that we just cannot give a book, for example, in one go the language model, because even if theoretically it could read the input in one go, the result quality that you get from the language model is going to suffer if you feed it too much data at once. So this is why we have designed retrieval augmented generation architectures.

Mikko Lehtimäki:
And if we look at this system on the bottom, you see the typical data ingestion. So the user gives a document, we slice it to small chunks, and we compute a numerical representation with vector embeddings and store those in a vector database. Why a vector database? Because it's really efficient to retrieve vectors from it when we get users query. So that is also embedded and it's used to look up relevant sources from the data that was previously uploaded efficiently directly on the database, and then we can fit the resulting text, the language model, to synthesize an answer. And this is how the RHe works in very basic form. Now you can see that if you have only a single document that you work with, it's nice if the problem set that you want to solve is very constrained, but the more data you can bring to your system, the more workflows you can build on that data. So if you have, for example, access to a complete book or many books, it's easy to see you can also generate higher quality content from that data. So this architecture really must be such that it can also make use of those larger amounts of data.

Mikko Lehtimäki:
Anyway, once you implement this for the first time, it really feels like magic. It tends to work quite nicely, but soon you'll notice that it's not suitable for all kinds of tasks. Like you will see sometimes that, for example, the lists. If you retrieve lists, they may be broken. If you ask questions that are document comparisons, you may not get complete results. If you run summarization tasks without thinking about it anymore, then that will most likely lead to super results. So we'll have to extend the architecture quite a bit to take into account all the use cases that we want to enable with bigger amounts of data that the users upload. And this is what it may look like once you've gone through a few design iterations.

Mikko Lehtimäki:
So let's see, what steps can we add to our rack stack in order to make it deliver better quality results? If we start from the bottom again, we can see that we try to enhance the quality of the data that we upload by adding steps to the data ingestion pipeline. We can augment the data we store, for example, by using multiple chunking strategies or generating question answer pairs from the user's documents, and then we'll embed those and look them up when the queries come in. At the same time, we can reduce the data we upload, so we want to make sure there are no duplicates. We want to clean low quality things like HTML stuff, and we also may want to add some metadata so that certain data, for example references, can be excluded from the search results if they're not needed to run the tasks that we like to do. We've modeled this as a stream processing pipeline, by the way. So we're using Bytewax, which is another really nice open source framework. Just a tiny advertisement we're going to have a workshop with Bytewax about rack on February 16, so keep your eyes open for that. At the center I have added different databases and different retrieval methods.

Mikko Lehtimäki:
We may, for example, add keyword based retrieval and metadata filters. The nice thing is that you can do all of this with quattron if you like. So that can be like a one stop shop for your document data. But some users may want to experiment with different databases, like graph databases or NoSQL databases and just ordinary SQL databases as well. They can enable different kinds of use cases really. So it's up to your service which one is really useful for you. If we look more to the left, we have a component called query planner and some query routers. And this really determines the response strategy.

Mikko Lehtimäki:
So when you get the query from the user, for example, you want to take different steps in order to answer it. For example, you may want to decompose the query to small questions that you answer individually, and each individual question may take a different path. So you may want to do a query based on metadata, for example pages five and six from a document. Or you may want to look up based on keywords full each page or chunk with a specific word. And there's really like a massive amount of choices how this can go. Another example is generating hypothetical documents based on the query and embedding those rather than the query itself. That will in some cases lead to higher quality retrieval results. But now all this leads into the right side of the query path.

Mikko Lehtimäki:
So here we have a re ranker. So if we implement all of this, we end up really retrieving a lot of data. We typically will retrieve more than it makes sense to give to the language model in a single call. So we can add a re ranker step here and it will firstly filter out low quality retrieved content and secondly, it will put the higher quality content on the top of the retrieved documents. And now when you pass this reranked content to the language model, it should be able to pay better attention to the details that actually matter given the query. And this should lead to you better managing the amount of data that you have to handle with your final response generator, LLM. And it should also make the response generator a bit faster because you will be feeding slightly less data in one go. The simplest way to build a re ranker is probably just asking a large language model to re rank or summarize the content that you've retrieved before you feed it to the language model.

Mikko Lehtimäki:
That's one way to do it. So yeah, that's a lot of complexity and honestly, we're not doing all of this right now with Yokot AI, either. We've tried all of it in different scopes, but really it's a lot of logic to maintain. And to me this just like screams the bitter lesson, because we're building so many steps, so much logic, so many rules into the system, when really all of this is done just because the language model can't be trusted, or it can't be with the current architectures trained reliably, or cannot be trained in real time with the current approaches that we have. So there's one thing in this picture, in my opinion, that is more promising than the others for leveraging data and compute, which should dominate the quality of the solution in the long term. And if we focus only on that, or not only, but if we focus heavily on that part of the process, we should be able to eliminate some complexity elsewhere. So if you're watching the recording, you can pause and think what this component may be. But in my opinion, it is the re ranker at the end.

Mikko Lehtimäki:
And why is that? Well, of course you could argue that the language model itself is one, but with the current architectures that we have, I think we need the retrieval process. We cannot just leave it out and hope that someday soon we will have a language model that doesn't require us fetching the data for it in such a sophisticated manner. The reranker is a component that can leverage data and compute quite efficiently, and it doesn't require that much manual craftmanship either. It's a stakes in samples and outputs samples, and it plays together really well with efficient vector search that we have available now. Like quatrant being a prime example of that. The vector search is an initial filtering step, and then the re ranker is the secondary step that makes sure that we get the highest possible quality data to the final LLM. And the efficiency of the re ranker really comes from the fact that it doesn't have to be a full blown generative language model so often it is a language model, but it doesn't have to have the ability to generate GPT four level content. It just needs to understand, and in some, maybe even a very fixed way, communicate the importance of the inputs that you give it.

Mikko Lehtimäki:
So typically the inputs are the user's query and the data that was retrieved. Like I mentioned earlier, the easiest way to use a read ranker is probably asking a large language model to rerank your chunks or sentences that you retrieved. But there are also models that have been trained specifically for this, the Colbert model being a primary example of that and we also have to remember that the rerankers have been around for a long time. They've been used in traditional search engines for a good while. We just now require a bit higher quality from them because there's no user checking the search results and deciding which of them is relevant. After the fact that the re ranking has already been run, we need to trust that the output of the re ranker is high quality and can be given to the language model. So you can probably get plenty of ideas from the literature as well. But the easiest way is definitely to use LLM behind a simple API.

Mikko Lehtimäki:
And that's not to say that you should ignore the rest like the query planner is of course a useful component, and the different methods of retrieval are still relevant for different types of user queries. So yeah, that's how I think the bitter lesson is realizing in these rack architectures I've collected here some methods that are recent or interesting in my opinion. But like I said, there's a lot of existing information from information retrieval research that is probably going to be rediscovered in the near future. So if we summarize the bitter lesson which we have or are experiencing firsthand, states that the methods that leverage data and compute will outperform the handcrafted approaches. And if we focus on the re ranking component in the RHE, we'll be able to eliminate some complexity elsewhere in the process. And it's good to keep in mind that we're of course all the time waiting for advances in the large language model technology. But those advances will very likely benefit the re ranker component as well. So keep that in mind when you find new, interesting research.

Mikko Lehtimäki:
Cool. That's pretty much my argument finally there. I hope somebody finds it interesting.

Demetrios:
Very cool. It was bitter like a black cup of coffee, or bitter like dark chocolate. I really like these lessons that you've learned, and I appreciate you sharing them with us. I know the re ranking and just the retrieval evaluation aspect is something on a lot of people's minds right now, and I know a few people at Qdrant are actively thinking about that too, and how to make it easier. So it's cool that you've been through it, you've felt the pain, and you also are able to share what has helped you. And so I appreciate that. In case anyone has any questions, now would be the time to ask them. Otherwise we will take it offline and we'll let everyone reach out to you on LinkedIn, and I can share your LinkedIn profile in the chat to make it real easy for people to reach out if they want to, because this was cool, man.

Demetrios:
This was very cool, and I appreciate it.

Mikko Lehtimäki:
Thanks. I hope it's useful to someone.

Demetrios:
Excellent. Well, if that is all, I guess I've got one question for you. Even though we are kind of running up on time, so it'll be like a lightning question. You mentioned how you showed the really descriptive diagram where you have everything on there, and it's kind of like the dream state or the dream outcome you're going for. What is next? What are you going to create out of that diagram that you don't have yet?

Mikko Lehtimäki:
You want the lightning answer would be really good to put this run on a local hardware completely. I know that's not maybe the algorithmic thing or not necessarily in the scope of Yoko AI, but if we could run this on a physical device in that form, that would be super.

Demetrios:
I like it. I like it. All right. Well, Mikko, thanks for everything and everyone that is out there. All you vector space astronauts. Have a great day. Morning, night, wherever you are at in the world or in space. And we will see you later.

Demetrios:
Thanks.

Mikko Lehtimäki:
See you.
