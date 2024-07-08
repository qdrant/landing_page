---
draft: false
title: How to Superpower Your Semantic Search Using a Vector Database
  Vector Space Talks
slug: semantic-search-vector-database
short_description: Nicolas Mauti and his team at Malt discusses how they
  revolutionize the way freelancers connect with projects.
description: Unlock the secrets of supercharging semantic search with Nicolas Mauti's insights on leveraging vector databases. Discover advanced strategies.
preview_image: /blog/from_cms/nicolas-mauti-cropped.png
date: 2024-01-09T12:27:18.659Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - Retriever-Ranker Architecture
  - Semantic Search
---
# How to Superpower Your Semantic Search Using a Vector Database with Nicolas Mauti

> *"We found a trade off between performance and precision in Qdrant’s that were better for us than what we can found on Elasticsearch.”*\
> -- Nicolas Mauti
> 

Want precision & performance in freelancer search? Malt's move to the Qdrant database is a masterstroke, offering geospatial filtering & seamless scaling. How did Nicolas Mauti and the team at Malt identify the need to transition to a retriever-ranker architecture for their freelancer matching app?

Nicolas Mauti, a computer science graduate from INSA Lyon Engineering School, transitioned from software development to the data domain. Joining Malt in 2021 as a data scientist, he specialized in recommender systems and NLP models within a freelancers-and-companies marketplace. Evolving into an MLOps Engineer, Nicolas adeptly combines data science, development, and ops knowledge to enhance model development tools and processes at Malt. Additionally, he has served as a part-time teacher in a French engineering school since 2020. Notably, in 2023, Nicolas successfully deployed Qdrant at scale within Malt, contributing to the implementation of a new matching system.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/5aTPXqa7GMjekUfD8aAXWG?si=otJ_CpQNScqTK5cYq2zBow), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/OSZSingUYBM).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/OSZSingUYBM?si=1PHIRm5K5Q-HKIiS" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Superpower-Your-Semantic-Search-Using-Vector-Database---Nicolas-Mauti--Vector-Space-Talk-007-e2d9lrs/a-aaoae5a" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top Takeaways:**

Dive into the intricacies of [semantic search](https://qdrant.tech/documentation/tutorials/search-beginners/) enhancement with Nicolas Mauti, MLOps Engineer at Malt. Discover how Nicolas and his team at Malt revolutionize the way freelancers connect with projects.

In this episode, Nicolas delves into enhancing semantics search at Malt by implementing a retriever-ranker architecture with multilingual transformer-based models, improving freelancer-project matching through a transition to [Qdrant](https://qdrant.tech/) that reduced latency from 10 seconds to 1 second and bolstering the platform's overall performance and scaling capabilities.

5 Keys to Learning from the Episode:

1. **Performance Enhancement Tactics**: Understand the technical challenges Malt faced due to increased latency brought about by their expansion to over half a million freelancers and the solutions they enacted.
2. **Advanced Matchmaking Architecture**: Learn about the retriever-ranker model adopted by Malt, which incorporates semantic searching alongside a KNN search for better efficacy in pairing projects with freelancers.
3. **Cutting-Edge Model Training**: Uncover the deployment of a multilingual transformer-based encoder that effectively creates high-fidelity embeddings to streamline the matchmaking process.
4. **Database Selection Process**: Mauti discusses the factors that shaped Malt's choice of database systems, facilitating a balance between high performance and accurate filtering capabilities.
5. **Operational Improvements**: Gain knowledge of the significant strides Malt made post-deployment, including a remarkable reduction in application latency and its positive effects on scalability and matching quality.

> Fun Fact: Malt employs a multilingual transformer-based encoder model to generate 384-dimensional embeddings, which improved their semantic search capability.
> 

## Show Notes:

00:00 Matching app experiencing major performance issues.\
04:56 Filtering freelancers and adopting retriever-ranker architecture.\
09:20 Multilingual encoder model for adapting semantic space.\
10:52 Review, retrain, categorize, and organize freelancers' responses.\
16:30 Trouble with geospatial filtering databases\
17:37 Benchmarking performance and precision of search algorithms.\
21:11 Deployed in Kubernetes. Stored in Git repository, synchronized with Argo CD.\
27:08 Improved latency quickly, validated architecture, aligned steps.\
28:46 Invitation to discuss work using specific methods.

## More Quotes from Nicolas:

*"And so GitHub's approach is basic idea that your git repository is your source of truth regarding what you must have in your Kubernetes clusters.”*\
-- Nicolas Mauti

*"And so we can see that our space seems to be well organized, where the tech freelancer are close to each other and the graphic designer for example, are far from the tech family.”*\
-- Nicolas Mauti

*"And also one thing that interested us is that it's multilingual. And as Malt is a European company, we have to have to model a multilingual model.”*\
-- Nicolas Mauti

## Transcript:
Demetrios:
We're live. We are live in the flesh. Nicholas, it's great to have you here, dude. And welcome to all those vector space explorers out there. We are back with another vector space talks. Today we're going to be talking all about how to superpower your semantics search with my man Nicholas, an ML ops engineer at Malt, in case you do not know what Malt is doing. They are pairing up, they're making a marketplace. They are connecting freelancers and companies.

Demetrios:
And Nicholas, you're doing a lot of stuff with recommender systems, right?

Nicolas Mauti:
Yeah, exactly.

Demetrios:
I love that. Well, as I mentioned, I am in an interesting spot because I'm trying to take in all the vitamin D I can while I'm listening to your talk. Everybody that is out there listening with us, get involved. Let us know where you're calling in from or watching from. And also feel free to drop questions in the chat as we go along. And if need be, I will jump in and stop Nicholas. But I know you got a little presentation for us, man you want to get into.

Nicolas Mauti:
Thanks for the, thanks for the introduction and hello, everyone. And thanks for the invitation to this talk, of course. So let's start. Let's do it.

Demetrios:
I love it. Superpowers.

Nicolas Mauti:
Yeah, we will have superpowers at the end of this presentation. So, yeah, hello, everyone. So I think the introduction was already done and perfectly done by Dimitrios. So I'm Nicola and yeah, I'm working as an Mlaps engineer at Malt. And also I'm a part time teacher in a french engineering school where I teach some mlaps course. So let's dig in today's subjects. So in fact, as Dimitrio said, malt is a marketplace and so our goal is to match on one side freelancers. And those freelancers have a lot of attributes, for example, a description, some skills and some awesome skills.

Nicolas Mauti:
And they also have some preferences and also some attributes that are not specifically semantics. And so it will be a key point of our topics today. And on other sides we have what we call projects that are submitted by companies. And this project also have a lot of attributes, for example, description, also some skills and need to find and also some preferences. And so our goal at the end is to perform a match between these two entities. And so for that we add a matching app in production already. And so in fact, we had a major issue with this application is performance of this application because the application becomes very slow. The p 50 latency was around 10 seconds.

Nicolas Mauti:
And what you have to keep from this is that if your latency, because became too high, you won't be able to perform certain scenarios. Sometimes you want some synchronous scenario where you fill your project and then you want to have directly your freelancers that match this project. And so if it takes too much time, you won't be able to have that. And so you will have to have some asynchronous scenario with email or stuff like that. And it's not very a good user experience. And also this problem were amplified by the exponential growth of the platform. Absolutely, we are growing. And so to give you some numbers, when I arrived two years ago, we had two time less freelancers.

Nicolas Mauti:
And today, and today we have around 600,000 freelancers in your base. So it's growing. And so with this grow, we had some, several issue. And something we have to keep in mind about this matching app. And so it's not only semantic app, is that we have two things in these apps that are not semantic. We have what we call art filters. And so art filters are art rules defined by the project team at Malt. And so these rules are hard and we have to respect them.

Nicolas Mauti:
For example, the question is hard rule at malt we have a local approach, and so we want to provide freelancers that are next to the project. And so for that we have to filter the freelancers and to have art filters for that and to be sure that we respect these rules. And on the other side, as you said, demetrius, we are talking about Rexis system here. And so in a rexy system, you also have to take into account some other parameters, for example, the preferences of the freelancers and also the activity on the platform of the freelancer, for example. And so in our system, we have to keep this in mind and to have this working. And so if we do a big picture of how our system worked, we had an API with some alphilter at the beginning, then ML model that was mainly semantic and then some rescoring function with other parameters. And so we decided to rework this architecture and to adopt a retriever ranker architecture. And so in this architecture, you will have your pool of freelancers.

Nicolas Mauti:
So here is your wall databases, so your 600,000 freelancers. And then you will have a first step that is called the retrieval, where we will constrict a subsets of your freelancers. And then you can apply your wrong kill algorithm. That is basically our current application. And so the first step will be, semantically, it will be fast, and it must be fast because you have to perform a quick selection of your more interesting freelancers and it's built for recall, because at this step you want to be sure that you have all your relevant freelancers selected and you don't want to exclude at this step some relevant freelancer because the ranking won't be able to take back these freelancers. And on the other side, the ranking can contain more features, not only semantics, it less conference in time. And if your retrieval part is always giving you a fixed size of freelancers, your ranking doesn't have to scale because you will always have the same number of freelancers in inputs. And this one is built for precision.

Nicolas Mauti:
At this point you don't want to keep non relevant freelancers and you have to be able to rank them and you have to be state of the art for this part. So let's focus on the first part. That's what will interesting us today. So for the first part, in fact, we have to build this semantic space where freelancers that are close regarding their skills or their jobs are closed in this space too. And so for that we will build this semantic space. And so then when we receive a project, we will have just to project this project in our space. And after that you will have just to do a search and a KNN search for knee arrest neighbor search. And in practice we are not doing a KNN search because it's too expensive, but inn search for approximate nearest neighbors.

Nicolas Mauti:
Keep this in mind, it will be interesting in our next slides. And so, to get this semantic space and to get this search, we need two things. The first one is a model, because we need a model to compute some vectors and to project our opportunity and our project and our freelancers in this space. And on another side, you will have to have a tool to operate this semantic step page. So to store the vector and also to perform the search. So for the first part, for the model, I will give you some quick info about how we build it. So for this part, it was more on the data scientist part. So the data scientist started from an e five model.

Nicolas Mauti:
And so the e five model will give you a common knowledge about the language. And also one thing that interested us is that it's multilingual. And as Malt is an european company, we have to have to model a multilingual model. And on top of that we built our own encoder model based on a transformer architecture. And so this model will be in charge to be adapted to Malchus case and to transform this very generic semantic space into a semantic space that is used for skills and jobs. And this model is also able to take into account the structure of a profile of a freelancer profile because you have a description and job, some skills, some experiences. And so this model is capable to take this into account. And regarding the training, we use some past interaction on the platform to train it.

Nicolas Mauti:
So when a freelancer receives a project, he can accept it or not. And so we use that to train this model. And so at the end we get some embeddings with 384 dimensions.

Demetrios:
One question from my side, sorry to stop you right now. Do you do any type of reviews or feedback and add that into the model?

Nicolas Mauti:
Yeah. In fact we continue to have some response about our freelancers. And so we also review them, sometimes manually because sometimes the response are not so good or we don't have exactly what we want or stuff like that, so we can review them. And also we are retraining the model regularly, so this way we can include new feedback from our freelancers. So now we have our model and if we want to see how it looks. So here I draw some ponds and color them by the category of our freelancer. So on the platform the freelancer can have category, for example tech or graphic or soon designer or this kind of category. And so we can see that our space seems to be well organized, where the tech freelancer are close to each other and the graphic designer for example, are far from the tech family.

Nicolas Mauti:
So it seems to be well organized. And so now we have a good model. So okay, now we have our model, we have to find a way to operate it, so to store this vector and to perform our search. And so for that, Vectordb seems to be the good candidate. But if you follow the news, you can see that vectordb is very trendy and there is plenty of actor on the market. And so it could be hard to find your loved one. And so I will try to give you the criteria we had and why we choose Qdrant at the end. So our first criteria were performances.

Nicolas Mauti:
So I think I already talked about this ponds, but yeah, we needed performances. The second ones was about inn quality. As I said before, we cannot do a KnN search, brute force search each time. And so we have to find a way to approximate but to be close enough and to be good enough on these points. And so otherwise we won't be leveraged the performance of our model. And the last one, and I didn't talk a lot about this before, is filtering. Filtering is a big problem for us because we have a lot of filters, of art filters, as I said before. And so if we think about my architecture, we can say, okay, so filtering is not a problem.

Nicolas Mauti:
You can just have a three step process and do filtering, semantic search and then ranking, or do semantic search, filtering and then ranking. But in both cases, you will have some troubles if you do that. The first one is if you want to apply prefiltering. So filtering, semantic search, ranking. If you do that, in fact, you will have, so we'll have this kind of architecture. And if you do that, you will have, in fact, to flag each freelancers before asking the [vector database](https://qdrant.tech/articles/what-is-a-vector-database/) and performing a search, you will have to flag each freelancer whether there could be selected or not. And so with that, you will basically create a binary mask on your freelancers pool. And as the number of freelancers you have will grow, your binary namask will also grow.

Nicolas Mauti:
And so it's not very scalable. And regarding the performance, it will be degraded as your freelancer base grow. And also you will have another problem. A lot of [vector database](https://qdrant.tech/articles/what-is-a-vector-database/) and Qdrants is one of them using hash NSW algorithm to do your inn search. And this kind of algorithm is based on graph. And so if you do that, you will deactivate some nodes in your graph, and so your graph will become disconnected and you won't be able to navigate in your graph. And so your quality of your matching will degrade. So it's definitely not a good idea to apply prefiltering.

Nicolas Mauti:
So, no, if we go to post filtering here, I think the issue is more clear. You will have this kind of architecture. And so, in fact, if you do that, you will have to retrieve a lot of freelancer for your [vector database](https://qdrant.tech/articles/what-is-a-vector-database/). If you apply some very aggressive filtering and you exclude a lot of freelancer with your filtering, you will have to ask for a lot of freelancer in your vector database and so your performances will be impacted. So filtering is a problem. So we cannot do pre filtering or post filtering. So we had to find a database that do filtering and matching and semantic matching and search at the same time. And so Qdrant is one of them, you have other one in the market.

Nicolas Mauti:
But in our case, we had one filter that caused us a lot of troubles. And this filter is the geospatial filtering and a few of databases under this filtering, and I think Qdrant is one of them that supports it. But there is not a lot of databases that support them. And we absolutely needed that because we have a local approach and we want to be sure that we recommend freelancer next to the project. And so now that I said all of that, we had three candidates that we tested and we benchmarked them. We had elasticsearch PG vector, that is an extension of PostgreSQL and Qdrants. And on this slide you can see Pycon for example, and Pycon was excluded because of the lack of geospatial filtering. And so we benchmark them regarding the qps.

Nicolas Mauti:
So query per second. So this one is for performance, and you can see that quadron was far from the others, and we also benchmark it regarding the precision, how we computed the precision, for the precision we used a corpus that it's called textmax, and Textmax corpus provide 1 million vectors and 1000 queries. And for each queries you have your grown truth of the closest vectors. They used brute force knn for that. And so we stored this vector in our databases, we run the query and we check how many vectors we found that were in the ground truth. And so they give you a measure of your precision of your inn algorithm. For this metric, you could see that elasticsearch was a little bit better than Qdrants, but in fact we were able to tune a little bit the parameter of the AsHNSW algorithm and indexes. And at the end we found a better trade off, and we found a trade off between performance and precision in Qdrants that were better for us than what we can found on elasticsearch.

Nicolas Mauti:
So at the end we decided to go with Qdrant. So we have, I think all know we have our model and we have our tool to operate them, to operate our model. So a final part of this presentation will be about the deployment. I will talk about it a little bit because I think it's interesting and it's also part of my job as a development engineer. So regarding the deployment, first we decided to deploy a Qdrant in a cluster configuration. We decided to start with three nodes and so we decided to get our collection. So collection are where all your vector are stored in Qdrant, it's like a table in SQL or an index in elasticsearch. And so we decided to split our collection between three nodes.

Nicolas Mauti:
So it's what we call shards. So you have a shard of a collection on each node, and then for each shard you have one replica. So the replica is basically a copy of a shard that is living on another node than the primary shard. So this way you have a copy on another node. And so this way if we operate normal conditions, your query will be split across your three nodes, and so you will have your response accordingly. But what is interesting is that if we lose one node, for example, this one, for example, because we are performing a rolling upgrade or because kubernetes always kill pods, we will be still able to operate because we have the replica to get our data. And so this configuration is very robust and so we are very happy with it. And regarding the deployment.

Nicolas Mauti:
So as I said, we deployed it in kubernetes. So we use the Qdrant M chart, the official M chart provided by Qdrants. In fact we subcharted it because we needed some additional components in your clusters and some custom configuration. So I didn't talk about this, but M chart are just a bunch of file of Yaml files that will describe the Kubernetes object you will need in your cluster to operate your databases in your case, and it's collection of file and templates to do that. And when you have that at malt we are using what we called a GitHub's approach. And so GitHub's approach is basic idea that your git repository is your groom truth regarding what you must have in your Kubernetes clusters. And so we store these files and these M charts in git, and then we have a tool that is called Argo CD that will pull our git repository at some time and it will check the differences between what we have in git and what we have in our cluster and what is living in our cluster. And it will then synchronize what we have in git directly in our cluster, either automatically or manually.

Nicolas Mauti:
So this is a very good approach to collaborate and to be sure that what we have in git is what you have in your cluster. And to be sure about what you have in your cluster by just looking at your git repository. And I think that's pretty all I have one last slide, I think that will interest you. It's about the outcome of the project, because we did that at malt. We built this architecture with our first phase with Qdrants that do the semantic matching and that apply all the filtering we have. And in the second part we keep our all drunking system. And so if we look at the latency of our apps, at the P 50 latency of our apps, so it's a wall app with the two steps and with the filters, the semantic matching and the ranking. As you can see, we started in a debate test in mid October.

Nicolas Mauti:
Before that it was around 10 seconds latency, as I said at the beginning of the talk. And so we already saw a huge drop in the application and we decided to go full in December and we can see another big drop. And so we were around 10 seconds and now we are around 1 second and alpha. So we divided the latency of more than five times. And so it's a very good news for us because first it's more scalable because the retriever is very scalable and with the cluster deployment of Qdrants, if we need, we can add more nodes and we will be able to scale this phase. And after that we have a fixed number of freelancers that go into the matching part. And so the matching part doesn't have to scale. No.

Nicolas Mauti:
And the other good news is that now that we are able to scale and we have a fixed size, after our first parts, we are able to build more complex and better matching model and we will be able to improve the quality of our matching because now we are able to scale and to be able to handle more freelancers.

Demetrios:
That's incredible.

Nicolas Mauti:
Yeah, sure. It was a very good news for us. And so that's all. And so maybe you have plenty of question and maybe we can go with that.

Demetrios:
All right, first off, I want to give a shout out in case there are freelancers that are watching this or looking at this, now is a great time to just join Malt, I think. It seems like it's getting better every day. So I know there's questions that will come through and trickle in, but we've already got one from Luis. What's happening, Luis? He's asking what library or service were you using for Ann before considering Qdrant, in fact.

Nicolas Mauti:
So before that we didn't add any library or service or we were not doing any ann search or [semantic searc](https://qdrant.tech/documentation/tutorials/search-beginners/) in the way we are doing it right now. We just had one model when we passed the freelancers and the project at the same time in the model, and we got relevancy scoring at the end. And so that's why it was also so slow because you had to constrict each pair and send each pair to your model. And so right now we don't have to do that and so it's much better.

Demetrios:
Yeah, that makes sense. One question from my side is it took you, I think you said in October you started with the A B test and then in December you rolled it out. What was that last slide that you had?

Nicolas Mauti:
Yeah, that's exactly that.

Demetrios:
Why the hesitation? Why did it take you from October to December to go down? What was the part that you weren't sure about? Because it feels like you saw a huge drop right there and then why did you wait until December?

Nicolas Mauti:
Yeah, regarding the latency and regarding the drop of the latency, the result was very clear very quickly. I think maybe one week after that, we were convinced that the latency was better. First, our idea was to validate the architecture, but the second reason was to be sure that we didn't degrade the quality of the matching because we have a two step process. And the risk is that the two model doesn't agree with each other. And so if the intersection of your first step and the second step is not good enough, you will just have some empty result at the end because your first part will select a part of freelancer and the second step, you select another part and so your intersection is empty. And so our goal was to assess that the two steps were aligned and so that we didn't degrade the quality of the matching. And regarding the volume of projects we have, we had to wait for approximately two months.

Demetrios:
It makes complete sense. Well, man, I really appreciate this. And can you go back to the slide where you show how people can get in touch with you if they want to reach out and talk more? I encourage everyone to do that. And thanks so much, Nicholas. This is great, man.

Nicolas Mauti:
Thanks.

Demetrios:
All right, everyone. By the way, in case you want to join us and talk about what you're working on and how you're using Qdrant or what you're doing in the semantic space or [semantic search](https://qdrant.tech/documentation/tutorials/search-beginners/) or vector space, all that fun stuff, hit us up. We would love to have you on here. One last question for you, Nicola. Something came through. What indexing method do you use? Is it good for using OpenAI embeddings?

Nicolas Mauti:
So in our case, we have our own model to build the embeddings.

Demetrios:
Yeah, I remember you saying that at the beginning, actually. All right, cool. Well, man, thanks a lot and we will see everyone next week for another one of these vector space talks. Thank you all for joining and take care. Care. Thanks.