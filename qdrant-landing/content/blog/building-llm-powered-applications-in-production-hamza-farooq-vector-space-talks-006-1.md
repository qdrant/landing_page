---
draft: true
title: Building LLM Powered Applications in Production - Hamza Farooq | Vector
  Space Talks
slug: vector-space-talk-006
short_description: Hamza Farooq discusses the future of LLMs, complex search, and copilots.
description: Hamza Farooq presents the future of large language models, complex
  search, and copilot, discussing real-world applications and the challenges of
  implementing these technologies in production.
preview_image: /blog/from_cms/hamza-farooq.png
date: 2024-01-09T13:50:05.622Z
author: Demetrios Brinkmann
featured: true
tags:
  - Vector Space Talks
  - LLM
  - Vector Database
---
> *"There are 10 billion search queries a day, estimated half of them go unanswered. Because people don't actually use search as what we used.”*\
> -- Hamza Farooq
> 

How do you think Hamza's background in machine learning and previous experiences at Google and Walmart Labs have influenced his approach to building LLM-powered applications?

Hamza Farooq, an accomplished educator and AI enthusiast, is the founder of Traversaal.ai. His journey is marked by a relentless passion for AI exploration, particularly in building Large Language Models. As an adjunct professor at UCLA Anderson, Hamza shapes the future of AI by teaching cutting-edge technology courses. At Traversaal.ai, he empowers businesses with domain-specific AI solutions, focusing on conversational search and recommendation systems to deliver personalized experiences. With a diverse career spanning academia, industry, and entrepreneurship, Hamza brings a wealth of experience from time at Google. His overarching goal is to bridge the gap between AI innovation and real-world applications, introducing transformative solutions to the market. Hamza eagerly anticipates the dynamic challenges and opportunities in the ever-evolving field of AI and machine learning.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/1oh31JA2XsqzuZhCUQVNN8?si=viPPgxiZR0agFhz1QlimSA), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/0N9ozwgmEQM).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/0N9ozwgmEQM?si=4f_MaEUrberT575w" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe style="border-radius:12px" src="https://open.spotify.com/embed/episode/1oh31JA2XsqzuZhCUQVNN8/video?utm_source=generator" width="496" height="279" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>

## **Top Takeaways:****************************

UX specialist? Your expertise in designing seamless user experiences for GenAI products is guaranteed to be in high demand. Let's elevate the user interface for next-gen technology!

In this episode, Hamza presents the future of large language models and complex search, discussing real-world applications and the challenges of implementing these technologies in production.

5 Keys to Learning from the Episode:

1. **Complex Search** - Discover how LLMs are revolutionizing the way we interact with search engines and enhancing the search experience beyond basic queries.
2. **Conversational Search and Personalization** - Explore the potential of conversational search and personalized recommendations using open-source LLMs, bringing a whole new level of user engagement.
3. **Challenges and Solutions** - Uncover the downtime challenges faced by LLM services and learn the strategies deployed to mitigate these issues for seamless operation.
4. **Traversal AI's Unique Approach** - Learn how Traversal AI has created a unified platform with a myriad of applications, simplifying the integration of LLMs and domain-specific search.
5. **The Importance of User Experience (UX)** - Understand the unparalleled significance of UX professionals in shaping the future of Gen AI products, and how they play a pivotal role in enhancing user interactions with LLM-powered applications.

> Fun Fact: User experience (UX) designers are anticipated to be crucial in the development of AI-powered products as they bridge the gap between user interaction and the technical aspects of the AI systems.
> 

## Show Notes:

00:00 Teaching GPU AI with open source products.\
06:40 Complex search leads to conversational search implementation.\
07:52 Generating personalized travel itineraries with ease.\
12:02 Maxwell's talk highlights challenges in search technology.\
16:01 Balancing preferences and trade-offs in travel.\
17:45 Beta mode, selective, personalized database.\
22:15 Applications needed: chatbot, knowledge retrieval, recommendation, job matching, copilot\
23:59 Challenges for UX in developing gen AI.

## More Quotes from Hamza:

*"Ux people are going to be more rare who can work on gen AI products than product managers and tech people, because for tech people, they can follow and understand code and they can watch videos, business people, they're learning GPT prompting and so on and so forth. But the UX people, there's literally no teaching guide except for a Chat GPT interface. So this user experience, they are going to be, their worth is going to be inequal in gold.”*\
-- Hamza Farooq

*"Usually they don't come to us and say we need a pine cone or we need a quadrant or we need a local llama, they say, this is the problem you're trying to solve. And we are coming from a problem solving initiative from our company is that we got this. You don't have to hire three ML engineers and two NLP research scientists and three people from here for the cost of two people. We can do an entire end to end implementation. Because what we have is 80% product which is built and we can tune the 20% to what you need.”*\
-- Hamza Farooq

*"Imagine you're trying to book a hotel, and you also get an article from New York Times that says, this is why this is a great, or a blogger that you follow and it sort of shows up in your. That is the strength that we have been powering, that you don't need to wait or you don't need to depend anymore on just the company's website itself. You can use the entire Internet to come up with an arsenal.”*\
-- Hamza Farooq

## Transcript:
Demetrios:
Yes, we are live. So what is going on? Hamza, it's great to have you here for this edition of the Vector Space Talks.

Demetrios:
Let's first start with this. Everybody that is here with us right now, great to have you.

Demetrios:
Let us know where you're dialing in from in the chat and feel free over the course of the next 20 - 25 minutes to ask any questions as they.

Demetrios:
Come up in the chat.

Demetrios:
I'll be monitoring it and maybe jumping.

Demetrios:
In in case we need to stop.

Demetrios:
Hunts at any moment. And if you or anybody you know would like to come and give a presentation on our vector space talks, we are very open to that. Reach out to me either on discord or LinkedIn or your preferred method of communication.

Demetrios:
Maybe it's carrier Pigeon.

Demetrios:
Whatever it may be, I am here and ready to hear your pitch about.

Demetrios:
What you want to talk about. It's always cool hearing about how people are building with Qdrant or what they.

Demetrios:
Are building in this space. So without further ado, let's jump into this with my man Hamza. Great to have you here, dude.

Hamza Farooq:
Thank you for having me. It's an honor.

Demetrios:
You say that now. Just wait. You don't know me that well. I guess that's the only thing. So let's just say this. You're doing some incredible stuff.

Demetrios:
You're the founder of Traversaal.ai.

Demetrios:
You have been building large language models in the past, and you're also a professor at UCLA. You're doing all kinds of stuff.

Demetrios:
And that is why I think it.

Demetrios:
Is my honor to have you here with us today. I know you've got all kinds of fun stuff that you want to get.

Demetrios:
Into, and it's really about building llm powered applications in production.

Demetrios:
You have some slides for us, I believe. So I'm going to kick it over.

Demetrios:
To you, let you start rocking, and in case anything comes up, I'll jump.

Demetrios:
In and stop you from going too.

Demetrios:
Far down the road.

Hamza Farooq:
Awesome. Thank you for that. I really like your joke of the carrier pigeon. Is it a geni carrier pigeon with multiple areas and h 100 attached to it?

Demetrios:
Exactly. Those are the expensive carrier pigeons. That's the premium version. I am not quite that GPU rich yet.

Hamza Farooq:
Absolutely. All right. I think that's a great segue. I usually tell people that I'm going to teach you all how to be a GPU poor AI gap person, and my job is to basically teach everyone, or the thesis of my organization is also, how can we build powerful solutions, LLM powered solutions by using open source products and open source llms and architectures so that we can stretch the dollar as much as possible. That's been my thesis and I have always pushed for open source because they've done some great job over there and they are coming in close to pretty much at par of what the industry standard is. But I digress. Let's start with my overall presentation. I'm here to talk about the future of search and copilots and just the overall experience which we are looking with llms.

Hamza Farooq:
So I know you gave a background about me. I am a founder at Traversaal.ai. Previously I was at Google and Walmart Labs. I have quite a few years of experience in machine learning. In fact, my first job in 2007 was working for SaaS and I was implementing trees for identifying fraud, for fraud detection. And I did not know that was honestly data science, but we were implementing that. I have had the experience of teaching at multiple universities and that sort of experience has really helped me do better at what I do, because when you can teach something, you actually truly understand that. All right, so why are we here? Why are we really here? I have a very strong mean game.

Hamza Farooq:
So we started almost a year ago, Char GPT came into our lives and almost all of a sudden we started using it. And I think in January, February, March, it was just an explosion of usage. And now we know all the different things that have been going on and we've seen peripheration of a lot of startups that have come in this space. Some of them are wrappers, some of them have done a lot, have a lot more motor. There are many, many different ways that we have been using it. I don't think we even know how many ways we can use charge GBT, but most often it's just been text generation, one form or the other. And that is what the focus has been. But if we look deeper, the llms that we know, they also can help us with a very important part, something which is called complex search.

Hamza Farooq:
And complex search is basically when we converse with a search system to actually give a much longer query of how we would talk to a human being. And that is something that has been missing for the longest time in our interfacing with any kind of search engine. Google has always been at the forefront of giving the best form of search for us all. But imagine if you were to look at any other e commerce websites other than Amazon. Imagine you go to Nike.com, you go to gap, you go to Banana Republic. What you see is that their search is really basic and this is an opportunity for a lot of companies to actually create a great search experience for the users with a multi tier engagement model. So you basically make a request. I would like to buy a Nike blue t shirt specially designed for golf with all these features which I need and at a reasonable price point.

Hamza Farooq:
It shows you a set of results and then from that you can actually converse more to it and say, hey, can you remove five or six or reduce this by a certain degree? That is the power of what we have at hand with complex search. And complex search is becoming quickly a great segue to why we need to implement conversational search. We would need to implement large language models in our ecosystem so that we can understand the context of what users have been asking. So I'll show you a great example of sort of know complex search that TripAdvisor has been. Last week in one of my classes at Stanford, we had head of AI from Trivia Advisor come in and he took us through an experience of a new way of planning your trips. So I'll share this example. So if you go to the website, you can use AI and you can actually select a city. So let's say I'm going to select London for that matter.

Hamza Farooq:
And I can say I'm going to go for a few days, I do next and I'm going to go with my partner now at the back end. This is just building up a version of complex search and I want to see attractions, great food, hidden gems. I basically just want to see almost everything. And then when I hit submit, the great thing what it does is that it sort of becomes a starting point for something that would have taken me quite a while to put it together, sort of takes all my information and generates an itinerary. Now see what's different about this. It has actual data about places where I can stay, things I can do literally day by day, and it's there for you free of cost generated within 10 seconds. This is an experience that did not exist before. You would have to build this by yourself and what you would usually do is you would go to chat.

Hamza Farooq:
GPT if you've started this year, you would say seven day itinerary to London and it would identify a few things over here. However, you see it has able to integrate the ability to book, the ability to actually see those restaurants all in one place. That is something that has not been done before. And this is the truest form of taking complex search and putting that into production and sort of create a great experience for the user so that they can understand what they can select. They can highlight and sort of interact with it. Going to pause here. Is there any question or I can help answer anything?

Demetrios:
No.

Demetrios:
Man, this is awesome though. I didn't even realize that this is already live, but it's 100% what a travel agent would be doing. And now you've got that at your fingertips.

Hamza Farooq:
So they have built a user experience which takes 10 seconds to build. Now, was it really happening in the back end? You have this macro task that I want to plan a vacation in Paris, I want to plan a vacation to London. And what web agents or auto agents or whatever you want to call them, they are recursively breaking down tasks into subtasks. And when you reach to an individual atomic subtask, it is able to divide it into actions which can be taken. So there's a task decomposition and a task recognition scene that is going on. And from that, for instance, Stripadvisor is able to build something of individual actions. And then it makes one interface for you where you can see everything ready to go. And that's the part that I have always been very interested in.

Hamza Farooq:
Whenever we go to Amazon or anything for search, we just do one tier search. We basically say, I want to buy a jeans, I want to buy a shirt, I want to buy. It's an atomic thing. Do you want to get a flight? Do you want to get an accommodation? Imagine if you could do, I would like to go to Tokyo or what kind of gear do I need? What kind of overall grade do I need to go to a glacier? And it can identify all the different subtasks that are involved in it and then eventually show you the action. Well, it's all good that it exists, but the biggest thing is that it's actually difficult to build complex search. Google can get away with it. Amazon can get away with it. But if you imagine how do we make sure that it's available to the larger masses? It's available to just about any company for that matter, if they want to build that experience at this point.

Hamza Farooq:
This is from a talk that was given by Maxwell a couple of months ago. There are 10 billion search queries a day, estimated half of them go unanswered. Because people don't actually use search as what we used. Because again, also because of GPT coming in and the way we have been conversing with our products, our search is getting more coherent, as we would expect it to be. We would talk to a person and it's great for finding a website for more complex questions or tasks. It often falls too short because a lot of companies, 99.99% companies, I think they are just stuck on elasticsearch because it's cheaper to run it, it's easier, it's out of the box, and a lot of companies do not want to spend the money or they don't have the people to help them build that as a product, as an SDK that is available and they can implement and starts working for them. And the biggest thing is that there are complex search is not just one query, it's multiple queries, sessions or deep, which requires deep engagement with search. And what I mean by deep engagement is imagine when you go to Google right now, you put in a search, you can give feedback on your search, but there's nothing that you can do that it can unless you start a new search all over again.

Hamza Farooq:
In perplexity, you can ask follow up questions, but it's also a bit of a broken experience because you can't really reduce as you would do with Jarvis in Ironman. So imagine there's a human aspect to it. And let me show you another example of a copilot system, let's say. So this is an example of a copilot which we have been working on.

Demetrios:
There is a question, there's actually two really good questions that came through, so I'm going to stop you before you get into this. Cool copilot Carlos was asking, what about downtime? When it comes to these LLM services.

Hamza Farooq:
I think the downtime. This is the perfect question. If you have a production level system running on Chat GPT, you're going to learn within five days that you can't run a production system on Chat GPT and you need to host it by yourself. And then you start with hugging face and then you realize hugging face can also go down. So you basically go to bedrock, or you go to an AWS or GCP and host your LLM over there. So essentially it's all fun with demos to show oh my God, it works beautifully. But consistently, if you have an SLA that 99.9% uptime, you need to deploy it in an architecture with redundancies so that it's up and running. And the eventual solution is to have dedicated support to it.

Hamza Farooq:
It could be through Azure open AI, I think, but I think even Azure openi tends to go down with open ais out of it's a little bit.

Demetrios:
Better, but it's not 100%, that is for sure.

Hamza Farooq:
Can I just give you an example? Recently we came across a new thing, the token speed. Also varies with the day and with the time of the day. So the token generation. And another thing that we found out that instruct, GPT. Instruct was great, amazing. But it's leaking the data. Even in a rack solution, it's leaking the data. So you have to go back to then 16k.

Hamza Farooq:
It's really slow. So to generate an answer can take up to three minutes.

Demetrios:
Yeah. So it's almost this catch 22. What do you prefer, leak data or slow speeds? There's always trade offs, folks. There's always trade offs. So Mike has another question coming through in the chat. And Carlos, thanks for that awesome question Mike is asking, though I presume you could modify the search itinerary with something like, I prefer italian restaurants when possible. And I was thinking about that when it comes to. So to add on to what Mike is saying, it's almost like every single piece of your travel or your itinerary would be prefaced with, oh, I like my flights at night, or I like to sit in the aisle row, and I don't want to pay over x amount, but I'm cool if we go anytime in December, et cetera, et cetera.

Demetrios:
And then once you get there, I like to go into hotels that are around this part of this city. I think you get what I'm going at, but the preference list for each of these can just get really detailed. And you can preference all of these different searches with what you were talking about.

Hamza Farooq:
Absolutely. So I think that's a great point. And I will tell you about a company that we have been closely working with. It's called Tripsby or Tripspy AI, and we actually help build them the ecosystem where you can have personalized recommendations with private discovery. It's pretty much everything that you just said. I prefer at this time, I prefer this. I prefer this. And it sort of takes audio and text, and you can converse it through WhatsApp, you can converse it through different ways.

Hamza Farooq:
They are still in the beta mode, and they go selectively, but literally, they have built this, they have taken a lot more personalization into play, and because the database is all the same, it's Ahmedius who gives out, if I'm pronouncing correct, they give out the database for hotels or restaurants or availability, and then you can build things on top of it. So they have gone ahead and built something, but with more user expectation. Imagine you're trying to book a hotel, and you also get an article from New York Times that says, this is why this is a great, or a blogger that you follow and it sort of shows up in your. That is the strength that we have been powering, that you don't need to wait or you don't need to depend anymore on just the company's website itself. You can use the entire Internet to come up with an arsenal.

Demetrios:
Yeah.

Demetrios:
And your ability. I think another example of this would be how I love to watch TikTok videos and some of the stuff that pops up on my TikTok feed is like Amazon finds you need to know about, and it's talking about different cool things you can buy on Amazon. If Amazon knew that I was liking that on TikTok, it would probably show it to me next time I'm on Amazon.

Hamza Farooq:
Yeah, I mean, that's what cookies are, right? Yeah. It's a conspiracy theory that you're talking about a product and it shows up on.

Demetrios:
Exactly. Well, so, okay. This website that you're showing is absolutely incredible. Carlos had a follow up question before we jump into the next piece, which is around the quality of these open source models and how you deal with that, because it does seem that OpenAI, the GPT-3 four, is still quite a.

Hamza Farooq:
Bit ahead these days, and that's the silver bullet you have to buy. So what we suggest is have open llms as a backup. So at a point in time, I know it will be subpar, but something subpar might be a little better than breakdown of your complete system. And that's what we have been employed, we have deployed. What we've done is that when we're building large scale products, we basically tend to put an ecosystem behind or a backup behind, which is like, if the token rate is not what we want, if it's not working, it's taking too long, we automatically switch to a redundant version, which is open source. It does perform. Like, for instance, even right now, perplexity is running a lot of things on open source llms now instead of just GPT wrappers.

Demetrios:
Yeah. Gives you more control. So I didn't want to derail this too much more. I know we're kind of running low on time, so feel free to jump back into it and talk fast.

Demetrios:
Yeah.

Hamza Farooq:
So can you give me a time check? How are we doing?

Demetrios:
Yeah, we've got about six to eight minutes left.

Hamza Farooq:
Okay, so I'll cover one important thing of why I built my company, Traversaal.ai. This is a great slide to see what everyone is doing everywhere. Everyone is doing so many different things. They're looking into different products for each different thing. You can pick one thing. Imagine the concern with this is that you actually have to think about every single product that you have to pick up because you have to meticulously go through, oh, for this I need this. For this I need this. For this I need this.

Hamza Farooq:
All what we have done is that we have created one platform which has everything under one roof. And I'll show you with a very simple example. This is our website. We call ourselves one platform with multiple applications. And in this what we have is we have any kind of data format, pretty much that you have any kind of integrations which you need, for example, any applications. And I'll zoom in a little bit. And if you need domain specific search. So basically, if you're looking for Internet search to come in any kind of llms that are in the market, and vector databases, you see Qdrant right here.

Hamza Farooq:
And what kind of applications that are needed? Do you need a chatbot? You need a knowledge retrieval system, you need recommendation system? You need something which is a job matching tool or a copilot. So if you've built a one stop shop where a lot of times when a customer comes in, usually they don't come to us and say we need a pine cone or we need a Qdrant or we need a local llama, they say, this is the problem you're trying to solve. And we are coming from a problem solving initiative from our company is that we got this. You don't have to hire three ML engineers and two NLP research scientists and three people from here for the cost of two people. We can do an entire end to end implementation. Because what we have is 80% product which is built and we can tune the 20% to what you need. And that is such a powerful thing that once they start trusting us, and the best way to have them trust me is they can come to my class on maven, they can come to my class in Stanford, they come to my class in UCLA, or they can.

Demetrios:
Listen to this podcast and sort of.

Hamza Farooq:
It adds credibility to what we have been doing with them. Sorry, stop sharing what we have been doing with them and sort of just goes in that direction that we can do these things pretty fast and we tend to update. I want to just cover one slide. At the end of the day, this is the main slide. Right now. All engineers and product managers think of, oh, llms and Gen AI and this and that. I think one thing we don't talk about is UX experience. I just showed you a UX experience on Tripadvisor.

Hamza Farooq:
It's so easy to explain, right? Like you're like, oh, I know how to use it and you can already find problems with it, which means that they've done a great job thinking about a user experience. I predict one main thing. Ux people are going to be more rare who can work on gen AI products than product managers and tech people, because for tech people, they can follow and understand code and they can watch videos, business people, they're learning GPT prompting and so on and so forth. But the UX people, there's literally no teaching guide except for a Chat GPT interface. So this user experience, they are going to be, their worth is going to be inequal in gold. Not bitcoin, but gold. It's basically because they will have to build user experiences because we can't imagine right now what it will look like.

Demetrios:
Yeah, I 100% agree with that, actually.

Demetrios:
I.

Demetrios:
Imagine you have seen some of the work from Linus Lee from notion and how notion is trying to add in the clicks. Instead of having to always chat with the LLM, you can just point and click and give it things that you want to do. I noticed with the demo that you shared, it was very much that, like, you're highlighting things that you like to do and you're narrowing that search and you're giving it more context without having to type in. I like italian food and I don't like meatballs or whatever it may be.

Hamza Farooq:
Yes.

Demetrios:
So that's incredible.

Demetrios:
This is perfect, man.

Demetrios:
And so for anyone that wants to continue the conversation with you, you are on LinkedIn. We will leave a link to your LinkedIn. And you're also teaching on Maven. You're teaching in Stanford, UCLA, all this fun stuff. It's been great having you here.

Demetrios:
I'm very excited and I hope to have you back because it's amazing seeing what you're building and how you're building it.

Hamza Farooq:
Awesome. I think, again, it's a pleasure and an honor and thank you for letting.

Demetrios:
Me speak about the UX part a.

Hamza Farooq:
Lot because when you go to your customers, you realize that you need the UX and all those different things.

Demetrios:
Oh, yeah, it's so true. It is so true. Well, everyone that is out there watching.

Demetrios:
Us, thank you for joining and we will see you next time. Next week we'll be back for another.

Demetrios:
Session of these vector talks and I am pleased to have you again.

Demetrios:
Reach out to me if you want to join us.

Demetrios:
You want to give a talk? I'll see you all later. Have a good one.

Hamza Farooq:
Thank you. Bye.