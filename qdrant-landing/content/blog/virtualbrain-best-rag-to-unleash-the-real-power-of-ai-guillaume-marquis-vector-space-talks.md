---
draft: false
title: "VirtualBrain: Best RAG to unleash the real power of AI - Guillaume
  Marquis | Vector Space Talks"
slug: virtualbrain-best-rag
short_description: Let's explore information retrieval with Guillaume Marquis,
  CTO & Co-Founder at VirtualBrain.
description: Guillaume Marquis, CTO & Co-Founder at VirtualBrain, reveals the
  mechanics of advanced document retrieval with RAG technology, discussing the
  challenges of scalability, up-to-date information, and navigating user
  feedback to enhance the productivity of knowledge workers.
preview_image: /blog/from_cms/guillaume-marquis-2-cropped.png
date: 2024-03-27T12:41:51.859Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - Vector Search
  - Retrieval Augmented Generation
  - VirtualBrain
---
> *"It's like mandatory to have a vector database that is scalable, that is fast, that has low latencies, that can under parallel request a large amount of requests. So you have really this need and Qdrant was like an obvious choice.”*\
—  Guillaume Marquis
> 

Guillaume Marquis, a dedicated Engineer and AI enthusiast, serves as the Chief Technology Officer and Co-Founder of VirtualBrain, an innovative AI company. He is committed to exploring novel approaches to integrating artificial intelligence into everyday life, driven by a passion for advancing the field and its applications.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/20iFzv2sliYRSHRy1QHq6W?si=xZqW2dF5QxWsAN4nhjYGmA), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/v85HqNqLQcI?feature=shared).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/v85HqNqLQcI?si=hjUiIhWxsDVO06-H" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/VirtualBrain-Best-RAG-to-unleash-the-real-power-of-AI---Guillaume-Marquis--Vector-Space-Talks-017-e2grbfg/a-ab22dgt" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Who knew that document retrieval could be creative? Guillaume and VirtualBrain help draft sales proposals using past reports. It's fascinating how tech aids deep work beyond basic search tasks.

Tackling document retrieval and AI assistance, Guillaume furthermore unpacks the ins and outs of searching through vast data using a scoring system, the virtue of [RAG](https://qdrant.tech/rag/rag-evaluation-guide/) for deep work, and going through the 'illusion of work', enhancing insights for knowledge workers while confronting the challenges of scalability and user feedback on hallucinations.

Here are some key insight from this episode you need to look out for:

1. How to navigate the world of data with a precision scoring system for document retrieval.
2. The importance of fresh data and how to avoid the black holes of outdated info.
3. Techniques to boost system scalability and speed — essential in the vastness of data space.
4. AI Assistants tailored for depth rather than breadth, aiding in tasks like crafting stellar commercial proposals.
5. The intriguing role of user perception in AI tool interactions, plus a dash of timing magic.

> Fun Fact: VirtualBrain uses Qdrant, for its advantages in speed, scalability, and API capabilities.
> 


## Show notes:

00:00 Hosts and guest recommendations.\
09:01 Leveraging past knowledge to create new proposals.\
12:33 Ingesting and parsing documents for context retrieval.\
14:26 Creating and storing data, performing advanced searches.\
17:39 Analyzing document date for accurate information retrieval.\
20:32 Perceived time can calm nerves and entertain.\
24:23 Tried various vector databases, preferred open source.\
27:42 LangFuse: open source tool for monitoring tasks.\
33:10 AI tool designed to stay within boundaries.\
34:31 Minimizing hallucination in AI through careful analysis.


## More Quotes from Guillaume:


*"We only exclusively use open source tools because of security aspects and stuff like that. That's why also we are using Qdrant one of the important point on that. So we have a system, we are using this serverless stuff to ingest document over time.”*\
—  Guillaume Marquis

*"One of the challenging part was the scalability of the system. We have clients that come with terra octave of data and want to be parsed really fast and so you have the ingestion, but even after the semantic search, even on a large data set can be slow. And today ChatGPT answers really fast. So your users, even if the question is way more complicated to answer than a basic ChatGPT question, they want to have their answer in seconds. So you have also this challenge that you really have to take care.”*\
—  Guillaume Marquis

*"Our AI is not trained to write you a speech based on Shakespeare and with the style of Martin Luther King. It's not the purpose of the tool. So if you ask something that is out of the box, he will just say like, okay, I don't know how to answer that. And that's an important point. That's a feature by itself to be able to not go outside of the box.”*\
—  Guillaume Marquis

## Transcript:
Demetrios:
So, dude, I'm excited for this talk. Before we get into it, I want to make sure that we have some pre conversation housekeeping items that go out, one of which being, as always, we're doing these vector space talks and everyone is encouraged and invited to join in. Ask your questions, let us know where you're calling in from, let us know what you're up to, what your use case is, and feel free to drop any questions that you may have in the chat. We will be monitoring it like a hawk. Today I am joined by none other than Sabrina. How are you doing, Sabrina?

Sabrina Aquino:
What's up, Demetrios? I'm doing great. Excited to be here. I just love seeing what amazing stuff people are building with Qdrant and. Yeah, let's get into it.

Demetrios:
Yeah. So I think I see Sabrina's wearing a special shirt which is don't get lost in vector space shirt. If anybody wants a shirt like that. There we go. Well, we got you covered, dude. You will get one at your front door soon enough. If anybody else wants one, come on here. Present at the next vector space talks.

Demetrios:
We're excited to have you. And we've got one last thing that I think is fun that we can talk about before we jump into the tech piece of the conversation. And that is I told Sabrina to get ready with some recommendations. Know vector databases, they can be used occasionally for recommendation systems, but nothing's better than getting that hidden gem from your friend. And right now what we're going to try and do is give you a few hidden gems so that the next time the recommendation engine is working for you, it's working in your favor. And Sabrina, I asked you to give me one music that you can recommend, one show and one rando. So basically one random thing that you can recommend to us.

Sabrina Aquino:
So I've picked. I thought about this. Okay, I give it some thought. The movie would be Catch Me If You Can by Leo DiCaprio and Tom Hanks. Have you guys watched it? Really good movie. The song would be oh, children by knee cave and the bad scenes. Also very good song. And the random recommendation is my favorite scented candle, which is citrus notes, sea salt and cedar.

Sabrina Aquino:
So there you go.

Demetrios:
A scented candle as a recommendation. I like it. I think that's cool. I didn't exactly tell you to get ready with that. So I'll go next, then you can have some more time to think. So for anybody that's joining in, we're just giving a few recommendations to help your own recommendation engines at home. And we're going to get into this conversation about rags in just a moment. But my song is with.

Demetrios:
Oh, my God. I've been listening to it because I didn't think that they had it on Spotify, but I found it this morning and I was so happy that they did. And it is Bill Evans and Chet Baker. Basically, their whole album, the legendary sessions, is just like, incredible. But the first song on that album is called Alone Together. And when Chet Baker starts playing his little trombone, my God, it is like you can feel emotion. You can touch it. That is what I would recommend.

Demetrios:
Anyone out there? I'll drop a link in the chat if you like it. The film or series. This fool, if you speak Spanish, it's even better. It is amazing series. Get that, do it. And as the rando thing, I've been having Rishi mushroom powder in my coffee in the mornings. I highly recommend it. All right, last one, let's get into your recommendations and then we'll get into this rag chat.

Guillaume Marquis:
So, yeah, I sucked a little bit. So for the song, I think I will give something like, because I'm french, I think you can hear it. So I will choose Get Lucky of Daft Punk and because I am a little bit sad of the end of their collaboration. So, yeah, just like, I cannot forget it. And it's a really good music. Like, miss them as a movie, maybe something like I really enjoy. So we have a lot of french movies that are really nice, but something more international maybe, and more mainstream. Jungle of Tarantino, that is really a good movie and really enjoy it.

Guillaume Marquis:
I watched it several times and still a good movie to watch. And random thing, maybe a city. A city to go to visit. I really enjoyed. It's hard to choose. Really hard to choose a place in general. Okay, Florence, like in Italy.

Demetrios:
There we go.

Guillaume Marquis:
Yeah, it's a really cool city to go. So if you have time, and even Sabrina, if you went to Europe soon, it's really a nice place to go.

Demetrios:
That is true. Sabrina is going to Europe soon. We're blowing up her spot right now. So hopefully Florence is on the list. I know that most people watching did not tune in to hearing the three of us just randomly give recommendations. We are here to talk more about retrieval augmented generation. But hopefully those recommendations help some of you all at home with your recommendation engines. And you're maybe using a little bit of a vector database in your recommendation engine building skills.

Demetrios:
Let's talk about this, though, man, because I think it would be nice if you can set the scene. What exactly are you working on? I know you've got virtual brain. Can you tell us a little bit about that so that we can know how you're doing rags?

Guillaume Marquis:
Because rag is like, I think the most famous word in the AI sphere at the moment. So, virtual brain, what we are building in particular is that we are building an AI assistant for knowledge workers. So we are not only building this next gen search bar to search content through documents, it's a tool for enterprises at enterprise grade that provide some easy way to interact with your knowledge. So basically, we create a tool that we connect to the world knowledge of the company. It could be whatever, like the drives, sharepoints, whatever knowledge you have, any kind of documents, and with that you will be able to perform tasks on your knowledge, such as like audit, RFP, due diligence. It's not only like everyone that is building rag or building a kind of search system through rag are always giving the same number. Is that like 20%? As a knowledge worker, you spend 20% of your time by searching information. And I think I heard this number so much time, and that's true, but it's not enough.

Guillaume Marquis:
Like the search bar, a lot of companies, like many companies, are working on how to search stuff for a long time, and it's always a subject. But the real pain and what we want to handle and what we are handling is deep work, is real tasks, is how to help these workers, to really help them as an assistant, not only on search bar, like as an assistant on real task, real added value tasks. So inside that, can you give us.

Demetrios:
An example of that? Is it like that? It pops up when it sees me working on notion and talking about or creating a PRD, and then it says, oh, this might be useful for your PRD because you were searching about that a week ago or whatever.

Guillaume Marquis:
For instance. So we are working with companies that have from 100 employees to several thousand employees. For instance, when you have to create a commercial proposal as a salesperson in a company, you have an history with a company, an history in this ecosystem, a history within this environment, and you have to capitalize on all this commercial proposition that you did in the past in your company, you can have thousands of propositions, you can have thousands of documents, you can have reporting from different departments, depending of the industry you are working on, and with that, with the tool. So you can ask question, you can capitalize on this document, and you can easily create new proposal by asking question, by interacting with the tool, to go deeply in this use case and to create something that is really relevant for your new use case. And that is using really the knowledge that you have in your company. And so it's not only like retrieve or just like find me as last proposition of this client. It's more like, okay, use x past proposals to create a new one. And that's a real challenge that is linked to our subject.

Guillaume Marquis:
It's because it's not only like retrieve one, two or even ten documents, it's about retrieving like hundred, 200, a lot of documents, a lot of information, and you have a real something to do with a lot of documents, a lot of context, a lot of information you have to manage.

Demetrios:
I have the million dollar question that I think is probably coming through everyone's head is like, you're retrieving so many documents, how are you evaluating your retrieval?

Guillaume Marquis:
That's definitely the $1 million question. It's a toss task to do, to be honest. To be fair. Currently what we are doing is that we monitor every tasks of the process, so we have the output of every tasks. On each tasks we use a scoring system to evaluate if it's relevant to the initial question or the initial task of the user. And we have a global scoring system on all the system. So it's quite odd, it's a little bit empiric, but it works for now. And it really help us to also improve over time all the tasks and all the processes that are done by the tool.

Guillaume Marquis:
So it's really important. And for instance, you have this kind of framework that is called RAGtriad. That is a way to evaluate rag on the accuracy of the context you retrieve on the link with the initial question and so on, several parameters. And you can really have a first way to evaluate the quality of answers and the quality of everything on each steps.

Sabrina Aquino:
I love it. Can you go more into the tech that you use for each one of these steps in architecture?

Guillaume Marquis:
So the process is quite like, it starts at the moment we ingest documents because basically it's hard to retrieve good documents or retrieve documents in a proper way if you don't parse it well. If you just like the dumb rug, as I call it, is like, okay, you take a document, you divide it in text, and that's it. But you will definitely lose the context, the global context of the document, what the document in general is talking about. And you really need to do it properly and to keep this context. And that's a real challenge, because if you keep some noises, if you don't do that well, everything will be broken at the end. So technically how it works. So we have a proper system that we developed to ingest documents using technologies, open source technologies. We only exclusively use open source tools because of security aspects and stuff like that.

Guillaume Marquis:
That's why also we are using Qdrant one of the important point on that. So we have a system, we are using this serverless stuff to ingest document over time. We have also models that create tags on documents. So we use open source slms to tag documents, to enrich documents, also to create a new title, to create a summary of documents, to keep the context. When we divide the document, we keep the title of paragraphers, the context inside paragraphers, and we leak every piece of text between each other to keep the context after that, when we retrieve the document. So it's like the retrieving part. We have a new breed search system. We are using Qdrant on the semantic port.

Guillaume Marquis:
So basically we are creating unbelieving, we are storing it into Qdrant. We are performing similarity search to retrieve documents based on title summary filtering, on tags, on the semantic context. And we have also some keyword search, but it's more for specific tasks, like when we know that we need a specific document, at some point we are searching it with a keyword search. So it's like a kind of ebrid system that is using deterministic approach with filtering with tags, and a probabilistic approach with selecting document with this ebot search, and doing a scoring system after that to get what is the most relevant document and to select how much content we will take from each document. It's a little bit techy, but it's really cool to create and we have a way to evolve it and to improve it.

Demetrios:
That's what we like around here, man. We want the techie stuff. That's what I think everybody signed up for. So that's very cool. One question that definitely comes up a lot when it comes to rags and when you're ingesting documents, and then when you're retrieving documents and updating documents, how do you make sure that the documents that you are, let's say, I know there's probably a hypothetical HR scenario where the company has a certain policy and they say you can have European style holidays, you get like three months of holidays a year, or even French style holidays. Basically, you just don't work. And whenever you want, you can work, you don't work. And then all of a sudden a US company comes and takes it over and they say, no, you guys don't get holidays.

Demetrios:
Even when you do get holidays, you're not working or you are working and so you have to update all the HR documents, right? So now when you have this knowledge worker that is creating something, or when you have anyone that is getting help, like this copilot help, how do you make sure that the information that person is getting is the most up to date information possible?

Guillaume Marquis:
That's a new $1 million question.

Demetrios:
I'm coming with the hits today. I don't know what you were looking for.

Guillaume Marquis:
That's a really good question. So basically you have several possibilities on that. First one you have like this PowerPoint presentation. That's a mess in the knowledge bases and sometimes you just want to use the most updated up to date documents. So basically we can filter on the created ad and the date of the documents. Sometimes you want to also compare the evolution of the process over time. So that's another use case. Basically we base.

Guillaume Marquis:
So during the ingestion we are analyzing if date is inside the document, because sometimes in documentation you have like the date at the end of the document or at the beginning of the document. That's a first way to do it. We have the date of the creation of the document, but it's not a source of truth because sometimes you created it after or you duplicated it and the date is not the same, depending if you are working on Windows, Microsoft, stuff like that. It's definitely a mess. And also we compare documents. So when we retry the documents and documents are really similar one to each other, we keep it in mind and we try to give more information as possible. Sometimes it's not possible, so it's not 100%, it's not bulletproof, but it's a real question of that. So it's a partial answer of your question, but it's like some way we are today filtering and answering on this special topic.

Sabrina Aquino:
Now I wonder what was the most challenging part of building this frag since there was like.

Guillaume Marquis:
There are a lot of parts that are really challenging.

Sabrina Aquino:
Challenging.

Guillaume Marquis:
One of the challenging part was the scalability of the system. We have clients that come with terra octave of data and want to be parsed really fast and so you have the ingestion, but even after the semantic search, even on a large data set can be slow. And today Chat GPT answer really fast. So your users, even if the question is way more complicated to answer than a basic Chat GPT question, they want to have their answer in seconds. So you have also this challenge that is really you have to take care. So it's quite challenging and it's like this industrial supply chain. So when you upgrade something, you have to be sure that everything is working well on the other side. And that's a real challenge to handle.

Guillaume Marquis:
And we are still on it because we are still evolving and getting more data. And at the end of the day, you have to be sure that everything is working well in terms of LLM, but in terms of research and in terms also a few weeks to give some insight to the user of what is working under the hood, to give them the possibility to wait a few seconds more, but starting to give them pieces of answer.

Demetrios:
Yeah, it's funny you say that because I remember talking to somebody that was working at you.com and they were saying how there's like the actual time. So they were calling it something like perceived time and real, like actual time. So you as an end user, if you get asked a question or maybe there's like a trivia quiz while the question is coming up, then it seems like it's not actually taking as long as it is. Even if it takes 5 seconds, it's a little bit cooler. Or as you were mentioning, I remember reading some paper, I think, on how people are a lot less anxious if they see the words starting to pop up like that and they see like, okay, it's not just I'm waiting and then the whole answer gets spit back out at me. It's like I see the answer forming as it is in real time. And so that can calm people's nerves too.

Guillaume Marquis:
Yeah, definitely. Human's brain is like marvelous on that. And you have a lot of stuff. Like, one of my favorites is the illusion of work. Do you know it? It's the total opposite. If you have something that seems difficult to do, adding more time of processing. So the user will imagine that it's really an OD task to do. And so that's really funny.

Demetrios:
So funny like that.

Guillaume Marquis:
Yeah. Yes. It's the opposite of what you will think if you create a product, but that's real stuff. And sometimes just to output them that you are performing toss tasks in the background, it helps them to. Oh, yes. My question was really like a complex question, like you have a lot of work to do. It's Axe word like. If you answer too fast, they will not trust the answer.

Guillaume Marquis:
And it's the opposite if you answer too slow. You can have this. Okay. But it should be dumb because it's really slow. So it's a dumb AI or stuff like that. So that's really funny. My co founder actually was a product guy, so really focused on product, and he really loves this kind of stuff.

Demetrios:
Great thought experiment, that's interesting.

Sabrina Aquino:
And you mentioned like you chose Qdrant because it's open source, but now I wonder if there's also something to do with your need for something that's fast, that's scalable, and what other factors you took in consideration when choosing the vector DB.

Guillaume Marquis:
Yes, so I told you that the scalability and the speed is like one of the most important points and toast part to endure. And yes, definitely, because when you are building a complex rag, you are not like just performing one research, at some points you are doing it maybe like you are splitting the question, doing several at the same time. And so it's like mandatory to have a vector database that is scalable, that is fast, that has low latencies, that can under parallel request a large amount of requests. So you have really this need. And Qdrant was like an obvious choose. Actually, we did a benchmark, so we really tried several possibilities.

Demetrios:
Some tell me more. Yeah.

Guillaume Marquis:
So we tried the classic postgres page vectors, that is, I think we tried it like 30 minutes, and we realized really fast that it was really not good for our use case. We tried Weaviate, we tried Milvus, we tried Qdrant, we tried a lot. We prefer use open source because of security issues. We tried Pinecone initially, we were on Pinecone at the beginning of the company. And so the most important point, so we have the speed of the tool, we have the scalability we have also, maybe it's a little bit dumb to say that, but we have also the API. I remember using Pinecone and trying just to get all vectors and it was not possible somehow, and you have this dumb stuff that are sometimes really strange. And if you have a tool that is 100% made for your use case with people that are working on it, really dedicated on that, and that are aligned with your vision of what is the evolution of this. I think it's like the best tool you have to choose.

Demetrios:
So one thing that I would love to hear about too, is when you're looking at your system and you're looking at just the product in general, what are some of the key metrics that you are constantly monitoring, and how do you know that you're hitting them or you're not? And then if you're not hitting them, what are some ways that you debug the situation?

Guillaume Marquis:
By metrics you mean like usage metrics.

Demetrios:
Or like, I'm more thinking on your whole tech setup and the quality of your rag.

Guillaume Marquis:
Basically we are focused on industry of knowledge workers and industry in particular like of consultants. So we have some data set of questions that we know should be answered. Well, we know the kind of outputs we should have. The metrics we are like monitoring on our rag is mostly the accuracy of the answer, the accuracy of sources, the number of hallucination that is sometimes really also hard to manage. Actually our tool is sourcing everything. When you ask a question or when you perform a task, it gives you all the sources. But sometimes you can have a perfect answer and just like one number inside your answer that comes from nowhere, that is totally like invented and that's up to get. We are still working on that.

Guillaume Marquis:
We are not the most advanced on this part. We just implemented a tool I think you may know it's LangFuse. Do you know them? LangFuse?

Demetrios:
No. Tell me more.

Guillaume Marquis:
LangFuse is like a tool that is made to monitor tasks on your rack so you can easily log stuff. It's also open source tool, you can easily self host it and you can monitor every part of your rag. You can create data sets based on questions and answers that has been asked or some you created by yourself. And you can easily perform like check of your rag just to trade out and to give a final score of it, and to be able to monitor everything and to give global score based on your data set of your rag. So we are currently implementing it. I give their name because it's wonderful the work they did, and I really enjoyed it. It's one of the most important points to not be blind. I mean, in general, in terms of business, you have to follow metrics.

Guillaume Marquis:
Numbers cannot lie. Humans lies, but not numbers. But after that you have to interpret numbers. So that's also another toss part. But it's important to have the good metrics and to be able to know if you are evolving it, if you are improving your system and if everything is working. Basically the different stuff we are doing, we are not like.

Demetrios:
Are you collecting human feedback? For the hallucinations part, we try, but.

Guillaume Marquis:
Humans are not like giving a lot of feedback.

Demetrios:
It's hard. That's why it's really hard the end user to do anything, even just like the thumbs up, thumbs down can be difficult.

Guillaume Marquis:
We tried several stuff. We have the thumbs up, thumbs down, we tried stars. You ask real feedback to write something, hey, please help us. Human feedback is quite poor, so we are not counting on that.

Demetrios:
I think the hard part about it, at least me as an end user, whenever I've been using these, is like the thumbs down or the, I've even seen it go as far as, like, you have more than just one emoji. Like, maybe you have the thumbs up, you have the thumbs down. You have, like, a mushroom emoji. So it's, like, hallucinated. And you have, like.

Guillaume Marquis:
What was the.

Demetrios:
Other one that I saw that I thought was pretty? I can't remember it right now, but.

Guillaume Marquis:
I never saw the mushroom. But that's quite fun.

Demetrios:
Yeah, it's good. It's not just wrong. It's absolutely, like, way off the mark. And what I think is interesting there when I've been the end user is that it's a little bit just like, I don't have time to explain the nuances as to why this is not useful. I really would have to sit down and almost, like, write a book or at least an essay on, yeah, this is kind of useful, but it's like a two out of a five, not a four out of a five. And so that's why I gave it the thumbs down. Or there was this part that is good and that part's bad. And so it's just like the ways that you have to, or the nuances that you have to go into as the end user when you're trying to evaluate it, I think it's much better.

Demetrios:
And what I've seen a lot of people do is just expect to do that in house. After the fact, you get all the information back, you see, on certain metrics, like, oh, did this person commit the code? Then that's a good signal that it's useful. But then you can also look at it, or did this person copy paste it? Et cetera, et cetera. And how can we see if they didn't copy paste that or if they didn't take that next action that we would expect them to take? Why not? And let's try and dig into what we can do to make that better.

Guillaume Marquis:
Yes. We can also evaluate the next questions, like the following questions. That's a great point. We are not currently doing it automatically, but if you see that a user just answer, no, it's not true, or you should rephrase it or be more concise, or these kind of following questions, you know that the first answer was not as relevant as.

Demetrios:
That's such a great point. Or you do some sentiment analysis and it slowly is getting more and more angry.

Guillaume Marquis:
Yeah, that's true. That's a good point also.

Demetrios:
Yeah, this one went downhill, so. All right, cool. I think that's it. Sabrina, any last questions from your side?

Sabrina Aquino:
Yeah, I think I'm just very interesting to know from a user perspective, from a virtual brain, how are traditional models worse or what kind of errors virtual brain fixes in their structure, that users find it better that way.

Guillaume Marquis:
I think in this particular, so we talked about hallucinations, I think it's like one of the main issues people have on classic elements. We really think that when you create a one size fit all tool, you have some chole because you have to manage different approaches, like when you are creating copilot as Microsoft, you have to under the use cases of, and I really think so. Our AI is not trained to write you a speech based on Shakespeare and with the style of Martin Luther King. It's not the purpose of the tool. So if you ask something that is out of the box, he will just say like, okay, I don't know how to answer that. And that's an important point. That's a feature by itself to be able to not go outside of the box. And so we did this choice of putting the AI inside the box, the box that is containing basically all the knowledge of your company, all the retrieved knowledge.

Guillaume Marquis:
Actually we do not have a lot of hallucination, I will not say like 0%, but it's close to zero. Because we analyze a question, we put the AI in a box, we enforce the AI to think about the answer before answering, and we analyze also the answer to know if the answer is relevant. And that's an important point that we are fixing and we fix for our user and we prefer yes, to give like non answers and a bad answer.

Sabrina Aquino:
Absolutely. And there are people who think like, hey, this is a rag, it's not going to hallucinate, and that's not the case at all. It will hallucinate less inside a certain context window that you provide. Right. But it still has a possibility. So minimizing that as much as possible is very valuable.

Demetrios:
So good. Well, I think with that, our time here is coming to an end. I really appreciate this. I encourage everyone to go and have a little look at virtual brain. We'll drop a link in the comment in case anyone wants free to sign up.

Guillaume Marquis:
So you can trade for free.

Demetrios:
Even better. Look at that, Christmas came early. Well, let's go have some fun, play around with it. And I can't promise, but I may give you some feedback, I may give you some [evaluation](https://qdrant.tech/rag/rag-evaluation-guide/) metrics if it's hallucinating.

Guillaume Marquis:
Or what if I see some thumbs up or thumbs down, I will know that it's you.

Demetrios:
Yeah, cool. Exactly. All right, folks, that's about it for today. We will see you all later. As a reminder, don't get lost in vector space. This has been another vector space talks. And if you want to come on here and chat with us, feel free to reach out. See ya.

Guillaume Marquis:
Cool.

Sabrina Aquino:
See you guys. Thank you. Bye.
