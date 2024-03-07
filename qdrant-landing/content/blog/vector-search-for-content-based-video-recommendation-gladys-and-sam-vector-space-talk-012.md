---
draft: true
title: The challenges in using LLM-as-a-Judge - Sourabh Agrawal | Vector Space Talks
slug: llm-as-a-judge
short_description: Sourabh Agrawal discusses the intricate world of AI chatbots.
description: Diving into the realm of chatbots, Sourabh Agrawal sheds light on
  the intricacies of evaluating their performance, from real-time to
  post-feedback assessments, and introduces uptrendAI—an open-source tool for
  enhancing chatbot interactions through customized and logical evaluations.
preview_image: /blog/from_cms/sourabh-agrawal-bp-cropped.png
date: 2024-03-07T18:57:43.704Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - LLM
  - retrieval augmented generation
---
> "*You don't want to use an expensive model like GPT 4 for evaluation, because then the cost adds up and it does not work out. Right. If you are spending more on evaluating the responses, you may as well just do something else, like have a human to generate the responses.*”\
-- Sourabh Agrawal
> 

Sourabh Agrawal, CEO & Co-Founder at UpTrain AI is a seasoned entrepreneur and AI/ML expert with a diverse background. He began his career at Goldman Sachs, where he developed machine learning models for financial markets. Later, he contributed to the autonomous driving team at Bosch/Mercedes, focusing on computer vision modules for scene understanding. In 2020, Sourabh ventured into entrepreneurship, founding an AI-powered fitness startup that gained over 150,000 users. Throughout his career, he encountered challenges in evaluating AI models, particularly Generative AI models. To address this issue, Sourabh is developing UpTrain, an open-source LLMOps tool designed to evaluate, test, and monitor LLM applications. UpTrain provides scores and offers insights to enhance LLM applications by performing root-cause analysis, identifying common patterns among failures, and providing automated suggestions for resolution.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/1o7xdbdx32TiKe7OSjpZts?si=yCHU-FxcQCaJLpbotLk7AQ), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/vBJF2sy1Pyw).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/vBJF2sy1Pyw?si=H-HwmPHtFSfiQXjn" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/The-challenges-with-using-LLM-as-a-Judge---Sourabh-Agrawal--Vector-Space-Talks-013-e2fj7g8/a-aaurgd0" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Why is real-time evaluation critical in maintaining the integrity of chatbot interactions and preventing issues like promoting competitors or making false promises? What strategies do developers employ to minimize cost while maximizing the effectiveness of model evaluations, specifically when dealing with LLMs? These might be just some of the many questions people in the industry are asking themselves. Worry not! Because Demetrios and Sourabh will break it down for you.

Check out their conversation as they dive into the intricate world of AI chatbot evaluations. Discover the nuances of ensuring your chatbot's quality and continuous improvement across various metrics.

Here are the key topics of this episode:

1. **Evaluating Chatbot Effectiveness**: An exploration of systematic approaches to assess chatbot quality across various stages, encompassing retrieval accuracy, response generation, and user satisfaction.
2. **Importance of Real-Time Assessment**: Insights into why continuous and real-time evaluation of chatbots is essential to maintain integrity and ensure they function as designed without promoting undesirable actions.
3. **Indicators of Compromised Systems**: Understand the significance of identifying behaviors that suggest a system may be prone to 'jailbreaking' and the methods available to counter these through API integration.
4. **Cost-Effective Evaluation Models**: Discussion on employing smaller models for evaluation to reduce costs without compromising the depth of analysis, focusing on failure cases and root-cause assessments.
5. **Tailored Evaluation Metrics**: Emphasis on the necessity of customizing evaluation criteria to suit specific use case requirements, including an exploration of the different metrics applicable to diverse scenarios.

> Fun Fact: Sourabh discussed the use of Uptrend, an innovative API that provides scores and explanations for various data checks, facilitating logical and informed decision-making when evaluating AI models.
> 

## Show notes:

00:00 Prototype evaluation subjective; scalability challenges emerge.\
05:52 Use cheaper, smaller models for effective evaluation.\
07:45 Use LLM objectively, avoid subjective biases.\
10:31 Evaluate conversation quality and customization for AI.\
15:43 Context matters for AI model performance.\
19:35 Chat bot creates problems for car company.\
20:45 Real-time user query evaluations, guardrails, and jailbreak.\
27:27 Check relevance, monitor data, filter model failures.\
28:09 Identify common themes, insights, experiment with settings.\
32:27 Customize jailbreak check for specific app purposes.\
37:42 Mitigate hallucination using evaluation data techniques.\
38:59 Discussion on productizing hallucination mitigation techniques.\
42:22 Experimentation is key for system improvement.

## More Quotes from Sourabh:

*"There are some cases, let's say related to safety, right? Like you want to check whether the user is trying to jailbreak your LLMs or not. So in that case, what you can do is you can do this evaluation in parallel to the generation because based on just the user query, you can check whether the intent is to jailbreak or it's an intent to actually use your product to kind of utilize it for the particular model purpose.*”\
-- Sourabh Agrawal

*"You have to break down the response into individual facts and just see whether each fact is relevant for the question or not. And then take some sort of a ratio to get the final score. So that way all the biases which comes up into the picture, like egocentric bias, where LLM prefers its own outputs, those biases can be mitigated to a large extent.”*\
-- Sourabh Agrawal

*"Generally speaking, what we have been seeing is that the better context you retrieve, the better your model becomes.”*\
-- Sourabh Agrawal

## Transcript:
Demetrios:
Sourabh, I've got you here from Uptrain. I think you have some notes that you wanted to present, but I also want to ask you a few questions because we are going to be diving into a topic that is near and dear to my heart and I think it's been coming up so much recently that is using LLMs as a judge. It is really hot these days. Some have even gone as far to say that it is the topic of 2024. I would love for you to dive in. Let's just get right to it, man. What are some of the key topics when you're talking about using LLMs to evaluate what key metrics are you using? How does this work? Can you break it down?

Sourabh Agrawal:
Yeah. First of all, thanks a lot for inviting me and no worries for hiccup. I guess I have never seen a demo or a talk which goes without any technical hiccups. It is bound to happen. Really excited to be here. Really excited to talk about LLM evaluations. And as you rightly pointed right, it's really a hot topic and rightly so. Right.

Sourabh Agrawal:
The way things have been panning out with LLMs and chat, GPT and GPT four and so on, is that people started building all these prototypes, right? And the way to evaluate them was just like eyeball them, just trust your gut feeling, go with the vibe. I guess they truly adopted the startup methodology, push things out to production and break things. But what people have been realizing is that it's not scalable, right? I mean, rightly so. It's highly subjective. It's a developer, it's a human who is looking at all the responses, someday he might like this, someday he might like something else. And it's not possible for them to kind of go over, just read through more than ten responses. And now the unique thing about production use cases is that they need continuous refinement. You need to keep on improving them, you need to keep on improving your prompt or your retrieval, your embedding model, your retrieval mechanisms and so on.

Sourabh Agrawal:
So that presents a case like you have to use a more scalable technique, you have to use LLMs as a judge because that's scalable. You can have an API call, and if that API call gives good quality results, it's a way you can mimic whatever your human is doing or in a way augment them which can truly act as their copilot.

Demetrios:
Yeah. So one question that's been coming through my head when I think about using LLMs as a judge and I get more into it, has been around when do we use those API calls. It's not in the moment that we're looking for this output. Is it like just to see if this output is real? And then before we show it to the user, it's kind of in bunches after we've gotten a bit of feedback from the user. So that means that certain use cases are automatically discarded from this, right? Like if we are thinking, all right, we're going to use LLMs as a judge to make sure that we're mitigating hallucinations or that we are evaluating better, it is not necessarily something that we can do in the moment, if I'm understanding it correctly. So can you break that down a little bit more? How does it actually look in practice?

Sourabh Agrawal:
Yeah, definitely. And that's a great point. The way I see it, there are three cases. Case one is what you mentioned in the moment before showing the response to the user. You want to check whether the response is good or not. In most of the scenarios you can't do that because obviously checking requires extra time and you don't want to add latency. But there are some cases, let's say related to safety, right? Like you want to check whether the user is trying to jailbreak your LLMs or not. So in that case, what you can do is you can do this evaluation in parallel to the generation because based on just the user query, you can check whether the intent is to jailbreak or it's an intent to actually use your product to kind of utilize it for the particular model purpose.

Sourabh Agrawal:
But most of the other evaluations like relevance, hallucinations, quality and so on, it has to be done. Post whatever you show to the users and then there you can do it in two ways. You can either experiment with use them to experiment with things, or you can run monitoring on your production and find out failure cases. And typically we are seeing like developers are adopting a combination of these two to find cases and then experiment and then improve their systems.

Demetrios:
Okay, so when you're doing it in parallel, that feels like something that is just asking you craft a prompt and as soon as. So you're basically sending out two prompts. Another piece that I have been thinking about is, doesn't this just add a bunch more cost to your system? Because there you're effectively doubling your cost. But then later on I can imagine you can craft a few different ways of making the evaluations and sending out the responses to the LLM better, I guess. And you can figure out how to trim some tokens off, or you can try and concatenate some of the responses and do tricks there. I'm sure there's all kinds of tricks that you know about that I don't, and I'd love to tell you to tell me about them, but definitely what kind of cost are we looking at? How much of an increase can we expect?

Sourabh Agrawal:
Yeah, so I think that's like a very valid limitation of evaluation. So that's why, let's say at uptrend, what we truly believe in is that you don't want to use an expensive model like GPT four for evaluation, because then the cost adds up and it does not work out. Right. If you are spending more on evaluating the responses, you may as well just do something else, like have a human to generate the responses. We rely on smaller models, on cheaper models for this. And secondly, the methodology which we adopt is that you don't want to evaluate everything on all the data points. Like maybe you have a higher level check, let's say, for jailbreak or let's say for the final response quality. And when you find cases where the quality is low, you run a battery of checks on these failures to figure out which part of the pipeline is exactly failing.

Sourabh Agrawal:
This is something what we call as like root cause analysis, where you take all these failure cases, which may be like 10% or 20% of the cases out of all what you are seeing in production. Take these 20% cases, run like a battery of checks on them. They might be exhaustive. You might run like five to ten checks on them. And then based on those checks, you can figure out that, what is the error mode? Is it a retrieval problem? Is it a citation problem? Is it a utilization problem? Is it hallucination? Is the query like the question asked by the user? Is it not clear enough? Is it like your embedding model is not appropriate? So that's how you can kind of take best of the two. Like, you can also improve the performance at the same time, make sure that you don't burn a hole in your pocket.

Demetrios:
I've also heard this before, and it's almost like you're using the LLMs as tests and they're helping you write. It's not that they're helping you write tests, it's that they are there and they're part of the tests that you're writing.

Sourabh Agrawal:
Yeah, I think the key here is that you have to use them objectively. What I have seen is a lot of people who are trying to do LLM evaluations, what they do is they ask the LLM that, okay, this is my response. Can you tell is it relevant or not? Or even, let's say, they go a step beyond and do like a grading thing, that is it highly relevant, somewhat relevant, highly irrelevant. But then it becomes very subjective, right? It depends upon the LLM to decide whether it's relevant or not. Rather than that you have to transform into an objective setting. You have to break down the response into individual facts and just see whether each fact is relevant for the question or not. And then take some sort of a ratio to get the final score. So that way all the biases which comes up into the picture, like egocentric bias, where LLM prefers its own outputs, those biases can be mitigated to a large extent.

Sourabh Agrawal:
And I believe that's the key for making LLM evaluations work, because similar to LLM applications, even LLM evaluations, you have to put in a lot of efforts to make them really work and finally get some scores which align well with human expectations.

Demetrios:
It's funny how these LLMs mimic humans so much. They love the sound of their own voice, even. It's hilarious. Yeah, dude. Well, talk to me a bit more about how this looks in practice, because there's a lot of different techniques that you can do. Also, I do realize that when it comes to the use cases, it's very different, right. So if it's code generation use case, and you're evaluating that, it's going to be pretty clear, did the code run or did it not? And then you can go into some details on is this code actually more valuable? Is it a hacked way to do it? Et cetera, et cetera. But there's use cases that I would consider more sensitive and less sensitive.

Demetrios:
And so how do you look at that type of thing?

Sourabh Agrawal:
Yeah, I think so. The way even we think about evaluations is there's no one size fit all solution for different use cases. You need to look at different things. And even if you, let's say, looking at hallucinations, different use cases, or different businesses would look at evaluations from different lenses. Right. For someone, whatever, if they are focusing a lot on certain aspects of the correctness, someone else would focus less on those aspects and more on other aspects. The way we think about it is, know, we define different criteria for different use cases. So if you have A-Q-A bot, right? So you look at the quality of the response, the quality of the context.

Sourabh Agrawal:
If you have a conversational agent, then you look at the quality of the conversation as a whole. You look at whether the user is satisfied with that conversation. If you are writing long form content. Like, you look at coherence across the content, you look at the creativity or the sort of the interestingness of the content. If you have an AI agent, you look at how well they are able to plan, how well they were able to execute a particular task, and so on. How many steps do they take to achieve their objective? So there are a variety of these evaluation matrices, which are each one of which is more suitable for different use cases. And even there, I believe a good tool needs to provide certain customization abilities to their developers so that they can transform it, they can modify it in a way that it makes most sense for their business.

Demetrios:
Yeah. Is there certain ones that you feel like are more prevalent and that if I'm just thinking about this, I'm developing on the side and I'm thinking about this right now and I'm like, well, how could I start? What would you recommend?

Sourabh Agrawal:
Yeah, definitely. One of the biggest use case for LLMs today is rag. Applications for Rag. I think retrieval is the key. So I think the best starting points in terms of evaluations is like look at the response quality, so look at the relevance of the response, look at the completeness of the response, look at the context quality. So like context relevance, which judges the retrieval quality. Hallucinations, which judges whether the response is grounded by the context or not. If tone matters for your use case, look at the tonality and finally look at the conversation satisfaction, because at the end, whatever outputs you give, you also need to judge whether the end user is satisfied with these outputs.

Sourabh Agrawal:
So I would say these four or five matrices are the best way for any developer to start who is building on top of these LLMs. And from there you can understand how the behavior is going, and then you can go more deeper, look at more nuanced metrics, which can help you understand your systems even better.

Demetrios:
Yeah, I like that. Now, one thing that has also been coming up in my head a lot are like the custom metrics and custom evaluation and also proprietary data set, like evaluation data sets, because as we all know, the benchmarks get gamed. And you see on Twitter, oh wow, this new model just came out. It's so good. And then you try it and you're like, what are you talking about? This thing just was trained on the benchmarks. And so it seems like it's good, but it's not. And can you talk to us about creating these evaluation data sets? What have you seen as far as the best ways of going about it? What kind of size? Like how many do we need to actually make it valuable. And what is that? Give us a breakdown there?

Sourabh Agrawal:
Yeah, definitely. So, I mean, surprisingly, the answer is that you don't need that many to get started. We have seen cases where even if someone builds a test data sets of like 50 to 100 samples, that's actually like a very good starting point than where they were in terms of manual annotation and in terms of creation of this data set, I believe that the best data set is what actually your users are asking. You can look at public benchmarks, you can generate some synthetic data, but none of them matches the quality of what actually your end users are looking, because those are going to give you issues which you can never anticipate. Right. Even you're generating and synthetic data, you have to anticipate what issues can come up and generate data. Beyond that, if you're looking at public data sets, they're highly curated. There is always problems of them leaking into the training data and so on.

Sourabh Agrawal:
So those benchmarks becomes highly reliable. So look at your traffic, take 50 samples from them. If you are collecting user feedback. So the cases where the user has downvoted or the user has not accepted the response, I mean, they are very good cases to look at. Or if you're running some evaluations, quality checks on that cases which are failing, I think they are the best starting point for you to have a good quality test data sets and use that as a way to experiment with your prompts, experiment with your systems, experiment with your retrievals, and iteratively improve them.

Demetrios:
Are you weighing any metrics more than others? Because I've heard stories about how sometimes you'll see that a new model will come out, or you're testing out a new model, and it seems like on certain metrics, it's gone down. But then the golden metric that you have, it actually has gone up. And so have you seen which metrics are better for different use cases?

Sourabh Agrawal:
I think for here, there's no single answer. I think that metric depends upon the business. Generally speaking, what we have been seeing is that the better context you retrieve, the better your model becomes. Especially like if you're using any of the bigger models, like any of the GPT or claudes, or to some extent even mistral, is highly performant. So if you're using any of these highly performant models, then if you give them the right context, the response more or less, it comes out to be good. So I think one thing which we are seeing people focusing a lot on, experimenting with different retrieval mechanisms, embedding models, and so on. But then again, the final golden key, I think many people we have seen, they annotate some data set so they have like a ground root response or a golden response, and they completely rely on just like how well their answer matches with that golden response, which I believe it's a very good starting point because now you know that, okay, if this is right and you're matching very highly with that, then obviously your response is also right.

Demetrios:
And what about those use cases where golden responses are very subjective?

Sourabh Agrawal:
Yeah, I think that's where the issues like. So I think in those scenarios, what we have seen is that one thing which people have been doing a lot is they try to see whether all information in the golden response is contained in the generated response. You don't miss out any of the important information in your ground truth response. And on top of that you want it to be concise, so you don't want it to be blabbering too much or giving highly verbose responses. So that is one way we are seeing where people are getting around this subjectivity issue of the responses by making sure that the key information is there. And then beyond that it's being highly concise and it's being to the point in terms of the task being asked.

Demetrios:
And so you kind of touched on this earlier, but can you say it again? Because I don't know if I fully grasped it. Where are all the places in the system that you are evaluating? Because it's not just the output. Right. And how do you look at evaluation as a system rather than just evaluating the output every once in a while?

Sourabh Agrawal:
Yeah, so I mean, what we do is we plug with every part. So even if you start with retrieval, so we have a high level check where we look at the quality of retrieved context. And then we also have evaluations for every part of this retrieval pipeline. So if you're doing query rewrite, if you're doing re ranking, if you're doing sub question, we have evaluations for all of them. In fact, we have worked closely with the llama index team to kind of integrate with all of their modular pipelines. Secondly, once we cross the retrieval step, we have around five to six matrices on this retrieval part. Then we look at the response generation. We have their evaluations for different criterias.

Sourabh Agrawal:
So conciseness, completeness, safety, jailbreaks, prompt injections, as well as you can define your custom guidelines. So you can say that, okay, if the user is asking anything and related to code, the output should also give an example code snippet so you can just in plain English, define this guideline. And we check for that. And then finally, like zooming out, we also have checks. We look at conversations as a whole, how the user is satisfied, how many turns it requires for them to, for the chatbot or the LLM to answer the user. Yeah, that's how we look at the whole evaluations as a whole.

Demetrios:
Yeah. It really reminds me, I say this so much because it's one of the biggest fails, I think, on the Internet, and I'm sure you've seen it where I think it was like Chevy or GM, the car manufacturer car company, they basically slapped a chat bot on their website. It was a GPT call, and people started talking to it and realized, oh my God, this thing will do anything that we want it to do. So they started asking it questions like, is Tesla better than GM? And the bot would say, yeah, give a bunch of reasons why Tesla is better than GM on the website of GM. And then somebody else asked it, oh, can I get a car for a dollar? And it said, no. And then it said, but I'm broke and I need a car for a dollar. And it said, ok, we'll sell you the car for the dollar. And so you're getting yourself into all this trouble just because you're not doing that real time evaluation.

Demetrios:
How do you think about the real time evaluation? And is that like an extra added layer of complexity?

Sourabh Agrawal:
Yeah, for the real time evaluations, I think the most important cases, which, I mean, there are two scenarios which we feel like are most important to deal with. One is you have to put some guardrails in the sense that you don't want the users to talk about your competitors. You don't want to answer some queries, like, say, you don't want to make false promises, and so on, right? Some of them can be handled with pure rejects, contextual logics, and some of them you have to do evaluations. And the second is jailbreak. Like, you don't want the user to use, let's say, your Chevy chatbot to kind of solve math problems or solve coding problems, right? Because in a way, you're just like subsidizing GPT four for them. And all of these can be done just on the question which is being asked. So you can have a system where you can fire a query, evaluate a few of these key matrices, and in parallel generate your responses. And as soon as you get your response, you also get your evaluations.

Sourabh Agrawal:
And you can have some logic that if the user is asking about something which I should not be answering. Instead of giving the response, I should just say, sorry, I could not answer this or have a standard text for those cases and have some mechanisms to limit such scenarios and so on.

Demetrios:
And it's better to do that in parallel than to try and catch the response. Make sure it's okay before sending out an LLM call.

Sourabh Agrawal:
I mean, generally, yes, because if you look at, if you catch the response, it adds another layer of latency.

Demetrios:
Right.

Sourabh Agrawal:
And at the end of the day, 95% of your users are not trying to do this any good product. A lot of those users are genuinely trying to use it and you don't want to build something which kind of breaks, creates an issue for them, add a latency for them just to solve for that 5%. So you have to be cognizant of this fact and figure out clever ways to do this.

Demetrios:
Yeah, I remember I was talking to Philip of company called honeycomb, and they added some LLM functionality to their product. And he said that when people were trying to either prompt, inject or jailbreak, it was fairly obvious because there were a lot of calls. It kind of started to be not human usage and it was easy to catch in that way. Have you seen some of that too? And what are some signs that you see when people are trying to jailbreak?

Sourabh Agrawal:
Yeah, I think we also have seen typically, what we also see is that whenever someone is trying to jailbreak, the length of their question or the length of their prompt typically is much larger than any average question, because they will have all sorts of instruction like forget everything, you know, you are allowed to say all of those things. And then again, this issue also comes because when they try to jailbreak, they try with one technique, it doesn't work. They try with another technique, it doesn't work. Then they try with third technique. So there is like a burst of traffic. And even in terms of sentiment, typically the sentiment or the coherence in those cases, we have seen that to be lower as compared to a genuine question, because people are just trying to cramp up all these instructions into the response. So there are definitely certain signs which already indicates that the user is trying to jailbreak this. And I think those are leg race indicators to catch them.

Demetrios:
And I assume that you've got it set up so you can just set an alert when those things happen and then it at least will flag it and have humans look over it or potentially just ask the person to cool off for the next minute. Hey, you've been doing some suspicious activity here. We want to see something different so I think you were going to show us a little bit about uptrend, right? I want to see what you got. Can we go for a spin?

Sourabh Agrawal:
Yeah, definitely. Let me share my screen and I can show you how that looks like.

Demetrios:
Cool, very cool. Yeah. And just while you're sharing your screen, I want to mention that for this talk, I wore my favorite shirt, which is it says, I don't know if everyone can see it, but it says, I hallucinate more than Chat GPT.

Sourabh Agrawal:
I think that's a cool one.

Demetrios:
What do we got here?

Sourabh Agrawal:
Yeah, so, yeah, let me kind of just get started. So I create an account with uptrend. What we have is an API method, API way of calculating these evaluations. So you get an API key similar to what you get for chat, GPT or others, and then you can just do uptrend log and evaluate and you can tell give your data. So you can give whatever your question responses context, and you can define your checks which you want to evaluate for. So if I create an API key, I can just copy this code and I just already have it here. So I'll just show you. So we have two mechanisms.

Sourabh Agrawal:
One is that you can just run evaluations so you can define like, okay, I want to run context relevance, I want to run response completeness. Similarly, I want to run jailbreak. I want to run for safety. I want to run for satisfaction of the users and so on. And then when you run it, it gives back you a score and it gives back you an explanation on why this particular score has been given for this particular question.

Demetrios:
Can you make that a little bit bigger? Yeah, just give us some plus. Yeah, there we.

Sourabh Agrawal:
It'S, it's essentially an API call which takes the data, takes the list of checks which you want to run, and then it gives back and score and an explanation for that. So based on that score, you can have logics, right? If the jailbreak score is like more than 0.5, then you don't want to show it. Like you want to switch back to a default response and so on. And then you can also configure that we log all of these course, and we have dashboard where you can access them.

Demetrios:
I was just going to ask if you have dashboards. Everybody loves a good dashboard. Let's see it. That's awesome.

Sourabh Agrawal:
So let's see. Okay, let's take this one. So in this case, I just ran some of this context relevance checks for some of the queries. So you can see how that changes on your data sets. If you're running the same. We also run this in a monitoring setting, so you can see how this varies over time. And then finally you have all of the data. So we provide all of the data, you can download it, run whatever analysis you want to run, and then you can also, one of the features which we have built recently and is getting very popular amongst our users is that you can filter cases where, let's say, the model is failing.

Sourabh Agrawal:
So let's say I take all the cases where the responses is zero and I can find common topics. So I can look at all these cases and I can find, okay, what's the common theme across them? Maybe, as you can see, they're all talking about France, Romeo Juliet and so on. So it can just pull out a common topic among these cases. So then this gives you some insights into where things are going wrong and what do you need to improve upon. And the second piece of the puzzle is the experiments. So, not just you can evaluate them, but also you can use it to experiment with different settings. So let's say. Let me just pull out an experiment I ran recently.

Demetrios:
Yeah.

Sourabh Agrawal:
So let's say I want to compare two different models, right? So GPT 3.5 and clot two. So I can now see that, okay, clot two is giving more concise responses, but in terms of factual accuracy, like GPT 3.5 is more factually accurate. So I can now decide, based on my application, based on what my users want, I can now decide which of these criteria is more meaningful for me, it's more meaningful for my users, for my data, and decide which prompt or which model I want to go ahead with.

Demetrios:
This is totally what I was talking about earlier, where you get a new model and you're seeing on some metrics, it's doing worse. But then on your core metric that you're looking at, it's actually performing better. So you have to kind of explain to yourself, why is it doing better on those other metrics? I don't know if I'm understanding this correctly. We can set the metrics that we're looking at.

Sourabh Agrawal:
Yeah, actually, I'll show you the kind of metric. Also, I forgot to mention earlier, uptrend is like open source.

Demetrios:
Nice.

Sourabh Agrawal:
Yeah. So we have these pre configured checks, so you don't need to do anything. You can just say uptrend response completeness or uptrend prompt injection. So these are like, pre configured. So we did the hard work of getting all these scores and so on. And on top of that, we also have ways for you to customize these matrices so you can define a custom guideline. You can change the prompt which you want. You can even define a custom python function which you want to act as an evaluator.

Sourabh Agrawal:
So we provide all of those functionalities so that they can also take advantage of things which are already there, as well as they can create custom things which make sense for them and have a way to kind of truly understand how their systems are doing.

Demetrios:
Oh, that's really cool. I really like the idea of custom, being able to set custom ones, but then also having some that just come right out of the box to make life easier on us.

Sourabh Agrawal:
Yeah. And I think both are needed because you want someplace to start, and as you advance, you also want to kind of like, you can't cover everything right, with pre configured. So you want to have a way to customize things.

Demetrios:
Yeah. And especially once you have data flowing, you'll start to see what other things you need to be evaluating exactly.

Sourabh Agrawal:
Yeah, that's very true.

Demetrios:
Just the random one. I'm not telling you how to build your product or anything, but have you thought about having a community sourced metric? So, like, all these custom ones that people are making, maybe there's a hub where we can add our custom?

Sourabh Agrawal:
Yeah, I think that's really interesting. This is something we also have been thinking a lot. It's not built out yet, but we plan to kind of go in that direction pretty soon. We want to kind of create, like a store kind of a thing where people can add their custom matrices. So. Yeah, you're right on. I think I also believe that's the way to go, and we will be releasing something on those fronts pretty soon.

Demetrios:
Nice. So drew's asking, how do you handle jailbreak for different types of applications? Jailbreak for a medical app would be different than one for a finance one, right? Yeah.

Sourabh Agrawal:
The way our jailbreak check is configured. So it takes something, what you call as a model purpose. So you define what is the purpose of your model? For a financial app, you need to say that, okay, this LLM application is designed to answer financial queries so and so on. From medical. You will have a different purpose, so you can configure what is the purpose of your app. And then when we take up a user query, we check whether the user query is under. Firstly, we check also for illegals activities and so on. And then we also check whether it's under the preview of this purpose.

Sourabh Agrawal:
If not, then we tag that as a scenario of jailbreak because the user is trying to do something other than the purpose so that's how we tackle it.

Demetrios:
Nice, dude. Well, this is awesome. Is there anything else you want to say before we jump off?

Sourabh Agrawal:
No, I mean, it was like, a great conversation. Really glad to be here and great talking to you.

Demetrios:
Yeah, I'm very happy that we got this working and you were able to show us a little bit of uptrend. Super cool that it's open source. So I would recommend everybody go check it out, get your LLMs working with confidence, and make sure that nobody is using your chatbot to be their GPT subsidy, like GM use case and. Yeah, it's great, dude. I appreciate.

Sourabh Agrawal:
Yeah, check us out like we are@GitHub.com. Slash uptrendai slashuptrend.

Demetrios:
There we go. And if anybody else wants to come on to the vector space talks and talk to us about all the cool stuff that you're doing, hit us up and we'll see you all astronauts later. Don't get lost in vector space.

Sourabh Agrawal:
Yeah, thank you. Thanks a lot.

Demetrios:
All right, dude. There we go. We are good. I don't know how the hell I'm going to stop this one because I can't go through on my phone or I can't go through on my computer. It's so weird. So I'm not, like, technically there's nobody at the wheel right now. So I think if we both get off, it should stop working. Okay.

Demetrios:
Yeah, but that was awesome, man. This is super cool. I really like what you're doing, and it's so funny. I don't know if we're not connected on LinkedIn, are we? I literally just today posted a video of me going through a few different hallucination mitigation techniques. So it's, like, super timely that you talk about this. I think so many people have been thinking about this.

Sourabh Agrawal:
Definitely with enterprises, it's like a big issue. Right? I mean, how do you make it safe? How do you make it production ready? So I'll definitely check out your video. Also would be super interesting.

Demetrios:
Just go to my LinkedIn right now. It's just like LinkedIn.com dpbrinkm or just search for me. I think we are connected. We're connected. All right, cool. Yeah, so, yeah, check out the last video I just posted, because it's literally all about this. And there's a really cool paper that came out and you probably saw it. It's all like, mitigating AI hallucinations, and it breaks down all 32 techniques.

Demetrios:
And I was talking with on another podcast that I do, I was literally talking with the guys from weights and biases yesterday, and I was talking about how I was like, man, these evaluation data sets as a service feels like something that nobody's doing. And I guess it's probably because, and you're the expert, so I would love to hear what you have to say about it, but I guess it's because you don't really need it that bad. With a relatively small amount of data, you can start getting some really good evaluation happening. So it's a lot better than paying somebody else.

Sourabh Agrawal:
And also, I think it doesn't make sense also for a service because some external person is not best suited to make a data set for your use case.

Demetrios:
Right.

Sourabh Agrawal:
It's you. You have to look at what your users are asking to create a good data set. You can have a method, which is what optrain also does. We basically help you to sample and pick out the right cases from this data set based on the feedback of your users, based on the scores which are being generated. But it's difficult for someone external to craft really good questions or really good queries or really good cases which make sense for your business.

Demetrios:
Because the other piece that kind of, like, spitballed off of that, the other piece of it was techniques. So let me see if I can place all this words into a coherent sentence for you. It's basically like, okay, evaluation data sets don't really make sense because you're the one who knows the most. With a relatively small amount of data, you're going to be able to get stuff going real quick. What I thought about is, what about these hallucination mitigation techniques so that you can almost have options. So in this paper, right, there's like 32 different kinds of techniques that they use, and some are very pertinent for rags. They have like, five different or four different types of techniques. When you're dealing with rags to mitigate hallucinations, then they have some like, okay, if you're distilling a model, here is how you can make sure that the new distilled model doesn't hallucinate as much.

Demetrios:
Blah, blah, blah. But what I was thinking is like, what about how can you get a product? Or can you productize these kind of techniques? So, all right, cool. They're in this paper, but in uptrain, can we just say, oh, you want to try this new mitigation technique? We make that really easy for you. You just have to select it as one of the hallucination mitigation techniques. And then we do the heavy lifting of, if it's like, there's one. Have you heard of fleek? That was one that I was talking about in the video. Fleek is like where there's a knowledge graph, LLM that is created, and it is specifically created to try and combat hallucinations. And the way that they do it is they say that LLM will try and identify anywhere in the prompt or the output.

Demetrios:
Sorry, the output. It will try and identify if there's anything that can be fact checked. And so if it says that humans landed on the moon in 1969, it will identify that. And then either through its knowledge graph or through just forming a search query that will go out and then search the Internet, it will verify if that fact is true in the output. So that's like one technique, right? And so what I'm thinking about is like, oh, man, wouldn't it be cool if you could have all these different techniques to be able to use really easily as opposed to, great, I read it in a paper. Now, how the fuck am I going to get my hands on one of these LLMs with a knowledge graph if I don't train it myself?

Sourabh Agrawal:
Shit, yeah, I think that's a great suggestion. I'll definitely check it out. One of the things which we also want to do is integrate with all these techniques because these are really good techniques and they help solve a lot of problems, but using them is not simple. Recently we integrated with Spade. It's basically like a technique where I.

Demetrios:
Did another video on spade, actually.

Sourabh Agrawal:
Yeah, basically. I think I'll also check out these hallucinations. So right now what we do is based on this paper called fact score, which instead of checking on the Internet, it checks in the context only to verify this fact can be verified from the context or not. But I think it would be really cool if people can just play around with these techniques and just see whether it's actually working on their data or not.

Demetrios:
That's kind of what I was thinking is like, oh, can you see? Does it give you a better result? And then the other piece is like, oh, wait a minute, does this actually, can I put like two or three of them in my system at the same time? Right. And maybe it's over engineering or maybe it's not. I don't know. So there's a lot of fun stuff that can go down there and it's fascinating to think about.

Sourabh Agrawal:
Yeah, definitely. And I think experimentation is the key here, right? I mean, unless you try out them, you don't know what works. And if something works which improves your system, then definitely it was worth it.

Demetrios:
Thanks for that.

Sourabh Agrawal:
We'll check into it.

Demetrios:
Dude, awesome. It's great chatting with you, bro. And I'll talk to you later, bro.

Sourabh Agrawal:
Yeah, thanks a lot. Great speaking. See you. Bye.
