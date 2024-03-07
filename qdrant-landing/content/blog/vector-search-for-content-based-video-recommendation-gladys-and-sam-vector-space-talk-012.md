---
draft: true
title: Vector Search for Content-Based Video Recommendation - Gladys and Sam |
  Vector Space Talks
slug: vector-search-video-recommendation
short_description: Gladys Roch and Samuel Leonardo Gracio from Dailymotion dive
  into the intricacies of content-based recommendation.
description: Gladys Roch and Samuel Leonardo Gracio from Dailymotion discuss
  optimizing video recommendations using Qdrant's vector search alongside
  challenges and solutions in content-based recommender systems.
preview_image: /blog/from_cms/gladys-and-sam-bp-cropped.png
date: 2024-03-06T21:33:50.944Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - Vector Search
  - Video Recommender
  - content based recommendation
---
> "*The vector search engine that we chose is Qdrant, but why did we choose it? Actually, it answers all the load constraints and the technical needs that we had. It allows us to do a fast neighbor search. It has a python API which match the recommendous tag that we have.*”\
-- Gladys Roch
> 

Gladys Roch is a French Machine Learning Engineer at Dailymotion working on recommender systems for video content.

> "*We don't have the full control and at the end the cost of their solution is very high for a very low proposal. So after that we tried to benchmark other solutions and we found out that Qdrant was easier for us to implement.*”\
-- Samuel Leonardo Gracio
> 

Samuel Leonardo Gracio, a Senior Machine Learning Engineer at Dailymotion, is a 26-year-old French Machine Learning Engineer, mainly working on recommender systems and video classification.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/4YYASUZKcT5A90d6H2mOj9?si=a5GgBd4JTR6Yo3HBJfiejQ), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/z_0VjMZ2JY0).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/z_0VjMZ2JY0?si=buv9aSN0Uh09Y6Qx" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Vector-Search-for-Content-Based-Video-Recommendation---Gladys-and-Sam--Vector-Space-Talk-012-e2f9hmm/a-aatvqtr" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Is anyone intrigued by the nitty-gritty of how video recommendations are engineered to serve up your next binge-worthy content? I know we all are! So...

Get ready to unwrap the secrets that keep millions engaged, as Demetrios chats with the brains behind the scenes of Dailymotion. This episode is packed with insights straight from ML Engineers at Dailymotion who are reshaping how we discover videos online.

Here's what you’ll unbox from this episode:

1. **The Mech Behind the Magic:** Understand how a robust video embedding process can change the game - from textual metadata to audio signals and beyond.
2. **The Power of Multilingual Understanding:** Discover the tools that help recommend videos to a global audience, transcending language barriers.
3. **Breaking the Echo Chamber:** Learn about Dailymotion's 'perspective' feature that's transforming the discovery experience for users.
4. **Challenges & Triumphs:** Hear how Qdrant helps Dailymotion tackle a massive video catalog and ensure the freshest content pops on your feed.
5. **Behind the Scenes with Quadrant:** Get an insider’s look at why Dailymotion entrusted their recommendation needs to Qdrant's capable hands (or should we say algorithms?).

> Fun Fact: Did you know that Dailymotion juggles over 13 million recommendations daily? That's like serving up a personalized video playlist to the entire population of Greece every — single — day!
> 

## Show notes:

00:00 Vector Space Talks intro with Gladys and Samuel.\
05:07 Recommender system needs vector search for recommendations.\
09:29 Chose vector search engine for fast neighbor search.\
13:23 Video transcript use for scalable multilingual embedding.\
16:35 Transcripts prioritize over video title and tags.\
17:46 Videos curated based on metadata for quality.\
20:53 Qdrant setup overview for machine learning engineers.\
25:25 Enhanced recommendation system improves user engagement.\
29:36 Recommender system, A/B testing, collection aliases strategic.\
33:03 Dailymotion's new feature diversifies video perspectives.\
34:58 Exploring different perspectives and excluding certain topics.

## More Quotes from Gladys and Sam:

"*Basically, we're computing the embeddings and then we feed them into Qdrant, and we do that with a streaming pipeline, which means that every time, so everything is in streaming, every time a new video is uploaded or updated, if the description changes, for example, then the embedding will be computed and then it will be fed directly into Qdrant.*”\
-- Gladys Roch

*"We basically recommend videos to a user if other users watching the same video were watching other videos. But the problem with that is that it only works with videos where we have what we call here high signal. So videos that have at least thousands of views, some interactions, because for fresh and fresh or niche videos, we don't have enough interaction.”*\
-- Samuel Leonardo Gracio

*"But every time we add new videos to Dailymotion, then it's growing. So it can provide recommendation for videos with few interactions that we don't know well. So we're very happy because it led us to huge performances increase on the low signal. We did a threefold increase on the CTR, which means the number of clicks on the recommendation. So with Qdrant we were able to kind of fix our call start issues.”*\
-- Gladys Roch

*"The fact that you have a very cool team that helped us to implement some parts when it was difficult, I think it was definitely the thing that make us choose Qdrant instead of another solution.”*\
-- Samuel Leonardo Gracio

## Transcript:
Demetrios:
I don't know if you all realize what you got yourself into, but we are back for another edition of the Vector Space Talks. My stream is a little bit chunky and slow, so I think we're just to get into it with Gladys and Samuel from Daily motion. Thank you both for joining us. It is an honor to have you here. For everyone that is watching, please throw your questions and anything else that you want to remark about into the chat. We love chatting with you and I will jump on screen if there is something that we need to stop the presentation about and ask right away. But for now, I think you all got some screen shares you want to show us.

Samuel Leonardo Gracio:
Yes, exactly. So first of all, thank you for the invitation, of course. And yes, I will share my screen. We have a presentation. Excellent. Should be okay now.

Demetrios:
Brilliant.

Samuel Leonardo Gracio:
So can we start?

Demetrios:
I would love it. Yes, I'm excited. I think everybody else is excited too.

Gladys Roch:
So welcome, everybody, to our vector space talk. I'm Gladys Roch, machine learning engineer at Dailymotion.

Samuel Leonardo Gracio:
And I'm Samuel, senior machine learning engineer at Dailymotion.

Gladys Roch:
Today we're going to talk about Vector search in the context of recommendation and in particular how Qdrant. That's going to be a hard one. We actually got used to pronouncing Qdrant as a french way, so we're going to sleep a bit during this presentation, sorry, in advance, the Qdrant and how we use it for our content based recommender. So we are going to first present the context and why we needed a vector database and why we chose Qdrant, how we fit Qdrant, what we put in it, and we are quite open about the pipelines that we've set up and then we get into the results and how Qdrant helped us solve the issue that we had.

Samuel Leonardo Gracio:
Yeah. So first of all, I will talk about, globally, the recommendation at Dailymotion. So just a quick introduction about Dailymotion, because you're not all french, so you may not all know what Dailymotion is. So we are a video hosting platform as YouTube or TikTok, and we were founded in 2005. So it's a node company for videos and we have 400 million unique users per month. So that's a lot of users and videos and views. So that's why we think it's interesting. So Dailymotion is we can divide the product in three parts.

Samuel Leonardo Gracio:
So one part is the native app. As you can see, it's very similar from other apps like TikTok or Instagram reels. So you have vertical videos, you just scroll and that's it. We also have a website. So Dailymotion.com, that is our main product, historical product. So on this website you have a watching page like you can have for instance, on YouTube. And we are also a video player that you can find in most of the french websites and even in other countries. And so we have recommendation almost everywhere and different recommenders for each of these products.

Gladys Roch:
Okay, so that's Dailymotion. But today we're going to focus on one of our recommender systems. Actually, the machine learning engineer team handles multiple recommender systems. But the video to video recommendation is the oldest and the most used. And so it's what you can see on the screen, it's what you have the recommendation queue of videos that you can see on the side or below the videos that you're watching. And to compute these suggestions, we have multiple models running. So that's why it's a global system. This recommendation is quite important for Dailymotion.

Gladys Roch:
It's actually a key component. It's one of the main levers of audience generation. So for everybody who comes to the website from SEO or other ways, then that's how we generate more audience and more engagement. So it's very important in the revenue stream of the platform. So working on it is definitely a main topic of the team and that's why we are evolving on this topic all the time.

Samuel Leonardo Gracio:
Okay, so why would we need a vector search for this recommendation? I think we are here for that. So as many platforms and as many recommender systems, I think we have a very usual approach based on a collaborative model. So we basically recommend videos to a user if other users watching the same video were watching other videos. But the problem with that is that it only works with videos where we have what we call here high signal. So videos that have at least thousands of views, some interactions, because for fresh and fresh or niche videos, we don't have enough interaction. And we have a problem that I think all the recommender systems can have, which is a costar tissue. So this costar tissue is for new users and new videos, in fact. So if we don't have any information or interaction, it's difficult to recommend anything based on this collaborative approach.

Samuel Leonardo Gracio:
So the idea to solve that was to use a content based recommendation. It's also a classic solution. And the idea is when you have a very fresh video. So video, hey, in this case, a good thing to recommend when you don't have enough information is to recommend a very similar video and hope that the user will watch it also. So for that, of course, we use Qdrant and we will explain how. So yeah, the idea is to put everything in the vector space. So each video at Dailymotion will go through an embedding model. So for each video we'll get a video on embedding.

Samuel Leonardo Gracio:
We will describe how we do that just after and put it in a vector space. So after that we could use Qdrant to, sorry, Qdrant to query and get similar videos that we will recommend to our users.

Gladys Roch:
Okay, so if we have embeddings to represent our videos, then we have a vector space, but we need to be able to query this vector space and not only to query it, but to do it at scale and online because it's like a recommender facing users. So we have a few requirements. The first one is that we have a lot of videos in our catalog. So actually doing an exact neighbor search would be unreasonable, unrealistic. It's a combinatorial explosion issue, so we can't do an exact Knn. Plus we also have new videos being uploaded to Dailymotion every hour. So if we could somehow manage to do KNN and to pre compute it, it would never be up to date and it would be very expensive to recompute all the time to include all the new videos. So we need a solution that can integrate new videos all the time.

Gladys Roch:
And we're also at scale, we serve over 13 million recommendation each day. So it means that we need a big setup to retrieve the neighbors of many videos all day. And finally, we have users waiting for the recommendation. So it's not just pre computed and stored, and it's not just content knowledge. We are trying to provide the recommendation as fast as possible. So we have time constraints and we only have a few hundred milliseconds to compute the recommendation that we're going to show the user. So we need to be able to retrieve the close video that we'd like to propose to the user very fast. So we need to be able to navigate this vector space that we are building quite quickly.

Gladys Roch:
So of course we need vector search engine. That's the most easy way to do it, to be able to compute and approximate neighbor search and to do it at scale. So obviously, evidently the vector search engine that we chose this Qdrant, but why did we choose it? Actually, it answers all the load constraints and the technical needs that we had. It allows us to do a fast neighbor search. It has a python API which match the recommendous tag that we have. A very important issue for us was to be able to not only put the embeddings of the vectors in this space but also to put metadata with it to be able to get a bit more information and not just a mathematical representation of the video in this database. And actually doing that make it filterable, which means that we can retrieve neighbors of a video, but given some constraints, and it's very important for us typically for language constraints. Samuel will talk a bit more in details about that just after.

Gladys Roch:
But we have an embedding that is multilingual and we need to be able to filter all the language, all the videos on their language to offer more robust recommendation for our users. And also Qdrant is distributed and so it's scalable and we needed that due to the load that I just talked about. So that's the main points that led us to choose Qdrant.

Samuel Leonardo Gracio:
And also they have an amazing team.

Gladys Roch:
So that's another, that would be our return of experience. The team of Qdrant is really nice. You helped us actually put in place the cluster.

Samuel Leonardo Gracio:
Yeah. So what do we put in our Qdrant cluster? So how do we build our robust video embedding? I think it's really interesting. So the first point for us was to know what a video is about. So it's a really tricky question, in fact. So of course, for each video uploaded on the platform, we have the video signal, so many frames representing the video, but we don't use that for our meetings. And in fact, why we are not using them, it's because it contains a lot of information. Right, but not what we want. For instance, here you have video about an interview of LeBron James.

Samuel Leonardo Gracio:
But if you only use the frames, the video signal, you can't even know what he's saying, what the video is about, in fact. So we still try to use it. But in fact, the most interesting thing to represent our videos are the textual metadata. So the textual metadata, we have them for every video. So for every video uploaded on the platform, we have a video title, video description that are put by the person that uploads the video. But we also have automatically detected tags. So for instance, for this video, you could have LeBron James, and we also have subtitles that are automatically generated. So just to let you know, we do that using whisper, which is an open source solution provided by OpenAI, and we do it at scale.

Samuel Leonardo Gracio:
When a video is uploaded, we directly have the video transcript and we can use this information to represent our videos with just a textual embedding, which is far more easy to treat, and we need less compute than for frames, for instance. So the other issue for us was that we needed an embedding that could scale so that does not require too much time to compute because we have a lot of videos, more than 400 million videos, and we have many videos uploaded every hour, so it needs to scale. We also have many languages on our platform, more than 300 languages in the videos. And even if we are a french video platform, in fact, it's only a third of our videos that are actually in French. Most of the videos are in English or other languages such as Turkish, Spanish, Arabic, et cetera. So we needed something multilingual, which is not very easy to find. But we came out with this embedding, which is called multilingual universal sentence encoder. It's not the most famous embedding, so I think it's interesting to share it.

Samuel Leonardo Gracio:
It's open source, so everyone can use it. It's available on Tensorflow hub, and I think that now it's also available on hugging face, so it's easy to implement and to use it. The good thing is that it's pre trained, so you don't even have to fine tune it on your data. You can, but I think it's not even required. And of course it's multilingual, so it doesn't work with every languages. But still we have the main languages that are used on our platform. It focuses on semantical similarity. And you have an example here when you have different video titles.

Samuel Leonardo Gracio:
So for instance, one about soccer, another one about movies. Even if you have another video title in another language, if it's talking about the same topic, they will have a high cosine similarity. So that's what we want. We want to be able to recommend every video that we have in our catalog, not depending on the language. And the good thing is that it's really fast. Actually, it's a few milliseconds on cpu, so it's really easy to scale. So that was a huge requirement for us.

Demetrios:
Can we jump in here?

Demetrios:
There's a few questions that are coming through that I think are pretty worth. And it's actually probably more suited to the last slide. Sameer is asking this one, actually, one more back. Sorry, with the LeBron. Yeah, so it's really about how you understand the videos. And Sameer was wondering if you can quote unquote hack the understanding by putting some other tags or.

Samuel Leonardo Gracio:
Ah, you mean from a user perspective, like the person uploading the video, right?

Demetrios:
Yeah, exactly.

Samuel Leonardo Gracio:
You could do that before using transcripts, but since we are using them mainly and we only use the title, so the tags are automatically generated. So it's on our side. So the title and description, you can put whatever you want. But since we have the transcript, we know the content of the video and we embed that. So the title and the description are not the priority in the embedding. So I think it's still possible, but we don't have such use case. In fact, most of the people uploading videos are just trying to put the right title, but I think it's still possible. But yeah, with the transcript we don't have any examples like that.

Samuel Leonardo Gracio:
Yeah, hopefully.

Demetrios:
So that's awesome to think about too. It kind of leads into the next question, which is around, and this is from Juan Pablo. What do you do with videos that have no text and no meaningful audio, like TikTok or a reel?

Samuel Leonardo Gracio:
So for the moment, for these videos, we are only using the signal from the title tags, description and other video metadata. And we also have a moderation team which is watching the videos that we have here in the mostly recommended videos. So we know that the videos that we recommend are mostly good videos. And for these videos, so that don't have audio signal, we are forced to use the title tags and description. So these are the videos where the risk is at the maximum for us currently. But we are also working at the moment on something using the audio signal and the frames, but not all the frames. But for the moment, we don't have this solution. Right.

Gladys Roch:
Also, as I said, it's not just one model, we're talking about the content based model. But if we don't have a similarity score that is high enough, or if we're just not confident about the videos that were the closest, then we will default to another model. So it's not just one, it's a huge system.

Samuel Leonardo Gracio:
Yeah, and one point also, we are talking about videos with few interactions, so they are not videos at risk. I mean, they don't have a lot of views. When this content based algo is called, they are important because there are very fresh videos, and fresh videos will have a lot of views in a few minutes. But when the collaborative model will be retrained, it will be able to recommend videos on other things than the content itself, but it will use the collaborative signal. So I'm not sure that it's a really important risk for us. But still, I think we could still do some improvement for that aspect.

Demetrios:
So where do I apply to just watch videos all day for the content team? All right, I'll let you get back to it. Sorry to interrupt. And if anyone else has good questions.

Samuel Leonardo Gracio:
And I think it's good to ask your question during the presentation, it's more easier to answer. So, yeah, sorry, I was saying that we had this multilingual embedding, and just to present you our embedding pipeline. So, for each video that is uploaded or edited, because you can change the video title whenever you want, we have a pub sub event that is sent to a dataflow pipeline. So it's a streaming job for every video we will retrieve. So textual metadata, title, description tags or transcript, preprocess it to remove some words, for instance, and then call the model to have this embedding. And then. So we put it in bigquery, of course, but also in Qdrant.

Gladys Roch:
So I'm going to present a bit our Qdrant setup. So actually all this was deployed by our tier DevOps team, not by us machine learning engineers. So it's an overview, and I won't go into the details because I'm not familiar with all of this, but basically, as Samuel said, we're computing the embeddings and then we feed them into  Qdrant, and we do that with a streaming pipeline, which means that every time, so everything is in streaming, every time a new video is uploaded or updated, if the description changes, for example, then the embedding will be computed and then it will be fed directly into Qdrant. And on the other hand, our recommender queries the Qdrant vector space through GrPC ingress. And actually Qdrant is running on six pods that are using arm nodes. And you have the specificities of which type of nodes we're using there, if you're interested. But basically that's the setup. And what is interesting is that our recommendation stack for now, it's on premise, which means it's running on Dailymotion servers, not on the Google Kubernetes engine, whereas Qdrant is on the TKE.

Gladys Roch:
So we are querying it from outside. And also if you have more questions about this setup, we'll be happy to redirect you to the DevOps team that helped us put that in place. And so finally the results. So we stated earlier that we had a call start issue. So before  Qdrant, we had a lot of difficulties with this challenge. We had a collaborative recommender that was trained and performed very well on high senior videos, which means that is videos with a lot of interactions. So we can see what user like to watch, which videos they like to watch together. And we also had a metadata recommender.

Gladys Roch:
But first, this collaborative recommender was actually also used to compute call start recommendation, which is not allowed what it is trained on, but we were using a default embedding to compute like a default recommendation for call start, which led to a lot of popularity issues. Popularity issues for recommender system is when you always recommend the same video that is hugely popular and it's like a feedback loop. A lot of people will default to this video because it might be clickbait and then we will have a lot of inhaler action. So it will pollute the collaborative model all over again. So we had popularity issues with this, obviously. And we also had like this metadata recommender that only focused on a very small scope of trusted owners and trusted video sources. So it was working. It was an auto encoder and it was fine, but the scope was too small.

Gladys Roch:
Too few videos could be recommended through this model. And also those two models were trained very infrequently, only every 4 hours and 5 hours, which means that any fresh videos on the platform could not be recommended properly for like 4 hours. So it was the main issue because Dailymotion uses a lot of fresh videos and we have a lot of news, et cetera. So we need to be topical and this couldn't be done with this huge delay. So we had overall bad performances on the Los signal. And so with squadron we fixed that. We still have our collaborative recommender. It has evolved since then.

Gladys Roch:
It's actually computed much more often, but the collaborative model is only focused on high signal now and it's not computed like default recommendation for low signal that it doesn't know. And we have a content based recommender based on the muse embedding and Qdrant that is able to recommend to users video as soon as they are uploaded on the platform. And it has like a growing scope, 20 million vectors at the moment. But every time we add new videos to Dailymotion, then it's growing. So it can provide recommendation for videos with few interactions that we don't know well. So we're very happy because it led us to huge performances increase on the low signal. We did a threefold increase on the CTR, which means the number of clicks on the recommendation. So with Qdrant we were able to kind of fix our call start issues.

Gladys Roch:
What I was talking about fresh videos, popularities, low performances. We fixed that and we were very happy with the setup. It's running smoothly. Yeah, I think that's it for the presentation, for the slides at least. So we are open to discussion and if you have any questions to go into the details of the recommender system. So go ahead, shoot.

Demetrios:
I've got some questions while people are typing out everything in the chat and the first one I think that we should probably get into is how did the evaluation process go for you when you were looking at different vector databases and vector search engines?

Samuel Leonardo Gracio:
So that's a good point. So first of all, you have to know that we are working with Google cloud platform. So the first thing that we did was to use their vector search engine, so which called matching engine.

Gladys Roch:
Right.

Samuel Leonardo Gracio:
But the issue with matching engine is that we could not in fact add the API, wasn't easy to use. First of all. The second thing was that we could not put metadata, as we do in  Qdrant, and filter out, pre filter before the query, as we are doing now in a Qdrant. And the first thing is that their solution is managed. Yeah, is managed. We don't have the full control and at the end the cost of their solution is very high for a very low proposal. So after that we tried to benchmark other solutions and we found out that Qdrant was easier for us to implement. We had a really cool documentation, so it was easy to test some things and basically we couldn't find any drawbacks for our use case at least.

Samuel Leonardo Gracio:
And moreover, the fact that you have a very cool team that helped us to implement some parts when it was difficult, I think it was definitely the thing that make us choose Qdrant instead of another solution, because we implemented Qdrant.

Gladys Roch:
Like on February or even January 2023. So Qdrant is fairly new, so the documentation was still under construction. And so you helped us through the discord to set up the cluster. So it was really nice.

Demetrios:
Excellent. And what about least favorite parts of using Qdrant?

Gladys Roch:
Yeah, I have one. I discovered it was not actually a requirement at the beginning, but for recommender systems we tend to do a lot of a B test. And you might wonder what's the deal with Qdrant and a b test. It's not related, but actually we were able to a b test our collection. So how we compute the embedding? First we had an embedding without the transcript, and now we have an embedding that includes the transcript. So we wanted to a b test that. And on Quellin you can have collection aliases and this is super helpful because you can have two collections that live on the cluster at the same time, and then on your code you can just call the production collection and then set the alias to the proper one. So for a d testing and rollout it's very useful.

Gladys Roch:
And I found it when I first wanted to do an a test. So I like this one. It was an existed and I like it also, the second thing I like is the API documentation like the one that is auto generated with all the examples and how to query any info on Qdrant. It's really nice for someone who's not from DevOps. It help us just debug our collection whenever. So it's very easy to get into.

Samuel Leonardo Gracio:
And the fact that the product is evolving so fast, like every week almost. You have a new feeder. I think it's really cool. There is one community and I think, yeah, it's really interesting and it's amazing to have such people working on that on an open source project like this one.

Gladys Roch:
We had feedback from our devot team when preparing this presentation. We reached out to them for the small schema that I tried to present. And yeah, they said that the open source community of quasant was really nice. It was easy to contribute, it was very open on Discord. I think we did a return on experience at some point on how we set up the cluster at the beginning. And yeah, they were very hyped by the fact that it's coded in rust. I don't know if you hear this a lot, but to them it's even more encouraging contributing with this kind of new language.

Demetrios:
100% excellent. So last question from my end, and it is on if you're using Qdrant for anything else when it comes to products at Dailymotion, yes, actually we do.

Samuel Leonardo Gracio:
I have one slide about this.

Gladys Roch:
We have slides because we presented quadrum to another talk a few weeks ago.

Samuel Leonardo Gracio:
So we didn't prepare this slide just for this presentation, it's from another presentation, but still, it's a good point because we're currently trained to use it in other projects. So as we said in this presentation, we're mostly using it for the watching page. So Dailymotion.com but we also introduced it in the mobile app recently through a feature that is called perspective. So the goal of the feature is to be able to break this vertical feed algorithm to let the users to have like a button to discover new videos. So when you go through your feed, sometimes you will get a video talking about, I don't know, a movie. You will get this button, which is called perspective, and you will be able to have other videos talking about the same movie but giving to you another point of view. So people liking the movie, people that didn't like the movie, and we use Qdrant, sorry for the candidate generation part. So to get the similar videos and to get the videos that are talking about the same subject.

Samuel Leonardo Gracio:
So I won't talk too much about this project because it will require another presentation of 20 minutes or more. But still we are using it in other projects and yeah, it's really interesting to see what we are able to do with that tool.

Gladys Roch:
Once we have the vector space set up, we can just query it from everywhere. In every project of recommendation.

Samuel Leonardo Gracio:
We also tested some search. We are testing many things actually, but we don't have implemented it yet. For the moment we just have this perspective feed and the content based Roko, but we still have a lot of ideas using this vector search space.

Demetrios:
I love that idea on the get another perspective. So it's not like you get, as you were mentioning before, you don't get that echo chamber and just about everyone saying the same thing. You get to see are there other sides to this? And I can see how that could be very uh, Juan Pablo is back, asking questions in the chat about are you able to recommend videos with negative search queries and negative in the sense of, for example, as a user I want to see videos of a certain topic, but I want to exclude some topics from the video.

Gladys Roch:
Okay. We actually don't do that at the moment, but we know we can with squadron we can set positive and negative points from where to query. So actually for the moment we only retrieve close positive neighbors and we apply some business filters on top of that recommendation. But that's it.

Samuel Leonardo Gracio:
And that's because we have also this collaborative model, which is our main recommender system. But I think we definitely need to check that and maybe in the future we will implement that. We saw that many documentation about this and I'm pretty sure that it would work very well on our use case.

Demetrios:
Excellent. Well folks, I think that's about it for today. I want to thank you so much for coming and chatting with us and teaching us about how you're using Qdrant and being very transparent about your use. I learned a ton. And for anybody that's out there doing recommender systems and interested in more, I think they can reach out to you on LinkedIn. I've got both of your we'll drop them in the chat right now and we'll let everybody enjoy. So don't get lost in vector base. We will see you all later.

Demetrios:
If anyone wants to give a talk next, reach out to me. We always are looking for incredible talks and so this has been great. Thank you all.

Gladys Roch:
Thank you.

Samuel Leonardo Gracio:
Thank you very much for the invitation and for everyone listening. Thank you.

Gladys Roch:
See you. Bye.
