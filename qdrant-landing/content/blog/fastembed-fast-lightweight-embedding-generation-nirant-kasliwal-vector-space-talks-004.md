---
draft: false
title: "FastEmbed: Fast & Lightweight Embedding Generation - Nirant Kasliwal |
  Vector Space Talks"
slug: vector-space-talk-embedding-models
short_description: Nirant Kasliwal, AI Engineer at Qdrant, discusses the power
  and potential of embedding models.
description: Nirant Kasliwal discusses the efficiency and optimization
  techniques of FastEmbed, a Python library designed for speedy, lightweight
  embedding generation in machine learning applications.
preview_image: /blog/from_cms/nirant-kasliwal.png
date: 2024-01-09T11:38:59.693Z
author: Demetrios Brinkmann
featured: true
tags:
  - Vector Space Talks
  - Quantized Emdedding Models
  - FastEmbed
---
> *"When things are actually similar or how we define similarity. They are close to each other and if they are not, they're far from each other. This is what a model or embedding model tries to do.”*\
>-- Nirant Kasliwal

Heard about FastEmbed? It's a game-changer. Nirant shares tricks on how to improve your embedding models. You might want to give it a shot!

Nirant Kasliwal, the creator and maintainer of FastEmbed, has made notable contributions to the Finetuning Cookbook at OpenAI Cookbook. His contributions extend to the field of Natural Language Processing (NLP), with over 5,000 copies of the NLP book sold.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/4QWCyu28SlURZfS2qCeGKf?si=GDHxoOSQQ_W_UVz4IzzC_A), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/e67jLAx_F2A).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/e67jLAx_F2A?si=533LvUwRKIt_qWWu" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe style="border-radius:12px" src="https://open.spotify.com/embed/episode/4QWCyu28SlURZfS2qCeGKf/video?utm_source=generator" width="496" height="279" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>

## **Top Takeaways:**

Nirant Kasliwal, AI Engineer at Qdrant joins us on Vector Space Talks to dive into FastEmbed, a lightning-quick method for generating embeddings.

In this episode, Nirant shares insights, tips, and innovative ways to enhance embedding generation.

5 Keys to Learning from the Episode:

1. Nirant introduces some hacker tricks for improving embedding models - you won't want to miss these!
2. Learn how quantized embedding models can enhance CPU performance.
3. Get an insight into future plans for GPU-friendly quantized models.
4. Understand how to select default models in Qdrant based on MTEB benchmark, and how to calibrate them for domain-specific tasks.
5. Find out how Fast Embed, a Python library created by Nirant, can solve common challenges in embedding creation and enhance the speed and efficiency of your workloads.

> Fun Fact: The largest header or adapter used in production is only about 400-500 KBs -- proof that bigger doesn't always mean better!
> 

## Show Notes:

00:00 Nirant discusses FastEmbed at Vector Space Talks.\
05:00 Tokens are expensive and slow in open air.\
08:40 FastEmbed is fast and lightweight.\
09:49 Supporting multimodal embedding is our plan.\
15:21 No findings. Enhancing model downloads and performance.\
16:59 Embed creation on your own compute, not cloud. Control and simplicity are prioritized.\
21:06 Qdrant is fast for embedding similarity search.\
24:07 Engineer's mindset: make informed guesses, set budgets.\
26:11 Optimize embeddings with questions and linear layers.\
29:55 Fast, cheap inference using mixed precision embeddings.

## More Quotes from Nirant:

*"There is the academic way of looking at and then there is the engineer way of looking at it, and then there is the hacker way of looking at it. And I will give you all these three answers in that order.”*\
-- Nirant Kasliwal

*"The engineer's mindset now tells you that the best way to build something is to make an informed guess about what workload or challenges you're going to foresee. Right. Like a civil engineer builds a bridge around how many cars they expect, they're obviously not going to build a bridge to carry a shipload, for instance, or a plane load, which are very different.”*\
-- Nirant Kasliwal

*"I think the more correct way to look at it is that we use the CPU better.”*\
-- Nirant Kasliwal

## Transcript:
Demetrios:
Welcome back, everyone, to another vector space talks. Today we've got my man Nirant coming to us talking about FastEmbed. For those, if this is your first time at our vector space talks, we like to showcase some of the cool stuff that the community in Qdrant is doing, the Qdrant community is doing. And we also like to show off some of the cool stuff that Qdrant itself is coming out with. And this is one of those times that we are showing off what Qdrant itself came out with with FastEmbed. And we've got my man Nirant around here somewhere. I am going to bring him on stage and I will welcome him by saying Nirant a little bit about his bio, we could say. So, Naran, what's going on, dude? Let me introduce you real fast before we get cracking.

Demetrios:
And you are a man that wears many hats. You're currently working on the Devrel team at Qdrant, right? I like that shirt that you got there. And you have worked with ML models and embeddings since 2017. That is wild. You are also the creator and maintainer of fast embed. So you're the perfect guy to talk to about this very topic that we are doing today. Now, if anyone has questions, feel free to throw them into the chat and I will ask Nirant as he's going through it. I will also take this moment to encourage anyone who is watching to come and join us in discord, if you are not already there for the Qdrant discord.

Demetrios:
And secondly, I will encourage you if you have something that you've been doing with Qdrant or in the vector database space, or in the AI application space and you want to show it off, we would love to have you talk at the vector space talks. So without further ado, Nirant, my man, I'm going to kick it over to you and I am going to start it off with what are the challenges with embedding creation today?

Nirant Kasliwal:
I think embedding creation has it's not a standalone problem, as you might first think like that's a first thought that it's a standalone problem. It's actually two problems. One is a classic compute that how do you take any media? So you can make embeddings from practically any form of media, text, images, video. In theory, you could make it from bunch of things. So I recently saw somebody use soup as a metaphor. So you can make soup from almost anything. So you can make embeddings from almost anything. Now, what do we want to do though? Embedding are ultimately a form of compression.

Nirant Kasliwal:
So now we want to make sure that the compression captures something of interest to us. In this case, we want to make sure that embeddings capture some form of meaning of, let's say, text or images. And when we do that, what does that capture mean? We want that when things are actually similar or whatever is our definition of similarity. They are close to each other and if they are not, they're far from each other. This is what a model or embedding model tries to do basically in this piece. The model itself is quite often trained and built in a way which retains its ability to learn new things. And you can separate similar embeddings faster and all of those. But when we actually use this in production, we don't need all of those capabilities, we don't need the train time capabilities.

Nirant Kasliwal:
And that means that all the extra compute and features and everything that you have stored for training time are wasted in production. So that's almost like saying that every time I have to speak to you I start over with hello, I'm Nirant and I'm a human being. It's extremely infuriating but we do this all the time with embedding and that is what fast embed primarily tries to fix. We say embeddings from the lens of production and we say that how can we make a Python library which is built for speed, efficiency and accuracy? Those are the core ethos in that sense. And I think people really find this relatable as a problem area. So you can see this on our GitHub issues. For instance, somebody says that oh yeah, we actually does what it says and yes, that's a good thing. So for 8 million tokens we took about 3 hours on a MacBook Pro M one while some other Olama embedding took over two days.

Nirant Kasliwal:
You can expect what 8 million tokens would cost on open air and how slow it would be given that they frequently rate limit you. So for context, we made a 1 million embedding set which was a little more than it was a lot more than 1 million tokens and that took us several hundred of us. It was not expensive, but it was very slow. So as a batch process, if you want to embed a large data set, it's very slow. I think the more colorful version of this somebody wrote on LinkedIn, Prithvira wrote on LinkedIn that your embeddings will go and I love that idea that we have optimized speed so that it just goes fast. That's the idea. So what do we I mean let's put names to these things, right? So one is we want it to be fast and light. And I'll explain what do we mean by light? We want recall to be fast, right? I mean, that's what we started with that what are embedding we want to be make sure that similar things are similar.

Nirant Kasliwal:
That's what we call recall. We often confuse this with accuracy but in retrieval sense we'll call it recall. We want to make sure it's still easy to use, right? Like there is no reason for this to get complicated. And we are fast, I mean we are very fast. And part of that is let's say we use BGE small En, the English model only. And let's say this is all in tokens per second and the token is model specific. So for instance, the way BGE would count a token might be different from how OpenAI might count a token because the tokenizers are slightly different and they have been trained on slightly different corporates. So that's the idea.

Nirant Kasliwal:
I would love you to try this so that I can actually brag about you trying it.

Demetrios:
What was the fine print on that slide? Benchmarks are my second most liked way to brag. What's your first most liked way to brag?

Nirant Kasliwal:
The best way is that when somebody tells me that they're using it.

Demetrios:
There we go. So I guess that's an easy way to get people to try and use it.

Nirant Kasliwal:
Yeah, I would love it if you try it. Tell us how it went for you, where it's working, where it's broken, all of that. I love it if you report issue then say I will even appreciate it if you yell at me because that means you're not ignoring me.

Demetrios:
That's it. There we go. Bug reports are good to throw off your mojo. Keep it rolling.

Nirant Kasliwal:
So we said fast and light. So what does light mean? So you will see a lot of these Embedding servers have really large image sizes. When I say image, I mean typically or docker image that can typically go to a few GPS. For instance, in case of sentence transformers, which somebody's checked out with Transformers the package and PyTorch, you get a docker image of roughly five GB. The Ram consumption is not that high by the way. Right. The size is quite large and of that the model is just 400 MB. So your dependencies are very large.

Nirant Kasliwal:
And every time you do this on, let's say an AWS Lambda, or let's say if you want to do horizontal scaling, your cold start times can go in several minutes. That is very slow and very inefficient if you are working in a workload which is very spiky. And if you were to think about it, people have more queries than, let's say your corpus quite often. So for instance, let's say you are in customer support for an ecommerce food delivery app. Bulk of your order volume will be around lunch and dinner timing. So that's a very spiky load. Similarly, ecommerce companies, which are even in fashion quite often see that people check in on their orders every evening and for instance when they leave from office or when they get home. And that's another spike.

Nirant Kasliwal:
So whenever you have a spiky load, you want to be able to scale horizontally and you want to be able to do it fast. And that speed comes from being able to be light. And that is why Fast Embed is very light. So you will see here that we call out that Fast Embed is just half a GB versus five GB. So on the extreme cases, this could be a ten x difference in your docker, image sizes and even Ram consumptions recall how good or bad are these embeddings? Right? So we said we are making them fast but do we sacrifice how much performance do we trade off for that? So we did a cosine similarity test with our default embeddings which was VG small en initially and now 1.5 and they're pretty robust. We don't sacrifice a lot of performance. Everyone with me? I need some audio to you.

Demetrios:
I'm totally with you. There is a question that came through the chat if this is the moment to ask it.

Nirant Kasliwal:
Yes, please go for it.

Demetrios:
All right it's from a little bit back like a few slides ago. So I'm just warning you. Are there any plans to support audio or image sources in fast embed?

Nirant Kasliwal:
If there is a request for that we do have a plan to support multimodal embedding. We would love to do that. If there's specific model within those, let's say you want Clip or Seglip or a specific audio model, please mention that either on that discord or our GitHub so that we can plan accordingly. So yeah, that's the idea. We need specific suggestions so that we keep adding it. We don't want to have too many models because then that creates confusion for our end users and that is why we take opinated stance and that is actually a good segue. Why do we prioritize that? We want this package to be easy to use so we're always going to try and make the best default choice for you. So this is a very Linux way of saying that we do one thing and we try to do that one thing really well.

Nirant Kasliwal:
And here, let's say for instance, if you were to look at Qdrant client it's just passing everything as you would. So docs is a list of strings, metadata is a list of dictionaries and IDs again is a list of IDs valid IDs as per the Qdrant Client spec. And the search is also very straightforward. The entire search query is basically just two params. You could even see a very familiar integration which is let's say langchain. I think most people here would have looked at this in some shape or form earlier. This is also very familiar and very straightforward. And under the hood what are we doing is just this one line.

Nirant Kasliwal:
We have a dot embed which is a generator and we call a list on that so that we actually get a list of embeddings. You will notice that we have a passage and query keys here which means that our retrieval model which we have used as default here, takes these into account that if there is a passage and a query they need to be mapped together and a question and answer context is captured in the model training itself. The other caveat is that we pass on the token limits or context windows from the embedding model creators themselves. So in the case of this model, which is BGE base, that is 512 BGE tokens.

Demetrios:
One thing on this, we had Neil's from Cohere on last week and he was talking about Cohere's embed version three, I think, or V three, he was calling it. How does this play with that? Does it is it supported or no?

Nirant Kasliwal:
As of now, we only support models which are open source so that we can serve those models directly. Embed V three is cloud only at the moment, so that is why it is not supported yet. But that said, we are not opposed to it. In case there's a requirement for that, we are happy to support that so that people can use it seamlessly with Qdrant and fast embed does the heavy lifting of passing it to Qdrant, structuring the schema and all of those for you. So that's perfectly fair. As I ask, if we have folks who would love to try coherent embed V three, we'd use that. Also, I think Nils called out that coherent embed V three is compatible with binary quantization. And I think that's the only embedding which officially supports that.

Nirant Kasliwal:
Okay, we are binary quantization aware and they've been trained for it. Like compression awareness is, I think, what it was called. So Qdrant supports that. So please of that might be worth it because it saves about 30 x in memory costs. So that's quite powerful.

Demetrios:
Excellent.

Nirant Kasliwal:
All right, so behind the scenes, I think this is my favorite part of this. It's also very short. We do literally two things. Why are we fast? We use ONNX runtime as of now, our configurations are such that it runs on CPU and we are still very fast. And that's because of all the multiple processing and ONNX runtime itself at some point in the future. We also want to support GPUs. We had some configuration issues on different Nvidia configurations. As the GPU changes, the OnX runtime does not seamlessly change the GPU.

Nirant Kasliwal:
So that is why we do not allow that as a provider. But you can pass that. It's not prohibited, it's just not a default. We want to make sure your default is always available and will be available in the happy path, always. And we quantize the models for you. So when we quantize, what it means is we do a bunch of tricks supported by a huge shout out to hugging faces optimum. So we do a bunch of optimizations in the quantization, which is we compress some activations, for instance, gelu. We also do some graph optimizations and we don't really do a lot of dropping the bits, which is let's say 32 to 16 or 64 to 32 kind of quantization only where required.

Nirant Kasliwal:
Most of these gains come from the graph optimizations themselves. So there are different modes which optimum itself calls out. And if there are folks interested in that, happy to share docs and details around that. Yeah, that's about it. Those are the two things which we do from which we get bulk of these speed gains. And I think this goes back to the question which you opened with. Yes, we do want to support multimodal. We are looking at how we can do an on and export of Clip, which is as robust as Clip.

Nirant Kasliwal:
So far we have not found anything. I've spent some time looking at this, the quality of life upgrades. So far, most of our model downloads have been through Google cloud storage hosted by Qdrant. We want to support hugging Face hub so that we can launch new models much, much faster. So we will do that soon. And the next thing is, as I called out, we always want to take performance as a first class citizen. So we are looking at how we can allow you to change or adapt frozen Embeddings, let's say open a Embedding or any other model to your specific domain. So maybe a separate toolkit within Fast Embed which is optional and not a part of the default path, because this is not something which you will use all the time.

Nirant Kasliwal:
We want to make sure that your training and experience parts are separate. So we will do that. Yeah, that's it. Fast and sweet.

Demetrios:
Amazing. Like FastEmbed.

Nirant Kasliwal:
Yes.

Demetrios:
There was somebody that talked about how you need to be good at your puns and that might be the best thing, best brag worthy stuff you've got. There's also a question coming through that I want to ask you. Is it true that when we use Qdrant client add Fast Embedding is included? We don't have to do it?

Nirant Kasliwal:
What do you mean by do it? As in you don't have to specify a Fast Embed model?

Demetrios:
Yeah, I think it's more just like you don't have to add it on to Qdrant in any way or this is completely separated.

Nirant Kasliwal:
So this is client side. You own all your data and even when you compress it and send us all the Embedding creation happens on your own compute. This Embedding creation does not happen on Cauldron cloud, it happens on your own compute. It's consistent with the idea that you should have as much control as possible. This is also why, as of now at least, Fast Embed is not a dedicated server. We do not want you to be running two different docker images for Qdrant and Fast Embed. Or let's say two different ports for Qdrant and Discord within the sorry, Qdrant and Fast Embed in the same docker image or server. So, yeah, that is more chaos than we would like.

Demetrios:
Yeah, and I think if I understood it, I understood that question a little bit differently, where it's just like this comes with Qdrant out of the box.

Nirant Kasliwal:
Yes, I think that's a good way to look at it. We set all the defaults for you, we select good practices for you and that should work in a vast majority of cases based on the MTEB benchmark, but we cannot guarantee that it will work for every scenario. Let's say our default model is picked for English and it's mostly tested on open domain open web data. So, for instance, if you're doing something domain specific, like medical or legal, it might not work that well. So that is where you might want to still make your own Embeddings. So that's the edge case here.

Demetrios:
What are some of the other knobs that you might want to be turning when you're looking at using this.

Nirant Kasliwal:
With Qdrant or without Qdrant?

Demetrios:
With Qdrant.

Nirant Kasliwal:
So one thing which I mean, one is definitely try the different models which we support. We support a reasonable range of models, including a few multilingual ones. Second is while we take care of this when you do use with Qdrants. So, for instance, let's say this is how you would have to manually specify, let's say, passage or query. When you do this, let's say add and query. What we do, we add the passage and query keys while creating the Embeddings for you. So this is taken care of. So whatever is your best practices for the Embedding model, make sure you use it when you're using it with Qdrant or just in isolation as well.

Nirant Kasliwal:
So that is one knob. The second is, I think it's very commonly recommended, we would recommend that you start with some evaluation, like have maybe let's even just five sentences to begin with and see if they're actually close to each other. And as a very important shout out in Embedding retrieval, when we use Embedding for retrieval or vector similarity search, it's the relative ordering which matters. So, for instance, we cannot say that zero nine is always good. It could also mean that the best match is, let's say, 0.6 in your domain. So there is no absolute cut off for threshold in terms of match. So sometimes people assume that we should set a minimum threshold so that we get no noise. So I would suggest that you calibrate that for your queries and domain.

Nirant Kasliwal:
And you don't need a lot of queries. Even if you just, let's say, start with five to ten questions, which you handwrite based on your understanding of the domain, you will do a lot better than just picking a threshold at random.

Demetrios:
This is good to know. Okay, thanks for that. So there's a question coming through in the chat from Shreya asking how is the latency in comparison to elasticsearch?

Nirant Kasliwal:
Elasticsearch? I believe that's a Qdrant benchmark question and I'm not sure how is elastics HNSW index, because I think that will be the fair comparison. I also believe elastics HNSW index puts some limitations on how many vectors they can store with the payload. So it's not an apples to apples comparison. It's almost like comparing, let's say, a single page with the entire book, because that's typically the ratio from what I remember I also might be a few months outdated on this, but I think the intent behind that question is, is Qdrant fast enough for what Qdrant does? It is definitely fast is, which is embedding similarity search. So for that, it's exceptionally fast. It's written in Rust and Twitter for all C. Similar tweets uses this at really large scale. They run a Qdrant instance.

Nirant Kasliwal:
So I think if a Twitter scale company, which probably does about anywhere between two and 5 million tweets a day, if they can embed and use Qdrant to serve that similarity search, I think most people should be okay with that latency and throughput requirements.

Demetrios:
It's also in the name. I mean, you called it Fast Embed for a reason, right?

Nirant Kasliwal:
Yes.

Demetrios:
So there's another question that I've got coming through and it's around the model selection and embedding size. And given the variety of models and the embedding sizes available, how do you determine the most suitable models and embedding sizes? You kind of got into this on how yeah, one thing that you can do to turn the knobs are choosing a different model. But how do you go about choosing which model is better? There.

Nirant Kasliwal:
There is the academic way of looking at and then there is the engineer way of looking at it, and then there is the hacker way of looking at it. And I will give you all these three answers in that order. So the academic and the gold standard way of doing this would probably look something like this. You will go at a known benchmark, which might be, let's say, something like Kilt K-I-L-T or multilingual text embedding benchmark, also known as MTEB or Beer, which is beir one of these three benchmarks. And you will look at their retrieval section and see which one of those marks very close to whatever is your domain or your problem area, basically. So, for instance, let's say you're working in Pharmacology, the ODS that a customer support retrieval task is relevant to. You are near zero unless you are specifically in, I don't know, a Pharmacology subscription app. So that is where you would start.

Nirant Kasliwal:
This will typically take anywhere between two to 20 hours, depending on how familiar you are with these data sets already. But it's not going to take you, let's say, a month to do this. So just to put a rough order of magnitude, once you have that, you try to take whatever is the best model on that subdomain data set and you see how does it work within your domain and you launch from there. At that point, you switch into the engineer's mindset. The engineer's mindset now tells you that the best way to build something is to make an informed guess about what workload or challenges you're going to foresee. Right. Like a civil engineer builds a bridge around how many cars they expect, they're obviously not going to build a bridge to carry a ship load, for instance, or a plane load, which are very different. So you start with that and you say, okay, this is the number of requests which I expect, this is what my budget is, and your budget will quite often be, let's say, in terms of latency budgets, compute and memory budgets.

Nirant Kasliwal:
So for instance, one of the reasons I mentioned binary quantization and product quantization is with something like binary quantization you can get 98% recall, but with 30 to 40 x memory savings because it discards all the extraneous bits and just keeps the zero or one bit of the embedding itself. And Qdrant has already measured it for you. So we know that it works for OpenAI and Cohere embeddings for sure. So you might want to use that to just massively scale while keeping your budgets as an engineer. Now, in order to do this, you need to have some sense of three numbers, right? What are your latency requirements, your cost requirements, and your performance requirement. Now, for the performance, which is where engineers are most unfamiliar with, I will give the hacker answer, which is this.

Demetrios:
Is what I was waiting for. Man, so excited for this one, exactly this. Please tell us the hacker answer.

Nirant Kasliwal:
The hacker answer is this there are two tricks which I will share. One is write ten questions, figure out the best answer, and see which model gets as many of those ten, right? The second is most embedding models which are larger or equivalent to 768 embeddings, can be optimized and improved by adding a small linear head over it. So for instance, I can take the Open AI embedding, which is 1536 embedding, take my text, pass it through that, and for my own domain, adapt the Open A embedding by adding two or three layers of linear functions, basically, right? Y is equals to MX plus C or Ax plus B y is equals to C, something like that. So it's very simple, you can do it on NumPy, you don't need Torch for it because it's very small. The header or adapter size will typically be in this range of few KBS to be maybe a megabyte, maybe. I think the largest I have used in production is about 400 500 KBS. That's about it. And that will improve your recall several, several times.

Nirant Kasliwal:
So that's one, that's two tricks. And a third bonus hacker trick is if you're using an LLM, sometimes what you can do is take a question and rewrite it with a prompt and make embeddings from both, and pull candidates from both. And then with Qdrant Async, you can fire both these queries async so that you're not blocked, and then use the answer of both the original question which the user gave and the one which you rewrote using the LLM and see select the results which are there in both, or figure some other combination method. Also, so most Kagglers would be familiar with the idea of ensembling. This is the way to do query inference time ensembling, that's awesome.

Demetrios:
Okay, dude, I'm not going to lie, that was a lot more than I was expecting for that answer.

Nirant Kasliwal:
Got into the weeds of retrieval there. Sorry.

Demetrios:
I like it though. I appreciate it. So what about when it comes to the know, we had Andre V, the CTO of Qdrant on here a few weeks ago. He was talking about binary quantization. But then when it comes to quantizing embedding models, in the docs you mentioned like quantized embedding models for fast CPU generation. Can you explain a little bit more about what quantized embedding models are and how they enhance the CPU performance?

Nirant Kasliwal:
So it's a shorthand to say that they optimize CPU performance. I think the more correct way to look at it is that we use the CPU better. But let's talk about optimization or quantization, which we do here, right? So most of what we do is from optimum and the way optimum call set up is they call these levels. So you can basically go from let's say level zero, which is there are no optimizations to let's say 99 where there's a bunch of extra optimizations happening. And these are different flags which you can switch. And here are some examples which I remember. So for instance, there is a norm layer which you can fuse with the previous operation. Then there are different attention layers which you can fuse with the previous one because you're not going to update them anymore, right? So what we do in training is we update them.

Nirant Kasliwal:
You know that you're not going to update them because you're using them for inference. So let's say when somebody asks a question, you want that to be converted into an embedding as fast as possible and as cheaply as possible. So you can discard all these extra information which you are most likely to not going to use. So there's a bunch of those things and obviously you can use mixed precision, which most people have heard of with projects, let's say like lounge CPP that you can use FP 16 mixed precision or a bunch of these things. Let's say if you are doing GPU only. So some of these things like FP 16 work better on GPU. The CPU part of that claim comes from how ONNX the runtime which we use allows you to optimize whatever CPU instruction set you are using. So as an example with intel you can say, okay, I'm going to use the Vino instruction set or the optimization.

Nirant Kasliwal:
So when we do quantize it, we do quantization right now with CPUs in mind. So what we would want to do at some point in the future is give you a GPU friendly quantized model and we can do a device check and say, okay, we can see that a GPU is available and download the GPU friendly model first for you. Awesome. Does that answer the. Question.

Demetrios:
I mean, for me, yeah, but we'll see what the chat says.

Nirant Kasliwal:
Yes, let's do that.

Demetrios:
What everybody says there. Dude, this has been great. I really appreciate you coming and walking through everything we need to know, not only about fast embed, but I think about embeddings in general. All right, I will see you later. Thank you so much, Naran. Thank you, everyone, for coming out. If you want to present, please let us know. Hit us up, because we would love to have you at our vector space talks.