---
draft: true
title: Advancements and Challenges in RAG Systems - Syed Asad | Vector Space Talks
slug: rag-advancements-challenges
short_description: Syed Asad talked about advanced rag systems and multimodal AI
  projects, discussing challenges, technologies, and model evaluations in the
  context of their work at Kiwi Tech.
description: Syed Asad unfolds the challenges of developing multimodal RAG
  systems at Kiwi Tech, detailing the balance between accuracy and
  cost-efficiency, and exploring various tools and approaches like GPT 4 and
  Mixtral to enhance family tree apps and financial chatbots while navigating
  the hurdles of data privacy and infrastructure demands.
preview_image: /blog/from_cms/syed-asad-cropped.png
date: 2024-04-11T22:13:00.000Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Search
  - Retrieval Augmented Generation
  - Generative AI
  - KiwiTech
---
> *"The problem with many of the vector databases is that they work fine, they are scalable. This is common. The problem is that they are not easy to use. So that is why I always use Qdrant.”*\
— Syed Asad
> 

Syed Asad is an accomplished AI/ML Professional, specializing in LLM Operations and RAGs. With a focus on Image Processing and Massive Scale Vector Search Operations, he brings a wealth of expertise to the field. His dedication to advancing artificial intelligence and machine learning technologies has been instrumental in driving innovation and solving complex challenges. Syed continues to push the boundaries of AI/ML applications, contributing significantly to the ever-evolving landscape of the industry.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/4Gm4TQsO2PzOGBp5U6Cj2e?si=JrG0kHDpRTeb2gLi5zdi4Q), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/RVb6_CI7ysM?si=8Hm7XSWYTzK6SRj0).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/RVb6_CI7ysM?si=8Hm7XSWYTzK6SRj0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Advancements-and-Challenges-in-RAG-Systems---Syed-Asad--Vector-Space-Talks-021-e2i112h/a-ab4vnl8" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Prompt engineering is the new frontier in AI. Let’s find out about how critical its role is in controlling AI language models. In this episode, Demetrios and Syed gets to discuss about it.

Syed also explores the retrieval augmented generation systems and machine learning technology at Kiwi Tech. This episode showcases the challenges and advancements in AI applications across various industries.

Here are the highlights from this episode:

1. **Digital Family Tree:** Learn about the family tree app project that brings the past to life through video interactions with loved ones long gone.
2. **Multimodal Mayhem:** Discover the complexities of creating AI systems that can understand diverse accents and overcome transcription tribulations – all while being cost-effective!
3. **The Perfect Match:** Find out how semantic chunking is revolutionizing job matching in radiology and why getting the context right is non-negotiable.
4. **Quasar's Quantum Leap:** Syed shares the inside scoop on Quasar, a financial chatbot, and the AI magic that makes it tick.
5. **The Privacy Paradox:** Delve into the ever-present conflict between powerful AI outcomes and the essential quest to preserve data privacy.

> Fun Fact: Syed Asad and his team at Kiwi Tech use a GPU-based approach with GPT 4 for their AI system named Quasar, addressing challenges like temperature control and mitigating hallucinatory responses.
> 

## Show notes:

00:00 Clients seek engaging multimedia apps over chatbots.\
06:03 Challenges in multimodal rags: accent, transcription, cost.\
08:18 AWS credits crucial, but costs skyrocket quickly.\
10:59 Accurate procedures crucial, Qdrant excels in search.\
14:46 Embraces AI for monitoring and research.\
19:47 Seeking insights on ineffective marketing models and solutions.\
23:40 GPT 4 useful, prompts need tracking tools\
25:28 Discussing data localization and privacy, favoring Ollama.\
29:21 Hallucination control and pricing are major concerns.\
32:47 DeepEval, AI testing, LLM, potential, open source.\
35:24 Filter for appropriate embedding model based on use case and size.

## More Quotes from Syed:

*"Qdrant has the ease of use. I have trained people in my team who specializes with Qdrant, and they were initially using Weaviate and Pinecone.”*\
— Syed Asad

*"What's happening nowadays is that the clients or the projects in which I am particularly working on are having more of multimedia or multimodal approach. They want their apps or their LLM apps to be more engaging rather than a mere chatbot.”*\
— Syed Asad

*"That is where the accuracy matters the most. And in this case, Qdrant has proved just commendable in giving excellent search results.”*\
— Syed Asad in Advancements in Medical Imaging Search

## Transcript:
Demetrios:
What is up, good people? How y'all doing? We are back for yet another vector space talks. I'm super excited to be with you today because we're gonna be talking about rags and rag systems. And from the most basic naive rag all the way to the most advanced rag, we've got it covered with our guest of honor, Asad. Where are you at, my man? There he is. What's going on, dude?

Syed Asad:
Yeah, everything is fine.

Demetrios:
Excellent, excellent. Well, I know we were talking before we went live, and you are currently in India. It is very late for you, so I appreciate you coming on here and doing this with us. You are also, for those who do not know, a senior engineer for AI and machine learning at Kiwi Tech. Can you break down what Kiwi tech is for us real fast?

Syed Asad:
Yeah, sure. Absolutely. So Kiwi tech is actually a software development, was actually a software development company focusing on software development, iOS and mobile apps. And right now we are in all focusing more on generative AI, machine learning and computer vision projects. So I am heading the AI part here. So. And we are having loads of projects here with, from basic to advanced rags, from naive to visual rags. So basically I'm doing rag in and out from morning to evening.

Demetrios:
Yeah, you can't get away from it, huh? Man, that is great.

Syed Asad:
Everywhere there is rag. Even, even the machine learning part, which was previously done by me, is all now into rags engineered AI. Yeah. Machine learning is just at the background now.

Demetrios:
Yeah, yeah, yeah. It's funny, I understand the demand for it because people are trying to see where they can get value in their companies with the new generative AI advancements.

Syed Asad:
Yeah.

Demetrios:
So I want to talk a lot about advance rags, considering the audience that we have. I would love to hear about the visual rags also, because that sounds very exciting. Can we start with the visual rags and what exactly you are doing, what you're working on when it comes to that?

Syed Asad:
Yeah, absolutely. So initially when I started working, so you all might be aware with the concept of frozen rags, the normal and the basic rag, there is a text retrieval system. You just query your data and all those things. So what is happening nowadays is that the clients or the projects in which I am particularly working on are having more of multimedia or multimodal approach. So that is what is happening. So they want their apps or their LLM apps to be more engaging rather than a mere chatbot. Because. Because if we go on to the natural language or the normal english language, I mean, interacting by means of a video or interacting by means of a photo, like avatar, generation, anything like that.

Syed Asad:
So that has become more popular or, and is gaining more popularity. And if I talk about, specifically about visual rags. So the projects which I am working on is, say, for example, say, for example, there is a family tree type of app in which. In which you have an account right now. So, so you are recording day videos every day, right? Like whatever you are doing, for example, you are singing a song, you're walking in the park, you are eating anything like that, and you're recording those videos and just uploading them on that app. But what do you want? Like, your future generations can do some sort of query, like what, what was my grandfather like? What was my, my uncle like? Anything my friend like. And it was, it is not straight, restricted to a family. It can be friends also.

Syed Asad:
Anyway, so. And these are all us based projects, not indian based projects. Okay, so, so you, you go in query and it returns a video about your grandfather who has already died. He has not. You can see him speaking about that particular thing. So it becomes really engaging. So this is something which is called visual rag, which I am working right now on this.

Demetrios:
I love that use case. So basically it's, I get to be closer to my family that may or may not be here with us right now because the rag can pull writing that they had. It can pull video of other family members talking about it. It can pull videos of when my cousin was born, that type of stuff.

Syed Asad:
Anything, anything from cousin to family. You can add any numbers of members of your family. You can give access to any number of people who can have after you, after you're not there, like a sort of a nomination or a delegation live up thing. So that is, I mean, actually, it is a very big project, involves multiple transcription models, video transcription models. It also involves actually the databases, and I'm using Qdrant, proud of it. So, in that, so. And Qdrant is working seamlessly in that. So, I mean, at the end there is a vector search, but at the background there is more of more of visual rag, and people want to communicate through videos and photos.

Syed Asad:
So that is coming into picture more.

Demetrios:
Well, talk to me about multimodal rag. And I know it's a bit of a hairy situation because if you're trying to do vector search with videos, it can be a little bit more complicated than just vector search with text. Right. So what are some of the unique challenges that you've seen when it comes to multimodal rag?

Syed Asad:
The first challenge dealing with multimodal rags is actually the accent, because it can be varying accent. The problem with the transcription, one of the problems or the challenges which I have faced in this is that lack of proper transcription models, if you are, if you are able to get a proper transcription model, then if that, I want to deploy that model in the cloud, say for example, an AWS cloud. So that AWS cloud is costing heavy on the pockets. So managing infra is one of the part. I mean, I'm talking in a, in a, in a highly scalable production environment. I'm not talking about a research environment in which you can do anything on a collab notebook and just go with that. So whenever it comes to the client part or the delivery part, it becomes more critical. And even there, there were points then that we have to entirely overhaul the entire approach, which was working very fine when we were doing it on the dev environment, like the openais whisper.

Syed Asad:
We started with that OpenAI's whisper. It worked fine. The transcription was absolutely fantastic. But we couldn't go into the production.

Demetrios:
Part with that because it was too, the word error rate was too high, or because it was too slow. What made it not allow you to go into production?

Syed Asad:
It was, the word error rate was also high. It was very slow when it was being deployed on an AWS instance. And the thing is that the costing part, because usually these are startups, or mid startup, if I talk about the business point of view, not the tech point of view. So these companies usually offer these type of services for free, and on the basis of these services they try to raise funding. So they want something which is actually optimized, optimizing their cost as well. So what I personally feel, although AWS is massively scalable, but I don't prefer AWS at all until, unless there are various other options coming out, like salad. I had a call, I had some interactions with Titan machine learning also, but it was also fine. But salad is one of the best as of now.

Demetrios:
Yeah. Unless you get that free AWS credits from the startup program, it can get very expensive very quickly. And even if you do have the free AWS credits, it still gets very expensive very quickly. So I understand what you're saying is basically it was unusable because of the cost and the inability to figure out, it was more of a product problem if you could figure out how to properly monetize it. But then you had technical problems like word error rate being really high, the speed and latency was just unbearable. I can imagine. So unless somebody makes a query and they're ready to sit around for a few minutes and let that query come back to you, with a video or some documents, whatever it may be. Is that what I'm understanding on this? And again, this is for the family tree use case that you're talking about.

Syed Asad:
Yes, family tree use case. So what was happening in that, in that case is a video is uploaded, it goes to the admin for an approval actually. So I mean you can, that is where we, they were restricting the costing part as far as the project was concerned. It's because you cannot upload any random videos and they will select that. Just some sort of moderation was also there, as in when the admin approves those videos, that videos goes on to the transcription pipeline. They are transcripted via an, say a video to text model like the open eyes whisper. So what was happening initially, all the, all the research was done with Openais, but at the end when deployment came, we have to go with deep Gram and AssemblyAI. That was the place where these models were excelling far better than OpenAI.

Syed Asad:
And I'm a big advocate of open source models, so also I try to leverage those, but it was not pretty working in production environment.

Demetrios:
Fascinating. So you had that, that's one of your use cases, right? And that's very much the multimodal rag use case. Are all of your use cases multimodal or did you have, do you have other ones too?

Syed Asad:
No, all are not multimodal. There are few multimodal, there are few text based on naive rag also. So what, like for example, there is one use case coming which is sort of a job search which is happening. A job search for a radiology, radiology section. I mean a very specialized type of client it is. And they're doing some sort of job search matching the modalities and procedures. And it is sort of a temporary job. Like, like you have two shifts ready, two shifts begin, just some.

Syed Asad:
So, so that is, that is very critical when somebody is putting their procedures or what in. Like for example, they, they are specializing in x rays in, in some sort of medical procedures and that is matching with the, with the, with the, with the employers requirement. So that is where the accuracy matters the most. Accurate. And in this case, Qdrant has proved just commendable in giving excellent search results. The other way around is that in this case is there were some challenges related to the quality of results also because. So progressing from frozen rack to advanced rag like adopting methods like re ranking, semantic chunking. I have, I have started using semantic chunking.

Syed Asad:
So it has proved very beneficial as far as the quality of results is concerned.

Demetrios:
Well, talk to me more about. I'm trying to understand this use case and why a rag is useful for the job matching. You have doctors who have specialties and they understand, all right, they're, maybe it's an orthopedic surgeon who is very good at a certain type of surgery, and then you have different jobs that come online. They need to be matched with those different jobs. And so where does the rag come into play? Because it seems like it could be solved with machine learning as opposed to AI.

Syed Asad:
Yeah, it could have been solved through machine learning, but the type of modalities that are, the type of, say, the type of jobs which they were posting are too much specialized. So it needed some sort of contextual matching also. So there comes the use case for the rag. In this place, the contextual matching was required. Initially, an approach for machine learning was on the table, but it was done with, it was not working.

Demetrios:
I get it, I get it. So now talk to me. This is really important that you said accuracy needs to be very high in this use case. How did you make sure that the accuracy was high? Besides the, I think you said chunking, looking at the chunks, looking at how you were doing that, what were some other methods you took to make sure that the accuracy was high?

Syed Asad:
I mean, as far as the accuracy is concerned. So what I did was that my focus was on the embedding model, actually when I started with what type of embed, choice of embedding model. So initially my team started with open source model available readily on hugging face, looking at some sort of leaderboard metrics, some sort of model specializing in medical, say, data, all those things. But even I was curious that the large language, the embedding models which were specializing in medical data, they were also not returning good results and they were mismatching. When, when there was a tabular format, I created a visualization in which the cosine similarity of various models were compared. So all were lagging behind until I went ahead with cohere. Cohere re rankers. They were the best in that case, although they are not trained on that.

Syed Asad:
And just an API call was required rather than loading that whole model onto the local.

Demetrios:
Interesting. All right. And so then were you doing certain types, so you had the cohere re ranker that gave you a big up. Were you doing any kind of monitoring of the output also, or evaluation of the output and if so, how?

Syed Asad:
Yes, for evaluation, for monitoring we readily use arrays AI, because I am a, I'm a huge advocate of Llama index also because it has made everything so easier versus lang chain. I mean, if I talk about my personal preference, not regarding any bias, because I'm not linked with anybody, I'm not promoting it here, but they are having the best thing which I write, I like about Llama index and why I use it, is that anything which is coming into play as far as the new research is going on, like for example, a recent research paper was with the raft retrieval augmented fine tuning, which was released by the Microsoft, and it is right now available on archive. So barely few days after they just implemented it in the library, and you can readily start using it rather than creating your own structure. So, yeah, so it was. So one of my part is that I go through the research papers first, then coming on to a result. So a research based approach is required in actually selecting the models, because every day there is new advancement going on in rags and you cannot figure out what is, what would be fine for you, and you cannot do hit and trial the whole day.

Demetrios:
Yes, that is a great point. So then if we break down your tech stack, what does it look like? You're using Llama index, you're using arise for the monitoring, you're using Qdrant for your vector database. You have the, you have the coherent re ranker, you are using GPT 3.5.

Syed Asad:
No, it's GPT 4, not 3.5.

Demetrios:
You needed to go with GPT 4 because everything else wasn't good enough.

Syed Asad:
Yes, because one of the context length was one of the most things. But regarding our production, we have been readily using since the last one and a half months. I have been readily using Mixtril. I have been. I have been using because there's one more challenge coming onto the rack, because there's one more I'll give, I'll give you an example of one more use case. It is the I'll name the project also because I'm allowed by my company. It is a big project by the name of Quasar markets. It is a us based company and they are actually creating a financial market type of check chatbot.

Syed Asad:
Q u a s a r, quasar. You can search it also, and they give you access to various public databases also, and some paid databases also. They have a membership plan. So we are entirely handling the front end backend. I'm not handling the front end and the back end, I'm handling the AI part in that. So one of the challenges is the inference, timing, the timing in which the users are getting queries when it is hitting the database. Say for example, there is a database publicly available database called Fred of us government. So when user can select in that app and go and select the Fred database and want to ask some questions regarding that.

Syed Asad:
So that is in this place there is no vectors, there are no vector databases. It is going without that. So we are following some keyword approach. We are extracting keywords, classifying the queries in simple or complex, then hitting it again to the database, sending it on the live API, getting results. So there are multiple hits going on. So what happened? This all multiple hits which were going on. They reduced the timing and I mean the user experience was being badly affected as the time for the retrieval has gone up and user and if you're going any query and inputting any query it is giving you results in say 1 minute. You wouldn't be waiting for 1 minute for a result.

Demetrios:
Not at all.

Syed Asad:
So this is one of the challenge for a GPU based approach. And in, in the background everything was working on GPT 4 even, not 3.5. I mean the costliest.

Demetrios:
Yeah.

Syed Asad:
So, so here I started with the LPU approach, the Grok. I mean it's magical.

Demetrios:
Yeah.

Syed Asad:
I have been implementing proc since the last many days and it has been magical. The chatbots are running blazingly fast but there are some shortcomings also. You cannot control the temperature if you have lesser control on hallucination. That is one of the challenges which I am facing. So that is why I am not able to deploy Grok into production right now. Because hallucination is one of the concern for the client. Also for anybody who is having, who wants to have a rag on their own data, say, or AI on their own data, they won't, they won't expect you, the LLM, to be creative. So that is one of the challenges.

Syed Asad:
So what I found that although many of the tools that are available in the market right now day in and day out, there are more researches. But most of the things which are coming up in our feeds or more, I mean they are coming as a sort of a marketing gimmick. They're not working actually on the ground.

Demetrios:
Tell me, tell me more about that. What other stuff have you tried that's not working? Because I feel that same way. I've seen it and I also have seen what feels like some people, basically they release models for marketing purposes as opposed to actual valuable models going out there. So which ones? I mean Grok, knowing about Grok and where it excels and what some of the downfalls are is really useful. It feels like this idea of temperature being able to control the knob on the temperature and then trying to decrease the hallucinations is something that is fixable in the near future. So maybe it's like months that we'll have to deal with that type of thing for now. But I'd love to hear what other things you've tried that were not like you thought they were going to be when you were scrolling Twitter or LinkedIn.

Syed Asad:
Should I name them?

Demetrios:
Please. So we all know we don't have to spend our time on them.

Syed Asad:
I'll start with OpenAI. The clients don't like GPT 4 to be used in there just because the primary concern is the cost. Secondary concern is the data privacy. And the third is that, I mean, I'm talking from the client's perspective, not the tech stack perspective.

Demetrios:
Yeah, yeah, yeah.

Syed Asad:
They consider OpenAI as a more of a marketing gimmick. Although GPT 4 gives good results. I'm, I'm aware of that, but the clients are not in favor. But the thing is that I do agree that GPT 4 is still the king of llms right now. So they have no option, no option to get the better, better results. But Mixtral is performing very good as far as the hallucinations are concerned. Just keeping the parameter temperature is equal to zero in a python code does not makes the hallucination go off. It is one of my key takeaways.

Syed Asad:
I have been bogging my head. Just. I'll give you an example, a chat bot. There is a, there's one of the use case in which is there's a big publishing company. I cannot name that company right now. And they want the entire system of books since the last 2025 years to be just converted into a rack pipeline. And the people got query. The.

Syed Asad:
The basic problem which I was having is handling a hello. When a user types hello. So when you type in hello, it.

Demetrios:
Gives you back a book.

Syed Asad:
It gives you back a book even. It is giving you back sometimes. Hello, I am this, this, this. And then again, some information. What you have written in the prompt, it is giving you everything there. I will answer according to this. I will answer according to this. So, so even if the temperature is zero inside the code, even so that, that included lots of prompt engineering.

Syed Asad:
So prompt engineering is what I feel is one of the most important trades which will be popular, which is becoming popular. And somebody is having specialization in prompt engineering. I mean, they can control the way how an LLM behaves because it behaves weirdly. Like in this use case, I was using croc and Mixtral. So to control Mixtral in such a way. It was heck lot of work, although it, we made it at the end, but it was heck lot of work in prompt engineering part.

Demetrios:
And this was, this was Mixtral large.

Syed Asad:
Mixtral, seven bits, eight by seven bits.

Demetrios:
Yeah. I mean, yeah, that's the trade off that you have to deal with. And it wasn't fine tuned at all.

Syed Asad:
No, it was not fine tuned because we were constructing a rack pipeline, not a fine tuned application, because right now, right now, even the customers are not interested in getting a fine tune model because it cost them and they are more interested in a contextual, like a rag contextual pipeline.

Demetrios:
Yeah, yeah. Makes sense. So basically, this is very useful to think about. I think we all understand and we've all seen that GPT 4 does best if we can. We want to get off of it as soon as possible and see how we can, how far we can go down the line or how far we can go on the difficulty spectrum. Because as soon as you start getting off GPT 4, then you have to look at those kind of issues with like, okay, now it seems to be hallucinating a lot more. How do I figure this out? How can I prompt it? How can I tune my prompts? How can I have a lot of prompt templates or a prompt suite to make sure that things work? And so are you using any tools for keeping track of prompts? I know there's a ton out there.

Syed Asad:
We initially started with the parameter efficient fine tuning for prompts, but nothing is working 100% interesting. Nothing works 100% it is as far as the prompting is concerned. It goes on to a hit and trial at the end. Huge wastage of time in doing prompt engineering. Even if you are following the exact prompt template given on the hugging face given on the model card anywhere, it will, it will behave, it will act, but after some time.

Demetrios:
Yeah, yeah.

Syed Asad:
But mixed well. Is performing very good. Very, very good. Mixtral eight by seven bits. That's very good.

Demetrios:
Awesome.

Syed Asad:
The summarization part is very strong. It gives you responses at par with GPT 4.

Demetrios:
Nice. Okay. And you don't have to deal with any of those data concerns that your customers have.

Syed Asad:
Yeah, I'm coming on to that only. So the next part was the data concern. So they, they want either now or in future the localization of llms. I have been doing it with readily, with Llama, CPP and Ollama. Right now. Ollama is very good. I mean, I'm a huge, I'm a huge fan of Ollama right now, and it is performing very good as far as the localization and data privacy is concerned because, because at the end what you are selling, it makes things, I mean, at the end it is sales. So even if the client is having data of the customers, they want to make their customers assure that the data is safe.

Syed Asad:
So that is with the localization only. So they want to gradually go into that place. So I want to bring here a few things. To summarize what I said, localization of llms is one of the concern right now is a big market. Second is quantization of models.

Demetrios:
Oh, interesting.

Syed Asad:
In quantization of models, whatever. So I perform scalar quantization and binary quantization, both using bits and bytes. I various other techniques also, but the bits and bytes was the best. Scalar quantization is performing better. Binary quantization, I mean the maximum compression or maximum lossy function is there, so it is not, it is, it is giving poor results. Scalar quantization is working very fine. It, it runs on CPU also. It gives you good results because whatever projects which we are having right now or even in the markets also, they are not having huge corpus of data right now, but they will eventually scale.

Syed Asad:
So they want something right now so that quantization works. So quantization is one of the concerns. People want to dodge aws, they don't want to go to AWS, but it is there. They don't have any other way. So that is why they want aws.

Demetrios:
And is that because of costs lock in?

Syed Asad:
Yeah, cost is the main part.

Demetrios:
Yeah. They understand that things can get out of hand real quick if you're using AWS and you start using different services. I think it's also worth noting that when you're using different services on AWS, it may be a very similar service. But if you're using sagemaker endpoints on AWS, it's like a lot more expensive than just an EKS endpoint.

Syed Asad:
Minimum cost for a startup, for just the GPU, bare minimum is minimum. $450. Minimum. It's $450 even without just on the testing phases or the development phases, even when it has not gone into production. So that gives a dent to the client also.

Demetrios:
Wow. Yeah. Yeah. So it's also, and this is even including trying to use like tranium or inferencia and all of that stuff. You know those services?

Syed Asad:
I know those services, but I've not readily tried those services. I'm right now in the process of trying salad also for inference, and they are very, very cheap right now.

Demetrios:
Nice. Okay. Yeah, cool. So if you could wave your magic wand and have something be different when it comes to your work, your day in, day out, especially because you've been doing a lot of rags, a lot of different kinds of rags, a lot of different use cases with, with rags. Where do you think you would get the biggest uptick in your performance, your ability to just do what you need to do? How could rags be drastically changed? Is it something that you say, oh, the hallucinations. If we didn't have to deal with those, that would make my life so much easier. I didn't have to deal with prompts that would make my life infinitely easier. What are some things like where in five years do you want to see this field be?

Syed Asad:
Yeah, you figured it right. The hallucination part is one of the concerns, or biggest concerns with the client when it comes to the rag, because what we see on LinkedIn and what we see on places, it gives you a picture that it, it controls hallucination, and it gives you answer that. I don't know anything about this, as mentioned in the context, but it does not really happen when you come to the production. It gives you information like you are developing a rag for a publishing company, and it is giving you. Where is, how is New York like, it gives you information on that also, even if you have control and everything. So that is one of the things which needs to be toned down. As far as the rag is concerned, pricing is the biggest concern right now, because there are very few players in the market as far as the inference is concerned, and they are just dominating the market with their own rates. So this is one of the pain points.

Syed Asad:
And the. I'll also want to highlight the popular vector databases. There are many Pinecone weaviate, many things. So they are actually, the problem with many of the vector databases is that they work fine. They are scalable. This is common. The problem is that they are not easy to use. So that is why I always use Qdrant.

Syed Asad:
Not because Qdrant is sponsoring me, not because I am doing a job with Qdrant, but Qdrant is having the ease of use. And it, I have, I have trained people in my team who specialize with Qdrant, and they were initially using Weaviate and Pinecone. I mean, you can do also store vectors in those databases, but it is not especially the, especially the latest development with Pine, sorry, with Qdrant is the fast embed, which they just now released. And it made my work a lot easier by using the ONNX approach rather than a Pytorch based approach, because there was one of the projects in which we were deploying embedding model on an AWS server and it was running continuously. And minimum utilization of ram is 6gb. Even when it is not doing any sort of vector embedding so fast. Embed has so Qdrant is playing a huge role, I should acknowledge them. And one more thing which I would not like to use is LAN chain.

Syed Asad:
I have been using it. So. So I don't want to use that language because it is not, it did not serve any purpose for me, especially in the production. It serves purpose in the research phase. When you are releasing any notebook, say you have done this and does that. It is not. It does not works well in production, especially for me. Llama index works fine, works well.

Demetrios:
You haven't played around with anything else, have you? Like Haystack or.

Syed Asad:
Yeah, haystack. Haystack. I have been playing out around, but haystack is lacking functionalities. It is working well. I would say it is working well, but it lacks some functionalities. They need to add more things as compared to Llama index.

Demetrios:
And of course, the hottest one on the block right now is DSPY. Right? Have you messed around with that at all?

Syed Asad:
DSPy, actually DSPY. I have messed with DSPY. But the thing is that DSPY is right now, I have not experimented with that in the production thing, just in the research phase.

Demetrios:
Yeah.

Syed Asad:
So, and regarding the evaluation part, DeepEval, I heard you might have a DeepEval. So I've been using that. It is because one of the, one of the challenges is the testing for the AI. Also, what responses are large language model is generating the traditional testers or the manual tester software? They don't know, actually. So there's one more vertical which is waiting to be developed, is the testing for AI. It has a huge potential. And DeepEval, the LLM based approach on testing is very, is working fine and is open source also.

Demetrios:
And that's the DeepEval I haven't heard.

Syed Asad:
Let me just tell you the exact spelling. It is. Sorry. It is DeepEval. D E E P. Deep eval. I can.

Demetrios:
Yeah. Okay. I know DeepEval. All right. Yeah, for sure. Okay. Hi. I for some reason was understanding D Eval.

Syed Asad:
Yeah, actually I was pronouncing it wrong.

Demetrios:
Nice. So these are some of your favorite, non favorite, and that's very good to know. It is awesome to hear about all of this. Is there anything else that you want to say before we jump off? Anything that you can, any wisdom you can impart on us for your rag systems and how you have learned the hard way? So tell us so we don't have to learn that way.

Syed Asad:
Just go. Don't go with the marketing. Don't go with the marketing. Do your own research. Hugging face is a good, I mean, just fantastic. The leaderboard, although everything does not work in the leaderboard, also say, for example, I don't, I don't know about today and tomorrow, today and yesterday, but there was a model from Salesforce, the embedding model from Salesforce. It is still topping charts, I think, in the, on the MTEB. MTEB leaderboard for the embedding models.

Syed Asad:
But you cannot use it in the production. It is way too huge to implement it. So what's the use? Mixed bread AI. The mixed bread AI, they are very light based, lightweight, and they, they are working fine. They're not even on the leaderboard. They were on the leaderboard, but they're right, they might not. When I saw they were ranking on around seven or eight on the leaderboard, MTEB leaderboard, but they were working fine. So even on the leaderboard thing, it does not works.

Demetrios:
And right now it feels a little bit like, especially when it comes to embedding models, you just kind of go to the leaderboard and you close your eyes and then you pick one of them. Have you figured out a way to better test these or do you just find one and then try and use it everywhere?

Syed Asad:
No, no, that is not the case. Actually what I do is that I need to find the first, the embedding model. Try to find the embedding model based on my use case. Like if it is an embedding model on a medical use case more. So I try to find that. But the second factor to filter that is, is the size of that embedding model. Because at the end, if I am doing the entire POC or an entire research with that embedding model, what? And it has happened to me that we did entire research with embedding models, large language models, and then we have to remove everything just on the production part and it just went in smoke. Everything.

Syed Asad:
So a lightweight embedding model, especially the one which, which has started working recently, is that the cohere embedding models, and they have given a facility to call those embedding models in a quantized format. So that is also working and fast. Embed is one of the things which is by Qdrant, these two things are working in the production. I'm talking in the production for research. You can do anything.

Demetrios:
Brilliant, man. Well, this has been great. I really appreciate it. Asad, thank you for coming on here and for anybody else that would like to come on to the vector space talks, just let us know. In the meantime, don't get lost in vector space. We will see you all later. Have a great afternoon. Morning, evening, wherever you are.

Demetrios:
Asad, you taught me so much, bro. Thank you.
