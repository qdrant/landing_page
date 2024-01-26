---
draft: true
title: "Indexify Unveiled - Diptanu Gon Choudhury | Vector Space Talk #009"
slug: indexify-content-extraction-engine
short_description: Diptanu Gon Choudhury discusses how Indexify is transforming
  the AI-driven workflow in enterprises today.
description: Diptanu Gon Choudhury shares insights on reimaging Spark and data
  infrastructure while discussing his work on Indexify to enhance AI-driven
  workflows and knowledge bases.
preview_image: /blog/from_cms/diptanu-choudhury-cropped.png
date: 2024-01-26T16:40:55.469Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - Indexify
  - structured extraction engine
  - rag-based applications
---
> *"Then we have something like Qdrant, which is very geared towards doing vector search and so on. And so we understand the shape of the storage system now.”*\
— Diptanu Gon Choudhury
> 

Diptanu Gon Choudhury is the founder of Tensorlake. They are building Indexify - an open-source scalable structured extraction engine for unstructured data to build near-real-time knowledgebase for AI/agent-driven workflows and query engines. Before building Indexify, Diptanu created the Nomad cluster scheduler at Hashicorp, inventor of the Titan/Titus cluster scheduler at Netflix, led the FBLearner machine learning platform, and built the real-time speech inference engine at Facebook.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/6MSwo7urQAWE7EOxO7WTns?si=_s53wC0wR9C4uF8ngGYQlg), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/RoOgTxHkViA).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/RoOgTxHkViA?si=r0EjWlssjFDVrzo6" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Indexify-Unveiled-A-Scalable-and-Near-Real-time-Content-Extraction-Engine-for-Multimodal-Unstructured-Data---Diptanu-Gon-Choudhury--Vector-Space-Talk-009-e2el8qc/a-aas4nil" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Discover how reimagined data infrastructures revolutionize AI-agent workflows as Diptanu delves into Indexify, transforming raw data into real-time knowledge bases, and shares expert insights on optimizing rag-based applications, all amidst the ever-evolving landscape of Spark.

Here's What You'll Discover:

1. **Innovative Data Infrastructure**: Diptanu dives deep into how Indexify is revolutionizing the enterprise world by providing a sharper focus on data infrastructure and a refined abstraction for generative AI this year.
2. **AI-Copilot for Call Centers**: Learn how Indexify streamlines customer service with a real-time knowledge base, transforming how agents interact and resolve issues.
3. **Scaling Real-Time Indexing**: Discover the system’s powerful capability to index content as it happens, enabling multiple extractors to run simultaneously. It’s all about the right model and the computing capacity for on-the-fly content generation.
4. **Revamping Developer Experience**: Get a glimpse into the future as Diptanu chats with Demetrios about reimagining Spark to fit today's tech capabilities, vastly different from just two years ago!
5. **AI Agent Workflow Insights**: Understand the crux of AI agent-driven workflows, where models dynamically react to data, making orchestrated decisions in live environments.

> Fun Fact: The development of Indexify by Diptanu was spurred by the rising use of large language models in applications and the subsequent need for better data infrastructure to support these technologies.
> 

## Show notes:

00:00 AI's impact on model production and workflows.\
05:15 Building agents need indexes for continuous updates.\
09:27 Early RaG and LLMs adopters neglect data infrastructure.\
12:32 Design partner creating copilot for call centers.\
17:00 Efficient indexing and generation using scalable models.\
20:47 Spark is versatile, used for many cases.\
24:45 Recent survey paper on RAG covers tips.\
26:57 Evaluation of various aspects of data generation.\
28:45 Balancing trust and cost in factual accuracy.

## More Quotes from Diptanu:

*"In 2017, when I started doing machine learning, it would take us six months to ship a good model in production. And here we are today, in January 2024, new models are coming out every week, and people are putting them in production.”*\
-- Diptanu Gon Choudhury

*"Over a period of time, you want to extract new information out of existing data, because models are getting better continuously.”*\
-- Diptanu Gon Choudhury

*"We are in the golden age of demos. Golden age of demos with LLMs. Almost anyone, I think with some programming knowledge can kind of like write a demo with an OpenAI API or with an embedding model and so on.”*\
-- Diptanu Gon Choudhury

## Transcript:
Demetrios:
We are live, baby. This is it. Welcome back to another vector space talks. I'm here with my man Diptanu. He is the founder and creator of Tenterlake. They are building indexify, an open source, scalable, structured extraction engine for unstructured data to build near real time knowledge bases for AI agent driven workflows and query engines. And if it sounds like I just threw every buzzword in the book into that sentence, you can go ahead and say, bingo, we are here, and we're about to dissect what all that means in the next 30 minutes. So, dude, first of all, I got to just let everyone know who is here, that you are a bit of a hard hitter.

Demetrios:
You've got some track record under some notches on your belt. We could say before you created Tensorlake, let's just let people know that you were at Hashicorp, you created the nomad cluster scheduler, and you were the inventor of Titus cluster scheduler at Netflix. You led the FB learner machine learning platform and built real time speech inference engine at Facebook. You may be one of the most decorated people we've had on and that I have had the pleasure of talking to, and that's saying a lot. I've talked to a lot of people in my day, so I want to dig in, man. First question I've got for you, it's a big one. What the hell do you mean by AI agent driven workflows? Are you talking to autonomous agents? Are you talking, like the voice agents? What's that?

Diptanu Gon Choudhury:
Yeah, I was going to say that what a great last couple of years has been for AI. I mean, in context, learning has kind of, like, changed the way people do models and access models and use models in production, like at Facebook. In 2017, when I started doing machine learning, it would take us six months to ship a good model in production. And here we are today, in January 2024, new models are coming out every week, and people are putting them in production. It's a little bit of a Yolo where I feel like people have stopped measuring how well models are doing and just ship in production, but here we are. But I think underpinning all of this is kind of like this whole idea that models are capable of reasoning over data and non parametric knowledge to a certain extent. And what we are seeing now is workflows stop being completely heuristics driven, or as people say, like software 10 driven. And people are putting models in the picture where models are reacting to data that a workflow is seeing, and then people are using models behavior on the data and kind of like making the model decide what should the workflow do? And I think that's pretty much like, to me, what an agent is that an agent responds to information of the world and information which is external and kind of reacts to the information and kind of orchestrates some kind of business process or some kind of workflow, some kind of decision making in a workflow.

Diptanu Gon Choudhury:
That's what I mean by agents. And they can be like autonomous. They can be something that writes an email or writes a chat message or something like that. The spectrum is wide here.

Demetrios:
Excellent. So next question, logical question is, and I will second what you're saying. Like the advances that we've seen in the last year, wow. And the times are a change in, we are trying to evaluate while in production. And I like the term, yeah, we just yoloed it, or as the young kids say now, or so I've heard, because I'm not one of them, but we just do it for the plot. So we are getting those models out there, we're seeing if they work. And I imagine you saw some funny quotes from the Chevrolet chat bot, that it was a chat bot on the Chevrolet support page, and it was asked if Teslas are better than Chevys. And it said, yeah, Teslas are better than Chevys.

Demetrios:
So yes, that's what we do these days. This is 2024, baby. We just put it out there and test and prod. Anyway, getting back on topic, let's talk about indexify, because there was a whole lot of jargon that I said of what you do, give me the straight shooting answer. Break it down for me like I was five. Yeah.

Diptanu Gon Choudhury:
So if you are building an agent today, which depends on augmented generation, like retrieval, augmented generation, and given that this is Qdrant's show, I'm assuming people are very much familiar with Arag and augmented generation. So if people are building applications where the data is external or non parametric, and the model needs to see updated information all the time, because let's say, the documents under the hood that the application is using for its knowledge base is changing, or someone is building a chat application where new chat messages are coming all the time, and the agent or the model needs to know about what is happening, then you need like an index, or a set of indexes, which are continuously updated. And you also, over a period of time, you want to extract new information out of existing data, because models are getting better continuously. And the other thing is, AI, until now, or until a couple of years back, used to be very domain oriented or task oriented, where modality was the key behind models. Now we are entering into a world where information being encoded in any form, documents, videos or whatever, are important to these workflows that people are building or these agents that people are building. And so you need capability to ingest any kind of data and then build indexes out of them. And indexes, in my opinion, are not just embedding indexes, they could be indexes of semi structured data. So let's say you have an invoice.

Diptanu Gon Choudhury:
You want to maybe transform that invoice into semi structured data of where the invoice is coming from or what are the line items and so on. So in a nutshell, you need good data infrastructure to store these indexes and serve these indexes. And also you need a scalable compute engine so that whenever new data comes in, you're able to index them appropriately and update the indexes and so on. And also you need capability to experiment, to add new extractors into your platform, add new models into your platform, and so on. Indexify helps you with all that, right? So indexify, imagine indexify to be an online service with an API so that developers can upload any form of unstructured data, and then a bunch of extractors run in parallel on the cluster and extract information out of this unstructured data, and then update indexes on something like Qdrant or postgres for semi structured data continuously.

Demetrios:
Okay?

Diptanu Gon Choudhury:
And you basically get that in a single application, in a single binary, which is distributed on your cluster. You wouldn't have any external dependencies other than storage systems, essentially, to have a very scalable data infrastructure for your Rag applications or for your LLM agents.

Demetrios:
Excellent. So then talk to me about the inspiration for creating this. What was it that you saw that gave you that spark of, you know what? There needs to be something on the market that can handle this. Yeah.

Diptanu Gon Choudhury:
Earlier this year I was working with founder of a generative AI startup here. I was looking at what they were doing, I was helping them out, and I saw that. And then I looked around, I looked around at what is happening. Not earlier this year as in 2023. Somewhere in early 2023, I was looking at how developers are building applications with llms, and we are in the golden age of demos. Golden age of demos with llms. Almost anyone, I think with some programming knowledge can kind of like write a demo with an OpenAI API or with an embedding model and so on. And I mostly saw that the data infrastructure part of those demos or those applications were very basic people would do like one shot transformation of data, build indexes and then do stuff, build an application on top.

Diptanu Gon Choudhury:
And then I started talking to early adopters of RaG and llms in enterprises, and I started talking to them about how they're building their data pipelines and their data infrastructure for llms. And I feel like people were mostly excited about the application layer, right? A very less amount of thought was being put on the data infrastructure, and it was almost like built out of duct tape, right, of pipeline, like pipelines and workflows like RabbitMQ, like x, Y and z, very bespoke pipelines, which are good at one shot transformation of data. So you put in some documents on a queue, and then somehow the documents get embedded and put into something like Qdrant. But there was no thought about how do you re index? How do you add a new capability into your pipeline? Or how do you keep the whole system online, right? Keep the indexes online while reindexing and so on. And so classically, if you talk to a distributed systems engineer, they would be, you know, this is a mapreduce problem, right? So there are tools like Spark, there are tools like any skills ray, and they would classically solve these problems, right? And if you go to Facebook, we use Spark for something like this, or like presto, or we have a ton of big data infrastructure for handling things like this. And I thought that in 2023 we need a better abstraction for doing something like this. The world is moving to our server less, right? Developers understand functions. Developer thinks about computers as functions and functions which are distributed on the cluster and can transform content into something that llms can consume.

Diptanu Gon Choudhury:
And that was the inspiration I was thinking, what would it look like if we redid Spark or ray for generative AI in 2023? How can we make it so easy so that developers can write functions to extract content out of any form of unstructured data, right? You don't need to think about text, audio, video, or whatever. You write a function which can kind of handle a particular data type and then extract something out of it. And now how can we scale it? How can we give developers very transparently, like, all the abilities to manage indexes and serve indexes in production? And so that was the inspiration for it. I wanted to reimagine Mapreduce for generative AI.

Demetrios:
Wow. I like the vision you sent me over some ideas of different use cases that we can walk through, and I'd love to go through that and put it into actual tangible things that you've been seeing out there. And how you can plug it in to these different use cases. I think the first one that I wanted to look at was building a copilot for call center agents and what that actually looks like in practice. Yeah.

Diptanu Gon Choudhury:
So I took that example because that was super close to my heart in the sense that we have a design partner like who is doing this. And you'll see that in a call center, the information that comes in into a call center or the information that an agent in a human being in a call center works with is very rich. In a call center you have phone calls coming in, you have chat messages coming in, you have emails going on, and then there are also documents which are knowledge bases for human beings to answer questions or make decisions on. Right. And so they're working with a lot of data and then they're always pulling up a lot of information. And so one of our design partner is like building a copilot for call centers essentially. And what they're doing is they want the humans in a call center to answer questions really easily based on the context of a conversation or a call that is happening with one of their users, or pull up up to date information about the policies of the company and so on. And so the way they are using indexify is that they ingest all the content, like the raw content that is coming in video, not video, actually, like audio emails, chat messages into indexify.

Diptanu Gon Choudhury:
And then they have a bunch of extractors which handle different type of modalities, right? Some extractors extract information out of emails. Like they would do email classification, they would do embedding of emails, they would do like entity extraction from emails. And so they are creating many different types of indexes from emails. Same with speech. Right? Like data that is coming on through calls. They would transcribe them first using ASR extractor, and from there on the speech would be embedded and the whole pipeline for a text would be invoked into it, and then the speech would be searchable. If someone wants to find out what conversation has happened, they would be able to look up things. There is a summarizer extractor, which is like looking at a phone call and then summarizing what the customer had called and so on.

Diptanu Gon Choudhury:
So they are basically building a near real time knowledge base of one what is happening with the customer. And also they are pulling in information from their documents. So that's like one classic use case. Now the only dependency now they have is essentially like a blob storage system and serving infrastructure for indexes, like in this case, like Qdrant and postgres. And they have a bunch of extractors that they have written in house and some extractors that we have written, they're using them out of the box and they can scale the system to as much as they need. And it's kind of like giving them a high level abstraction of building indexes and using them in llms.

Demetrios:
So I really like this idea of how you have the unstructured and you have the semi structured and how those play together almost. And I think one thing that is very clear is how you've got the transcripts, you've got the embeddings that you're doing, but then you've also got documents that are very structured and maybe it's from the last call and it's like in some kind of a database. And I imagine we could say whatever, salesforce, it's in a salesforce and you've got it all there. And so there is some structure to that data. And now you want to be able to plug into all of that and you want to be able to, especially in this use case, the call center agents, human agents need to make decisions and they need to make decisions fast. Right. So the real time aspect really plays a part of that.

Diptanu Gon Choudhury:
Exactly.

Demetrios:
You can't have it be something that it'll get back to you in 30 seconds, or maybe 30 seconds is okay, but really the less time the better. And so traditionally when I think about using llms, I kind of take real time off the table. Have you had luck with making it more real time? Yeah.

Diptanu Gon Choudhury:
So there are two aspects of it. How quickly can your indexes be updated? As of last night, we can index all of Wikipedia under five minutes on AWS. We can run up to like 5000 extractors with indexify concurrently and parallel. I feel like we got the indexing part covered. Unless obviously you are using a model as behind an API where we don't have any control. But assuming you're using some kind of embedding model or some kind of extractor model, right, like a named entity extractor or an speech to text model that you control and you understand the I Ops, we can scale it out and our system can kind of handle the scale of getting it indexed really quickly. Now on the generation side, that's where it's a little bit more nuanced, right? Generation depends on how big the generation model is. If you're using GPD four, then obviously you would be playing with the latency budgets that OpenAI provides.

Diptanu Gon Choudhury:
If you're using some other form of models like mixture MoE or something which is very optimized and you have worked on making the model optimized, then obviously you can cut it down. So it depends on the end to end stack. It's not like a single piece of software. It's not like a monolithic piece of software. So it depends on a lot of different factors. But I can confidently claim that we have gotten the indexing side of real time aspects covered as long as the models people are using are reasonable and they have enough compute in their cluster.

Demetrios:
Yeah. Okay. Now talking again about the idea of rethinking the developer experience with this and almost reimagining what Spark would be if it were created today.

Diptanu Gon Choudhury:
Exactly.

Demetrios:
How do you think that there are manifestations in what you've built that play off of things that could only happen because you created it today as opposed to even two years ago.

Diptanu Gon Choudhury:
Yeah. So I think, for example, take Spark, right? Spark was born out of big data, like the 2011 twelve era of big data. In fact, I was one of the committers on Apache Mesos, the cluster scheduler that Spark used for a long time. And then when I was at Hashicorp, we tried to contribute support for Nomad in Spark. What I'm trying to say is that Spark is a task scheduler at the end of the day and it uses an underlying scheduler. So the teams that manage spark today or any other similar tools, they have like tens or 15 people, or they're using like a hosted solution, which is super complex to manage. Right. A spark cluster is not easy to manage.

Diptanu Gon Choudhury:
I'm not saying it's a bad thing or whatever. Software written at any given point in time reflect the world in which it was born. And so obviously it's from that era of systems engineering and so on. And since then, systems engineering has progressed quite a lot. I feel like we have learned how to make software which is scalable, but yet simpler to understand and to operate and so on. And the other big thing in spark that I feel like is missing or any skills, Ray, is that they are not natively integrated into the data stack. Right. They don't have an opinion on what the data stack is.

Diptanu Gon Choudhury:
They're like excellent Mapreduce systems, and then the data stuff is layered on top. And to a certain extent that has allowed them to generalize to so many different use cases. People use spark for everything. At Facebook, I was using Spark for batch transcoding of speech, to text, for various use cases with a lot of issues under the hood. Right? So they are tied to the big data storage infrastructure. So when I am reimagining Spark, I almost can take the position that we are going to use blob storage for ingestion and writing raw data, and we will have low latency serving infrastructure in the form of something like postgres or something like clickhouse or something for serving like structured data or semi structured data. And then we have something like Qdrant, which is very geared towards doing vector search and so on. And so we understand the shape of the storage system now.

Diptanu Gon Choudhury:
We understand that developers want to integrate with them. So now we can control the compute layer such that the compute layer is optimized for doing the compute and producing data such that they can be written in those data stores, right? So we understand the I Ops, right? The I O, what is it called? The I O characteristics of the underlying storage system really well. And we understand that the use case is that people want to consume those data in llms, right? So we can make design decisions such that how we write into those, into the storage system, how we serve very specifically for llms, that I feel like a developer would be making those decisions themselves, like if they were using some other tool.

Demetrios:
Yeah, it does feel like optimizing for that and recognizing that spark is almost like a swiss army knife. As you mentioned, you can do a million things with it, but sometimes you don't want to do a million things. You just want to do one thing and you want it to be really easy to be able to do that one thing. I had a friend who worked at some enterprise and he was talking about how spark engineers have all the job security in the world, because a, like you said, you need a lot of them, and b, it's hard stuff being able to work on that and getting really deep and knowing it and the ins and outs of it. So I can feel where you're coming from on that one.

Diptanu Gon Choudhury:
Yeah, I mean, we basically integrated the compute engine with the storage so developers don't have to think about it. Plug in whatever storage you want. We support, obviously, like all the blob stores, and we support Qdrant and postgres right now, indexify in the future can even have other storage engines. And now all an application developer needs to do is deploy this on AWS or GCP or whatever, right? Have enough compute, point it to the storage systems, and then now build your application. You don't need to make any of the hard decisions or build a distributed systems by bringing together like five different tools and spend like five months building the data layer, focus on the application, build your agents.

Demetrios:
So there is something else. As we are winding down, I want to ask you one last thing, and if anyone has any questions, feel free to throw them in the chat. I am monitoring that also, but I am wondering about advice that you have for people that are building rag based applications, because I feel like you've probably seen quite a few out there in the wild. And so what are some optimizations or some nice hacks that you've seen that have worked really well? Yeah.

Diptanu Gon Choudhury:
So I think, first of all, there is a recent paper, like a rack survey paper. I really like it. Maybe you can have the link on the show notes if you have one. There was a recent survey paper, I really liked it, and it covers a lot of tips and tricks that people can use with Rag. But essentially, Rag is an information. Rag is like a two step process in its essence. One is the document selection process and the document reading process. Document selection is how do you retrieve the most important information out of million documents that might be there, and then the reading process is how do you jam them in the context of a model, and so that the model can kind of ground its generation based on the context.

Diptanu Gon Choudhury:
So I think the most tricky part here, and the part which has the most tips and tricks is the document selection part. And that is like a classic information retrieval problem. So I would suggest people doing a lot of experimentation around ranking algorithms, hitting different type of indexes, and refining the results by merging results from different indexes. One thing that always works for me is reducing the search space of the documents that I am selecting in a very systematic manner. So like using some kind of hybrid search where someone does the embedding lookup first, and then does the keyword lookup, or vice versa, or does lookups parallel and then merges results together? Those kind of things where the search space is narrowed down always works for me.

Demetrios:
So I think one of the Qdrant team members would love to know because I've been talking to them quite frequently about this, the evaluating of retrieval. Have you found any tricks or tips around that and evaluating the quality of what is retrieved?

Diptanu Gon Choudhury:
So I haven't come across a golden one trick that fits every use case type thing like solution for evaluation. Evaluation is really hard. There are open source projects like ragas who are trying to solve it, and everyone is trying to solve various, various aspects of evaluating like rag exactly. Some of them try to evaluate how accurate the results are, some people are trying to evaluate how diverse the answers are, and so on. I think the most important thing that our design partners care about is factual accuracy and factual accuracy. One process that has worked really well is like having a critique model. So let the generation model generate some data and then have a critique model go and try to find citations and look up how accurate the data is, how accurate the generation is, and then feed that back into the system. One another thing like going back to the previous point is what tricks can someone use for doing rag really well? I feel like people don't fine tune embedding models that much.

Diptanu Gon Choudhury:
I think if people are using an embedding model, like sentence transformer or anything like off the shelf, they should look into fine tuning the embedding models on their data set that they are embedding. And I think a combination of fine tuning the embedding models and kind of like doing some factual accuracy checks lead to a long way in getting like rag working really well.

Demetrios:
Yeah, it's an interesting one. And I'll probably leave it here on the extra model that is basically checking factual accuracy. You've always got these trade offs that you're playing with, right? And one of the trade offs is going to be, maybe you're making another LLM call, which could be more costly, but you're gaining trust or you're gaining confidence that what it's outputting is actually what it says it is. And it's actually factually correct, as you said. So it's like, what price can you put on trust? And we're going back to that whole thing that I saw on Chevy's website where they were saying that a Tesla is better. It's like that hopefully doesn't happen anymore as people deploy this stuff and they recognize that humans are cunning when it comes to playing around with chat bots. So this has been fascinating, man. I appreciate you coming on here and chatting me with it.

Demetrios:
I encourage everyone to go and either reach out to you on LinkedIn, I know you are on there, and we'll leave a link to your LinkedIn in the chat too. And if not, check out Tensorleg, check out indexify, and we will be in touch. Man, this was great.

Diptanu Gon Choudhury:
Yeah, same. It was really great chatting with you about this, Demetrius, and thanks for having me today.

Demetrios:
Cheers. I'll talk to you later.