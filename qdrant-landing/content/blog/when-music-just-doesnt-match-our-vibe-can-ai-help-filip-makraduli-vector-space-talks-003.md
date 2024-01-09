---
draft: true
title: "When music just doesn't match our vibe, can AI help? - Filip Makraduli |
  Vector Space Talks #003"
slug: vector-space-talk-003
short_description: Filip Makraduli discusses using AI to create personalized
  music recommendations based on user mood and vibe descriptions.
description: Filip Makraduli discusses using human language and AI to capture
  music vibes, encoding text with sentence transformers, generating
  recommendations through vector spaces, integrating Streamlit and Spotify API,
  and future improvements for AI-powered music recommendations.
preview_image: /blog/from_cms/filip-makraduli.png
date: 2024-01-09T10:44:20.559Z
author: Demetrios Brinkmann
featured: true
tags:
  - Vector Space Talks
  - Vector Database
  - LLM Recommendation System
---
> *"Was it possible to somehow maybe find a way to transfer this feeling that we have this vibe and get the help of AI to understand what exactly we need at that moment in terms of songs?”*\
> -- Filip Makraduli
> 

Imagine if the recommendation system could understand spoken instructions or hummed melodies. This would greatly impact the user experience and accuracy of the recommendations.

Filip Makraduli, an electrical engineering graduate from Skopje, Macedonia, expanded his academic horizons with a Master's in Biomedical Data Science from Imperial College London. 

Currently a part of the Digital and Technology team at Marks and Spencer (M&S), he delves into retail data science, contributing to various ML and AI projects. His expertise spans causal ML, XGBoost models, NLP, and generative AI, with a current focus on improving outfit recommendation systems. 

Filip is not only professionally engaged but also passionate about tech startups, entrepreneurship, and ML research, evident in his interest in Qdrant, a startup he admires.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/6a517GfyUQLuXwFRxvwtp5?si=ywXPY_1RRU-qsMt9qrRS6w), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/WIBtZa7mcCs).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/WIBtZa7mcCs?si=szfeeuIAZ5LEgVI3" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe style="border-radius:12px" src="https://open.spotify.com/embed/episode/6a517GfyUQLuXwFRxvwtp5/video?utm_source=generator" width="496" height="279" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>

## **Top Takeaways:**

Take a look at the song vibe recommender system created by Filip Makraduli, Data Scientist at Marks and Spencer. Find out how it works!

Filip discusses how AI can assist in finding the perfect songs for any mood. He takes us through his unique approach, using human language and AI models to capture the essence of a song and generate personalized recommendations.

Here are 5 key things you'll learn from this video:

1. How AI can help us understand and capture the vibe and feeling of a song
2. The use of language to transfer the experience and feeling of a song
3. The role of data sets and descriptions in building unconventional song recommendation systems
4. The importance of encoding text and using sentence transformers to generate song embeddings
5. How vector spaces and cosine similarity search are used to generate song recommendations

> Fun Fact: Filip actually created a Spotify playlist in real-time during the video, based on the vibe and mood Demetrios described, showing just how powerful and interactive this AI music recommendation system can be!
> 

## Show Notes:

01:25 Using AI to capture desired music vibes.\
06:17 Faster and accurate model.\
10:07 Sentence embedding model maps song descriptions.\
14:32 Improving recommendations, user personalization in music.\
15:49 Qdrant Python client creates user recommendations.\
21:26 Questions about getting better embeddings for songs.\
25:04 Contextual information for personalized walking recommendations.\
26:00 Need predictions, voice input, and music options.

## More Quotes from Filip:

*"When you log in with Spotify, you could get recommendations related to your taste on Spotify or on whatever app you listen your music on.”*\
-- Filip Makraduli

*"Once the user writes a query and the query mentions, like some kind of a mood, for example, I feel happy and it's a sunny day and so on, you would get the similarity to the song that has this kind of language explanations and language intricacies in its description.”*\
-- Filip Makraduli

*"I've explored Qdrant and as I said with Spotify web API there are a lot of things to be done with these specific user-created recommendations.”*\
-- Filip Makraduli

## Transcript:
Demetrios:
So for those who do not know, you are going to be talking to us about when the music we listen to does not match our vibe. And can we get AI to help us on that? And you're currently working as a data scientist at Marks and Spencer. I know you got some slides to share, right? So I'll let you share your screen. We can kick off the slides and then we'll have a little presentation and I'll be back on to answer some questions. And if Neil's is still around at the end, which I don't think he will be able to hang around, but we'll see, we can pull him back on and have a little discussion at the end of the.

Filip Makraduli:
That's. That's great. All right, cool. I'll share my screen.

Demetrios:
Right on.

Filip Makraduli:
Yeah.

Demetrios:
There we go.

Filip Makraduli:
Yeah. So I had to use this slide because it was really well done as an introductory slide. Thank you. Yeah. Thank you also for making it so. Yeah, the idea was, and kind of the inspiration with music, we all listen to it. It's part of our lives in many ways. Sometimes it's like the gym.

Filip Makraduli:
We're ready to go, we're all hyped up, ready to do a workout, and then we click play. But the music and the playlist we get, it's just not what exactly we're looking for at that point. Or if we try to work for a few hours and try to get concentrated and try to code for hours, we can do the same and then we click play, but it's not what we're looking for again. So my inspiration was here. Was it possible to somehow maybe find a way to transfer this feeling that we have this vibe and get the help of AI to understand what exactly we need at that moment in terms of songs. So the obvious first question is how do we even capture a vibe and feel of a song? So initially, one approach that's popular and that works quite well is basically using a data set that has a lot of features. So Spotify has one data set like this and there are many others open source ones which include different features like loudness, key tempo, different kind of details related to the acoustics, the melody and so on. And this would work.

Filip Makraduli:
And this is kind of a way that a lot of song recommendation systems are built. However, what I wanted to do was maybe try a different approach in a way. Try to have a more unconventional recommender system, let's say. So what I did here was I tried to concentrate just on language. So my idea was, okay, is it possible to use human language to transfer this experience, this feeling that we have, and just use that and try to maybe encapsulate these features of songs. And instead of having a data set, just have descriptions of songs or sentences that explain different aspects of a song. So, as I said, this is a bit of a less traditional approach, and it's more of kind of testing the waters, but it worked to a decent extent. So what I did was, first I created a data set where I queried a large language model.

Filip Makraduli:
So I tried with llama and chat GPT, both. And the idea was to ask targeted questions, for example, like, what movie character does this song make you feel like? Or what's the tempo like? So, different questions that would help us understand maybe in what situation we would listen to this song, how will it make us feel like? And so on. And the idea was, as I said, again, to only use song names as queries for this large language model. So not have the full data sets with multiple features, but just song name, and kind of use this pretrained ability of all these LLMs to get this info that I was looking for. So an example of the generated data was this. So this song called Deep Sea Creature. And we have, like, a small description of the song. So it says a heavy, dark, mysterious vibe.

Filip Makraduli:
It will make you feel like you're descending into the unknown and so on. So a bit of a darker choice here, but that's the general idea. So trying to maybe do a bit of prompt engineering in a way to get the right features of a song, but through human language. So that was the first step. So the next step was how to encode this text. So all of this kind of querying reminds me of sentences. And this led me to sentence transformers and sentence Bird. And the usual issue with kind of doing this sentence similarity in the past was this, what I have highlighted here.

Filip Makraduli:
So this is actually a quote from a paper that Nils published a few years ago. So, basically, the way that this similarity was done was using cross encoders in the past, and that worked well, but it was really slow and unscalable. So Nils and his colleague created this kind of model, which helped scale this and make this a lot quicker, but also keep a lot of the accuracy. So Bert and Roberta were used, but they were not, as I said, quite scalable or useful for larger applications. So that's how sentence Bert was created. So the idea here was that there would be, like, a Siamese network that would train the model so that there could be, like, two bird models, and then the training would be done using this like zero, one and two tags, where kind of the sentences would be compared, whether there is entailment, neutrality or contradiction. So how similar these sentences are to each other. And by training a model like this and doing mean pooling, in the end, the model performed quite well and was able to kind of encapsulate this language intricacies of sentences.

Filip Makraduli:
So I decided to use and try out sentence transformers for my use case, and that was the encoding bit. So we have the model, we encode the text, and we have the embedding. So now the question is, how do we actually generate the recommendations? How is the similarity performed? So the similarity was done using vector spaces and cosine similarity search here. There were multiple ways of doing this. First, I tried things with a flat index and I tried Qdrant and I tried FIS. So I've worked with both. And with the flat index, it was good. It works well.

Filip Makraduli:
It's quick for small number of examples, small number of songs, but there is an issue when scaling. So once the vector indices get bigger, there might be a problem. So one popular kind of index architecture is this one here on the left. So hierarchical, navigable, small world graphs. So the idea here is that you wouldn't have to kind of go through all of the examples, but search through the examples in different layers, so that the search for similarities quicker. And this is a really popular approach. And Qdrant have done a really good customizable version of this, which is quite useful, I think, for very larger scales of application. And this graph here illustrates kind of well what the idea is.

Filip Makraduli:
So there is the sentence in this example. It's like a stripped striped blue shirt made from cotton, and then there is the network or the encoder. So in my case, this sentence is the song description, the neural network is the sentence transformer in my case. And then this embeddings are generated, which are then mapped into this vector space, and then this vector space is queryed and the cosine similarity is found, and the recommendations are generated in this way, so that once the user writes a query and the query mentions, like some kind of a mood, for example, I feel happy and it's a sunny day and so on, you would get the similarity to the song that has this kind of language explanations and language intricacies in its description. And there are a lot of ways of doing this, as Nils mentioned, especially with different embedding models and doing context related search. So this is an interesting area for improvement, even in my use case. And the quick screenshot looks like this. So for example, the mood that the user wrote, it's a bit rainy, but I feel like I need a long walk in London.

Filip Makraduli:
And these are the top five suggested songs. This is also available on Streamlit. In the end I'll share links of everything and also after that you can click create a Spotify playlist and this playlist will be saved in your Spotify account. As you can see here, it says playlist generated earlier today. So yeah, I tried this, it worked. I will try live demo bit later. Hopefully it works again. But this is in beta currently so you won't be able to try it at home because Spotify needs to approve my app first and go through that process so that then I can do this part fully.

Filip Makraduli:
And the front end bit, as I mentioned, was done in Streamlit. So why Streamlit? I like the caching bit. So of course this general part where it's really easy and quick to do a lot of data dashboarding and data applications to test out models, that's quite nice. But this caching options that they have help a lot with like loading models from hugging face or if you're loading models from somewhere, or if you're loading different databases. So if you're combining models and data. In my case I had a binary file of the index and also the model. So it was quite useful and quick to do these things and to be able to try things out quickly. So this is kind of the step by step outline of everything I've mentioned and the whole project.

Filip Makraduli:
So the first step is encoding this descriptions into embeddings. Then this vector embeddings are mapped into a vector space. Examples here with how I've used Qdrant for this, which was quite nice. I feel like the developer experience is really good for scalable purposes. It's really useful. So if the number of songs keep increasing it's quite good. And the query and more similar embeddings. The front is done with Streamlit and the Spotify API to save the playlists on the Spotify account.

Filip Makraduli:
All of these steps can be improved and tweaked in certain ways and I will talk a bit about that too. So a lot more to be done. So now there are 2000 songs, but as I've mentioned, in this vector space, the more songs that are there, the more representative this recommendations would be. So this is something I'm currently exploring and doing, generating, filtering and user specific personalization. So once maybe you log in with Spotify, you could get recommendations related to your taste on Spotify or on whatever app you listen your music on. And referring to the talk that Niels had a lot of potential for better models and embeddings and embedding models. So also the contrastive learning bits or the contents aware querying, that could be useful too. And a vector database because currently I'm using a binary file.

Filip Makraduli:
But I've explored Qdrant and as I said with Spotify web API there are a lot of things to be done with this specific user created recommendations. So with Qdrant, the Python client is quite good. The getting started helps a lot. So I wrote a bit of code. I think for production use cases it's really great. So for my use case here, as you can see on the right, I just read the text from a column and then I encode with the model. So the sentence transformer is the model that I encode with. And there is this collections that they're so called in Qdrant that are kind of like this vector spaces that you can create and you can also do different things with them, which I think one of the more helpful ones is the payload one and the batch one.

Filip Makraduli:
So you can batch things in terms of how many vectors will go to the server per single request. And also the payload helps if you want to add extra context. So maybe I want to filter by genres. I can add useful information to the vector embedding. So this is quite a cool feature that I'm planning on using. And another potential way of doing this and kind of combining things is using audio waves too, lyrics and descriptions and combining all of this as embeddings and then going through the similar process. So that's something that I'm looking to do also. And yeah, you also might have noticed that I'm a data scientist at Marks and Spencer and I just wanted to say that there are a lot of interesting ML and data related stuff going on there.

Filip Makraduli:
So a lot of teams that work on very interesting use cases, like in recommender systems, personalization of offers different stuff about forecasting. There is a lot going on with causal ML and yeah, the digital and tech department is quite well developed and I think it's a fun place to explore if you're interested in retail data science use cases. So yeah, thank you for your attention. I'll try the demo. So this is the QR code with the repo and all the useful links. You can contact me on LinkedIn. This is the screenshot of the repo and you have the link in the QR code. The name of the repo is song Vibe.

Filip Makraduli:
A friend of mine said that that wasn't a great name of a repo. Maybe he was right. But yeah, here we are. I'll just try to do the demo quickly and then we can step back to the.

Demetrios:
I love dude, I got to say, when you said you can just automatically create the Spotify playlist, that made me.

Filip Makraduli:
Go like, oh, yes, let's see if it works locally. Do you have any suggestion what mood are you in?

Demetrios:
I was hoping you would ask me, man. I am in a bit of an esoteric mood and I want female kind of like Gaelic voices, but not Gaelic music, just Gaelic voices and lots of harmonies, heavy harmonies.

Filip Makraduli:
Also.

Demetrios:
You didn't realize you're asking a musician. Let's see what we got.

Filip Makraduli:
Let's see if this works in 2000 songs. Okay, so these are the results. Okay, yeah, you'd have to playlist. Let's see.

Demetrios:
Yeah, can you make the playlist public and then I'll just go find it right now. Here we go.

Filip Makraduli:
Let's see. Okay, yeah, open in. Spotify playlist created now. Okay, cool. I can also rename it. What do you want to name the playlist?

Demetrios:
Esoteric Gaelic Harmonies. That's what I think we got to go with AI. Well, I mean, maybe we could just put maybe in parenthes.

Filip Makraduli:
Yeah. So I'll share this later with you. Excellent. But yeah, basically that was it.

Demetrios:
It worked. Ten out of ten for it. Working. That is also very cool.

Filip Makraduli:
Live demo working. That's good. So now doing the infinite screen, which I have stopped now.

Demetrios:
Yeah, classic, dude. Well, I've got some questions coming through and the chat has been active too. So I'll ask a few of the questions in the chat for a minute. But before I ask those questions in the chat, one thing that I was thinking about when you were talking about how to, like, the next step is getting better embeddings. And so was there a reason that you just went with the song title and then did you check, you said there was 2000 songs or how many songs? So did you do anything to check the output of the descriptions of these songs?

Filip Makraduli:
Yeah, so I didn't do like a systematic testing in terms of like, oh, yeah, the output is structured in this way. But yeah, I checked it roughly went through a few songs and they seemed like, I mean, of course you could add more info, but they seemed okay. So I was like, okay, let me try kind of whether this works. And, yeah, the descriptions were nice.

Demetrios:
Awesome. Yeah. So that kind of goes into one of the questions that mornie's asking. Let me see. Are you going to team this up with other methods, like collaborative filtering, content embeddings and stuff like that.

Filip Makraduli:
Yeah, I was thinking about this different kind of styles, but I feel like I want to first try different things related to embeddings and language just because I feel like with the other things, with the other ways of doing these recommendations, other companies and other solutions have done a really great job there. So I wanted to try something different to see whether that could work as well or maybe to a similar degree. So that's why I went towards this approach rather than collaborative filtering.

Demetrios:
Yeah, it kind of felt like you wanted to test the boundaries and see if something like this, which seems a little far fetched, is actually possible. And it seems like I would give it a yes.

Filip Makraduli:
It wasn't that far fetched, actually, once you see it working.

Demetrios:
Yeah, totally. Another question is coming through is asking, is it possible to merge the current mood so the vibe that you're looking for with your musical preferences?

Filip Makraduli:
Yeah. So I was thinking of that when we're doing this, the playlist creation that I did for you, there is a way to get your top ten songs or your other playlists and so on from Spotify. So my idea of kind of capturing this added element was through Spotify like that. But of course it could be that you could enter that in your own profile in the app or so on. So one idea would be how would you capture that preferences of the user once you have the user there. So you'd need some data of the preferences of the user. So that's the problem. But of course it is possible.

Demetrios:
You know what I'd lOve? Like in your example, you put that, I feel like going for a walk or it's raining, but I still feel like going through for a long walk in London. Right. You could probably just get that information from me, like what is the weather around me, where am I located? All that kind of stuff. So I don't have to give you that context. You just add those kind of contextual things, especially weather. And I get the feeling that that would be another unlock too. Unless you're like, you are the exact opposite of a sunny day on a sunny day. And it's like, why does it keep playing this happy music? I told you I was sad.

Filip Makraduli:
Yeah. You're predicting not just the songs, but the mood also.

Demetrios:
Yeah, totally.

Filip Makraduli:
You don't have to type anything, just open the website and you get everything.

Demetrios:
Exactly. Yeah. Give me a few predictions just right off the bat and then maybe later we can figure it out. The other thing that I was thinking, could be a nice add on. I mean, the infinite feature request, I don't think you realized you were going to get so many feature requests from me, but let it be known that if you come on here and I like your app, you'll probably get some feature requests from me. So I was thinking about how it would be great if I could just talk to it instead of typing it in, right? And I could just explain my mood or explain my feeling and even top that off with a few melodies that are going on in my head, or a few singers or songwriters or songs that I really want, something like this, but not this song, and then also add that kind of thing, do the.

Filip Makraduli:
Humming sound a bit and you play your melody and then you get.

Demetrios:
Except I hum out of tune, so I don't think that would work very well. I get a lot of random songs, that's for sure. It would probably be just about as accurate as your recommendation engine is right now. Yeah. Well, this is awesome, man. I really appreciate you coming on here. I'm just going to make sure that there's no other questions that came through the chat. No, looks like we're good.

Demetrios:
And for everyone out there that is listening, if you want to come on and talk about anything cool that you have built with Qdrant, or how you're using Qdrant, or different ways that you would like Qdrant to be better, or things that you enjoy, whatever it may be, we'd love to have you on here. And I think that is it. We're going to call it a day for the vector space talks, number two. We'll see you all later. Philip, thanks so much for coming on. It's.