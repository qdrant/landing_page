---
draft: false
title: Insight Generation Platform for LifeScience Corporation - Hooman
  Sedghamiz | Vector Space Talks
slug: insight-generation-platform
short_description: Hooman Sedghamiz explores the potential of large language
  models in creating cutting-edge AI applications.
description: Hooman Sedghamiz discloses the potential of AI in life sciences,
  from custom knowledge applications to improving crop yield predictions, while
  tearing apart the nuances of in-house AI deployment for multi-faceted
  enterprise efficiency.
preview_image: /blog/from_cms/hooman-sedghamiz-bp-cropped.png
date: 2024-03-25T08:46:28.227Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - Retrieval Augmented Generation
  - Insight Generation Platform
---
> *"There is this really great vector db comparison that came out recently. I saw there are like maybe more than 40 vector stores in 2024. When we started back in 2023 was only a few. What I see, which is really lacking in this pipeline of retrieval augmented generation is major innovation around data pipeline.”*\
-- Hooman Sedghamiz
> 

Hooman Sedghamiz**,** Sr. Director AI/ML - Insights at Bayer AG is a distinguished figure in AI and ML in the life sciences field. With years of experience, he has led teams and projects that have greatly advanced medical products, including implantable and wearable devices. Notably, he served as the Generative AI product owner and Senior Director at Bayer Pharmaceuticals, where he played a pivotal role in developing a GPT-based central platform for precision medicine. 

In 2023, he assumed the role of Co-Chair for the EMNLP 2023 GEM industrial track, furthering his contributions to the field. Hooman has also been an AI/ML advisor and scientist at the University of California, San Diego, leveraging his expertise in deep learning to drive biomedical research and innovation. His strengths lie in guiding data science initiatives from inception to commercialization and bridging the gap between medical and healthcare applications through MLOps, LLMOps, and deep learning product management. Engaging with research institutions and collaborating closely with Dr. Nemati at Harvard University and UCSD, Hooman continues to be a dynamic and influential figure in the data science community.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/2oj2ne5l9qrURQSV0T1Hft?si=DMJRTAt7QXibWiQ9CEKTJw), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/yfzLaH5SFX0).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/yfzLaH5SFX0?si=I8dw5QddKbPzPVOB" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Charting-New-Frontiers-Creating-a-Pioneering-Insight-Generation-Platform-for-a-Major-Life-Science-Corporation---Hooman-Sedghamiz--Vector-Space-Talks-014-e2fqnnc/a-aavffjd" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Why is real-time evaluation critical in maintaining the integrity of chatbot interactions and preventing issues like promoting competitors or making false promises? What strategies do developers employ to minimize cost while maximizing the effectiveness of model evaluations, specifically when dealing with LLMs? These might be just some of the many questions people in the industry are asking themselves. We aim to cover most of it in this talk.

Check out their conversation as they peek into world of AI chatbot evaluations. Discover the nuances of ensuring your chatbot's quality and continuous improvement across various metrics.

Here are the key topics of this episode:

1. **Evaluating Chatbot Effectiveness**: An exploration of systematic approaches to assess chatbot quality across various stages, encompassing retrieval accuracy, response generation, and user satisfaction.
2. **Importance of Real-Time Assessment**: Insights into why continuous and real-time evaluation of chatbots is essential to maintain integrity and ensure they function as designed without promoting undesirable actions.
3. **Indicators of Compromised Systems**: Understand the significance of identifying behaviors that suggest a system may be prone to 'jailbreaking' and the methods available to counter these through API integration.
4. **Cost-Effective Evaluation Models**: Discussion on employing smaller models for evaluation to reduce costs without compromising the depth of analysis, focusing on failure cases and root-cause assessments.
5. **Tailored Evaluation Metrics**: Emphasis on the necessity of customizing evaluation criteria to suit specific use case requirements, including an exploration of the different metrics applicable to diverse scenarios.

>Fun Fact: Large language models like Mistral, Llama, and Nexus Raven have improved in their ability to perform function calling with low hallucination and high-quality output.

> 

## Show notes:

00:00 Introduction to Bayer AG\
05:15 Drug discovery, trial prediction, medical virtual assistants.\
10:35 New language models like Llama rival GPT 3.5.\
12:46 Large language model solving, efficient techniques, open source.\
16:12 Scaling applications for diverse, individualized models.\
19:02 Open source offers multilingual embedding.\
25:06 Stability improved, reliable function calling capabilities emerged.\
27:19 Platform aims for efficiency, measures impact.\
31:01 Build knowledge discovery tool, measure value\
33:10 Wrap up

## More Quotes from Hooman:

*"I think there has been concentration around vector stores. So a lot of startups that have appeared around vector store idea, but I think what really is lacking are tools that you have a lot of sources of knowledge, information.*”\
-- Hooman Sedghamiz

*"You can now kind of take a look and see that the performance of them is really, really getting close, if not better than GPT 3.5 already at same level and really approaching step by step to GPT 4.”*\
-- Hooman Sedghamiz in advancements in language models

*"I think the biggest, I think the untapped potential, it goes back to when you can do scientific discovery and all those sort of applications which are more challenging, not just around the efficiency and all those sort of things.”*\
-- Hooman Sedghamiz

## Transcript:
Demetrios:
We are here and I couldn't think of a better way to spend my Valentine's Day than with you Hooman this is absolutely incredible. I'm so excited for this talk that you're going to bring and I want to let everyone that is out there listening know what caliber of a speaker we have with us today because you have done a lot of stuff. Folks out there do not let this man's young look fool you. You look like you are not in your fifty's or sixty's. But when it comes to your bio, it looks like you should be in your seventy's. I am very excited. You've got a lot of experience running data science projects, ML projects, LLM projects, all that fun stuff. You're working at Bayern Munich, sorry, not Bayern Munich, Bayer AG. And you're the senior director of AI and ML.


Demetrios:
And I think that there is a ton of other stuff that you've done when it comes to machine learning, artificial intelligence. You've got both like the traditional ML background, I think, and then you've also got this new generative AI background and so you can leverage both. But you also think about things in data engineering way. You understand the whole lifecycle. And so today we get to talk all about some of this fun. I know you've got some slides prepared for us. I'll let you throw those on and I'll let anyone else in the chat. Feel free to ask questions while Hooman is going through the presentation and I'll jump in and stop them when needed.


Demetrios:
But also we can have a little discussion after a few minutes of slides. So for everyone looking, we're going to be watching this and then we're going to be checking out like really talking about what 2024 AI in the enterprise looks like and what is needed to really take advantage of that. So Hooman, I'm dropping off to you, man, and I'll jump in when needed.


Hooman Sedghamiz:
Thanks a lot for the introduction. Let me get started. Do you have my screen already?

Demetrios:
Yeah, we see it.

Hooman Sedghamiz:
Okay, perfect. All right, so hopefully I can change the slides. Yes, as you said, first, thanks a lot for spending your day with me. I know it's Valentine's Day, at least here in the US people go crazy when it gets Valentine's. But I know probably a lot of you are in love with large language models, semantic search and all those sort of things, so it's great to have you here. Let me just start with the. I have a lot of slides, by the way, but maybe I can start with kind of some introduction about the company I work for, what these guys are doing and what we are doing at a life science company like Bayer, which is involved in really major humanity needs, right? So health and the food chain and like agriculture, we do three major kind of products or divisions in the company, mainly consumer halls, over the counter medication that probably a lot of you have taken, aspirin, all those sort of good stuff. And we have crop science division that works on ensuring that the yield is high for crops and the food chain is performing as it should, and also pharmaceutical side which is around treatment and prevention.

Hooman Sedghamiz:
So now you can imagine via is really important to us because it has the potential of unlocking a future where good health is a reality and hunger is a memory. So I maybe start about maybe giving you a hint of what are really the numerous use cases that AI or challenges that AI could help out with. In life science industry. You can think of adverse event detection when patients are taking a medication, too much of it. The patients might report adverse events, stomach bleeding and go to social media post about it. A few years back, it was really difficult to process automatically all this sort of natural text in a kind of scalable manner. But nowadays, thanks to large language models, it's possible to automate this and identify if there is a medication or anything that might have negatively an adverse event on a patient population. Similarly, you can now create a lot of marketing content using these large language models for products.

Hooman Sedghamiz:
At the same time, drug discovery is making really big strides when it comes to identifying new compounds. You can essentially describe these compounds using formats like smiles, which could be represented as real text. And these large language models can be trained on them and they can predict the sequences. At the same time, you have this clinical trial outcome prediction, which is huge for pharmaceutical companies. If you could predict what will be the outcome of a trial, it would be a huge time and resource saving for a lot of companies. And of course, a lot of us already see in the market a lot of medical virtual assistants using large language models that can answer medical inquiries and give consultations around them. And there is really, I believe the biggest potential here is around real world data, like most of us nowadays, have some sort of sensor or watch that's measuring our health maybe at a minute by minute level, or it's measuring our heart rate. You go to the hospital, you have all your medical records recorded there, and these large language models have their capacity to process this complex data, and you will be able to drive better insights for individualized insights for patients.

Hooman Sedghamiz:
And our company is also in crop science, as I mentioned, and crop yield prediction. If you could help farmers improve their crop yield, it means that they can produce better products faster with higher quality. So maybe I could start with maybe a history in 2023, what happened? How companies like ours were looking at large language models and opportunities. They bring, I think in 2023, everyone was excited to bring these efficiency games, right? Everyone wanted to use them for creating content, drafting emails, all these really low hanging fruit use cases. That was around. And one of the earlier really nice architectures that came up that I really like was from a 16 z enterprise that was, I think, back in really, really early 2023. LangChain was new, we had land chain and we had all this. Of course, Qdrant been there for a long time, but it was the first time that you could see vector store products could be integrated into applications.

Hooman Sedghamiz:
Really at large scale. There are different components. It's quite complex architecture. So on the right side you see how you can host large language models. On the top you see how you can augment them using external data. Of course, we had these plugins, right? So you can connect these large language models with Google search APIs, all those sort of things, and some validation that are in the middle that you could use to validate the responses fast forward. Maybe I can kind of spend, let me check out the time. Maybe I can spend a few minutes about the components of LLM APIs and hosting because that I think has a lot of potential in terms of applications that need to be really scalable.

Hooman Sedghamiz:
Just to give you some kind of maybe summary about my company, we have around 100,000 people in almost all over the world. Like the languages that people speak are so diverse. So it makes it really difficult to build an application that will serve 200,000 people. And it's kind of efficient. It's not really costly and all those sort of things. So maybe I can spend a few minutes talking about what that means and how kind of larger scale companies might be able to tackle that efficiently. So we have, of course, out of the box solutions, right? So you have Chat GPT already for enterprise, you have other copilots and for example from Microsoft and other companies that are offering, but normally they are seat based, right? So you kind of pay a subscription fee, like Spotify, you pay like $20 per month, $30 on average, somewhere between $20 to $60. And for a company, like, I was like, just if you calculate that for 3000 people, that means like 180,000 per month in subscription fees.

Hooman Sedghamiz:
And we know that most of the users won't use that. We know that it's a usage based application. You just probably go there. Depending on your daily work, you probably use it. Some people don't use it heavily. I kind of did some calculation. If you build it in house using APIs that you can access yourself, and large language models that corporations can deploy internally and locally, that cost saving could be huge, really magnitudes cheaper, maybe 30 to 20 to 30 times cheaper. So looking, comparing 2024 to 2023, a lot of things have changed.

Hooman Sedghamiz:
Like if you look at the open source large language models that came out really great models from Mistral, now we have models like Llama, two based model, all of these models came out. You can now kind of take a look and see that the performance of them is really, really getting close, if not better than GPT 3.5 already at same level and really approaching step by step to GPT 4. And looking at the price on the right side and speed or throughput, you can see that like for example, Mistral seven eight B could be a really cheap option to deploy. And also the performance of it gets really close to GPT 3.5 for many use cases in the enterprise companies. I think two of the big things this year, end of last year that came out that make this kind of really a reality are really a few large language models. I don't know if I can call them large language models. They are like 7 billion to 13 billion compared to GPT four, GT 3.5. I don't think they are really large.

Hooman Sedghamiz:
But one was Nexus Raven. We know that applications, if they want to be robust, they really need function calling. We are seeing this paradigm of function calling, which essentially you ask a language model to generate structured output, you give it a function signature, right? You ask it to generate an output, structured output argument for that function. Next was Raven came out last year, that, as you can see here, really is getting really close to GPT four, right? And GPT four being magnitude bigger than this model. This model only being 13 billion parameters really provides really less hallucination, but at the same time really high quality of function calling. So this makes me really excited for the open source and also the companies that want to build their own applications that requires function calling. That was really lacking maybe just five months ago. At the same time, we have really dedicated large language models to programming languages or scripting like SQL, that we are also seeing like SQL coder that's already beating GPT four.

Hooman Sedghamiz:
So maybe we can now quickly take a look at how model solving will look like for a large company like ours, like companies that have a lot of people across the globe again, in this aspect also, the community has made really big progress, right? So we have text generation inference from hugging face is open source for most purposes, can be used and it's the choice of mine and probably my group prefers this option. But we have Olama, which is great, a lot of people are using it. We have llama CPP which really optimizes the large language models for local deployment as well, and edge devices. I was really amazed seeing Raspberry PI running a large language model, right? Using Llama CPP. And you have this text generation inference that offers quantization support, continuous patching, all those sort of things that make these large LLMs more quantized or more compressed and also more suitable for deployment to large group of people. Maybe I can kind of give you kind of a quick summary of how, if you decide to deploy these large language models, what techniques you could use to make them more efficient, cost friendly and more scalable. So we have a lot of great open source projects like we have Lite LLM which essentially creates an open AI kind of signature on top of your large language models that you have deployed. Let's say you want to use Azure to host or to access GPT four gypty 3.5 or OpenAI to access OpenAI API.

Hooman Sedghamiz:
To access those, you could put them behind Lite LLM. You could have models using hugging face that are deployed internally, you could put lightlm in front of those, and then your applications could just use OpenAI, Python SDK or anything to call them naturally. And then you could simply do load balancing between those. Of course, we have also, as I mentioned, a lot of now serving opportunities for deploying those models that you can accelerate. Semantic caching is another opportunity for saving cost. Like for example, if you have cute rent, you are storing the conversations. You could semantically check if the user has asked similar questions and if that question is very similar to the history, you could just return that response instead of calling the large language model that can create costs. And of course you have line chain that you can summarize conversations, all those sort of things.

Hooman Sedghamiz:
And we have techniques like prompt compression. So as I mentioned, this really load balancing can offer a lot of opportunities for scaling this large language model. As you know, a lot of offerings from OpenAI APIs or Microsoft Azure, they have rate limits, right? So you can't call those models extensively. So what you could do, you could have them in multiple regions, you can have multiple APIs, local TGI deployed models using hugging face TGI or having Azure endpoints and OpenAI endpoints. And then you could use light LLM to load balance between these models. Once the users get in. Right. User one, you send the user one to one deployment, you send the user two requests to the other deployment.

Hooman Sedghamiz:
So this way you can really scale your application to large amount of users. And of course, we have these opportunities for applications called Lorex that use Lora. Probably a lot of you have heard of like very efficient way of fine tuning these models with fewer number of parameters that we could leverage to have really individualized models for a lot of applications. And you can see the costs are just not comparable if you wanted to use, right. So at GPT 3.5, even in terms of performance and all those sort of things, because you can use really small hardware GPU to deploy thousands of Lora weights or adapters, and then you will be able to serve a diverse set of models to your users. I think one really important part of these kind of applications is the part that you add contextual data, you add augmentation to make them smarter and to make them more up to date. So, for example, in healthcare domain, a lot of Americans already don't have high trust in AI when it comes to decision making in healthcare. So that's why augmentation of data or large language models is really, really important for bringing trust and all those sort of state of the art knowledge to this large language model.

Hooman Sedghamiz:
For example, if you ask about cancer or rededicated questions that need to build on top of scientific knowledge, it's very important to use those. Augmented or retrieval augmented generation. No, sorry, go next. Jumped on one. But let me see. I think I'm missing a slide, but yeah, I have it here. So going through this kind of, let's say retrieval augmented generation, different parts of it. You have, of course, these vector stores that in 2024, I see explosion of vector stores.

Hooman Sedghamiz:
Right. So there is this really great vector DB comparison that came out recently. I saw there are like maybe more than 40 vector stores in 2024. When we started back in 2023 was only a few. And what I see, which is really lacking in this pipeline of retrieval augmented generation is major innovation around data pipeline. And I think we were talking before this talk together that ETL is not something that is taken seriously. So far. We have a lot of embedding models that are coming out probably on a weekly basis.

Hooman Sedghamiz:
We have great embedding models that are open source, BgEM. Three is one that is multilingual, 100 plus languages. You could embed text in those languages. We have a lot of vector stores, but we don't have really ETL tools, right? So we have maybe a few airbytes, right? How can you reindex data efficiently? How can you parse scientific articles? Like imagine I have an image here, we have these articles or archive or on a pubmed, all those sort of things that have images and complex structure that our parsers are not able to parse them efficiently and make sense of them so that you can embed them really well. And really doing this Internet level, scientific level retrieval is really difficult. And no one I think is still doing it at scale. I just jumped, I have a love slide, maybe I can jump to my last and then we can pause there and take in some questions. Where I see 2014 and beyond, beyond going for large language models for enterprises, I see assistance, right? I see assistance for personalized assistance, for use cases coming out, right? So these have probably four components.

Hooman Sedghamiz:
You have even a personalized large language model that can learn from the history of your conversation, not just augmented. Maybe you can fine tune that using Laura and all those techniques. You have the knowledge that probably needs to be customized for your assistant and integrated using vector stores and all those sort of things, technologies that we have out, you know, plugins that bring a lot of plugins, some people call them skills, and also they can cover a lot of APIs that can bring superpowers to the large language model and multi agent setups. Right? We have autogen, a lot of cool stuff that is going on. The agent technology is getting really mature now as we go forward. We have langraph from Langchain that is bringing a lot of more stabilized kind of agent technology. And then you can think of that as for companies building all these kind of like App Stores or assistant stores that use cases, store there. And the colleagues can go there, search.

Hooman Sedghamiz:
I'm looking for this application. That application is customized for them, or even they can have their own assistant which is customized to them, their own large language model, and they could use that to bring value. And then even a nontechnical person could create their own assistant. They could attach the documents they like, they could select the plugins they like, they'd like to be connected to, for example, archive, or they need to be connected to API and how many agents you like. You want to build a marketing campaign, maybe you need an agent that does market research, one manager. And then you build your application which is customized to you. And then based on your feedback, the large language model can learn from your feedback as well. Going forward, maybe I pause here and then we can it was a bit longer than I expected, but yeah, it's all good, man.

Demetrios:
Yeah, this is cool. Very cool. I appreciate you going through this, and I also appreciate you coming from the past, from 2014 and talking about what we're going to do in 2024. That's great. So one thing that I want to dive into right away is the idea of ETL and why you feel like that is a bit of a blocker and where you think we can improve there.

Hooman Sedghamiz:
Yeah. So I think there has been concentration around vector stores. Right. So a lot of startups that have appeared around vector store idea, but I think what really is lacking tools that you have a lot of sources of knowledge, information. You have your Gmail, if you use outlook, if you use scientific knowledge, like sources like archive. We really don't have any startup that I hear that. Okay. I have a platform that offers real time retrieval from archive papers.

Hooman Sedghamiz:
And you want to ask a question, for example, about transformers. It can do retrieval, augmented generation over all archive papers in real time as they get added for you and brings back the answer to you. We don't have that. We don't have these syncing tools. You can of course, with tricks you can maybe build some smart solutions, but I haven't seen many kind of initiatives around that. And at the same time, we have this paywall knowledge. So we have these nature medicine amazing papers which are paywall. We can access them.

Hooman Sedghamiz:
Right. So we can build rag around them yet, but maybe some startups can start coming up with strategies, work with this kind of publishing companies to build these sort of things.

Demetrios:
Yeah, it's almost like you're seeing it not as the responsibility of nature or.

Hooman Sedghamiz:
Maybe they can do it.

Demetrios:
Yeah, they can potentially, but maybe that's not their bread and butter and so they don't want to. And so how do startups get in there and take some of this paywalled information and incorporate it into their product? And there is another piece that you mentioned on, just like when it comes to using agents, I wonder, have you played around with them a lot? Have you seen their reliability get better? Because I'm pretty sure a lot of us out there have tried to mess around with agents and maybe just like blown a bunch of money on GPT, four API calls. And it's like this thing isn't that stable. What's going on? So do you know something that we don't?

Hooman Sedghamiz:
I think they have become much, much more stable. If you look back in 2023, like June, July, they were really new, like auto GPT. We had all these new projects came out, really didn't work out as you say, they were not stable. But I would say by the end of 2023, we had really stable frameworks, for example, customized solutions around agent function calling. I think when function calling came out, the capability that you could provide signature or dot string of, I don't know, a function and you could get back the response really reliably. I think that changed a lot. And Langchen has this OpenAI function calling agent that works with some measures. I mean, of course I wouldn't say you could automate 100% something, but for a knowledge, kind of.

Hooman Sedghamiz:
So for example, if you have an agent that has access to data sources, all those sort of things, and you ask it to go out there, see what are the latest clinical trial design trends, it can call these tools, it can reliably now get you answer out of ten times, I would say eight times, it works. Now it has become really stable. And what I'm excited about is the latest multi agent scenarios and we are testing them. They are very promising. Right? So you have autogen from Microsoft platform, which is open source, and also you have landgraph from Langchain, which I think the frameworks are becoming really stable. My prediction is between the next few months is lots of, lots of applications will rely on agents.

Demetrios:
So you also mentioned how to recognize if a project is winning or losing type thing. And considering there are so many areas that you can plug in AI, especially when you're looking at buyer and all the different places that you can say, oh yeah, we could add some AI to this. How are you setting up metrics so, you know, what is worth it to continue investing into versus what maybe sounded like a better idea, but in practice it wasn't actually that good of an idea.

Hooman Sedghamiz:
Yeah, depends on the platform that you're building. Right? So where we started back in 2023, the platform was aiming for efficiency, right? So how can you make our colleagues more efficient? They can be faster in their daily work, like really delegate this boring stuff, like if you want to summarize or you want to create a presentation, all those sort of things, and you have measures in place that, for example, you could ask, okay, now you're using this platform for months. Let us know how many hours you're saving during your daily work. And really we could see the shift, right? So we did a questionnaire and I think we could see a lot of shift in terms of saving hours, daily work, all those sort of things that is measurable. And it's like you could then convert it, of course, to the value that brings for the enterprise on the company. And I think the biggest, I think the untapped potential, it goes back to when you can do scientific discovery and all those sort of applications which are more challenging, not just around the efficiency and all those sort of things. And then you need to really, if you're building a product, if it's not the general product. And for example, let's say if you're building a natural language to SQL, let's say you have a database.

Hooman Sedghamiz:
It was a relational database. You want to build an application that searches cars in the background. The customers go there and ask, I'm looking for a BMW 2013. It uses qudrant in the back, right. It kind of does semantic search, all these cool things and returns the response. I think then you need to have really good measures to see how satisfied your customers are when you're integrating a kind of generative application on top of your website that's selling cars. So measuring this in a kind of, like, cyclic manner, people are not going to be happy because you start that there are a lot of things that you didn't count for. You measure all those kind of metrics and then you go forward, you improve your platform.

Demetrios:
Well, there's also something else that you mentioned, and it brought up this thought in my mind, which is undoubtedly you have these low hanging fruit problems, and it's mainly based on efficiency gains. Right. And so it's helping people extract data from pdfs or what be it, and you're saving time there. You're seeing that you're saving time, and it's a fairly easy setup. Right. But then you have moonshots, I would imagine, like creating a whole new type of aspirin or tylenol or whatever it is, and that is a lot more of an investment of time and energy and infrastructure and everything along those lines. How do you look at both of these and say, we want to make sure that we make headway in both directions. And I'm not sure if you have unlimited resources to be able to just do everything or if you have to recognize what the trade offs are and how you measure those types of metrics.

Demetrios:
Again, in seeing where do we invest and where do we cut ties with different initiatives.

Hooman Sedghamiz:
Yeah. So that's a great question. So for product development, like the example that you made, there are really a lot of stages involved. Right. So you start from scientific discovery stage. So I can imagine that you can have multiple products along the way to help out. So if you have a product already out there that you want to generate insights and see. Let's say you have aspirin out there.

Hooman Sedghamiz:
You want to see if it is also helpful for cardiovascular problems that patients might have. So you could build a sort of knowledge discovery tool that could search for you, give it a name of your product, it will go out there, look into pubmed, all these articles that are being published, brings you back the results. Then you need to have really clear metrics to see if this knowledge discovery platform, after a few months is able to bring value to the customers or the stakeholders that you build the platform for. We have these experts that are really experts in their own field. Takes them really time to go read these articles to make conclusions or answer questions about really complex topic. I think it's really difficult based on the initial feedback we see, it helps, it helps save them time. But really I think it goes back again to the ETL problem that we still don't have your paywall. We can't access a lot of scientific knowledge yet.

Hooman Sedghamiz:
And these guys get a little bit discouraged at the beginning because they expect that a lot of people, especially non technical, say like you go to Chat GPT, you ask and it brings you the answer, right? But it's not like that. It doesn't work like that. But we can measure it, we can see improvements, they can access knowledge faster, but it's not comprehensive. That's the problem. It's not really deep knowledge. And I think the companies are still really encouraging developing these platforms and they can see that that's a developing field. Right. So it's very hard to give you a short answer, very hard to come up with metrics that gives you success of failure in a short term time period.

Demetrios:
Yeah, I like the creativity that you're talking about there though. That is like along this multistepped, very complex product creation. There are potential side projects that you can do that show and prove value along the way, and they don't necessarily need to be as complex as that bigger project.

Hooman Sedghamiz:
True.

Demetrios:
Sweet, man. Well, this has been awesome. I really appreciate you coming on here to the vector space talks for anyone that would like to join us and you have something cool to present. We're always open to suggestions. Just hit me up and we will make sure to send you some shirt or whatever kind of swag is on hand. Remember, all you astronauts out there, don't get lost in vector space. This has been another edition of the Qdrant vector space talks with Hooman, my man, on Valentine's Day. I can't believe you decided to spend it with me.

Demetrios:
I appreciate it.

Hooman Sedghamiz:
Thank you. Take care.
