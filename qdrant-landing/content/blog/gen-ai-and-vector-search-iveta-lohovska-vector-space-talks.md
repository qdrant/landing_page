---
draft: false
title: Iveta Lohovska on Gen AI and Vector Search | Qdrant
slug: gen-ai-and-vector-search
short_description: Iveta talks about the importance of trustworthy AI,
  particularly when implementing it within high-stakes enterprises like
  governments and security agencies
description: Discover valuable insights on generative AI, vector search, and ethical AI implementation from Iveta Lohovska, Chief Technologist at HPE.
preview_image: /blog/from_cms/iveta-lohovska-bp-cropped.png
date: 2024-04-11T22:12:00.000Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - Vector Search
  - Retrieval Augmented Generation
  - GenAI
---
# Exploring Gen AI and Vector Search: Insights from Iveta Lohovska

> *"In the generative AI context of AI, all foundational models have been trained on some foundational data sets that are distributed in different ways. Some are very conversational, some are very technical, some are on, let's say very strict taxonomy like healthcare or chemical structures. We call them modalities, and they have different representations.”*\
— Iveta Lohovska
> 

Iveta Lohovska serves as the Chief Technologist and Principal Data Scientist for AI and Supercomputing at [Hewlett Packard Enterprise (HPE)](https://www.hpe.com/us/en/home.html), where she champions the democratization of decision intelligence and the development of ethical AI solutions. An industry leader, her multifaceted expertise encompasses natural language processing, computer vision, and data mining. Committed to leveraging technology for societal benefit, Iveta is a distinguished technical advisor to the United Nations' AI for Good program and a Data Science lecturer at the Vienna University of Applied Sciences. Her career also includes impactful roles with the World Bank Group, focusing on open data initiatives and Sustainable Development Goals (SDGs), as well as collaborations with USAID and the Gates Foundation.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/7f1RDwp5l2Ps9N7gKubl8S?si=kCSX4HGCR12-5emokZbRfw), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/RsRAUO-fNaA).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/RsRAUO-fNaA?si=s3k_-DP1U0rkPlEV" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Gen-AI-and-Vector-Search---Iveta-Lohovska--Vector-Space-Talks-020-e2hnie2/a-ab48uha" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

In our continuous pursuit of knowledge and understanding, especially in the evolving landscape of AI and the vector space, we brought another great Vector Space Talk episode featuring Iveta Lohovska as she talks about generative AI and [vector search](https://qdrant.tech/).

Iveta brings valuable insights from her work with the World Bank and as Chief Technologist at HPE, explaining the ins and outs of ethical AI implementation.

Here are the episode highlights:
- Exploring the critical role of trustworthiness and explainability in AI, especially within high confidentiality use cases like government and security agencies.
- Discussing the importance of transparency in AI models and how it impacts the handling of data and understanding the foundational datasets for vector search.
- Iveta shares her experiences implementing generative AI in high-stakes environments, including the energy sector and policy-making, emphasizing accuracy and source credibility.
- Strategies for managing data privacy in high-stakes sectors, the superiority of on-premises solutions for control, and the implications of opting for cloud or hybrid infrastructure.
- Iveta's take on the maturity levels of generative AI, the ongoing development of smaller, more focused models, and the evolving landscape of AI model licensing and open-source contributions.

> Fun Fact: The climate agent solution showcased by Iveta helps individuals benchmark their carbon footprint and assists policymakers in drafting policy recommendations based on scientifically accurate data.
> 

## Show notes:

00:00 AI's vulnerabilities and ethical implications in practice.\
06:28 Trust reliable sources for accurate climate data.\
09:14 Vector database offers control and explainability.\
13:21 On-prem vital for security and control.\
16:47 Gen AI chat models at basic maturity.\
19:28 Mature technical community, but slow enterprise adoption.\
23:34 Advocates for open source but highlights complexities.\
25:38 Unreliable information, triangle of necessities, vector space.

## More Quotes from Iveta:

*"What we have to ensure here is that every citation and every answer and augmentation by the generative AI on top of that is linked to the exact source of paper or publication, where it's coming from, to ensure that we can trace it back to where the climate information is coming from.”*\
— Iveta Lohovska

*"Explainability means if you receive a certain answer based on your prompt, you can trace it back to the exact source where the embedding has been stored or the source of where the information is coming from and things.”*\
— Iveta Lohovska

*"Chat GPT for conversational purposes and individual help is something very cool but when this needs to be translated into actual business use cases scenario with all the constraint of the enterprise architecture, with the constraint of the use cases, the reality changes quite dramatically.”*\
— Iveta Lohovska

## Transcript:
Demetrios:
Look at that. We are back for another vector space talks. I'm very excited to be doing this today with you all. I am joined by none other than Sabrina again. Where are you at, Sabrina? How's it going?

Sabrina Aquino:
Hey there, Demetrios. Amazing. Another episode and I'm super excited for this one. How are you doing?

Demetrios:
I'm great. And we're going to bring out our guest of honor today. We are going to be talking a lot about trustworthy AI because Iveta has a background working with the World bank and focusing on the open data with that. But currently she is chief technologist and principal data scientist at HPE. And we were talking before we hit record before we went live. And we've got some hot takes that are coming up. So I'm going to bring Iveta to the stage. Where are you? There you are, our guest of honor.

Demetrios:
How you doing?

Iveta Lohovska:
Good. I hope you can hear me well.

Demetrios:
Loud and clear. Yes.

Iveta Lohovska:
Happy to join here from Vienna and thank you for the invite.

Demetrios:
Yes. So I'm very excited to talk with you today. I think it's probably worth getting the TLDR on your story and why you're so passionate about trustworthiness and explainability.

Iveta Lohovska:
Well, I think especially in the genaid context where if there any vulnerabilities around the solution or the training data set or any underlying context, either in the enterprise or in a smaller scale, it's just the scale that AI engine AI can achieve if it has any vulnerabilities or any weaknesses when it comes to explainability or trustworthiness or bias, it just goes explain nature. So it is to be considered and taken with high attention when it comes to those use cases. And most of my work is within an enterprise with high confidentiality use cases. So it plays a big role more than actually people will think it's on a high level. It just sounds like AI ethical principles or high level words that are very difficult to implement in technical terms. But in reality, when you hit the ground, when you hit the projects, when you work with in the context of, let's say, governments or organizations that deal with atomic energy, I see it in Vienna, the atomic agency is a neighboring one, or security agencies. Then you see the importance and the impact of those terms and the technical implications behind that.

Sabrina Aquino:
That's amazing. And can you talk a little bit more about the importance of the transparency of these models and what can happen if we don't know exactly what kind of data they are being trained on?

Iveta Lohovska:
I mean, this is especially relevant under our context of [vector databases](https://qdrant.tech/articles/what-is-a-vector-database/) and vector search. Because in the generative AI context of AI, all foundational models have been trained on some foundational data sets that are distributed in different ways. Some are very conversational, some are very technical, some are on, let's say very strict taxonomy like healthcare or chemical structures. We call them modalities, and they have different representations. So, so when it comes to implementing vector search or [vector database](https://qdrant.tech/articles/what-is-a-vector-database/) and knowing the distribution of the foundational data sets, you have better control if you introduce additional layers or additional components to have the control in your hands of where the information is coming from, where it's stored, [what are the embeddings](https://qdrant.tech/articles/what-are-embeddings/). So that helps, but it is actually quite important that you know what the foundational data sets are, so that you can predict any kind of weaknesses or vulnerabilities or penetrations that the solution or the use case of the model will face when it lands at the end user. Because we know with generative AI that is unpredictable, we know we can implement guardrails. They're already solutions.

Iveta Lohovska:
We know they're not 100, they don't give you 100% certainty, but they are definitely use cases and work where you need to hit the hundred percent certainty, especially intelligence, cybersecurity and healthcare.

Demetrios:
Yeah, that's something that I wanted to dig into a little bit. More of these high stakes use cases feel like you can't. I don't know. I talk with a lot of people about at this current time, it's very risky to try and use specifically generative AI for those high stakes use cases. Have you seen people that are doing it well, and if so, how?

Iveta Lohovska:
Yeah, I'm in the business of high stakes use cases and yes, we do those kind of projects and work, which is very exciting and interesting, and you can see the impact. So I'm in the generative AI implementation into enterprise control. An enterprise context could mean critical infrastructure, could mean telco, could mean a government, could mean intelligence organizations. So those are just a few examples, but I could flip the coin and give you an alternative for a public one where I can share, let's say a good example is climate data. And we recently worked on, on building a knowledge worker, a climate agent that is trained, of course, his foundational knowledge, because all foundational models have prior knowledge they can refer to. But the key point here is to be an expert on climate data emissions gap country cards. Every country has a commitment to meet certain reduction emission reduction goals and then benchmarked and followed through the international supervisions of the world, like the United nations environmental program and similar entities. So when you're training this agent on climate data, they're competing ideas or several sources.

Iveta Lohovska:
You can source your information from the local government that is incentivized to show progress to the nation and other stakeholders faster than the actual reality, the independent entities that provide information around the state of the world when it comes to progress towards certain climate goals. And there are also different parties. So for this kind of solution, we were very lucky to work with kind of the status co provider, the benchmark around climate data, around climate publications. And what we have to ensure here is that every citation and every answer and augmentation by the generative AI on top of that is linked to the exact source of paper or publication, where it's coming from, to ensure that we can trace it back to where the climate information is coming from. If Germany performs better compared to Austria, and also the partner we work with was the United nations environmental program. So they want to make sure that they're the citadel scientific arm when it comes to giving information. And there's no compromise, could be a compromise on the structure of the answer, on the breadth and death of the information, but there should be no compromise on the exact fact fullness of the information and where it's coming from. And this is a concrete example because why, you oughta ask, why is this so important? Because it has two interfaces.

Iveta Lohovska:
It has the public. You can go and benchmark your carbon footprint as an individual living in one country comparing to an individual living in another. But if you are a policymaker, which is the other interface of this application, who will write the policy recommendation of a country in their own country, or a country they're advising on, you might want to make sure that the scientific citations and the policy recommendations that you're making are correct and they are retrieved from the proper data sources. Because there will be a huge implication when you go public with those numbers or when you actually design a law that is reinforceable with legal terms and law enforcement.

Sabrina Aquino:
That's very interesting, Iveta, and I think this is one of the great use cases for [RAG](https://qdrant.tech/articles/what-is-rag-in-ai/), for example. And I think if you can talk a little bit more about how vector search is playing into all of this, how it's helping organizations do this, this.

Iveta Lohovska:
Would be amazing in such specific use cases. I think the main differentiator is the traceability component, the first that you have full control on which data it will refer to, because if you deal with open source models, most of them are open, but the data it has been trained on has not been opened or given public so with vector database you introduce a step of control and explainability. Explainability means if you receive a certain answer based on your prompt, you can trace it back to the exact source where the embedding has been stored or the source of where the information is coming from and things. So this is a major use case for us for those kind of high stake solution is that you have the explainability and traceability. Explainability. It could be as simple as a semantical similarity to the text, but also the traceability of where it's coming from and the exact link of where it's coming from. So it should be, it shouldn't be referred. You can close and you can cut the line of the model referring to its previous knowledge by introducing a [vector database](https://qdrant.tech/articles/what-is-a-vector-database/), for example.

Iveta Lohovska:
So there could be many other implications and improvements in terms of speed and just handling huge amounts of data, yet also nice to have that come with this kind of technique, but the prior use case is actually not incentivized around those.

Demetrios:
So if I'm hearing you correctly, it's like yet another reason why you should be thinking about using vector databases, because you need that ability to cite your work and it's becoming a very strong design pattern. Right. We all understand now, if you can't see where this data has been pulled from or you can't get, you can't trace back to the actual source, it's hard to trust what the output is.

Iveta Lohovska:
Yes, and the easiest way to kind of cluster the two groups. If you think of creative fields and marketing fields and design fields where you could go wild and crazy with the temperature on each model, how creative it could go and how much novelty it could bring to the answer are one family of use cases. But there is exactly the opposite type of use cases where this is a no go and you don't need any creativity, you just focus on, focus on the factfulness and explainability. So it's more of the speed and the accuracy of retrieving information with a high level of novelty, but not compromising on any kind of facts within the answer, because there will be legal implications and policy implications and societal implications based on the action taken on this answer, either policy recommendation or legal action. There's a lot to do with the intelligence agencies that retrieve information based on nearest neighbor or kind of a relational analysis that you can also execute with vector databases and generative AI.

Sabrina Aquino:
And we know that for these high stakes sectors that data privacy is a huge concern. And when we're talking about using vector databases and storing that data somewhere, what are some of the principles or techniques that you use in terms of infrastructure, where should you store your vector database and how should you think about that part of your system?

Iveta Lohovska:
Yeah, so most of the cases, I would say 99% of the cases, is that if you have such a high requirements around security and explainability, security of the data, but those security of the whole use case and environment, and the explainability and trustworthiness of the answer, then it's very natural to have expectations that will be on prem and not in the cloud, because only on prem you have a full control of where your data sits, where your model sits, the full ownership of your IP, and then the full ownership of having less question marks of the implementation and architecture, but mainly the full ownership of the end to end solution. So when it comes to those use cases, RAG on Prem, with the whole infrastructure, with the whole software and platform layers, including models on Prem, not accessible through an API, through a service somewhere where you don't know where the guardrails is, who designed the guardrails, what are the guardrails? And we see those, this a lot with, for example, copilot, a lot of question marks around that. So it's a huge part of my work is just talking of it, just sorting out that.

Sabrina Aquino:
Exactly. You don't want to just give away your data to a cloud provider, because there's many implications that that comes with. And I think even your clients, they need certain certifications, then they need to make sure that nobody can access that data, something that you cannot. Exactly. I think ensure if you're just using a cloud provider somewhere, which is, I think something that's very important when you're thinking about these high stakes solutions. But also I think if you're going to maybe outsource some of the infrastructure, you also need to think about something that's similar to a [hybrid cloud solution](https://qdrant.tech/documentation/hybrid-cloud/) where you can keep your data and outsource the kind of management of infrastructure. So that's also a nice use case for that, right?

Iveta Lohovska:
I mean, I work for HPE, so hybrid is like one of our biggest sacred words. Yeah, exactly. But actually like if you see the trends and if you see how expensive is to work to run some of those workloads in the cloud, either for training for national model or fine tuning. And no one talks about inference, inference not in ten users, but inference in hundred users with big organizations. This itself is not sustainable. Honestly, when you do the simple Linux, algebra or math of the exponential cost around this. That's why everything is hybrid. And there are use cases that make sense to be fast and speedy and easy to play with, low risk in the cloud to try.

Iveta Lohovska:
But when it comes to actual GenAI work and LLM models, yeah, the answer is never straightforward when it comes to the infrastructure and the environment where you are hosting it, for many reasons, not just cost, but any other.

Demetrios:
So there's something that I've been thinking about a lot lately that I would love to get your take on, especially because you deal with this day in and day out, and it is the maturity levels of the current state of Gen AI and where we are at for chat GPT or just llms and foundational models feel like they just came out. And so we're almost in the basic, basic, basic maturity levels. And when you work with customers, how do you like kind of signal that, hey, this is where we are right now, but you should be very conscientious that you're going to need to potentially work with a lot of breaking changes or you're going to have to be constantly updating. And this isn't going to be set it and forget it type of thing. This is going to be a lot of work to make sure that you're staying up to date, even just like trying to stay up to date with the news as we were talking about. So I would love to hear your take on on the different maturity levels that you've been seeing and what that looks like.

Iveta Lohovska:
So I have huge exposure to GenAI for the enterprise, and there's a huge component expectation management. Why? Because chat GPT for conversational purposes and individual help is something very cool. But when this needs to be translated into actual business use cases scenario with all the constraint of the enterprise architecture, with the constraint of the use cases, the reality changes quite dramatically. So end users who are used to expect level of forgiveness as conversational chatbots have, is very different of what you will get into actual, let's say, knowledge worker type of context, or summarization type of context into the enterprise. And it's not so much to the performance of the models, but we have something called modalities of the models. And I don't think there will be ultimately one model with all the capabilities possible, let's say cult generation or image generation, voice generational, or just being very chatty and loving and so on. There will be multiple mini models out there for those. Modalities in actual architecture with reasonable cost are very difficult to handle.

Iveta Lohovska:
So I would say the technical community feels we are very mature and very fast. The enterprise adoption is a totally different topic, and it's a couple of years behind, but also the society type of technologists like me, who try to keep up with the development and we know where we stand at this point, but they're the legal side and the regulations coming in, like the EU act and Biden trying to regulate the compute power, but also how societies react to this and how they adapt. And I think especially on the third one, we are far behind understanding and the implications of this technology, also adopting it at scale and understanding the vulnerabilities. That's why I enjoy so much my enterprise work is because it's a reality check. When you put the price tag attached to actual Gen AI use case in production with the inference cost and the expected performance, it's different situation when you just have an app on the phone and you chat with it and it pulls you interesting links. So yes, I think that there's a bridge to be built between the two worlds.

Demetrios:
Yeah. And I find it really interesting too, because it feels to me like since it is so new, people are more willing to explore and not necessarily have that instant return of the ROI, but when it comes to more traditional ML or predictive ML, it is a bit more mature and so there's less patience for that type of exploration. Or, hey, is this use case? If you can't by now show the ROI of a predictive ML use case, then that's a little bit more dangerous. But if you can't with a Gen AI use case, it is not that big of a deal.

Iveta Lohovska:
Yeah, it's basically a technology growing up in front of our eyes. It's a kind of a flying a plane while building it type of situation. We are seeing it in the real time, and I agree with you. So that the maturity around ML is one thing, but around generative AI, and they will be a model of kind of mini disappointment or decline, in my opinion, before actually maturing product. This kind of powerful technology in a sustainable way. Sustainable ways mean you can afford it, but also it proves your business case and use case. Otherwise it's just doing for the sake of doing it because everyone else is doing it.

Demetrios:
Yeah, yeah, 100%. So I know we're bumping up against time here. I do feel like there was a bit of a topic that we wanted to discuss with the licenses and how that plays into basically trustworthiness and explainability. And so we were talking about how, yeah, the best is to run your own model, and it probably isn't going to be this gigantic model that can do everything. It's the, it seems like the trends are going into smaller models. And from your point of view though, we are getting new models like every week. It feels like. Yeah, especially.

Demetrios:
I mean, we were just talking about this before we went live again, like databricks just released there. What is it? DBRX Yesterday you had Mistral releasing like a new base model over the weekend, and then Llama 3 is probably going to come out in the flash of an eye. So where do you stand in regards to that? It feels like there's a lot of movement in open source, but it is a little bit of, as you mentioned, like, to be cautious with the open source movement.

Iveta Lohovska:
So I think it feels like there's a lot of open source, but that. So I'm totally for open sourcing and giving the people and the communities the power to be able to innovate, to do R & D in different labs so it's not locked to the view. Elite big tech companies that can afford this kind of technology. So kudos to meta for trying compared to the other equal players in the space. But open source comes with a lot of ecosystem in our world, especially for the more powerful models, which is something I don't like because it becomes like just, it immediately translates into legal fees type of conversation. It's like there are too many if else statements in those open source licensing terms where it becomes difficult to navigate, for technologists to understand what exactly this means, and then you have to bring the legal people to articulate it to you or to put additional clauses. So it's becoming a very complex environment to handle and less and less open, because there are not so many open source and small startup players that can afford to train foundational models that are powerful and useful. So it becomes a bit of a game logged to a view, and I think everyone needs to be a bit worried about that.

Iveta Lohovska:
So we can use the equivalents from the past, but I don't think we are doing well enough in terms of open sourcing. The three main core components of LLM model, which is the model itself, the data it has been trained on, and the data sets, and most of the times, at least in one of those, is restricted or missing. So it's difficult space to navigate.

Demetrios:
Yeah, yeah. You can't really call it trustworthy, or you can't really get the information that you need and that you would hope for if you're missing one of those three. I do like that little triangle of the necessities. So, Iveta, this has been awesome. I really appreciate you coming on here. Thank you, Sabrina, for joining us. And for everyone else that is watching, remember, don't get lost in vector space. This has been another vector space talk.

Demetrios:
We are out. Have a great weekend, everyone.

Iveta Lohovska:
Thank you. Bye. Thank you. Bye.
