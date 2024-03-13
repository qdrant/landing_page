---
draft: true
title: Production-scale RAG for Real-Time News Distillation - Robert Caulk |
  Vector Space Talks
slug: real-time-news-distillation-rag
short_description: Robert Caulk dives into the challenges and innovations in
  open source AI and news article modeling
description: Robert Caulk, founder of Emergent Methods, discusses the
  intricacies of context engineering, the power of Newscatcher API for broader
  news access, and the sophisticated use of tools like Qdrant for improved
  recommendation systems, all while emphasizing the importance of efficiency and
  modularity in technology stacks for real-time data management.
preview_image: /blog/from_cms/robert-caulk-bp-cropped.png
date: 2024-03-08T10:07:45.278Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - Vector Search
  - Retrieval Augmented Generation
  - LLM
---
> *"We've got a lot of fun challenges ahead of us in the industry, I think, and the industry is establishing best practices. Like you said, everybody's just trying to figure out what's going on. And some of these base layer tools like Qdrant really enable products and enable companies and they enable us.”*\
-- Robert Caulk
> 

Robert, Founder of Emergent Methods is a scientist by trade, dedicating his career to a variety of open-source projects that range from large-scale artificial intelligence to discrete element modeling. He is currently working with a team at Emergent Methods to adaptively model over 1 million news articles per day, with a goal of reducing media bias and improving news awareness.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/7lQnfv0v2xRtFksGAP6TUW?si=Vv3B9AbjQHuHyKIrVtWL3Q), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/0ORi9QJlud0).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/0ORi9QJlud0?si=rpSOnS2kxTFXiVBq" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Production-scale-RAG-for-Real-Time-News-Distillation---Robert-Caulk--Vector-Space-Talks-015-e2g6464/a-ab0c1sq" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

How do Robert Caulk and Emergent Methods contribute to the open-source community, particularly in AI systems and news article modeling?

In this episode, we're getting under the hood of open-source projects that are reshaping how we interact with AI systems and news article modeling. Robert takes us on a deep dive into the evolving landscape of news distribution and the tech making it more efficient and balanced.

Here are some takeaways from this episode:

1. **Context Matters**: Discover the importance of context engineering in news and how it ensures a diversified and consumable information flow.
2. **Introducing Newscatcher API**: Get the lowdown on how this tool taps into 50,000 news sources for more thorough and up-to-date reporting.
3. **The Magic of Embedding**: Learn about article summarization and semantic search, and how they're crucial for discovering content that truly resonates.
4. **Quadrant & Cloud**: Explore how Qdrant's cloud offering and its single responsibility principle support a robust, modular approach to managing news data.
5. **Startup Superpowers**: Find out why startups have an edge in implementing new tech solutions and how incumbents are tied down by legacy products.

> Fun Fact: Did you know that startups' lack of established practices is actually a superpower in the face of new tech paradigms? Legacy products can't keep up!
> 

## Show notes:

00:00 Intro to Robert and Emergent Methods.\
05:22 Crucial dedication to scaling context engineering.\
07:07 Optimizing embedding for semantic similarity in search.\
13:07 New search technology boosts efficiency and speed.\
14:17 Reliable cloud provider with privacy and scalability.\
17:46 Efficient data movement and resource management.\
22:39 GoLang for services, Rust for security.\
27:34 Logistics organized; Newscatcher provides up-to-date news.\
30:27 Tested Weaviate and another in Rust.\
32:01 Filter updates by starring and user preferences.

## More Quotes from Robert:

*"Web search is powerful, but it's slow and ultimately inaccurate. What we're building is real time indexing and we couldn't do that without Qdrant*”\
-- Robert Caulk

*"You need to start thinking about persistence and search and making sure those services are robust. That's where Qdrant comes into play. And we found that the all in one solutions kind of sacrifice performance for convenience, or sacrifice accuracy for convenience, but it really wasn't for us. We'd rather just orchestrate it ourselves and let Qdrant do what Qdrant does, instead of kind of just hope that an all in one solution is handling it for us and that allows for modularity performance.”*\
-- Robert Caulk

*"Anyone riding the Qdrant wave is just reaping benefits. It seems monthly, like two months ago, sparse vector support got added. There's just constantly new massive features that enable products.”*\
-- Robert Caulk

## Transcript:
Demetrios:
Robert, it's great to have you here for the vector space talks. I don't know if you're familiar with some of this fun stuff that we do here, but we get to talk with all kinds of experts like yourself on what they're doing when it comes to the vector space and how you've overcome challenges, how you're working through things, because this is a very new field and it is not the most intuitive, as you will tell us more in this upcoming talk. I really am excited because you've been a scientist by trade. Now, you're currently founder at emergent Methods and you've dedicated your career to a variety of open source projects that range from the large scale AI systems to the discrete element modeling. Now at emergent methods, you are adaptively modeling over 1 million news articles per day. That sounds like a whole lot of news articles. And you've been talking and working through production grade rag, which is basically everyone's favorite topic these days. So I know you got to talk for us, man.

Demetrios:
I'm going to hand it over to you. I'll bring up your screen right now, and when someone wants to answer or ask a question, feel free to throw it in the chat and I'll jump out at Robert and stop him if needed.

Robert Caulk:
Sure.

Demetrios:
Great to have you here, man. I'm excited for this one.

Robert Caulk:
Thanks for having me, Demetrius. Yeah, it's a great opportunity. I love talking about vector spaces, parameter spaces. So to talk on the show is great. We've got a lot of fun challenges ahead of us in the industry, I think, and the industry is establishing best practices. Like you said, everybody's just trying to figure out what's going on. And some of these base layer tools like Qdrant really enable products and enable companies and they enable us. So let me start.

Robert Caulk:
Yeah, like you said, I'm Robert and I'm a founder of emergent methods. Our background, like you said, we are really committed to free and open source software. We started with a lot of narrow AI. Freak AI was one of our original projects, which is AI ML for algo trading very narrow AI, but we came together and built flowdapt. It's a really nice cluster orchestration software, and I'll talk a little bit about that during this presentation. But some of our background goes into, like you said, large scale deep learning for supercomputers. Really cool, interesting stuff. We have some cloud experience.

Robert Caulk:
We really like configuration, so let's dive into it. Why do we actually need to engineer context in the news? There's a lot of reasons why news is important and why it needs to be distributed in a way that's balanced and diversified, but also consumable. Right, let's look at Chat GPT on the left. This is Chat GPT plus it's kind of hanging out searching for Gaza news on Bing, trying to find the top three articles live. Web search is powerful, but it's slow and ultimately inaccurate. What we're building is real time indexing and we couldn't do that without Qdrant, and there's a lot of reasons which I'll be perfectly happy to dive into, but eventually Chappa Chi PT will pull something together here. There it is. And the first thing it reports is 25 day old article with 25 day old nudes.

Robert Caulk:
Old news. So it's just inaccurate. So it's borderline dangerous, what's happening here. Right, so this is a very delicate topic. Engineering context in news properly, which takes a lot of energy, a lot of time and dedication and focus, and not every company really has this sort of resource. So we're talking about enforcing journalistic standards, right? OpenAI and Chachipt, they just don't have the time and energy to build a dedicated prompt for this sort of thing. It's fine, they're doing great stuff, they're helping you code. But someone needs to step in and really do enforce some journalistic standards here.

Robert Caulk:
And that includes enforcing diversity, languages, regions and sources. If I'm going to read about Gaza, what's happening over there, you can bet I want to know what Egypt is saying and what France is saying and what Algeria is saying. So let's do this right. That's kind of what we're suggesting, and the only way to do that is to parse a lot of articles. That's how you avoid outdated, stale reporting. And that's a real danger, which is kind of what we saw on that first slide. Everyone here knows hallucination is a problem and it's something you got to minimize, especially when you're talking about the news. It's just a really high cost if you get it wrong.

Robert Caulk:
And so you need people dedicated to this. And if you're going to dedicate a ton of resources and ton of people, you might as well scale that properly. So that's kind of where this comes into. We call this context engineering news context engineering, to be precise, before llama two, which also is enabling products left and right. As we all know, the traditional pipeline was chunk it up, take 512 tokens, put it through a translator, put it through distillbart, do some sentence extraction, and maybe text classification, if you're lucky, get some sentiment out of it and it works. It gets you something. But after we're talking about reading full articles, getting real rich, context, flexible output, translating, summarizing, really deciding that custom extraction on the fly as your product evolves, that's something that the traditional pipeline really just doesn't support. Right.

Robert Caulk:
We're talking being able to on the fly say, you know what, actually we want to ask this very particular question of all articles and get this very particular field out. And it's really just a prompt modification. This all is based on having some very high quality, base level, diversified news. And so we'll talk a little bit more. But newscatchers is one of the sources that we're using, which opens up 50,000 different sources. So check them out. That's newscatcherapi.com. They even give free access to researchers if you're doing research in this.

Robert Caulk:
So I don't want to dive too much into the direct rag stuff. We can go deep, but I'm happy to talk about some examples of how to optimize this and how we've optimized it. Here on the right, you can see the diagram where we're trying to follow along the process of summarizing and embedding. And I'll talk a bit more about that in a moment. It's here to support after we've summarized those articles and we're ready to embed that. Embedding is really important to get that right because like the name of the show suggests you have to have a clean cluster vector space if you're going to be doing any sort of really rich semantic similarity searches. And if you're going to be able to dive deep into extracting important facts out of all 1 million articles a day, you're going to need to do this right. So having a user query which is not equivalent to the embedded page where this is the data, the enriched data that the embedding that we really want to be able to do search on.

Robert Caulk:
And then how do we connect the dots here? Of course, there are many ways to go about it. One way which is interesting and fun to talk about is ide. So that's basically a hypothetical document embedding. And what you do is you use the LLM directly to generate a fake article. And that's what we're showing here on the right. So let's say if the user says, what's going on in New York City government, well, you could say, hey, write me just a hypothetical summary based, it could completely fake and use that to create a fake embedding page and use that for the search. Right. So then you're getting a lot closer to where you want to go.

Robert Caulk:
There's some limitations to this, to it's, there's a computational cost also, it's not updated. It's based on whatever. It's basically diving into what it knows about the New York City government and just creating keywords for you. So there's definitely optimizations here as well. When you talk about ambiguity, well, what if the user follows up and says, well, why did they change the rules? Of course, that's where you can start prompt engineering a little bit more and saying, okay, given this historic conversation and the current question, give me some explicit question without ambiguity, and then do the high de, if that's something you want to do. The real goal here is to stay in a single parameter space, a single vector space. Stay as close as possible when you're doing your search as when you do your embedding. So we're talking here about production scale of stuff.

Robert Caulk:
So I really am happy to geek out about the stack, the open source stack that we're relying on, which includes Qdrant here. But let's start with Vllm. I don't know if you guys have heard of it. This is a really great new project, and their focus on continuous batching and page detention. And if I'm being completely honest with you, it's really above my pay grade in the technicals and how they're actually implementing all of that inside the GPU memory. But what we do is we outsource that to that project and we really like what they're doing, and we've seen really good results. It's increasing throughput. So when you're talking about trying to parse through a million articles, you're going to need a lot of throughput.

Robert Caulk:
The other is text embedding inference. This is a great server. A lot of vector databases will say, okay, we'll do all the embedding for you and we'll do all everything. But when you move to production scale, I'll talk a bit about this later. You need to be using micro service architecture, so it's not super smart to have your database bogged down with doing sorting out the embeddings and sorting out other things. So honestly, I'm a real big fan of single responsibility principle, and that's what Tei does for you. And it also does dynamic batching, which is great in this world where everything is heterogeneous lengths of what's coming in and what's going out. So it's great.

Robert Caulk:
It really simplifies the process and allows you to isolate resources. But now the star of the show Qdrant, it's really come into its own. Anyone riding the Qdrant wave is just reaping benefits. It seems monthly, like two months ago, sparse vector support got added. There's just constantly new massive features that enable products. Right. So for us, we're doing so much up Cert, we really need to minimize client connections and networking overhead. So you got that batch up cert.

Robert Caulk:
The filters are huge. We're talking about real time filtering. We can't be searching on news articles from a month ago, two months ago, if the user is asking for a question that's related to the last 24 hours. So having that timestamp filtering and having it be efficient, which is what it is in Qdrant, is huge. Keyword filtering really opens up a massive realm of product opportunities for us. And then the sparse vectors, we hopped on this train immediately and are just seeing benefits. I don't want to say replacement of elasticsearch, but elasticsearch is using sparse vectors as well. So you can add splade into elasticsearch, and splade is great.

Robert Caulk:
It's a really great alternative to BM 25. It's based on that Burt architecture, and that really opens up a lot of opportunities for filtering out keywords that are kind of useless to the search when the user uses the and a, and then there, these words that are less important splays a bit of a hybrid into semantics, but sparse retrieval. So it's really interesting. And then the idea of hybrid search with semantic and a sparse vector also opens up the ability to do ranking, and you got a higher quality product at the end, which is really the goal, right, especially in production. Point number four here, I would say, is probably one of the most important to us, because we're dealing in a world where latency is king, and being able to deploy Qdrant inside of the same cluster as all the other services. So we're just talking through the switch. That's huge. We're never getting bogged down by network.

Robert Caulk:
We're never worried about a cloud provider potentially getting overloaded or noisy neighbor problems, stuff like that, completely removed. And then you got high privacy, right. All the data is completely isolated from the external world. So this point number four, I'd say, is one of the biggest value adds for us. But then distributing deployment is huge because high availability is important, and deep storage, which when you're in the business of news archival, and that's one of our main missions here, is archiving the news forever. That's an ever growing database, and so you need a database that's going to be able to grow with you as your data grows. So what's the TLDR to this context? Engineering? Well, service orchestration is really just based on service orchestration in a very heterogeneous and parallel event driven environment. On the right side, we've got the user requests coming in.

Robert Caulk:
They're hitting all the same services, which every five minutes or every two minutes, whatever you've scheduled the scrape workflow on, also hitting the same services, this requires some orchestration. So that's kind of where I want to move into discussing the real production, scaling, orchestration of the system and how we're doing that. Provide some diagrams to show exactly why we're using the tools we're using here. This is an overview of our Kubernetes cluster with the services that we're using. So it's a bit of a repaint of the previous diagram, but a better overview about showing kind of how these things are connected and why they're connected. I'll go through one by one on these services to just give a little deeper dive into each one. But the goal here is for us, in our opinion, microservice orchestration is key. Sticking to single responsibility principle.

Robert Caulk:
Open source projects like Qdrant, like Tei, like VLLM and Kubernetes, it's huge. Kubernetes is opening up doors for security and for latency. And of course, if you're going to be getting involved in this game, you got to find the strong DevOps. There's no escaping that. So let's step through kind of piece by piece and talk about flow Dapp. So that's our project. That's our open source project. We've spent about two years building this for our needs, and we're really excited because we did a public open sourcing maybe last week or the week before.

Robert Caulk:
So finally, after all of our testing and rewrites and refactors, we're open. We're open for business. And it's running asknews app right now, and we're really excited for where it's going to go and how it's going to help other people orchestrate their clusters. Our goal and our priorities were highly paralyzed compute and we were running tests using all sorts of different executors, comparing them. So when you use Flowdapt, you can choose ray or dask. And that's key. Especially with vanilla Python, zero code changes, you don't need to know how ray or dask works. In the back end, floatapt is vanilla Python.

Robert Caulk:
That was a key goal for us to ensure that we're optimizing how data is moving around the cluster. Automatic resource management this goes back to Ray and dask. They're helping manage the resources of the cluster, allocating a GPU to a task, or allocating multiple tasks to one GPU. These can come in very, very handy when you're dealing with very heterogeneous workloads like the ones that we discussed in those previous slides. For us, the biggest priority was ensuring rapid prototyping and debugging locally. When you're dealing with clusters of 1015 servers, 40 or 5100 with ray, honestly, ray just scales as far as you want. So when you're dealing with that big of a cluster, it's really imperative that what you see on your laptop is also what you are going to see once you deploy. And being able to debug anything you see in the cluster is big for us, we really found the need for easy cluster wide data sharing methods between tasks.

Robert Caulk:
So essentially what we've done is made it very easy to get and put values. And so this makes it extremely easy to move data and share data between tasks and make it highly available and stay in cluster memory or persist it to disk, so that when you do the inevitable version update or debug, you're reloading from a persisted state in the real time. News business scheduling is huge. Scheduling, making sure that various workflows are scheduled at different points and different periods or frequencies rather, and that they're being scheduled correctly, and that their triggers are triggering exactly what you need when you need it. Huge for real time. And then one of our biggest selling points, if you will, for this project is Kubernetes style. Everything. Our goal is everything's Kubernetes style, so that if you're coming from Kubernetes, everything's familiar, everything's resource oriented.

Robert Caulk:
We even have our own flow ectyl, which would be the Kubectl style command schemas. A lot of what we've done is ensuring deployment cycle efficiency here. So the goal is that flowdapt can schedule everything and manage all these services for you, create workflows. But why these services? For this particular use case, I'll kind of skip through quickly. I know I'm kind of running out of time here, but of course you're going to need some proprietary remote models. That's just how it works. You're going to of course share that load with on premise llms to reduce cost and to have some reasoning engine on premise. But there's obviously advantages and disadvantages to these.

Robert Caulk:
I'm not going to go through them. I'm happy to make these slides available, and you're welcome to kind of parse through the details. Yeah, for sure. You need to start thinking about persistence and search and making sure those services are robust. That's where Qdrant comes into play. And we found that the all in one solutions kind of sacrifice performance for convenience, or sacrifice accuracy for convenience, but it really wasn't for us. We'd rather just orchestrate it ourselves and let Qdrant do what Qdrant does, instead of kind of just hope that an all in one solution is handling it for us and that allows for modularity performance. And we'll dump Qdrant if we want to.

Robert Caulk:
Probably we won't. Or we'll dump minio if we need to, or we'll swap out for whatever replaces bllm. Trying to keep things modular so that future engineers are able to adapt with the tech that's just blowing up and exploding right now. Right. The last thing to talk about here in a production scale environment is really minimizing the latency. I touched on this with Kubernetes ensuring that these services are sitting on the same network, and that is huge. But that talks about decommunication latency. But when you start talking about getting hit with a ton of traffic, production scale, tons of people asking a question all simultaneously, and you needing to go hit a variety of services, well, this is where you really need to isolate that to an asynchronous environment.

Robert Caulk:
And of course, if you could write this all in Golang, that's probably going to be your best bet for us. We have some services written in Golang, but predominantly, especially the endpoints that the ML engineers need to work with. We're using fast API on pydantic and honestly, it's powerful. Pydantic V 2.0 now runs on Rust, and as anyone in the Qdrant community knows, Rust is really valuable when you're dealing with highly parallelized environments that require high security and protections for immutability and atomicity. Forgive me for the pronunciation, that kind of sums up the production scale talk, and I'm happy to answer questions. I love diving into this sort of stuff. I do have some just general thoughts on why startups are so much more well positioned right now than some of these incumbents, and I'll just do kind of a quick run through, less than a minute just to kind of get it out there. We can talk about it, see if we agree or disagree.

Robert Caulk:
But you touched on it, Demetrius, in the introduction, which was the best practices have not been established. That's it. That is why startups have such a big advantage. And the reason they're not established is because, well, the new paradigm of technology is just underexplored. We don't really know what the limits are and how to properly handle these things. And that's huge. Meanwhile, some of these incumbents, they're dealing with all sorts of limitations and resistance to change and stuff, and then just market expectations for incumbents maintaining these kind of legacy products and trying to keep them hobbling along on this old tech. In my opinion, startups, you got your reasoning engine building everything around a reasoning engine, using that reasoning engine for every aspect of your system to really open up the adaptivity of your product.

Robert Caulk:
And okay, I won't put elasticsearch in the incumbent world. I'll keep elasticsearch in the middle. I understand it still has a lot of value, but some of these vendor lock ins, not a huge fan of. But anyway, that's it. That's kind of all I have to say. But I'm happy to take questions or chat a bit.

Demetrios:
Dude, I've got so much to ask you and thank you for breaking down that stack. That is like the exact type of talk that I love to see because you open the kimono full on. And I was just playing around with asknews app. And so I think it's probably worth me sharing my screen just to show everybody what exactly that is and how that looks at the moment. So you should be able to see it now. Right? And super cool props to you for what you've built. Because I went, and intuitively I was able to say like, oh, cool, I can change, I can see positive news, and I can go by the region that I'm looking at. I want to make sure that I'm checking out all the stuff in Europe or all the stuff in America categories.

Demetrios:
I can look at sports, blah blah blah, like as if you were flipping the old newspaper and you could go to the sports section or the finance section, and then you cite the sources and you see like, oh, what's the trend in the coverage here? What kind of coverage are we getting? Where are we at in the coverage cycle? Probably something like that. And then, wait, although I was on the happy news, I thought murder, she wrote. So anyway, what we do is we.

Robert Caulk:
Actually sort it from we take the poll and we actually just sort most positive to the least positive. But you're right, we were talking the other day, we're like, let's just only show the positive. But yeah, that's a good point.

Demetrios:
There you go.

Robert Caulk:
Murder, she wrote.

Demetrios:
But the one thing that I was actually literally just yesterday talking to someone about was how you update things inside of your vector database. So I can imagine that news, as you mentioned, news cycles move very fast and the news that happened 2 hours ago is very different. The understanding of what happened in a very big news event is very different 2 hours ago than it is right now. So how do you make sure that you're always pulling the most current and up to date information?

Robert Caulk:
This is another logistical point that we think needs to get sorted properly and there's a few layers to it. So for us, as we're parsing that data coming in from Newscatcher, so newscatcher is doing a good job of always feeding the latest buckets to us. Sometimes one will be kind of arrive, but generally speaking, it's always the latest news. So we're taking five minute buckets, and then with those buckets, we're going through and doing all of our enrichment on that, adding it to Qdrant. And that is the point where we use that timestamp filtering, which is such an important point. So in the metadata of Qdrant, we're using the range filter, which is where we call that the timestamp filter, but it's really range filter, and that helps. So when we're going back to update things, we're sorting and ensuring that we're filtering out only what we haven't seen.

Demetrios:
Okay, that makes complete sense. And basically you could generalize this to something like what I was talking to with people yesterday about, which was, hey, I've got an HR policy that gets updated every other month or every quarter, and I want to make sure that if my HR chat bot is telling people what their vacation policy is, it's pulling from the most recent HR policy. So how do I make sure and do that? And how do I make sure that my vector database isn't like a landmine where it's pulling any information, but we don't necessarily have that control to be able to pull the correct information? And this comes down to that retrieval evaluation, which is such a hot topic, too.

Robert Caulk:
That's true. No, I think that's a key piece of the puzzle. Now, in that particular example, maybe you actually want to go in and start cleansing a bit, your database, just to make sure if it's really something you're never going to need again. You got to get rid of it. This is a piece I didn't add to the presentation, but it's tangential. You got to keep multiple databases and you got to making sure to isolate resources and cleaning out a database, especially in real time. So ensuring that your database is representative of what you want to be searching on. And you can do this with collections too, if you want.

Robert Caulk:
But we find there's sometimes a good opportunity to isolate resources in that sense, 100%.

Demetrios:
So, another question that I had for you was, I noticed Mongo was in the stack. Why did you not just use the Mongo vector option? Is it because of what you were mentioning, where it's like, yeah, you have these all in one options, but you sacrifice that performance for the convenience?

Robert Caulk:
We didn't test that, to be honest, I can't say. All I know is we tested weavyt, we tested one other, and I just really like. Although I was going to say I like that it's written in rust, although I believe Mongo is also written in rust, if I'm not mistaken. But for us, the document DB is more of a representation of state and what's happening, especially for our configurations and workflows. Meanwhile, we really like keeping and relying on Qdrant and all the features. Qdrant is updating, so, yeah, I'd say single responsibility principle is key to that. But I saw some chat in Qdrant discord about this, which I think the only way to use vector is actually to use their cloud offering, if I'm not mistaken. Do you know about this?

Demetrios:
Yeah, I think so, too.

Robert Caulk:
This would also be a piece that we couldn't do.

Demetrios:
Yeah. Where it's like it's open source, but not open source, so that makes sense. Yeah. This has been excellent, man. So I encourage anyone who is out there listening, check out again this is asknews app, and stay up to date with the most relevant news in your area and what you like. And I signed in, so I'm guessing that when I sign in, it's going to tweak my settings. Am I going to be able.

Robert Caulk:
Good question.

Demetrios:
Catch this next time.

Robert Caulk:
Well, at the moment, if you star a story, a narrative that you find interesting, then you can filter on the star and whatever the latest updates are, you'll get it for that particular story. Okay. It brings up another point about Qdrant, which is at the moment we're not doing it yet, but we have plans to use the recommendation system for letting a user kind of create their profile by just saying what they like, what they don't like, and then using the recommender to start recommending stories that they may or may not like. And that's us outsourcing the Qdrant almost entirely. Right. It's just us building around it. So that's nice.

Demetrios:
Yeah. That makes life a lot easier, especially knowing recommender systems. Yeah, that's excellent.

Robert Caulk:
Thanks. I appreciate that. For sure. And I'll try to make the slides available. I don't know if I can send them to the two Qdrant or something. They could post them in the discord maybe, for sure.

Demetrios:
And we can post them in the link in the description of this talk. So this has been excellent. Rob, I really appreciate you coming on here and chatting with me about this, and thanks for breaking down everything that you're doing. I also love the VllM project. It's blowing up. It's cool to see so much usage and all the good stuff that you're doing with it. And yeah, man, for anybody that wants to follow along on your journey, we'll drop a link to your LinkedIn so that they can connect with you and.

Robert Caulk:
Cool.

Demetrios:
Thank you.

Robert Caulk:
Thanks for having me. Demetrios, talk to you later.

Demetrios:
Catch you later, man. Take care.
