---
draft: true
title: "Building a High-Performance Entity Matching Solution with Qdrant -
  Rishabh Bhardwaj | Vector Space Talks #005"
slug: vector-space-talk-005
short_description: Rishabh Bhardwaj, a data engineer at HRS Group, discusses
  building a high-performance hotel matching solution with Qdrant.
description: Rishabh Bhardwaj, a data engineer at HRS Group, discusses building
  a high-performance hotel matching solution with Qdrant, addressing data
  inconsistency, duplication, and real-time processing challenges.
preview_image: /blog/from_cms/rishabh-bhardwaj.png
date: 2024-01-09T11:53:56.825Z
author: Demetrios Brinkmann
featured: true
tags:
  - Vector Space Talk
  - Entity Matching Solution
  - Real Time Processing
---
> *"When we were building proof of concept for this solution, we initially started with Postgres. But after some experimentation, we realized that it basically does not perform very well in terms of recall and speed... then we came to know that Qdrant performs a lot better as compared to other solutions that existed at the moment.”*\
> -- Rishabh Bhardwaj
> 

How does the HNSW (Hierarchical Navigable Small World) algorithm benefit the solution built by Rishabh?

Rhishabh, a data engineer at HRS Group, excels in designing, developing, and maintaining data pipelines and infrastructure crucial for data-driven decision-making processes. With extensive experience, Rhishabh brings a profound understanding of data engineering principles and best practices to the role. Proficient in SQL, Python, Airflow, ETL tools, and cloud platforms like AWS and Azure, Rhishabh has a proven track record of delivering high-quality data solutions that align with business needs. Collaborating closely with data analysts, scientists, and stakeholders at HRS Group, Rhishabh ensures the provision of valuable data and insights for informed decision-making.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/3IMIZljXqgYBqt671eaR9b?si=HUV6iwzIRByLLyHmroWTFA), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/tDWhMAOyrcE).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/tDWhMAOyrcE?si=-LVPtwvJTyyvaSv3" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe style="border-radius:12px" src="https://open.spotify.com/embed/episode/3IMIZljXqgYBqt671eaR9b/video?utm_source=generator" width="496" height="279" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>

## **Top Takeaways:**

Data inconsistency, duplication, and real-time processing challenges? Rishabh Bhardwaj, Data Engineer at HRS Group has the solution!

In this episode, Rishabh Bhardwaj dives into the nitty-gritty of creating a high-performance hotel matching solution with Qdrant, covering everything from data inconsistency challenges to the speed and accuracy enhancements achieved through the HNSW algorithm.

5 Keys to Learning from the Episode:

1. Discover the importance of data consistency and the challenges it poses when dealing with multiple sources and languages.
2. Learn how Quadrant, an open-source vector database, outperformed other solutions and provided an efficient solution for high-speed matching.
3. Explore the unique modification of the HNSW algorithm in Quadrant and how it optimized the performance of the solution.
4. Dive into the crucial role of geofiltering and how it ensures accurate matching based on hotel locations.
5. Gain insights into the considerations surrounding GDPR compliance and the secure handling of hotel data.

> Fun Fact: Did you know that Rishabh and his team experimented with multiple transformer models to find the best fit for their entity resolution use case? Ultimately, they found that the Mini LM model struck the perfect balance between speed and accuracy. Talk about a winning combination!
> 

## Show Notes:

02:24 Data from different sources is inconsistent and complex.\
05:03 Using Postgres for proof, switched to Qdrant for better results\
09:16 Geofiltering is crucial for validating our matches.\
11:46 Insights on performance metrics and benchmarks.\
16:22 We experimented with different values and found the desired number.\
19:54 We experimented with different models and found the best one.\
21:01 API gateway connects multiple clients for entity resolution.\
24:31 Multiple languages supported, using transcript API for accuracy.

## More Quotes from Rishabh:

*"One of the major challenges is the data inconsistency.”*\
-- Rishabh Bhardwaj

*"So the only thing of how to know that which model would work for us is to again experiment with the models on our own data sets. But after doing those experiments, we realized that this is the best model that offers the best balance between speed and accuracy cool of the embeddings.”*\
-- Rishabh Bhardwaj

*"Qdrant basically optimizes a lot using for the compute resources and this also helped us to scale the whole infrastructure in a really efficient manner.”*\
-- Rishabh Bhardwaj

## Transcript:
Demetrios:
Hello, fellow travelers in vector space there. I call you astronauts. Today we've got an incredible conversation coming up with Rashab, and I am happy that you all have joined us. Rashab, it's great to have you here, man. How you doing?

Rishabh Bhardwaj:
Thanks for having me, Dimitris. I'm doing really great.

Demetrios:
Cool. I love hearing that. And I know you are in India. It is a little bit late there, so I appreciate you taking the time to come on the Vector space talks with us today. You've got a lot of stuff that you're going to be talking about. For anybody that does not know you, you are a data engineer at Hrs Group, and you're responsible for designing, developing, and maintaining data pipelines and infrastructure that supports the company. I am excited because today we're going to be talking about building a high performance hotel matching solution with Qdrant. Of course, there's a little kicker there.

Demetrios:
We want to get into how you did that and how you leveraged Qdrant. Let's talk about it, man. Let's get into it. I want to know give us a quick overview of what exactly this is. I gave the title, but I think you can tell us a little bit more about building this high performance hotel matching solution.

Rishabh Bhardwaj:
Definitely. So to start with, a brief description about the project. So we have some data in our internal databases, and we ingest a lot of data on a regular basis from different sources. So Hrs is basically a global tech company focused on business travel, and we have one of the most used hotel booking portals in Europe. So one of the major things that is important for customer satisfaction is the content that we provide them on our portals. Right. So the issue or the key challenges that we have is basically with the data itself that we ingest from different sources. One of the major challenges is the data inconsistency.

Rishabh Bhardwaj:
So different sources provide data in different formats, not only in different formats. It comes in multiple languages as well. So almost all the languages being used across Europe and also other parts of the world as well. So, Majorly, the data is coming across 20 different languages, and it makes it really difficult to consolidate and analyze this data. And this inconsistency in data often leads to many errors in data interpretation and decision making as well. Also, there is a challenge of data duplication, so the same piece of information can be represented differently across various sources, which could then again lead to data redundancy. And identifying and resolving these duplicates is again a significant challenge. Then the last challenge I can think about is that this data processing happens in real time.

Rishabh Bhardwaj:
So we have a constant influx of data from multiple sources, and processing and updating this information in real time is a really daunting task. Yeah.

Demetrios:
And when you are talking about this data duplication, are you saying things like, it's the same information in French and German? Or is it something like it's the same column, just a different way in like, a table?

Rishabh Bhardwaj:
Actually, it is both the cases, so the same entities can be coming in multiple languages. And then again, second thing also wow.

Demetrios:
All right, cool. Well, that sets the scene for us. Now, I feel like you brought some slides along. Feel free to share those whenever you want. I'm going to fire away the first question and ask about this. I'm going to go straight into Qdrant questions and ask you to elaborate on how the unique modification of Qdrant of the HNSW algorithm benefits your solution. So what are you doing there? How are you leveraging that? And how also to add another layer to this question, this ridiculously long question that I'm starting to get myself into, how do you handle geo filtering based on longitude and latitude? So, to summarize my lengthy question, let's just start with the HNSW algorithm. How does that benefit your solution?

Rishabh Bhardwaj:
Sure. So to begin with, I will give you a little backstory. So when we were building proof of concept for this solution, we initially started with Postgres, because we had some Postgres databases lying around in development environments, and we just wanted to try out and build a proof of concept. So we installed an extension called Pgvector. And at that point of time, it used to have IVF Flat indexing approach. But after some experimentation, we realized that it basically does not perform very well in terms of recall and speed. Basically, if we want to increase the speed, then we would suffer a lot on basis of recall. Then we started looking for native vector databases in the market, and then we saw some benchmarks and we came to know that Qdrant performs a lot better as compared to other solutions that existed at the moment.

Rishabh Bhardwaj:
And also, it was open source and really easy to host and use. We just needed to deploy a docker image in EC two instance and we can really start using it.

Demetrios:
Did you guys do your own benchmarks too? Or was that just like, you looked, you saw, you were like, all right, let's give this thing a spin.

Rishabh Bhardwaj:
So while deciding initially we just looked at the publicly available benchmarks, but later on, when we started using Qdrant, we did our own benchmarks internally. Nice.

Demetrios:
All right.

Rishabh Bhardwaj:
We just deployed a docker image of Qdrant in one of the EC Two instances and started experimenting with it. Very soon we realized that the HNSW indexing algorithm that it uses to build the indexing for the vectors, it was really efficient. We noticed that as compared to the PG Vector IVF Flat approach, it was around 16 times faster. And it didn't mean that it was not that accurate. It was actually 5% more accurate as compared to the previous results. So hold up.

Demetrios:
16 times faster and 5% more accurate. And just so everybody out there listening knows we're not paying you to say this, right?

Rishabh Bhardwaj:
No, not at all.

Demetrios:
All right, keep going. I like it.

Rishabh Bhardwaj:
Yeah. So initially, during the experimentations, we begin with the default values for the HNSW algorithm that Qdrant ships with. And these benchmarks that I just told you about, it was based on those parameters. But as our use cases evolved, we also experimented on multiple values of basically M and EF construct that Qdrant allow us to specify in the indexing algorithm.

Demetrios:
Right.

Rishabh Bhardwaj:
So also the other thing is, Qdrant also provides the functionality to specify those parameters while making the search as well. So it does not mean if we build the index initially, we only have to use those specifications. We can again specify them during the search as well.

Demetrios:
Okay.

Rishabh Bhardwaj:
Yeah. So some use cases we have requires 100% accuracy. It means we do not need to worry about speed at all in those use cases. But there are some use cases in which speed is really important when we need to match, like, a million scale data set. In those use cases, speed is really important, and we can adjust a little bit on the accuracy part. So, yeah, this configuration that Qdrant provides for indexing really benefited us in our approach.

Demetrios:
Okay, so then layer into that all the fun with how you're handling geofiltering.

Rishabh Bhardwaj:
So geofiltering is also a very important feature in our solution because the entities that we are dealing with in our data majorly consist of hotel entities. Right. And hotel entities often comes with the geocordinates. So even if we match it using one of the Embedding models, then we also need to make sure that whatever the model has matched with a certain cosine similarity is also true. So in order to validate that, we use geofiltering, which also comes in stacked with Qdrant. So we provide geocordinate data from our internal databases, and then we match it from what we get from multiple sources as well. And it also has a radius parameter, which we can provide to tune in. How much radius do we want to take in account in order for this to be filterable?

Demetrios:
Yeah. Makes sense. I would imagine that knowing where the hotel location is is probably a very big piece of the puzzle that you're serving up for people. So as you were doing this, what are some things that came up that were really important? I know you talked about working with Europe. There's a lot of GDPR concerns. Was there, like, privacy considerations that you had to address? Was there security considerations when it comes to handling hotel data? Vector, Embeddings, how did you manage all that stuff?

Rishabh Bhardwaj:
So GDP compliance? Yes. It does play a very important role in this whole solution.

Demetrios:
That was meant to be a thumbs up. I don't know what happened there. Keep going. Sorry, I derailed that.

Rishabh Bhardwaj:
No worries. Yes. So GDPR compliance is also one of the key factors that we take in account while building this solution to make sure that nothing goes out of the compliance. We basically deployed Qdrant inside a private EC two instance, and it is also protected by an API key. And also we have built custom authentication workflows using Microsoft Azure SSO.

Demetrios:
I see. So there are a few things that I also want to ask, but I do want to open it up. There are people that are listening, watching live. If anyone wants to ask any questions in the chat, feel free to throw something in there and I will ask away. In the meantime, while people are typing in what they want to talk to you about, can you talk to us about any insights into the performance metrics? And really, these benchmarks that you did where you saw it was, I think you said, 16 times faster and then 5% more accurate. What did that look like? What benchmarks did you do? How did you benchmark it? All that fun stuff. And what are some things to keep in mind if others out there want to benchmark? And I guess you were just benchmarking it against Pgvector, right?

Rishabh Bhardwaj:
Yes, we did.

Demetrios:
Okay, cool.

Rishabh Bhardwaj:
So for benchmarking, we have some data sets that are already matched to some entities. This was done partially by humans and partially by other algorithms that we use for matching in the past. And it is already consolidated data sets, which we again used for benchmarking purposes. Then the benchmarks that I specified were only against PG vector, and we did not benchmark it any further because the speed and the accuracy that Qdrant provides, I think it is already covering our use case and it is way more faster than we thought the solution could be. So right now we did not benchmark against any other vector database or any other solution.

Demetrios:
Makes sense just to also get an idea in my head kind of jumping all over the place, so forgive me. The semantic components of the hotel, was it text descriptions or images or a little bit of both? Everything?

Rishabh Bhardwaj:
Yes. So semantic comes just from the descriptions of the hotels, and right now it does not include the images. But in future use cases, we are also considering using images as well to calculate the semantic similarity between two entities.

Demetrios:
Nice. Okay, cool. Good. I am a visual guy. You got slides for us too, right? If I'm not mistaken? Do you want to share those or do you want me to keep hitting you with questions? We have something from Brad in the chat and maybe before you share any slides, is there a map visualization as part of the application UI? Can you speak to what you used?

Rishabh Bhardwaj:
If so, not right now, but this is actually a great idea and we will try to build it as soon as possible.

Demetrios:
Yeah, it makes sense. Where you have the drag and you can see like within this area, you have X amount of hotels, and these are what they look like, et cetera, et cetera.

Rishabh Bhardwaj:
Yes, definitely.

Demetrios:
Awesome. All right, so, yeah, feel free to share any slides you have, otherwise I can hit you with another question in the meantime, which is I'm wondering about the configurations you used for the HNSW index in Qdrant and what were the number of edges per node and the number of neighbors to consider during the index building. All of that fun stuff that goes into the nitty gritty of it.

Rishabh Bhardwaj:
So should I go with the slide first or should I answer your question first?

Demetrios:
Probably answer the question so we don't get too far off track, and then we can hit up your slides. And the slides, I'm sure, will prompt many other questions from my side and the audience's side.

Rishabh Bhardwaj:
So, for HNSW configuration, we have specified the value of M, which is, I think, basically the layers as 64, and the value for EF construct is 256.

Demetrios:
And how did you go about that?

Rishabh Bhardwaj:
So we did some again, benchmarks based on the single model that we have selected, which is mini LM, L six, V two. I will talk about it later also. But we basically experimented with different values of M and EF construct, and we came to this number that this is the value that we want to go ahead with. And also when I said that in some cases, indexing is not required at all, speed is not required at all, we want to make sure that whatever we are matching is 100% accurate. In that case, the Python client for Qdrant also provides a parameter called exact, and if we specify it as true, then it basically does not use indexing and it makes a full search on the whole vector collection, basically.

Demetrios:
Okay, so there's something for me that's pretty fascinating there on these different use cases. What else differs in the different ones? Because you have certain needs for speed or accuracy. It seems like those are the main trade offs that you're working with. What differs in the way that you set things up?

Rishabh Bhardwaj:
So in some cases so there are some internal databases that need to have hotel entities in a very sophisticated manner. It means it should not contain even a single duplicate entity. In those cases, accuracy is the most important thing we look at, and in some cases, for data analytics and consolidation purposes, we want speed more, but the accuracy should not be that much in value.

Demetrios:
So what does that look like in practice? Because you mentioned okay, when we are looking for the accuracy, we make sure that it comes through all of the different records. Right. Are there any other things in practice that you did differently?

Rishabh Bhardwaj:
Not really. Nothing I can think of right now.

Demetrios:
Okay, if anything comes up yeah, I'll remind you, but hit us with the slides, man. What do you got for the visual learners out there?

Rishabh Bhardwaj:
Sure. So I have an architecture diagram of what the solution looks like right now. So, this is the current architecture that we have in production. So, as I mentioned, we have deployed the Qdrant vector database in an EC Two, private EC Two instance hosted inside a VPC. And then we have some batch jobs running, which basically create Embeddings. And the source data basically first comes into S three buckets into a data lake. We do a little bit of preprocessing data cleaning and then it goes through a batch process of generating the Embeddings using the Mini LM model, mini LML six, V two. And this model is basically hosted in a SageMaker serverless inference endpoint, which allows us to not worry about servers and we can scale it as much as we want.

Rishabh Bhardwaj:
And it really helps us to build the Embeddings in a really fast manner.

Demetrios:
Why did you choose that model? Did you go through different models or was it just this one worked well enough and you went with it?

Rishabh Bhardwaj:
No, actually this was, I think the third or the fourth model that we tried out with. So what happens right now is if, let's say we want to perform a task such as sentence similarity and we go to the Internet and we try to find a model, it is really hard to see which model would perform best in our use case. So the only thing of how to know that which model would work for us is to again experiment with the models on our own data sets. So we did a lot of experiments. We used, I think, Mpnet model and a lot of multilingual models as well. But after doing those experiments, we realized that this is the best model that offers the best balance between speed and accuracy cool of the Embeddings. So we have deployed it in a serverless inference endpoint in SageMaker. And once we generate the Embeddings in a glue job, we then store them into the vector database Qdrant.

Rishabh Bhardwaj:
Then this part here is what goes on in the real time scenario. So, we have multiple clients, basically multiple application that would connect to an API gateway. We have exposed this API gateway in such a way that multiple clients can connect to it and they can use this entity resolution service according to their use cases. And we take in different parameters. Some are mandatory, some are not mandatory, and then they can use it based on their use case. The API gateway is connected to a lambda function which basically performs search on Qdrant vector database using the same Embeddings that can be generated from the same model that we hosted in the serverless inference endpoint. So, yeah, this is how the diagram looks right now. It did not used to look like this sometime back, but we have evolved it, developed it, and now we have got to this point where it is really scalable because most of the infrastructure that we have used here is serverless and it can be scaled up to any number of requests that you want.

Demetrios:
What did you have before that was the MVP.

Rishabh Bhardwaj:
So instead of this one, we had a real time inference endpoint which basically limited us to some number of requests that we had preset earlier while deploying the model. So this was one of the bottlenecks and then lambda function was always there, I think this one and also I think in place of this Qdrant vector database, as I mentioned, we had Postgres. So yeah, that was also a limitation because it used to use a lot of compute capacity within the EC two instance as compared to Qdrant. Qdrant basically optimizes a lot using for the compute resources and this also helped us to scale the whole infrastructure in a really efficient manner.

Demetrios:
Awesome. Cool. This is fascinating. From my side, I love seeing what you've done and how you went about iterating on the architecture and starting off with something that you had up and running and then optimizing it. So this project has been how long has it been in the making and what has the time to market been like that first MVP from zero to one and now it feels like you're going to one to infinity by making it optimized. What's the time frames been here?

Rishabh Bhardwaj:
I think we started this in the month of May this year. Now it's like five to six months already. So the first working solution that we built was in around one and a half months and then from there onwards we have tried to iterate it to make it better and better.

Demetrios:
Cool. Very cool. Some great questions come through in the chat. Do you have multiple language support for hotel names? If so, did you see any issues with such mappings?

Rishabh Bhardwaj:
Yes, we do have support for multiple languages and we do not do it using currently using the multilingual models because what we realized is the multilingual models are built on journal sentences and not based it is not trained on entities like names, hotel names and traveler names, et cetera. So when we experimented with the multilingual models it did not provide much satisfactory results. So we used transcript API from Google and it is able to basically translate a lot of languages across that we have across the data and it really gives satisfactory results in terms of entity resolution.

Demetrios:
Awesome. What other transformers were considered for the evaluation?

Rishabh Bhardwaj:
The ones I remember from top of my head are Mpnet, then there is a Chinese model called Text to VEC, Shiba something and Bert uncased, if I remember correctly. Yeah, these were some of the models.

Demetrios:
That we considered and nothing stood out that worked that well or was it just that you had to make trade offs on all of them?

Rishabh Bhardwaj:
So in terms of accuracy, Mpnet was a little bit better than Mini LM but then again it was a lot slower than the Mini LM model. It was around five times slower than the Mini LM model, so it was not a big trade off to give up with. So we decided to go ahead with Mini LM.

Demetrios:
Awesome. Well, dude, this has been pretty enlightening. I really appreciate you coming on here and doing this. If anyone else has any questions for you, we'll leave all your information on where to get in touch in the chat. Rashab, thank you so much. This is super cool. I appreciate you coming on here. Anyone that's listening, if you want to come onto the vector space talks, feel free to reach out to me and I'll make it happen.

Demetrios:
This is really cool to see the different work that people are doing and how you all are evolving the game, man. I really appreciate this.

Rishabh Bhardwaj:
Thank you, Dimitros. Thank you for inviting inviting me and have a nice day.