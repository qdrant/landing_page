---
draft: false
title: Talk with YouTube without paying a cent - Francesco Saverio Zuppichini |
  Vector Space Talks
slug: youtube-without-paying-cent
short_description: A sneak peek into the tech world as Francesco shares his
  ideas and processes on coding innovative solutions.
description: Francesco Zuppichini outlines the process of converting YouTube
  video subtitles into searchable vector databases, leveraging tools like
  YouTube DL and Hugging Face, and addressing the challenges of coding without
  conventional frameworks in machine learning engineering.
preview_image: /blog/from_cms/francesco-saverio-zuppichini-bp-cropped.png
date: 2024-03-27T12:37:55.643Z
author: Demetrios Brinkmann
featured: false
tags:
  - embeddings
  - LLMs
  - Retrieval Augmented Generation
  - Ollama
---
> *"Now I do believe that Qdrant, I'm not sponsored by Qdrant, but I do believe it's the best one for a couple of reasons. And we're going to see them mostly because I can just run it on my computer so it's full private and I'm in charge of my data.”*\
-- Francesco Saverio Zuppichini
> 

Francesco Saverio Zuppichini is a Senior Full Stack Machine Learning Engineer at Zurich Insurance with experience in both large corporations and startups of various sizes. He is passionate about sharing knowledge, and building communities, and is known as a skilled practitioner in computer vision. He is proud of the community he built because of all the amazing people he got to know.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/7kVd5a64sz2ib26IxyUikO?si=mrOoVP3ISQ22kXrSUdOmQA), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/56mFleo06LI).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/56mFleo06LI?si=P4vF9jeQZEZzjb32" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Talk-with-YouTube-without-paying-a-cent---Francesco-Saverio-Zuppichini--Vector-Space-Talks-016-e2ggt6d/a-ab17u5q" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

Curious about transforming YouTube content into searchable elements? Francesco Zuppichini unpacks the journey of coding a RAG by using subtitles as input, harnessing technologies like YouTube DL, Hugging Face, and Qdrant, while debating framework reliance and the fine art of selecting the right software tools.

Here are some insights from this episode:

1. **Behind the Code**: Francesco unravels how to create a RAG using YouTube videos. Get ready to geek out on the nuts and bolts that make this magic happen.
2. **Vector Voodoo**: Ever wonder how embedding vectors carry out their similarity searches? Francesco's got you covered with his brilliant explanation of vector databases and the mind-bending distance method that seeks out those matches.
3. **Function over Class**: The debate is as old as stardust. Francesco shares why he prefers using functions over classes for better code organization and demonstrates how this approach solidifies when running language models with Ollama.
4. **Metadata Magic**: Find out how metadata isn't just a sidekick but plays a pivotal role in the realm of Qdrant and RAGs. Learn why Francesco values metadata as payload and the challenges it presents in developing domain-specific applications.
5. **Tool Selection Tips**: Deciding on the right software tool can feel like navigating an asteroid belt. Francesco shares his criteria—ease of installation, robust documentation, and a little help from friends—to ensure a safe landing.

> Fun Fact: Francesco confessed that his code for chunking subtitles was "a little bit crappy" because of laziness—proving that even pros take shortcuts to the stars now and then.
> 

## Show notes:

00:00 Intro to Francesco\
05:36 Create YouTube rack for data retrieval.\
09:10 Local web dev showcase without frameworks effectively.\
11:12 Qdrant: converting video text to vectors.\
13:43 Connect to vectordb, specify config, keep it simple.\
17:59 Recreate, compare vectors, filter for right matches.\
21:36 Use functions and share states for simpler coding.\
29:32 Gemini Pro generates task-based outputs effectively.\
32:36 Good documentation shows pride in the product.\
35:38 Organizing different data types in separate collections.\
38:36 Proactive approach to understanding code and scalability.\
42:22 User feedback and statistics evaluation is crucial.\
44:09 Consider user needs for chatbot accuracy and relevance.

## More Quotes from Francesco:

*"So through Docker, using Docker compose, very simple here I just copy and paste the configuration for the Qdrant documentation. I run it and when I run it I also get a very nice looking interface.*”\
-- Francesco Saverio Zuppichini

*"It's a very easy way to debug stuff because if you see a lot of vectors from the same document in the same place, maybe your chunking is not doing a great job because maybe you have some too much kind of overlapping on the recent bug in your code in which you have duplicate chunks. Okay, so we have our vector DB running. Now we need to do some setup stuff. So very easy to do with Qdrant. You just need to get the Qdrant client.”*\
-- Francesco Saverio Zuppichini

*"So straightforward, so useful. A lot of people, they don't realize that types are very useful. So kudos to the Qdrant team to actually make all the types very nice.”*\
-- Francesco Saverio Zuppichini

## Transcript:
Demetrios:
Folks, welcome to another vector space talks. I'm excited to be here and it is a special day because I've got a co host with me today. Sabrina, what's going on? How you doing?

Sabrina Aquino:
Let's go. Thank you so much, Demetrios, for having me here. I've always wanted to participate in vector space talks. Now it's finally my chance. So thank you so much.

Demetrios:
Your dream has come true and what a day for it to come true because we've got a special guest today. While we've got you here, Sabrina, I know you've been doing some excellent stuff on the Internet when it comes to other ways to engage with the Qdrant community. Can you break that down real fast before we jump into this?

Sabrina Aquino:
Absolutely. I think an announcement here is we're hosting our first discord office hours. We're going to be answering all your questions about Qdrant with Qdrant team members, where you can interact with us, with our community as well. And we're also going to be dropping a few insights on the next Qdrant release 1.8. So that's super exciting and also, we are. Sorry, I just have another thing going on here on the live.

Demetrios:
Music got in your ear.

Sabrina Aquino:
We're also having the vector voices on Twitter, the X Spaces roundtable, where we bring experts to talk about a topic with our team. And you can also jump in and ask questions on the AMA. So that's super exciting as well. And, yeah, see you guys there. And I'll drop a link of the discord in the comments so you guys can join our community and be a part of it.

Demetrios:
Exactly what I was about to say. So without further ado, let's bring on our guest of honor, Mr. Where are you at, dude?

Francesco Zuppichini:
Hi. Hello. How are you?

Demetrios:
I'm great. How are you doing?

Francesco Zuppichini:
Great.

Demetrios:
I've been seeing you all around the Internet and I am very excited to be able to chat with you today. I know you've got a bit of stuff planned for us. You've got a whole presentation, right?

Francesco Zuppichini:
Correct.

Demetrios:
But for those that do not know you, you're a full stack machine learning engineer at Zurich Insurance. I think you also are very vocal and you are fun to follow on LinkedIn is what I would say. And we're going to get to that at the end after you give your presentation. But once again, reminder for everybody, if you want to ask questions, hit us up with questions in the chat. As far as going through his presentation today, you're going to be talking to us all about some really cool stuff about rags. I'm going to let you get into it, man. And while you're sharing your screen, I'm going to tell people a little bit of a fun fact about you. That you put ketchup on your pizza, which I think is a little bit sacrilegious.

Francesco Zuppichini:
Yes. So that's 100% true. And I hope that the italian pizza police is not listening to this call or I can be in real trouble.

Demetrios:
I think we just lost a few viewers there, but it's all good.

Sabrina Aquino:
Italy viewers just dropped out.

Demetrios:
Yeah, the Italians just dropped, but it's all good. We will cut that part out in post production, my man. I'm going to share your screen and I'm going to let you get after it. I'll be hanging around in case any questions pop up with Sabrina in the background. And here you go, bro.

Francesco Zuppichini:
Wonderful. So you can see my screen, right?

Demetrios:
Yes, for sure.

Francesco Zuppichini:
That's perfect. Okay, so today we're going to talk about talk with YouTube without paying a cent, no framework bs. So the goal of today is to showcase how to code a  RAG given as an input a YouTube video without using any framework like language, et cetera, et cetera. And I want to show you that it's straightforward, using a bunch of technologies and Qdrants as well. And you can do all of this without actually pay to any service. Right. So we are going to run our PEDro DB locally and also the language model. We are going to run our machines.

Francesco Zuppichini:
And yeah, it's going to be a technical talk, so I will kind of guide you through the code. Feel free to interrupt me at any time if you have questions, if you want to ask why I did that, et cetera, et cetera. So very quickly, before we get started, I just want you not to introduce myself. So yeah, senior full stack machine engineer. That's just a bunch of funny work to basically say that I do a little bit of everything. Start. So when I was working, I start as computer vision engineer, I work at PwC, then a bunch of startups, and now I sold my soul to insurance companies working at insurance. And before I was doing computer vision, now I'm doing due to Chat GPT, hyper language model, I'm doing more of that.

Francesco Zuppichini:
But I'm always involved in bringing the full product together. So from zero to something that is deployed and running. So I always be interested in web dev. I can also do website servers, a little bit of infrastructure as well. So now I'm just doing a little bit of everything. So this is why there is full stack there. Yeah. Okay, let's get started to something a little bit more interesting than myself.

Francesco Zuppichini:
So our goal is to create a full local YouTube rack. And if you don't want a rack, is, it's basically a system in which you take some data. In this case, we are going to take subtitles from YouTube videos and you're able to basically q a with your data. So you're able to use a language model, you ask questions, then we retrieve the relevant parts in the data that you provide, and hopefully you're going to get the right answer to your. So let's talk about the technologies that we're going to use. So to get the subtitles from a video, we're going to use YouTube DL and YouTube DL. It's a library that is available through Pip. So Python, I think at some point it was on GitHub and then I think it was removed because Google, they were a little bit beach about that.

Francesco Zuppichini:
So then they realized it on GitHub. And now I think it's on GitHub again, but you can just install it through Pip and it's very cool.

Demetrios:
One thing, man, are you sharing a slide? Because all I see is your. I think you shared a different screen.

Francesco Zuppichini:
Oh, boy.

Demetrios:
I just see the video of you. There we go.

Francesco Zuppichini:
Entire screen. Yeah. I'm sorry. Thank you so much.

Demetrios:
There we go.

Francesco Zuppichini:
Wonderful. Okay, so in order to get the embedding. So to translate from text to vectors, right, so we're going to use hugging face just an embedding model so we can actually get some vectors. Then as soon as we got our vectors, we need to store and search them. So we're going to use our beloved Qdrant to do so. We also need to keep a little bit of stage right because we need to know which video we have processed so we don't redo the old embeddings and the storing every time we see the same video. So for this part, I'm just going to use SQLite, which is just basically an SQL database in just a file. So very easy to use, very kind of lightweight, and it's only your computer, so it's safe to run the language model.

Francesco Zuppichini:
We're going to use Ollama. That is a very simple way and very well done way to just get a language model that is running on your computer. And you can also call it using the OpenAI Python library because they have implemented the same endpoint as. It's like, it's super convenient, super easy to use. If you already have some code that is calling OpenAI, you can just run a different language model using Ollama. And you just need to basically change two lines of code. So what we're going to do, basically, I'm going to take a video. So here it's a video from Fireship IO.

Francesco Zuppichini:
We're going to run our command line and we're going to ask some questions. Now, if you can still, in theory, you should be able to see my full screen. Yeah. So very quickly to showcase that to you, I already processed this video from the good sound YouTube channel and I have already here my command line. So I can already kind of see, you know, I can ask a question like what is the contact size of Germany? And we're going to get the reply. Yeah. And here we're going to get a reply. And now I want to walk you through how you can do something similar.

Francesco Zuppichini:
Now, the goal is not to create the best rack in the world. It's just to showcase like show zero to something that is actually working. How you can do that in a fully local way without using any framework so you can really understand what's going on under the hood. Because I think a lot of people, they try to copy, to just copy and paste stuff on Langchain and then they end up in a situation when they need to change something, but they don't really know where the stuff is. So this is why I just want to just show like Windfield zero to hero. So the first step will be I get a YouTube video and now I need to get the subtitle. So you could actually use a model to take the audio from the video and get the text. Like a whisper model from OpenAI, for example.

Francesco Zuppichini:
In this case, we are taking advantage that YouTube allow people to upload subtitles and YouTube will automatically generate the subtitles. So here using YouTube dial, I'm just going to get my video URL. I'm going to set up a bunch of options like the format they want, et cetera, et cetera. And then basically I'm going to download and get the subtitles. And they look something like this. Let me show you an example. Something similar to this one, right? We have the timestamps and we do have all text inside. Now the next step.

Francesco Zuppichini:
So we got our source of data, we have our text key. Next step is I need to translate my text to vectors. Now the easiest way to do so is just use sentence transformers for backing phase. So here I've installed it. I load in a model. In this case I'm using this model here. I have no idea what tat model is. I just default one tatted find and it seems to work fine.

Francesco Zuppichini:
And then in order to use it, I'm just providing a query and I'm getting back a list of vectors. So we have a way to take a video, take the text from the video, convert that to vectors with a semantic meaningful representation. And now we need to store them. Now I do believe that Qdrant, I'm not sponsored by Qdrant, but I do believe it's the best one for a couple of reasons. And we're going to see them mostly because I can just run it on my computer so it's full private and I'm in charge of my data. So the way I'm running it is through Docker compose. So through Docker, using Docker compose, very simple here I just copy and paste the configuration for the Qdrant documentation. I run it and when I run it I also get a very nice looking interface.

Francesco Zuppichini:
I'm going to show that to you because I think it's very cool. So here I've already some vectors inside here so I can just look in my collection, it's called embeddings, an original name. And we can see all the chunks that were embed with the metadata, in this case just the video id. A super cool thing, super useful to debug is go in the visualize part and see the embeddings, the projected embeddings. You can actually do a bounce of stuff. You can actually also go here and color them by some metadata. Like I can say I want to have a different color based on the video id. In this case I just have one video.

Francesco Zuppichini:
I will show that as soon as we add more videos. This is so cool, so useful. I will use this at work as well in which I have a lot of documents. And it's a very easy way to debug stuff because if you see a lot of vectors from the same document in the same place, maybe your chunking is not doing a great job because maybe you have some too much kind of overlapping on the recent bug in your code in which you have duplicate chunks. Okay, so we have our vector DB running. Now we need to do some setup stuff. So very easy to do with Qdrant. You just need to get the Qdrant client.

Francesco Zuppichini:
So you have a connection with a vectordb, you create a connection, you specify a name, you specify some configuration stuff. In this case I just specify the vector size because Qdrant, it needs to know how big the vectors are going to be and the distance I want to use. So I'm going to use the cosite distance in Qdrant documentation there are a lot of parameters. You can do a lot of crazy stuff here and just keep it very simple. And yeah, another important thing is that since we are going to embed more videos, when I ask a question to a video, I need to know which embedded are from that video. So we're going to create an index. So it's very efficient to filter my embedded based on that index, an index on the metadata video because when I store a chunk in Qdrant, I also going to include from which video is coming from. Very simple, very simple to set up.

Francesco Zuppichini:
You just need to do this once. I was very lazy so I just assumed that if this is going to fail, it means that it's because I've already created a collection. So I'm just going to pass it and call it a day. Okay, so this is basically all the preprocess this setup you need to do to have your Qdrant ready to store and search vectors. To store vectors. Straightforward, very straightforward as well. Just need again the client. So the connection to the database here I'm passing my embedding so sentence transformer model and I'm passing my chunks as a list of documents.

Francesco Zuppichini:
So documents in my code is just a type that will contain just this metadata here. Very simple. It's similar to Lang chain here. I just have attacked it because it's lightweight. To store them we call the upload records function. We encode them here. There is a little bit of bad variable names from my side which I replacing that. So you shouldn't do that.

Francesco Zuppichini:
Apologize about that and you just send the records. Another very cool thing about Qdrant. So the second things that I really like is that they have types for what you send through the library. So this models record is a Qdrant type. So you use it and you know immediately. So what you need to put inside. So let me give you an example. Right? So assuming that I'm programming, right, I'm going to say model record bank.

Francesco Zuppichini:
I know immediately. So what I have to put inside, right? So straightforward, so useful. A lot of people, they don't realize that types are very useful. So kudos to the Qdrant team to actually make all the types very nice. Another cool thing is that if you're using fast API to build a web server, if you are going to return a Qdrant models type, it's actually going to be serialized automatically through pydantic. So you don't need to do weird stuff. It's all handled by the Qdrant APIs, by the product SDK. Super cool.

Francesco Zuppichini:
Now we have a way to store our chunks to embed them. So this is how they look like in the interface. I can see them, I can go to them, et cetera, et Cetera. Very nice. Now the missing part, right. So video subtitles. I chunked the subtitles. I haven't show you the chunking code.

Francesco Zuppichini:
It's a little bit crappy because I was very lazy. So I just like chunking by characters count and a little bit of overlapping. We have a way to store and embed our chunks and now we need a way to search. That's basically one of the missing steps. Now search straightforward as well. This is also a good example because I can show you how effective is to create filters using Qdrant. So what do we need to search with again the vector client, the embeddings, because we have a query, right. We need to run the query with the same embedding models.

Francesco Zuppichini:
We need to recreate to embed in a vector and then we need to compare with the vectors in the vector Db using a distance method, in this case considered similarity in order to get the right matches right, the closest one in our vector DB, in our vector search base. So passing a query string, I'm passing a video id and I pass in a label. So how many hits I want to get from the metadb. Now to create a filter again you're going to use the model package from the Qdrant framework. So here I'm just creating a filter class for the model and I'm saying okay, this filter must match this key, right? So metadata video id with this video id. So when we search, before we do the similarity search, we are going to filter away all the vectors that are not from that video. Wonderful. Now super easy as well.

Francesco Zuppichini:
We just call the DB search, right pass. Our collection name here is star coded. Apologies about that, I think I forgot to put the right global variable our coded, we create a query, we set the limit, we pass the query filter, we get the it back as a dictionary in the payload field of each it and we recreate our document a dictionary. I have types, right? So I know what this function is going to return. Now if you were to use a framework, right this part, it will be basically the same thing. If I were to use langchain and I want to specify a filter, I would have to write the same amount of code. So most of the times you don't really need to use a framework. One thing that is nice about not using a framework here is that I add control on the indexes.

Francesco Zuppichini:
Lang chain, for instance, will create the indexes only while you call a classmate like from document. And that is kind of cumbersome because sometimes I wasn't quoting bugs in which I was not understanding why one index was created before, after, et cetera, et cetera. So yes, just try to keep things simple and not always write on frameworks. Wonderful. Now I have a way to ask a query to get back the relative parts from that video. Now we need to translate this list of chunks to something that we can read as human. Before we do that, I was almost going to forget we need to keep state. Now, one of the last missing part is something in which I can store data.

Francesco Zuppichini:
Here I just have a setup function in which I'm going to create an SQL lite database, create a table called videos in which I have an id and a title. So later I can check, hey, is this video already in my database? Yes. I don't need to process that. I can just start immediately to QA on that video. If not, I'm going to do the chunking and embeddings. Got a couple of functions here to get video from Db to save video from and to save video to Db. So notice now I only use functions. I'm not using classes here.

Francesco Zuppichini:
I'm not a fan of object writing programming because it's very easy to kind of reach inheritance health in which we have like ten levels of inheritance. And here if a function needs to have state, here we do need to have state because we need a connection. So I will just have a function that initialize that state. I return tat to me, and me as a caller, I'm just going to call it and pass my state. Very simple tips allow you really to divide your code properly. You don't need to think about is my class to couple with another class, et cetera, et cetera. Very simple, very effective. So what I suggest when you're coding, just start with function and share states across just pass down state.

Francesco Zuppichini:
And when you realize that you can cluster a lot of function together with a common behavior, you can go ahead and put state in a class and have key function as methods. So try to not start first by trying to understand which class I need to use around how I connect them, because in my opinion it's just a waste of time. So just start with function and then try to cluster them together if you need to. Okay, last part, the juicy part as well. Language models. So we need the language model. Why do we need the language model? Because I'm going to ask a question, right. I'm going to get a bunch of relevant chunks from a video and the language model.

Francesco Zuppichini:
It needs to answer that to me. So it needs to get information from the chunks and reply that to me using that information as a context. To run language model, the easiest way in my opinion is using Ollama. There are a lot of models that are available. I put a link here and you can also bring your own model. There are a lot of videos and tutorial how to do that. You run this command as soon as you install it on Linux. It's a one line to install Ollama.

Francesco Zuppichini:
You run this command here, it's going to download Mistral 7B very good model and run it on your gpu if you have one, or your cpu if you don't have a gpu, run it on GPU. Here you can see it yet. It's around 6gb. So even with a low tier gpu, you should be able to run a seven minute model on your gpu. Okay, so this is the prompt just for also to show you how easy is this, this prompt was just very lazy. Copy and paste from langchain source code here prompt use the following piece of context to answer the question at the end. Blah blah blah variable to inject the context inside question variable to get question and then we're going to get an answer. How do we call it? Is it easy? I have a function here called getanswer passing a bunch of stuff, passing also the OpenAI from the OpenAI Python package model client passing a question, passing a vdb, my DB client, my embeddings, reading my prompt, getting my matching documents, calling the search function we have just seen before, creating my context.

Francesco Zuppichini:
So just joining the text in the chunks on a new line, calling the format function in Python. As simple as that. Just calling the format function in Python because the format function will look at a string and kitty will inject variables that match inside these parentheses. Passing context passing question using the OpenAI model client APIs and getting a reply back. Super easy. And here I'm returning the reply from the language model and also the list of documents. So this should be documents. I think I did a mistake.

Francesco Zuppichini:
When I copy and paste this to get this image and we are done right. We have a way to get some answers from a video by putting everything together. This can seem scary because there is no comment here, but I can show you tson code. I think it's easier so I can highlight stuff. I'm creating my embeddings, I'm getting my database, I'm getting my vector DB login, some stuff I'm getting my model client, I'm getting my vid. So here I'm defining the state that I need. You don't need comments because I get it straightforward. Like here I'm getting the vector db, good function name.

Francesco Zuppichini:
Then if I don't have the vector db, sorry. If I don't have the video id in a database, I'm going to get some information to the video. I'm going to download the subtitles, split the subtitles. I'm going to do the embeddings. In the end I'm going to save it to the betterDb. Finally I'm going to get my video back, printing something and start a while loop in which you can get an answer. So this is the full pipeline. Very simple, all function.

Francesco Zuppichini:
Also here fit function is very simple to divide things. Around here I have a file called  RAG and here I just do all the  RAG stuff. Right. It's all here similar. I have my file called crude. Here I'm doing everything I need to do with my database, et cetera, et cetera. Also a file called YouTube. So just try to split things based on what they do instead of what they are.

Francesco Zuppichini:
I think it's easier than to code. Yeah. So I can actually show you a demo in which we kind of embed a video from scratch. So let me kill this bad boy here. Let's get a juicy YouTube video from Sam. We can go with Gemma. We can go with Gemma. I think I haven't embedded that yet.

Francesco Zuppichini:
I'm sorry. My Eddie block is doing weird stuff over here. Okay, let me put this here.

Demetrios:
This is the moment that we need to all pray to the demo gods that this will work.

Francesco Zuppichini:
Oh yeah. I'm so sorry. I'm so sorry. I think it was already processed. So let me. I don't know this one. Also I noticed I'm seeing this very weird thing which I've just not seen that yesterday. So that's going to be interesting.

Francesco Zuppichini:
I think my poor Linux computer is giving up to running language models. Okay. Downloading ceramic logs, embeddings and we have it now before I forgot because I think that you guys spent some time doing this. So let's go on the visualize page and let's actually do the color by and let's do metadata, video id. Video id. Let's run it. Metadata, metadata, video meta. Oh my God.

Francesco Zuppichini:
Data video id. Why don't see the other one? I don't know. This is the beauty of live section.

Demetrios:
This is how we know it's real.

Francesco Zuppichini:
Yeah, I mean, this is working, right? This is called Chevroni Pro. That video. Yeah, I don't know about that. I don't know about that. It was working before. I can touch for sure. So probably I'm doing something wrong, probably later. Let's try that.

Francesco Zuppichini:
Let's see. I must be doing something wrong, so don't worry about that. But we are ready to ask questions, so maybe I can just say I don't know, what is Gemini pro? So let's see, Mr. Running on GPU is kind of fast, it doesn't take too much time. And here we can see we are 6gb, 1gb is for the embedding model. So 4gb, 5gb running the language model here it says Gemini pro is a colonized tool that can generate output based on given tasks. Blah, blah, blah, blah, blah, blah. Yeah, it seems to work.

Francesco Zuppichini:
Here you have it. Thanks. Of course. And I don't know if there are any questions about it.

Demetrios:
So many questions. There's a question that came through the chat that is a simple one that we can answer right away, which is can we access this code anywhere?

Francesco Zuppichini:
Yeah, so it's on my GitHub. Can I share a link with you in the chat? Maybe? So that should be YouTube. Can I put it here maybe?

Demetrios:
Yes, most definitely can. And we'll drop that into all of the spots so that we have it. Now. Next question from my side, while people are also asking, and you've got some fans in the chat right now, so.

Francesco Zuppichini:
Nice to everyone by the way.

Demetrios:
So from my side, I'm wondering, do you have any specific design decisions criteria that you use when you are building out your stack? Like you chose Mistral, you chose Ollama, you chose Qdrant. It sounds like with Qdrant you did some testing and you appreciated the capabilities. With Qdrant, was it similar with Ollama and Mistral?

Francesco Zuppichini:
So my test is how long it's going to take to install that tool. If it's taking too much time and it's hard to install because documentation is bad, so that it's a red flag, right? Because if it's hard to install and documentation is bad for the installation, that's the first thing people are going to read. So probably it's not going to be great for something down the road to use Olama. It took me two minutes, took me two minutes, it was incredible. But just install it, run it and it was done. Same thing with Qualent as well and same thing with the hacking phase library. So to me, usually as soon as if I see that something is easy to install, that's usually means that is good. And if the documentation to install it, it's good.

Francesco Zuppichini:
It means that people thought about it and they care about writing good documentation because they want people to use their tools. A lot of times for enterprises tools like cloud enterprise services, documentation is terrible because they know you're going to pay because you're an enterprise. And some manager has decided five years ago to use TatCloud provider, not the other. So I think know if you see recommendation that means that the people's company, startup enterprise behind that want you to use their software because they know and they're proud of it. Like they know that is good. So usually this is my way of going. And then of course I watch a lot of YouTube videos so I see people talking about different texts, et cetera. And if some youtuber which I trust say like I tried this seems to work well, I will note it down.

Francesco Zuppichini:
So then in the future I know hey, for these things I think I use ABC and this has already be tested by someone. I don't know I'm going to use it. Another important thing is reach out to your friends networks and say hey guys, I need to do this. Do you know if you have a good stock that you're already trying to experience with that?

Demetrios:
Yeah. With respect to the enterprise software type of tools, there was something that I saw that was hilarious. It was something along the lines of custom customer and user is not the same thing. Customer is the one who pays, user is the one who suffers.

Francesco Zuppichini:
That's really true for enterprise software, I need to tell you. So that's true.

Demetrios:
Yeah, we've all been through it. So there's another question coming through in the chat about would there be a collection for each embedded video based on your unique view video id?

Francesco Zuppichini:
No. What you want to do, I mean you could do that of course, but collection should encapsulate the project that you're doing more or less in my mind. So in this case I just call it embeddings. Maybe I should have called videos. So they are just going to be inside the same collection, they're just going to have different metadata. I think you need to correct me if I'm wrong that from your side, from the Qdrant code, searching things in the same collection, probably it's more effective to some degree. And imagine that if you have 1000 videos you need to create 1000 collection. And then I think cocoa wise collection are meant to have data coming from the same source, semantic value.

Francesco Zuppichini:
So in my case I have all videos. If I were to have different data, maybe from pdfs. Probably I would just create another collection, right, if I don't want them to be in the same part and search them. And one cool thing of having all the videos in the same collection is that I can just ask a question to all the videos at the same time if I want to, or I can change my filter and ask questions to two free videos. Specifically, you can do that if you have one collection per video, right? Like for instance at work I was embedding PDF and using qualitative and sometimes you need to talk with two pdf at the same time free, or just one, or maybe all the PDF in that folder. So I was just changing the filter, right? And that can only be done if they're all in the same collection.

Sabrina Aquino:
Yeah, that's a great explanation of collections. And I do love your approach of having everything locally and having everything in a structured way that you can really understand what you're doing. And I know you mentioned sometimes frameworks are not necessary. And I wonder also from your side, when do you think a framework would be necessary and does it have to do with scaling? What do you think?

Francesco Zuppichini:
So that's a great question. So what frameworks in theory should give you is good interfaces, right? So a good interface means that if I'm following that interface, I know that I can always call something that implements that interface in the same way. Like for instance in Langchain, if I call a betterdb, I can just swap the betterdb and I can call it in the same way. If the interfaces are good, the framework is useful. If you know that you are going to change stuff. In my case, I know from the beginning that I'm going to use Qdrant, I'm going to use Ollama, and I'm going to use SQL lite. So why should I go to the hello reading framework documentation? I install libraries, and then you need to install a bunch of packages from the framework that you don't even know why you need them. Maybe you have a conflict package, et cetera, et cetera.

Francesco Zuppichini:
If you know ready. So what you want to do then just code it and call it a day? Like in this case, I know I'm not going to change the vector DB. If you think that you're going to change something, even if it's a simple approach, it's fair enough, simple to change stuff. Like I will say that if you know that you want to change your vector DB providers, either you define your own interface or you use a framework with an already defined interface. But be careful because right too much on framework will. First of all, basically you don't know what's going on inside the hood for launching because it's so kudos to them. They were the first one. They are very smart people, et cetera, et cetera.

Francesco Zuppichini:
But they have inheritance held in that code. And in order to understand how to do certain stuff I had to look at in the source code, right. And try to figure it out. So which class is inherited from that? And going straight up in order to understand what behavior that class was supposed to have. If I pass this parameter, and sometimes defining an interface is straightforward, just maybe you want to define a couple of function in a class. You call it, you just need to define the inputs and the outputs and if you want to scale and you can just implement a new class called that interface. Yeah, that is at least like my take. I try to first try to do stuff and then if I need to scale, at least I have already something working and I can scale it instead of kind of try to do the perfect thing from the beginning.

Francesco Zuppichini:
Also because I hate reading documentation, so I try to avoid doing that in general.

Sabrina Aquino:
Yeah, I totally love this. It's about having like what's your end project? Do you actually need what you're going to build and understanding what you're building behind? I think it's super nice. We're also having another question which is I haven't used Qdrant yet. The metadata is also part of the embedding, I. E. Prepended to the chunk or so basically he's asking if the metadata is also embedded in the answer for that. Go ahead.

Francesco Zuppichini:
I think you have a good article about another search which you also probably embed the title. Yeah, I remember you have a good article in which you showcase having chunks with the title from, I think the section, right. And you first do a search, find the right title and then you do a search inside. So all the chunks from that paragraph, I think from that section, if I'm not mistaken. It really depends on the use case, though. If you have a document full of information, splitting a lot of paragraph, very long one, and you need to very be precise on what you want to fetch, you need to take advantage of the structure of the document, right?

Sabrina Aquino:
Yeah, absolutely. The metadata goes as payload in Qdrant. So basically it's like a JSON type of information attached to your data that's not embedded. We also have documentation on it. I will answer on the comments as well, I think another question I have for you, Franz, about the sort of evaluation and how would you perform a little evaluation on this rag that you created.

Francesco Zuppichini:
Okay, so that is an interesting question, because everybody talks about metrics and evaluation. Most of the times you don't really have that, right? So you have benchmarks, right. And everybody can use a benchmark to evaluate their pipeline. But when you have domain specific documents, like at work, for example, I'm doing  RAG on insurance documents now. How do I create a data set from that in order to evaluate my  RAG? It's going to be very time consuming. So what we are trying to do, so we get a bunch of people who knows these documents, catching some paragraph, try to ask a question, and that has the reply there and having basically a ground truth from their side. A lot of time the reply has to be composed from different part of the document. So, yeah, it's very hard.

Francesco Zuppichini:
It's very hard. So what I will kind of suggest is try to use no benchmark, or then you empirically try that. If you're building a  RAG that users are going to use, always include a way to collect feedback and collect statistics. So collect the conversation, if that is okay with your privacy rules. Because in my opinion, it's always better to put something in production till you wait too much time, because you need to run all your metrics, et cetera, et cetera. And as soon as people start using that, you kind of see if it is good enough, maybe for language model itself, so that it's a different task, because you need to be sure that they don't say, we're stuck to the users. I don't really have the source of true answer here. It's very hard to evaluate them.

Francesco Zuppichini:
So what I know people also try to do, like, so they get some paragraph or some chunks, they ask GPD four to generate a question and the answer based on the paragraph, and they use that as an auto labeling way to create a data set to evaluate your  RAG. That can also be effective, I guess 100%, yeah.

Demetrios:
And depending on your use case, you probably need more rigorous evaluation or less, like in this case, what you're doing, it might not need that rigor.

Francesco Zuppichini:
You can see, actually, I think was Canada Airlines, right?

Demetrios:
Yeah.

Francesco Zuppichini:
If you have something that is facing paying users, then think one of the times before that. In my case at all, I have something that is used by internal users and we communicate with them. So if my chat bot is saying something wrong, so they will tell me. And the worst thing that can happen is that they need to manually look for the answer. But as soon as your chatbot needs to do something that had people that are going to pay or medical stuff. You need to understand that for some use cases, you need to apply certain rules for others and you can be kind of more relaxed, I would say, based on the arm that your chatbot is going to generate.

Demetrios:
Yeah, I think that's all the questions we've got for now. Appreciate you coming on here and chatting with us. And I also appreciate everybody listening in. Anyone who is not following Fran, go give him a follow, at least for the laughs, the chuckles, and huge thanks to you, Sabrina, for joining us, too. It was a pleasure having you here. I look forward to doing many more of these.

Sabrina Aquino:
The pleasure is all mine, Demetrios, and it was a total pleasure. Fran, I learned a lot from your session today.

Francesco Zuppichini:
Thank you so much. Thank you so much. And also go ahead and follow the Qdrant on LinkedIn. They post a lot of cool stuff and read the Qdrant blogs. They're very good. They're very good.

Demetrios:
That's it. The team is going to love to hear that, I'm sure. So if you are doing anything cool with good old Qdrant, give us a ring so we can feature you in the vector space talks. Until next time, don't get lost in vector space. We will see you all later. Have a good one, y'all.
