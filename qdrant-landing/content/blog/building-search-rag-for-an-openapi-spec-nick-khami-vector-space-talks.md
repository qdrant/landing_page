---
draft: false
title: Building Search/RAG for an OpenAPI spec - Nick Khami | Vector Space Talks
slug: building-search-rag-open-api
short_description: Nick Khami, Founder and Engineer of Trieve, dives into the
  world of search and rag apps powered by Open API specs.
description: Nick Khami discuss Trieve's work with Qdrant's Open API spec for
  creating powerful and simplified search and recommendation systems, touching
  on real-world applications, technical specifics, and the potential for
  improved user experiences.
preview_image: /blog/from_cms/nick-khami-cropped.png
date: 2024-04-12T18:27:00.000Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Search
  - Retrieval Augmented Generation
  - OpenAPI
  - Trieve
---
> *"It's very, very simple to build search over an Open API specification with a tool like Trieve and Qdrant. I think really there's something to highlight here and how awesome it is to work with a group based system if you're using Qdrant.”*\
— Nick Khami
> 

Nick Khami, a seasoned full-stack engineer, has been deeply involved in the development of vector search and RAG applications since the inception of Qdrant v0.11.0 back in October 2022. His expertise and passion for innovation led him to establish Trieve, a company dedicated to facilitating businesses in embracing cutting-edge vector search and RAG technologies.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/1JtL167O2ygirKFVyieQfP?si=R2cN5LQrTR60i-JzEh_m0Q), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/roLpKNTeG5A?si=JkKI7yOFVOVEY4Qv).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/roLpKNTeG5A?si=FViKeSYBT-Xw-gwM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Building-SearchRAG-for-an-OpenAPI-spec---Nick-Khami--Vector-Space-Talk-022-e2iabfb/a-ab5mb2m" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Nick showcases Trieve and the advancements in the world of search technology, demonstrating with Qdrant how simple it is to construct precise search functionalities with open API specs for colorful sneaker discoveries, all while unpacking the potential of improved search experiences and analytics for diverse applications like apps for legislation.

We're going deep into the mechanics of search and recommendation applications. Whether you're a developer or just an enthusiast, this episode  is guaranteed in giving you insight into how to create a seamless search experience using the latest advancements in the industry.

Here are five key takeaways from this episode:

1. **Understand the Open API Spec**: Discover the magic behind Open API specifications and how they can serve your development needs especially when it comes to rest API routes.
2. **Simplify with Trieve and Qdrant**: Nick walks us through a real-world application using Trieve and Qdrant's group-based system, demonstrating how to effortlessly build search capabilities.
3. **Elevate Search Results**: Learn about the power of grouping and recommendations within Qdrant to fine-tune your search results, using the colorful world of sneakers as an example!
4. **Trieve's Infrastructure Made Easy**: Find out how taking advantage of Trieve can make creating datasets, obtaining API keys, and kicking off searches simpler than you ever imagined.
5. **Enhanced Vector Search with Tantivy**: If you're curious about alternative search engines, get the scoop on Tantivy, how it complements Qdrant, and its role within the ecosystem.

> Fun Fact: Trieve was established in 2023 and the name is a play on the word "retrieve”.
> 

## Show notes:

00:00 Vector Space Talks intro to Nick Khami.\
06:11 Qdrant system simplifies difficult building process.\
07:09 Using Qdrant to organize and manage content.\
11:43 Creating a group: search results may not group.\
14:23 Searching with Qdrant: utilizing system routes.\
17:00 Trieve wrapped up YC W24 batch.\
21:45 Revolutionizing company search.\
23:30 Next update: user tracking, analytics, and cross-encoders.\
27:39 Quadruple supported sparse vectors.\
30:09 Final questions and wrap up.

## More Quotes from Nick:

*"You can get this RAG, this search and the data upload done in a span of maybe 10-15 minutes, which is really cool and something that we were only really possible to build at Trieve, thanks to what the amazing team at Qdrant has been able to create.”*\
— Nick Khami

*"Qdrant also offers recommendations for groups, so like, which is really cool... Not only can you search groups, you can also recommend groups, which is, I think, awesome. But yeah, you can upload all your data, you go to the search UI, you can search it, you can test out how recommendations are working [and] in a lot of cases too, you can fix problems in your search.”*\
— Nick Khami

*"Typically when you do recommendations, you take the results that you want to base recommendations off of and you build like an average vector that you then use to search. Qdrant offers a more evolved recommendation pattern now where you can traverse the graph looking at the positive point similarity, then also the negative similarity.”*\
— Nick Khami

## Transcript:
Demetrios:
What is happening? Everyone? Welcome back to another edition of the Vector Space Talks. I am super excited to be here with you today. As always, we've got a very special guest. We've got Nick, the founder and engineer, founder slash engineer of Trieve. And as you know, we like to start these sessions off with a little recommendations of what you can hopefully be doing to make life better. And so when Sabrina's here, I will kick it over to her and ask her for her latest recommendation of what she's been doing. But she's traveling right now, so I'm just going to give you mine on some things that I've been listening to and I have been enjoying. For those who want some nice music, I would recommend an oldie, but a goodie.

Demetrios:
It is from the incredible band that is not coming to me right now, but it's called this must be the place from the. Actually, it's from the Talking Heads. Definitely recommend that one as a fun way to get the day started. We will throw a link to that music in the chat, but we're not going to be just talking about good music recommendations. Today we are going to get Nick on the stage to talk all about search and rags. And Nick is in a very interesting position because he's been using vector search from Qdrant since 2022. Let's bring this man on the stage and see what he's got to say. What's up, dude?

Nick Khami:
Hey.

Demetrios:
Hey.

Nick Khami:
Nice to meet you.

Demetrios:
How you doing?

Nick Khami:
Doing great.

Demetrios:
Well, it's great to have you.

Nick Khami:
Yeah, yeah. Nice sunny day. It looks like it's going to be here in San Francisco, which is good. It was raining like all of January, but finally got some good sunny days going, which is awesome.

Demetrios:
Well, it is awesome that you are waking up early for us and you're doing this. I appreciate it coming all the way from San Francisco and talking to us today all about search and recommender system. Sorry, rag apps. I just have in my mind, whenever I say search, I automatically connect recommender because it is kind of similar, but not in this case. You're going to be talking about search and rag apps and specifically around the Open API spec. I know you've got a talk set up for. For us. Do you want to kick it off? And then I'll be monitoring the chat.

Demetrios:
So if anybody has any questions, throw it in the chat and I'll pop up on screen again and ask away.

Nick Khami:
Yeah, yeah, I'd love to. I'll go ahead and get this show on the road. Okay. So I guess the first thing I'll talk about is what exactly an Open API spec is. This is Qdrants open API spec. I feel like it's a good topical example for vector space talk. You can see here, Qdrant offers a bunch of different rest API routes on their API. Each one of these exists within this big JSON file called the Open API specification.

Nick Khami:
There's a lot of projects that have an Open API specification. Stripe has one, I think sentry has one. It's kind of like a de facto way of documenting your API.

Demetrios:
Can you make your screen just a little or the font just a little bit bigger? Maybe zoom in?

Nick Khami:
I think I can, yeah.

Demetrios:
All right, awesome. So that my eyesight is not there. Oh, that is brilliant. That is awesome.

Nick Khami:
Okay, we doing good here? All right, awesome. Yeah. Hopefully this is more readable for everyone, but yeah. So this is an open API specification. If you look at it inside of a JSON file, it looks a little bit like this. And if you go to the top, I can show the structure. There's a list or there's an object called paths that contains all the different API paths for the API. And then there's another object called security, which explains the authentication scheme.

Nick Khami:
And you have a nice info section I'm going to ignore, kind of like these two, they're not all that important. And then you have this list of like tags, which is really cool because this is kind of how things get organized. If we go back, you can see these kind of exist as tags. So these items here will be your tags in the Open API specification. One thing that's kind of like interesting is it would be cool if it was relatively trivial to build search over an OpenAPI specification, because if you don't know what you're looking for, then this search bar does not always work great. For example, if you type in search within groups. Oh, this one actually works pretty good. Wow, this seems like an enhanced Open API specification search bar.

Nick Khami:
I should have made sure that I checked it before going. So this is quite good. Our search bar for tree in example, does not actually, oh, it does have the same search, but I was really interested in, I guess, explaining how you could enhance this or hook it up to vector search in order to do rag audit. It's what I want to highlight here. Qdrant has a really interesting feature called groups. You can search over a group of points at one time and kind of return results in a group oriented way instead of only searching for a singular route. And for an Open API specification, that's very interesting. Because it means that you can search for a tag while looking at each tag's individual paths.

Nick Khami:
It is like a, it's something that's very difficult to build without a system like Qdrant and kind of like one of the primary, I think, feature offerings of it compared to PG vector or maybe like brute force with face or yousearch or something. And the goal that I kind of had was to figure out which endpoint was going to be most relevant for what I was trying to do. In a lot of cases with particularly Qdrants, Open API spec in this example. To go about doing that, I used a scripting runtime for JavaScript called Bun. I'm a big fan of it. It tends to work quite well. It's very performant and kind of easy to work with. I start off here by loading up the Qdrant Open API spec from JSON and then I import some things that exist inside of tree.

Nick Khami:
Trieve uses Qdrant under the hood to offer a lot of its features, and that's kind of how I'm going to go about doing this here. So I import some stuff from the tree SDK client package, instantiate a couple of environment variables, set up my configuration for the tree API, and now this is where it gets interesting. I pull the tags from the Qdrant Open API JSON specification, which is this array here, and then I iterate over each tag and I check if I've already created the group. If I have, then I do nothing. But if I have it, then I go ahead and I create a group. For each tag, I'm creating these groups so that way I can insert each path into its relevant groups whenever I create them as individual points. Okay, so I finished creating all of the groups, and now for like the next part, I iterate over the paths, which are the individual API routes. For each path I pull the tags that it has, the summary, the description and the API method.

Nick Khami:
So post, get put, delete, et cetera, and I then create the point. In Trieve world, we call each point a chunk, kind of using I guess like rag terminology. For each individual path I create the chunk and by including its tags in this group tracking ids request body key, it will automatically get added to its relevant groups. I have some try catches here, but that's really the whole script. It's very, very simple to build search over an Open API specification with a tool like Trieve and Qdrant. I think really there's something to highlight here and how awesome it is to work with a group based system. If you're using Qdrant. If you can think about an e commerce store, sometimes you have multiple colorways of an item.

Nick Khami:
You'll have a red version of the sneaker, a white version, a blue version, et cetera. And when someone performs a search, you not only want to find the relevant shoe, you want to find the relevant colorway of that shoe. And groups allow you to do this within Qdrant because you can place each colorway as an individual point. Or again, in tree world, chunk into a given group, and then when someone searches, they're going to get the relevant colorway at the top of the given group. It's really nice, really cool. You can see running this is very simple. If I want to update the entire data set by running this again, I can, and this is just going to go ahead and create all the relevant chunks for every route that Qdrant offers. If you guys who are watching or interested in replicating this experiment, I created an open source GitHub repo.

Nick Khami:
We're going to zoom in here that you can reference@GitHub.com/devflowinc/OpenAPI/search. You can follow the instructions in the readme to replicate the whole thing. Okay, but I uploaded all the data. Let's see how this works from a UI perspective. Yeah. Trieve bundles in a really nice UI for searching after you add all of your data. So if I go home here, you can see that I'm using the Qdrant Open API spec dataset. And the organization here is like the email I use.

Nick Khami:
Nick.K@OpenAPI one of the nice things about Trieve, kind of like me on just the simplicity of adding data is we use Qdrant's multi tenancy feature to offer the ability to have multiple datasets within a given organization. So you can have, I have the Open API organization. You can create additional datasets with different embedding models to test with and experiment when it comes to your search. Okay. But not going to go through all those features today, I kind of want to highlight this Open API search that we just finished building. So I guess to compare and contrast, I'm going to use the exact same query that I used before, also going to zoom in. Okay.

Nick Khami:
And that one would be like what we just did, right? So how do I maybe, how do I create a group? This isn't a Gen AI rag search. This is just a generic, this is just a generic search. Okay, so for how do I create a group? We're going to get all these top level results. In this case, we're not doing a group oriented search. We're just returning relevant chunks. Sometimes, or a lot of times I think that people will want to have a more group oriented search where the results are grouped by tag. So here I'm going to see that the most relevant endpoint or the most relevant tag within Qdrant's Open API spec is in theory collections, and within collections it thinks that these are the top three routes that are relevant. Recommend point groups discover bash points recommend bash points none of these are quite what I wanted, which is how do I create a group? But it's okay for cluster, you can see create shard key delete.

Nick Khami:
So for cluster, this is kind of interesting. It thinks cluster is relevant, likely because a cluster is a kind of group and it matches to a large extent on the query. Then we also have points which it keys in on the shard system and the snapshotting system. When the next version gets released, we'll have rolling snapshots in Qdrant, which is very exciting. If anyone else is excited about that feature. I certainly am. Then it pulls the metrics. For another thing that might be a little bit easier for the search to work on.

Nick Khami:
You can type in how do I search points via group? And now it kind of is going to key in on what I would say is a better result. And you can see here we have very nice sub sentence highlighting on the request. It's bolding the sentence of the response that it thinks is the most relevant, which in this case are the second two paragraphs. Yep, the description and summary of what the request does. Another convenient thing about tree is in our default search UI, you can include links out to your resources. If I click this link, I'm going to immediately get to the correct place within the Qdrant redox specification. That's the entire search experience. For the Jedi side of this, I did a lot less optimization, but we can experiment and see how it goes.

Nick Khami:
I'm going to zoom in again, guys. Okay, so let's say I want to make a new rag chat and I'm going to ask here, how would I search over points in a group oriented way with Qdrant? And it's going to go ahead and do a search query for me on my behalf again, powered by the wonder of Qdrant. And once it does this search query, I'm able to get citations and and see what the model thinks. The model is a pretty good job with the first response, and it says that to search for points and group oriented wave Qdrant, I can utilize the routes and endpoints provided by the system and the ones that I'm going to want to use first is points search groups. If I click doc one here and I look at the route, this is actually correct. Conveniently, you're able to open the link in the. Oh, well, okay, this env is wrong, but conveniently what this is supposed to do, if I paste it and fix the incorrect portion of the system. Changing chat to search is you can load the individual chunk of the search UI and read it here, and then you can update it to include document expansion, change the actual copy of what was indexed out, et cetera.

Nick Khami:
It's like a really convenient way to merchandise and enhance your data set without having to write a lot of code. Yeah, and it'll continue writing its answer. I'm not going to go through the whole thing, but this really encapsulates what I wanted to show. This is incredibly simple to do. You can get this RAG, this search and the data upload done in a span of maybe 10-15 minutes, which is really cool and something that we were only really possible to build at Trieve, thanks to what the amazing team at Qdrant has been able to create. And yeah, guys, hopefully that was cool.

Demetrios:
Excellent. So I've got some questions. Woo the infinite spinning field. So I want to know about Trieve and I want to jump into what you all are doing there. And then I want to jump in a little bit about the evolution that you've seen of Qdrant over the years, because you've been using it for a while. But first, can we get a bit of an idea on what you're doing and how you're dedicating yourself to creating what you're creating?

Nick Khami:
Yeah. At Trieve, we just wrapped up the Y Combinator W 24 batch and our fundogram, which is like cool. It took us like a year. So Dens and I started Trieve in January of 2023, and we kind of kept building and building and building, and in the process, we started out trying to build an app for you to have like AI powered arguments at work. It wasn't the best of ideas. That's kind of why we started using Qdrant originally in the process of building that, we thought it was really hard to get the amazing next gen search that products like Qdrant offer, because for a typical team, they have to run a Docker compose file on the local machine, add the Qdrant service, that docker compose docker compose up D stand up Qdrant, set an env, download the Qdrant SDK. All these things get very, very difficult after you index all of your data, you then have to create a UI to view it, because if you don't do that. It can be very hard to judge performance.

Nick Khami:
I mean, you can always make these benchmarks, but search and recommendations are kind of like a heuristic thing. It's like you can always have a benchmark, but the data is dynamic, it changes and you really like. In what we were experiencing at the time, we really needed a way to quickly gauge the system was doing. We gave up on our rag AI application argumentation app and pivoted to trying to build infrastructure for other people to benefit from the high quality search that is offered by splayed for sparse, or like sparse encode. I mean, elastics, LSR models, really cool. There's all the dense embedding vector models and we wanted to offer a managed suite of infrastructure for building on this kind of stuff. That's kind of what tree is. So like, with tree you go to.

Nick Khami:
It's more of like a managed experience. You go to the dashboard, you make an account, you create the data set, you get an API key and the data set id, you go to your little script and mine for the Open API specs, 80 lines, you add all your data and then boom, bam, bing bop. You can just start searching and you can. We offer recommendations as well. Maybe I should have shown those in my demo, like, you can open an individual path and get recommendations for similar.

Demetrios:
There were recommendations, so I wasn't too far off the mark. See, search and recommendation, they just, they occupy the same spot in my head.

Nick Khami:
And Qdrant also offers recommendations for groups, guys. So like, which is really cool. Like you can, you can, like, not only can you search groups, you can also recommend groups, which is, I think, awesome. But yeah, you can upload all your data, you go to the search UI, you can search it, you can test out how recommendations are working in a lot of cases too. You can fix problems in your search. A good example of this is we built search for Y comb later companies so they could make it a lot better. Algolia is on an older search algorithm that doesn't offer semantic capabilities. And that means that you go to the Y combinator search companies bar, you type in which company offers short term rentals and you don't get Airbnb.

Nick Khami:
But with like Trieve it is. It is. But with tree, like, the magic of it is that even, believe it or not, there's a bunch of YC companies to do short term rentals and Airbnb does not appear first naturally. So with tree like, we offer a merchandising UI where you put that query in, you see Airbnb ranks a little bit lower than you want. You can immediately adjust the text that you indexed and even add like a re ranking weight so that appears higher in results. Do it again and it works. And you can also experiment and play with the rag. I think rag is kind of a third class citizen in our API.

Nick Khami:
It turns out search recommendations are a lot more popular with our customers and users. But yeah, like tree, I would say like to encapsulate it. Trieve is an all in one infrastructure suite for teams building search recommendations in Rag. And we bundle the power of databases like Qdrant and next gen search ML AI models with uis for fine tuning ranking of results.

Demetrios:
Dude, the reason I love this is because you can do so much with like well done search that is so valuable for so many companies and it's overlooked as like a solved problem, I think, for a lot of people, but it's not, and it's not that easy as you just explained.

Nick Khami:
Yeah, I mean, like we're fired up about it. I mean, like, even if you guys go to like YC.Trieve.AI, that's like the Y combinator company search and you can a b test it against like the older style of search that Algolia offers or like elasticsearch offers. And like, it's, to me it's magical. It's like it's an absolute like work of human ingenuity and amazingness that you can type in, which company should I get an airbed at? And it finds Airbnb despite like none of the keywords matching up. And I'm afraid right now our brains are trained to go to Google. And on Google search bar you can ask a question, you can type in abstract ideas and concepts and it works. But anytime we go to an e commerce search bar or oh, they're so.

Demetrios:
Bad, they're so bad. Everybody's had that experience too, where I don't even search. Like, I just am like, well, all right, or I'll go to Google and search specifically on Google for that website, you know, and like put in parentheses.

Nick Khami:
We'Re just excited about that. Like we want to, we're trying to make it a lot like the goal of tree is to make it a lot easier to power these search experiences, the latest gentech, and help fix this problem. Like, especially if AI continues to get better, people are going to become more and more used to like things working and not having to hack around, faceting and filtering for it to work. And yeah, we're just excited to make that easier for companies to work on and build.

Demetrios:
So there's one question coming through in the chat asking where we can get actual search metrics.

Nick Khami:
Yeah, so that's like the next thing that we're planning to add. Basically, like right now at tree, we don't track your users as queries. The next thing that we're like building at tree is a system for doing that. You're going to be able to analyze all of the searches that have been used on your data set within that search merchandising UI, or maybe a new UI, and adjust your rankings spot fix things the same way you can now, but with the power of the analytics. The other thing we're going to be offering soon is dynamically tunable cross encoders. Cross encoders are this magic neural net that can zip together full text and semantic results into a new ranked order. And they're underutilized, but they're also hard to adjust over time. We're going to be offering API endpoints for uploading, for doing your click through rates on the search results, and then dynamically on a batched timer tuning across encoder to adjust ranking.

Nick Khami:
This should be coming out in the next two to three weeks. But yeah, we're just now getting to the analytics hurdle. We also just got to the speed hurdle. So things are fast now. As you guys hopefully saw in the demo, it's sub 50 milliseconds for most queries. P 95 is like 80 milliseconds, which is pretty cool thanks to Qdrant, by the way. Nice Qdrant is huge, I mean for powering all of that. But yeah, analytics will be coming next two or three weeks.

Nick Khami:
We're excited about it.

Demetrios:
So there's another question coming through in the chat and they're asking, I wonder if llms can suggest graph QL queries based on schema as it's not so tied to endpoints.

Nick Khami:
I think they could in the system that we built for this case, I didn't actually use the response body. If you guys go to devflowinc Open API search on GitHub, you guys can make your own example where you fix that. In the response query of the Open API JSON spec, you have the structure. If you embed that inside of the chunk as another paragraph tag and then go back to doing rag, it probably can do that. I see no reason why I wouldn't be able to.

Demetrios:
I just dropped the link in the chat for anybody that is interested. And now let's talk a little bit for these next couple minutes about the journey of using Qdrant. You said you've been using it since 2022. Things have evolved a ton with the product over these years. Like, what have you seen what's been the most value add that you've had since starting?

Nick Khami:
I mean, there's so many, like, okay, the one that I have highlighted in my head that I wanted to talk about was, I remember in May of 2023, there's a GitHub issue with an Algora bounty for API keys. I remember Dens and I, we'd already been using it for a while and we knew there was no API key thing. There's no API key for it. We were always joking about it. We were like, oh, we're so early. There's not even an API key for our database. You had to have access permissions in your VPC or sub routing to have it work securely. And I'm not sure it's like the highest.

Nick Khami:
I'll talk about some other things where higher value add, but I just remember, like, how cool that was. Yeah, yeah, yeah.

Demetrios:
State of the nation. When you found out about it and.

Nick Khami:
It was so hyped, like, the API key had added, we were like, wow, this is awesome. It was kind of like a simple thing, but like, for us it was like, oh, whoa, this is. We're so much more comfortable in security now. But dude, Qdrant added so many cool things. Like a couple of things that I think I'd probably highlight are the group system. That was really awesome when that got added. I mean, I think it's one of my favorite features. Then after that, the sparse vector support and a recent version was huge.

Nick Khami:
We had a whole crazy subsystem with Tantivy. If anyone watching knows the crate Tantivy, it's like a full text. Uh, it's like a leucine alternative written in rust. Um, and we like, built this whole crazy subsystem and then quad fit, like, supported the sparse vectors and we were like, oh my God, we should have probably like, worked with them on the sparse vector thing we didn't even know you guys wanted to do, uh, because like, we spent all this time building it and probably could have like, helped out that PR. We felt bad, um, because that was really nice. When that got added, the performance fixes for that were also really cool. Some of the other things that, like, Qdrant added while we've been using it that were really awesome. Oh, the multiple recommendation modes, I think I forget what they're both called, but there's, it's also like insane for people, like, out there watching, like, try Qdrant for sure, it's so, so, so good compared to like a lot of what you can do in a PG vector.

Nick Khami:
There's like, this recommendation feature is awesome. Typically when you do recommendations, you take the results that you want to base recommendations off of and you build like an average vector that you then use to search. Qdrant offers a more evolved recommendation pattern now where you can traverse the graph looking at the positive point similarity, then also the negative similarity. And if the similarity of the negative points is higher than that of the positive points, it'll ignore that edge recommendations. And for us at least, like with our customers, this improved their quality of recommendations a lot when they use negative samples. And we didn't even find out about that. It was in the version release notes and we didn't think about it. And like a month or two later we had a customer that was like communicating that they wanted higher quality recommendations.

Nick Khami:
And we were like, okay, what is like, are we using all the features available? And we weren't. That was cool.

Demetrios:
The fact that you understand that now and you were able to communicate it back to me almost like better than I communicate it to people is really cool. And it shows that you've been in the weeds on it and you have seen a strong use case for it, because sometimes it's like, okay, this is out there. It needs to be communicated in the best use case so that people can understand it. And it seems like with that e commerce use case, it really stuck.

Nick Khami:
This one was actually for a company that does search over american legislation called funny enough, we want more e commerce customers for retrieve. Most of our customers right now are like SaaS applications. This particular customer, I don't think they'd mind me shouting them out. It's called Bill Track 50. If you guys want to like search over us legislation, try them out. They're very, very good. And yeah, they were the team that really used it. But yeah, it's another cool thing, I think, about infrastructure like Qdrant in general, and it's so, so powerful that like a lot of times it can be worth like getting an implementation partner.

Nick Khami:
Like, even if you're gonna, if you're gonna use Qdrant, like, the team at Qdrant is very helpful and you should consider reaching out to them because they can probably help anyone who's going to build search recommendations to figure out what is offered and what can help on a high level, not so much a GitHub issue code level, but at a high level. Thinking about your use case. Again, search is such a heuristic problem and so human in a way that it's always worth talking through your solution with people it that are very familiar with search recommendations in general.

Demetrios:
Yeah. And they know the best features and the best tool to use that is going to get you that outcome you're looking for. So. All right, Nick, last question for you. It is about Trieve. I have my theory on why you call it that. Is it retrieve? You just took off the Re-?

Nick Khami:
Yes. Drop the read. It's cleaner. That's like the Facebook quote, but for Trieve.

Demetrios:
I was thinking when I first read it, I was like, it must be some french word I'm not privy to. And so it's cool because it's french. You just got to put like an accent over one of these e's or both of them, and then it's even cooler. It's like luxury brand to the max. So I appreciate you coming on here. I appreciate you walking us through this and talking about it, man. This was awesome.

Nick Khami:
Yeah, thanks for having me on. I appreciate it.

Demetrios:
All right. For anybody else that is out there and wants to come on the vector space talks, come join us. You know where to find us. As always, later.
