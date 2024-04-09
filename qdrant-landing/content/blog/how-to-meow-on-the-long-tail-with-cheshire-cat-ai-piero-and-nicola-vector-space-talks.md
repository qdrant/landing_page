---
draft: false
title: How to meow on the long tail with Cheshire Cat AI? - Piero and Nicola |
  Vector Space Talks
slug: meow-with-cheshire-cat
short_description: Piero Savastano and Nicola Procopio discusses the ins and
  outs of Cheshire Cat AI.
description: Cheshire Cat AI's Piero Savastano and Nicola Procopio discusses the
  framework's vector space complexities, community growth, and future
  cloud-based expansions.
preview_image: /blog/from_cms/piero-and-nicola-bp-cropped.png
date: 2024-04-09T19:00:00.000Z
author: Demetrios Brinkmann
featured: false
tags:
  - LLM
  - Qdrant
  - Cheshire Cat AI
  - Vector Search
  - Vector database
---
> *"We love Qdrant! It is our default DB. We support it in three different forms, file based, container based, and cloud based as well.”*\
— Piero Savastano
> 

Piero Savastano is the Founder and Maintainer of the open-source project, Cheshire Cat AI. He started in Deep Learning pure research. He wrote his first neural network from scratch at the age of 19. After a period as a researcher at La Sapienza and CNR, he provides international consulting, training, and mentoring services in the field of machine and deep learning. He spreads Artificial Intelligence awareness on YouTube and TikTok.

> *"Another feature is the quantization because with this Qdrant feature we improve the accuracy at the performance. We use the scalar quantitation because we are model agnostic and other quantitation like the binary quantitation.”*\
— Nicola Procopio
> 

Nicola Procopio has more than 10 years of experience in data science and has worked in different sectors and markets from Telco to Healthcare. At the moment he works in the Media market, specifically on semantic search, vector spaces, and LLM applications. He has worked in the R&D area on data science projects and he has been and is currently a contributor to some open-source projects like Cheshire Cat. He is the author of popular science articles about data science on specialized blogs.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/2d58Xui99QaUyXclIE1uuH?si=68c5f1ae6073472f), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/K40DIG9ZzAU?feature=shared).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/K40DIG9ZzAU?si=rK0EVXmvNJ5OSZa4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/How-to-meow-on-the-long-tail-with-Cheshire-Cat-AI----Piero-and-Nicola--Vector-Space-Talks-018-e2h7k59/a-ab31teu" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Did you know that companies across Italy, Germany, and the USA are already harnessing the power of Cheshire Cat for a variety of nifty purposes? It's not just a pretty face; it's evolved from a simple tutorial to an influential framework!

It’s time to learn how to meow! Piero in this episode of Vector Space Talks discusses the community and open-source nature that contributes to the framework's success and expansion while Nicola reveals the Cheshire Cat’s use of Qdrant and quantization to enhance search accuracy and performance in a hybrid mode.

Here are the highlights from this episode:

1. **The Art of Embedding:** Discover how Cheshire Cat uses collections with an embedder, fine-tuning them through scalar quantization and other methods to enhance accuracy and performance.
2. **Vectors in Harmony:** Get the lowdown on storing quantized vectors in a hybrid mode – it's all about saving memory without compromising on speed.
3. **Memory Matters:** Scoop on managing different types of memory within Qdrant, the go-to vector DB for Cheshire Cat.
4. **Community Chronicles:** Talking about the growing community that's shaping the evolution of Cheshire Cat - from enthusiasts to core contributors!
5. **Looking Ahead:** They've got grand plans brewing for a cloud version of Cheshire Cat. Imagine a marketplace buzzing with user-generated plugins. This is the future they're painting!

> Fun Fact: The Cheshire Cat community on Discord plays a crucial role in the development and user support of the framework, described humorously by Piero as "a mess" due to its large and active nature.
> 

## Show notes:

00:00 Powerful open source framework.\
06:11 Tutorials, code customization, conversational forms, community challenges.\
09:09 Exploring Qdrant's memory features.\
13:02 Qdrant experiments with document quantization.\
17:52 Explore details, export, and memories.\
20:42 Addressing challenges in ensuring Cheshire Cat's reliability.\
23:36 Leveraging cool features presents significant challenges.\
27:06 Plugin-based approach distinguishes the CAT framework.\
29:28 Wrap up

## More Quotes from Piero and Nicola:

*"We have a little partnership going on with Qdrant because the native DB in this framework is Qdrant.”*\
— Piero Savastano

*"We explore the feature, the Qdrant aliases feature, and we call this topic the drunken cut effect because if we have several embedders, for example two model, two embedders with the same dimension, we can put in the collection in the episodic or declarative collection factors from two different embeddings with the same dimension. But the points are different for the same sentences and for the cat is like for the human, when he mixes drinks he has a big headache and don't understand what it retrieved.”*\
— Nicola Procopio

*"It's a classic language model assistant chat we have for each message you have explainability, you can upload documents. This is all handled automatically and we start with new stuff. You have a memory page where you can search through the memories of your cat, delete, explore collections, collection from Qdrant.”*\
— Piero Savastano

*"Because I'm a researcher, a data scientist, I like to play with strange features like binary quantization, but we need to maintain the focus on the user needs, on the user behavior.”*\
— Nicola Procopio

## Transcript:
Demetrios:
What is up, good people of the Internet? We are here for another one of these vector space talks and I've got to say it's a special day. We've got the folks from Cheshire Cat coming at you full on today and I want to get it started right away because I know they got a lot to talk about. And today we get a two for one discount. It's going to be nothing like you have experienced before. Or maybe those are big words. I'm setting them up huge. We've got Piero coming at us live. Where you at, Piero? Piero, founder.

Demetrios:
There he is, founder at Cheshire Cat. And you are joined today by Nicola, one of the core contributors. It's great to have you both very excited. So you guys are going to be talking to us all about what you poetically put how to meow on the long tail with Cheshire Cat. And so I know you've got some slides prepared. I know you've got all that fun stuff working right now and I'm going to let you hop right into it so we don't waste any time. You ready? Who wants to share their screen first? Is it you, Nicola, or go?

Piero Savastano:
I'll go. Thanks.

Demetrios:
Here we go. Man, you should be seeing it right now.

Piero Savastano:
Yes.

Demetrios:
Boom.

Piero Savastano:
Let's go. Thank you, Demetrios. We're happy to be hosted at the vector space talk. Let's talk about the Cheshire Cat AI. This is an open source framework. We have a little partnership going on with Qdrant because the native DB in this framework is Qdrant. It's a python framework. And before starting to get into the details, I'm going to show you a little video.

Piero Savastano:
This is the website. So you see, it's a classic language model assistant chat we have for each message you have explainability, you can upload documents. This is all handled automatically and we start with new stuff. You have a memory page where you can search through the memories of your cat, delete, explore collections, collection from Qdrant. We have a plugin system and you can publish any plugin. You can sell your plugin. There is a big ecosystem already and we also give explanation on memories. We have adapters for the most common language models.

Piero Savastano:
Dark team, you can do a lot of stuff with the framework. This is how it presents itself. We have a blog with tutorials, but going back to our numbers, it is open source, GPL licensed. We have some good numbers. We are mostly active in Italy and in a good part of Europe, East Europe, and also a little bit of our communities in the United States. There are a lot of contributors already and our docker image has been downloaded quite a few times, so it's really easy to start up and running because you just docker run and you're good to go. We have also a discord server with thousands of members. If you want to join us, it's going to be fun.

Piero Savastano:
We like meme, we like to build culture around code, so it is not just the code, these are the main components of the cat. You have a chat as usual. The rabbit hole is our module dedicated to document ingestion. You can extend all of these parts. We have an agent manager. Meddetter is the module to manage plugins. We have a vectordb which is Qdrant natively, by the way. We use both the file based Qdrant, the container version, and also we support the cloud version.

Piero Savastano:
So if you are using Qdrant, we support the whole stack. Right now with the framework we have an embedder and a large language model coming to the embedder and language models. You can use any language model or embedded you want, closed source API, open Ollama, self hosted anything. These are the main features. So the first feature of the cat is that he's ready to fight. It is already dogsized. It's model agnostic. One command in the terminal and you can meow.

Piero Savastano:
The other aspect is that there is not only a retrieval augmented generation system, but there is also an action agent. This is all customizable. You can plug in any script you want as an agent, or you can customize the ready default presence default agent. And one of our specialty is that we do retrieve augmented generation, not only on documents as everybody's doing, but we do also augmented generation over conversations. I can hear your keyboard. We do augmented generation over conversations and over procedures. So also our tools and form conversational forms are embedded into the DB. We have a big plugin system.

Piero Savastano:
It's really easy to use and with different primitives. We have hooks which are events, WordPress style events. We have tools, function calling, and also we just build up a spec for conversational forms. So you can use your assistant to order a pizza, for example, multitool conversation and order a pizza, book a flight. You can do operative stuff. I already told you, and I repeat a little, not just a runner, but it's a full fledged framework. So we built this not to use language model, but to build applications on top of language models. There is a big documentation where all the events are described.

Piero Savastano:
You find tutorials and with a few lines of code you can change the prompt. You can use long chain inspired tools, and also, and this is the big part we just built, you can use conversational forms. We launched directly on GitHub and in our discord a pizza challenge, where we challenged our community members to build up prototypes to support a multi turn conversational pizza order. And the result of this challenge is this spec where you define a pedantic model in Python and then you subclass the pizza form, the cut form from the framework, and you can give examples on utterances that triggers the form, stops the forms, and you can customize the submit function and any other function related to the form. So with a simple subclass you can handle pragmatic, operational, multi turn conversations. And I truly believe we are among the first in the world to build such a spec. We have a lot of plugins. Many are built from the community itself.

Piero Savastano:
Many people is already hosting private plugins. There is a little marketplace independent about plugins. All of these plugins are open source. There are many ways to customize the cat. The big advantage here is no vendor lock in. So since the framework is open and the plugin system can be open, you do not need to pass censorship from big tech giants. This is one of the best key points of moving the framework along the open source values for the future. We plan to add the multimodality.

Piero Savastano:
At the moment we are text only, but there are plugins to generate images. But we want to have images and sounds natively into the framework. We already accomplished the conversational forms. In a later talk we can speak in more detail about this because it's really cool and we want to integrate a knowledge graph into the framework so we can play with both symbolic vector representations and symbolic network ones like linked data, for example wikidata. This stuff is going to be really interesting within. Yes, we love the Qdrant. It is our default DB. We support it in three different forms, file based, container based, and cloud based also.

Piero Savastano:
But from now on I want to give word to Nicola, which is way more expert on this vector search topic and he wrote most of the part related to the DB. So thank you guys. Nicola to you.

Nicola Procopio:
Thanks Piero. Thanks Demetrios. I'm so proud to be hosted here because I'm a vector space talks fan. Okay, Qdrant is the vector DB of the cat and now I will try to explore the feature that we use on Cheshire Cat. The first slide, explain the cut's memory. Because Qdrant is our memory. We have a long term memory in three parts. The episodic memory when we store and manage the conversation, the chart, the declarative memory when we store and manage documents and the procedural memory when we store and manage the tools how to manage three memories with several embedder because the user can choose his fabric embedder and change it.

Nicola Procopio:
We explore the feature, the Qdrant aliases feature, and we call this topic the drunken cut effect because if we have several embedders, for example two model, two embedders with the same dimension, we can put in the collection in the episodic or declarative collection factors from two different embeddings with the same dimension. But the points are different for the same sentences and for the cat is like for the human, when he mixes drinks he has a big headache and don't understand what it retrieved. To us the flow now is this. We create the collection with the name and we use the aliases to.

Piero Savastano:
Label.

Nicola Procopio:
This collection with the name of the embedder used. When the user changed the embedder, we check if the embedder has the same dimension. If has the same dimension, we check also the aliases. If the aliases is the same we don't change nothing. Otherwise we create another collection and this is the drunken cut effect. The first feature that we use in the cat. Another feature is the quantization because with this Qdrant feature we improve the accuracy at the performance. We use the scalar quantitation because we are model agnostic and other quantitation like the binary quantitation.

Nicola Procopio:
If you read on the Qdrant documents are experimented on not to all embedder but also for OpenAI and Coer. If I remember well with this discover quantitation and the scour quantization is used in the storage step. The vector are quantized and stored in a hybrid mode, the original vector on disk, the quantized vector in RAM and with this procedure we procedure we can use less memory. In case of Qdrant scalar quantization, the flat 32 elements is converted to int eight on a single number on a single element needs 75% less memory. In case of big embeddings like I don't know Gina embeddings or mistral embeddings with more than 1000 elements. This is big improvements. The second part is the retriever step. We use a quantizement query at the quantized vector to calculate causing similarity and we have the top n results like a simple semantic search pipeline.

Nicola Procopio:
But if we want a top end results in quantize mod, the quantity mod has less quality on the information and we use the oversampling. The oversampling is a simple multiplication. If we want top n with n ten with oversampling with a score like one five, we have 15 results, quantities results. When we have these 15 quantities results, we retrieve also the same 15 unquanted vectors. And on these unquanted vectors we rescale busset on the query and filter the best ten. This is an improvement because the retrieve step is so fast. Yes, because using these tip and tricks, the Cheshire capped vectors achieve up.

Piero Savastano:
Four.

Nicola Procopio:
Times lower memory footprint and two time performance increase. We are so fast using this Qdrant feature. And last but not least, we go in deep on the memory. This is the visualization that Piero showed before. This is the vector space in 2D we use Disney is very similar to the Qdrant cloud visualization. For the embeddings we have the search bar, how many vectors we want to retrieve. We can choose the memory and other filters. We can filter on the memory and we can wipe a memory or all memory and clean all our space.

Nicola Procopio:
We can go in deep using the details. We can pass on the dot and we have a bubble or use the detail, the detail and we have a list of first n results near our query for every memory. Last but not least, we can export and share our memory in two modes. The first is exporting the JSON using the export button from the UI. Or if you are very curious, you can navigate the folder in the project and share the long term memory folder with all the memories. Or the experimental feature is wake up the door mouse. This feature is simple, the download of Qdrant snapshots. This is experimental because the snapshot is very easy to download and we will work on faster methods to use it.

Nicola Procopio:
But now it works and sometimes us, some user use this feature for me is all and thank you.

Demetrios:
All right, excellent. So that is perfect timing. And I know there have been a few questions coming through in the chat, one from me. I think you already answered, Piero. But when we can have some pistachio gelato made from good old Cheshire cat.

Piero Savastano:
So the plan is make the cat order gelato from service from an API that can already be done. So we meet somewhere or at our house and gelato is going to come through the cat. The cat is able to take, each of us can do a different order, but to make the gelato itself, we're going to wait for more open source robotics to come to our way. And then we go also there.

Demetrios:
Then we do that, we can get the full program. How cool is that? Well, let's see, I'll give it another minute, let anyone from the chat ask any questions. This was really cool and I appreciate you all breaking down. Not only the space and what you're doing, but the different ways that you're using Qdrant and the challenges and the architecture behind it. I would love to know while people are typing in their questions, especially for you, Nicola, what have been some of the challenges that you've faced when you're dealing with just trying to get Cheshire Cat to be more reliable and be more able to execute with confidence?

Nicola Procopio:
The challenges are in particular to mix a lot of Qdrant feature with the user needs. Because I'm a researcher, a data scientist, I like to play with strange features like binary quantization, but we need to maintain the focus on the user needs, on the user behavior. And sometimes we cut some feature on the Cheshire cat because it's not important now for for the user and we can introduce some bug, or rather misunderstanding for the user.

Demetrios:
Can you hear me? Yeah. All right, good. Now I'm seeing a question come through in the chat that is asking if you are thinking about cloud version of the cat. Like a SaaS, it's going to come. It's in the works.

Piero Savastano:
It's in the works. Not only you can self host the cat freely, some people install it on a raspberry, so it's really lightweight. We plan to have an osted version and also a bigger plugin ecosystem with a little marketplace. Also user will be able to upload and maybe sell their plugins. So we want to build an know our vision is a WordPress style ecosystem.

Demetrios:
Very cool. Oh, that is awesome. So basically what I'm hearing from Nicola asking about some of the challenges are like, hey, there's some really cool features that we've got in Qdrant, but it's almost like you have to keep your eye on the prize and make sure that you're building for what people need and want instead of just using cool features because you can use cool features. And then Piero, you're saying, hey, we really want to enable people to be able to build more cool things and use all these cool different features and whatever flavors or tools they want to use. But we want to be that ecosystem creator so that anyone can bring and create an app on top of the ecosystem and then enable them to get paid also. So it's not just Cheshire cat getting paid, it's also the contributors that are creating cool stuff.

Piero Savastano:
Yeah. Community is the first protagonist without community. I'm going to tell you, the cat started as a tutorial. When chat GPT came out, I decided to do a little rug tutorial and I chose Qdrant as vector. I took OpenAI as a language model, and I built a little tutorial, and then from being a tutorial to show how to build an agent on GitHub, it completely went out of hand. So the whole framework is organically grown?

Demetrios:
Yeah, that's the best. That is really cool. Simone is asking if there's companies that are already using Cheshire cat, and if you can mention a few.

Piero Savastano:
Yeah, okay. In Italy, there are at least 1015 companies distributed along education, customer care, typical chatbot usage. Also, one of them in particular is trying to build for public administration, which is really hard to do on the international level. We are seeing something in Germany, like web agencies starting to use the cat a little on the USA. Mostly they are trying to build agents using the cat and Ollama as a runner. And a company in particular presented in a conference in Vegas a pitch about a 3d avatar. Inside the avatar, there is the cat as a linguistic device.

Demetrios:
Oh, nice.

Piero Savastano:
To be honest, we have a little problem tracking companies because we still have no telemetry. We decided to be no telemetry for the moment. So I hope companies will contribute and make themselves happen. If that does not, we're going to track a little more. But companies using the cat are at least in the 50, 60, 70.

Demetrios:
Yeah, nice. So if anybody out there is using the cat, and you have not talked to Piero yet, let him know so that he can have a good idea of what you're doing and how you're doing it. There's also another question coming through about the market analysis. Are there some competitors?

Piero Savastano:
There are many competitors. When you go down to what distinguishes the cat from many other frameworks that are coming out, we decided since the beginning to go for a plugin based operational agent. And at the moment, most frameworks are retrieval augmented generation frameworks. We have both retrieval augmented generation. We have tooling, we have forms. The tools and the forms are also embedded. So the cat can have 20,000 tools, because we also embed the tools and we make a recall over the function calling. So we scaled up both documents, conversation and tools, conversational forms, and I've not seen anybody doing that till now.

Piero Savastano:
So if you want to build an application, a pragmatic, operational application, to buy products, order pizza, do stuff, have a company assistant. The cat is really good at the moment.

Demetrios:
Excellent.

Nicola Procopio:
And the cat has a very big community on discord works.

Piero Savastano:
Our discord is a mess.

Demetrios:
You got the best memes around. If that doesn't make people join the discord, I don't know what will.

Piero Savastano:
Please, Nicola. Sorry for interrupting.

Demetrios:
No.

Nicola Procopio:
Okay. The community is a plus for Cheshire Cat because we have a lot of developer user on Discord, and for an open source project, the community is fundamentally 100%.

Demetrios:
Well fellas, this has been awesome. I really appreciate you coming on the vector space talks and sharing about the cat for anybody that is interested. Hopefully they go, they check it out, they join your community, they share some memes and they get involved, maybe even contribute back and create some tools. That would be awesome. So Piero and Nicola, I really appreciate your time. We'll see you all later.

Piero Savastano:
Thank you.

Nicola Procopio:
Thank you.

Demetrios:
And for anybody out there that wants to come on to the vector space talks and give us a bit of an update on how you're using Qdrant, we'd love to hear it. Just reach out and we'll schedule you in. Until next time. See y'all. Bye.
