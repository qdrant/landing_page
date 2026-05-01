---
draft: false
title: Teaching Vector Databases at Scale - Alfredo Deza | Vector Space Talks
slug: teaching-vector-db-at-scale
short_description: Alfredo Deza tackles AI teaching, the intersection of
  technology and academia, and the value of consistent learning.
description: Alfredo Deza discusses the practicality of machine learning
  operations, highlighting how personal interest in topics like wine datasets
  enhances engagement, while reflecting on the synergies between his
  professional sportsman discipline and the persistent, straightforward approach
  required for effectively educating on vector databases and large language
  models.
preview_image: /blog/from_cms/alfredo-deza-bp-cropped.png
date: 2024-04-09T03:06:00.000Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Search
  - Retrieval Augmented Generation
  - Vector Space Talks
  - Coursera
---
> *"So usually I get asked, why are you using Qdrant? What's the big deal? Why are you picking these over all of the other ones? And to me it boils down to, aside from being renowned or recognized, that it works fairly well. There's one core component that is critical here, and that is it has to be very straightforward, very easy to set up so that I can teach it, because if it's easy, well, sort of like easy to or straightforward to teach, then you can take the next step and you can make it a little more complex, put other things around it, and that creates a great development experience and a learning experience as well.”*\
— Alfredo Deza
> 

Alfredo is a software engineer, speaker, author, and former Olympic athlete working in Developer Relations at Microsoft. He has written several books about programming languages and artificial intelligence and has created online courses about the cloud and machine learning.

He currently is an Adjunct Professor at Duke University, and as part of his role, works closely with universities around the world like Georgia Tech, Duke University, Carnegie Mellon, and Oxford University where he often gives guest lectures about technology.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/4HFSrTJWxl7IgQj8j6kwXN?si=99H-p0fKQ0WuVEBJI9ugUw), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/3l6F6A_It0Q?feature=shared).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/3l6F6A_It0Q?si=cFZGAh7995iHilcY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Teaching-Vector-Databases-at-Scale---Alfredo-Deza--Vector-Space-Talks-019-e2hhjlo/a-ab3qp7u" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>

## **Top takeaways:**

How does a former athlete such as Alfredo Deza end up in this AI and Machine Learning industry? That’s what we’ll find out in this episode of Vector Space Talks. Let’s understand how his background as an olympian offers a unique perspective on consistency and discipline that's a real game-changer in this industry.

Here are some things you’ll discover from this episode:

1. **The Intersection of Teaching and Tech:** Alfredo discusses on how to effectively bridge the gap between technical concepts and student understanding, especially when dealing with complex topics like vector databases.
2. **Simplified Learning:** Dive into Alfredo's advocacy for simplicity in teaching methods, mirroring his approach with Qdrant and the potential for a Rust in-memory implementation aimed at enhancing learning experiences.
3. **Beyond the Titanic Dataset:** Discover why Alfredo prefers to teach with a wine dataset he developed himself, underscoring the importance of using engaging subject matter in education.
4. **AI Learning Acceleration:** Alfredo discusses the struggle universities face to keep pace with AI advancements and how online platforms can offer a more up-to-date curriculum.
5. **Consistency is Key:** Alfredo draws parallels between the discipline required in high-level athletics and the ongoing learning journey in AI, zeroing in on his mantra, “There is no secret” to staying consistent.

> Fun Fact: Alfredo tells the story of athlete Dick Fosbury's invention of the Fosbury Flop to highlight the significance of teaching simplicity.
> 

## Show notes:

00:00 Teaching machine learning, Python to graduate students.\
06:03 Azure AI search service simplifies teaching, Qdrant facilitates learning.\
10:49 Controversy over high jump style.\
13:18 Embracing past for inspiration, emphasizing consistency.\
15:43 Consistent learning and practice lead to success.\
20:26 Teaching SQL uses SQLite, Rust has limitations.\
25:21 Online platforms improve and speed up education.\
29:24 Duke and Coursera offer specialized language courses.\
31:21 Passion for wines, creating diverse dataset.\
35:00 Encouragement for vector db discussion, wrap up.\

## More Quotes from Alfredo:

*"Qdrant makes it straightforward. We use it in-memory for my classes and I would love to see something similar setup in Rust to make teaching even easier.”*\
— Alfredo Deza

*"Retrieval augmented generation is kind of like having an open book test. So the large language model is the student, and they have an open book so they can see the answers and then repackage that into their own words and provide an answer.”*\
— Alfredo Deza

*"With Qdrant, I appreciate that the use of the Python API is so simple. It avoids the complexity that comes from having a back-end system like in Rust where you need an actual instance of the database running.”*\
— Alfredo Deza

## Transcript:
Demetrios:
What is happening? Everyone, welcome back to another vector space talks. I am Demetrios, and I am joined today by good old Sabrina. Where you at, Sabrina? Hello?

Sabrina Aquino:
Hello, Demetrios. I'm from Brazil. I'm in Brazil right now. I know that you are traveling currently.

Demetrios:
Where are you? At Kubecon in Paris. And it has been magnificent. But I could not wait to join the session today because we've got Alfredo coming at us.

Alfredo Deza:
What's up, dude? Hi. How are you?

Demetrios:
I'm good, man. It's been a while. I think the last time that we chatted was two years ago, maybe right before your book came out. When did the book come out?

Alfredo Deza:
Yeah, something like that. I would say a couple of years ago. Yeah. I wrote, co authored practical machine learning operations with no gift. And it was published on O'Reilly.

Demetrios:
Yeah. And that was, I think, two years ago. So you've been doing a lot of stuff since then. Let's be honest, you are maybe one of the most active men on the Internet. I always love seeing what you're doing. You're bringing immense value to everything that you touch. I'm really excited to be able to chat with you for this next 30 minutes.

Alfredo Deza:
Yeah, of course.

Demetrios:
Maybe just, we'll start it off. We're going to get into it when it comes to what you're doing and really what the space looks like right now. Right. But I would love to hear a little bit of what you've been up to since, for the last two years, because I haven't talked to you.

Alfredo Deza:
Yeah, that's right. Well, several different things, actually. Right after we chatted last time, I joined Microsoft to work in developer relations. Microsoft has a big group of folks working in developer relations. And basically, for me, it signaled my shift away from regular software engineering. I was primarily doing software engineering and thought that perhaps with the books and some of the courses that I had published, it was time for me to get into more teaching and providing useful content, which is really something very rewarding. And in developer relations, in advocacy in general, it's kind of like a way of teaching. We demonstrate technology, how it works from a technical point of view.

Alfredo Deza:
So aside from that, started working really closely with several different universities. I work with Georgia Tech, Oxford University, Carnegie Mellon University, and Duke University, where I've been working as an adjunct professor for a couple of years as well. So at Duke, what I do is I teach a couple of classes a year. One is on machine learning. Last year was machine learning operations, and this year it's going to, I think, hopefully I'm not messing anything up. I think we're going to shift a little bit to doing operations with large language models. And in the fall I teach a programming class for graduate students that want to join one of the graduate programs and they want to get a primer on Python. So I teach a little bit of that.

Alfredo Deza:
And in the meantime, also in partnership with Duke, getting a lot of courses out on Coursera, and from large language models to doing stuff with Azure, to machine learning operations, to rust, I've been doing a lot of rust lately, which I really like. So, yeah, so a lot of different things, but I think the core pillar for me remains being able to teach and spread the knowledge.

Demetrios:
Love it, man. And I know you've been diving into vector databases. Can you tell us more?

Alfredo Deza:
Yeah, well, the thing is that when you're trying to teach, and yes, one of the courses that we had out for large language models was applying retrieval augmented generation, which is the basis for vector databases, to see how it works. This is how it works. These are the components that you need. Let's create an application from scratch and see how it works. And for those that don't know, retrieval augmented generation is kind of like having. The other day I saw a description about this, which I really like, which is a way of, it's kind of like having an open book test. So the large language model is the student, and they have an open book so they can see the answers and then repackage that into their own words and provide an answer, which is kind of like what we do with vector databases in the retrieval augmented generation pattern. We've been putting a lot of examples on how to do these, and in the case of Azure, you're enabling certain services.

Alfredo Deza:
There's the Azure AI search service, which is really good. But sometimes when you're trying to teach specifically, it is useful to have a very straightforward way to do this and applying or creating a retrieval augmented generation pattern, it's kind of tricky, I think. We're not there yet to do it in a nice, straightforward way. So there are several different options, Qdrant being one of them. So usually I get asked, why are you using Qdrant? What's the big deal? Why are you picking these over all of the other ones? And to me it boils down to, aside from being renowned or recognized, that it works fairly well. There's one core component that is critical here, and that is it has to be very straightforward, very easy to set up so that I can teach it, because if it's easy, well, sort of like easy to or straightforward to teach, then you can take the next step and you can make it a little more complex, put other things around it, and that creates a great development experience and a learning experience as well. If something is very complex, if the list of requirements is very long, you're not going to be very happy, you're going to spend all this time trying to figure, and when you have, similar to what happens with automation, when you have a list of 20 different things that you need to, in order to, say, deploy a website, you're going to get things out of order, you're going to forget one thing, you're going to have a typo, you're going to mess it up, you're going to have to start from scratch, and you're going to get into a situation where you can't get out of it. And Qdrant does provide a very straightforward way to run the database, and that one is the in memory implementation with Python.

Alfredo Deza:
So you can actually write a little bit of python once you install the libraries and say, I want to instantiate a vector database and I wanted to run it in memory. So for teaching, this is great. It's like, hey, of course it's not for production, but just write these couple of lines and let's get right into it. Let's just start populating these and see how it works. And it works. It's great. You don't need to have all of these, like, wow, let's launch Kubernetes over here and let's have all of these dynamic. No, why? I mean, sure, you want to create a business model and you want to launch to production eventually, and you want to have all that running perfect.

Alfredo Deza:
But for this setup, like for understanding how it works, for trying baby steps into understanding vector databases, this is perfect. My one requirement, or my one wish list item is to have that in memory thing for rust. That would be pretty sweet, because I think it'll make teaching rust and retrieval augmented generation with rust much easier. I wouldn't have to worry about bringing up containers or external services. So that's the deal with rust. And I'll tell you one last story about why I think specifically making it easy to get started with so that I can teach it, so that others can learn from it, is crucial. I would say almost 50 years ago, maybe a little bit more, my dad went to Italy to have a course on athletics. My dad was involved in sports and he was going through this, I think it was like a six month specialization on athletics.

Alfredo Deza:
And he was in class and it had been recent that the high jump had transitioned from one style to the other. The previous style, the old style right now is the old style. It's kind of like, it was kind of like over the bar. It was kind of like a weird style. And it had recently transitioned to a thing called the Fosbury flop. This person, his last name is Dick Fosbury, invented the Fosbury flop. He said, no, I'm just going to go straight at it, then do a little curve and then jump over it. And then he did, and then he started winning everything.

Alfredo Deza:
And everybody's like, what this guy? Well, first they thought he was crazy, and they thought that dismissive of what he was trying to do. And there were people that sticklers that wanted to stay with the older style, but then he started beating records and winning medals, and so people were like, well, is this a good thing? Let's try it out. So there was a whole. They were casting doubt. It's like, is this really the thing? Is this really what we should be doing? So one of the questions that my dad had to answer in this specialization he did in Italy was like, which style is better, it's the old style or the new style? And so my dad said, it's the new style. And they asked him, why is the new style better? And he didn't choose the path of answering the, well, because this guy just won the Olympics or he just did a record over here that at the end is meaningless. What he said was, it is the better style because it's easier to teach and it is 100% correct. When you're teaching high jump, it is much easier to teach the Fosbury flop than the other style.

Alfredo Deza:
It is super hard. So you start seeing this parallel in teaching and learning where, but with this one, you have all of these world records and things are going great. Well, great. But is anybody going to try, are you going to have more people looking into it or are you going to have less? What is it that we're trying to do here? Right.

Demetrios:
Not going to lie, I did not see how you were going to land the plane on coming from the high jump into the vector database space, but you did it gracefully. That was well done. So, basically, the easier it is to teach, the more people are going to be able to jump on board and the more people are going to be able to get value out of it.

Sabrina Aquino:
I absolutely love it, by the way. It's a pleasure to meet you, Alfredo. And I was actually about to ask you. I love your background as an olympic athlete. Right. And I was wondering, do you make any connections or how do we interact this background with your current teaching and AI? And do you see any similarities or something coming from that approach into what you've applied?

Alfredo Deza:
Well, you're bringing a great point. It's taken me a very long time to feel comfortable talking about my professional sports past. I don't want to feel like I'm overwhelming anyone or trying to be like a show off. So I usually try not to mention, although I'm feeling more comfortable mentioning my professional past. But the only situations where I think it's good to talk about it is when I feel like there's a small chance that I might get someone thinking about the possibilities of what they can actually do and what they can try. And things that are seemingly complex might be achievable. So you mentioned similarities, but I think there are a couple of things that happen when you're an athlete in any sport, really, that you're trying to or you're operating at the very highest level and there's several things that happen there. You have to be consistent.

Alfredo Deza:
And it's something that I teach my kids as well. I have one of my kids, he's like, I did really a lot of exercise today and then for a week he doesn't do anything else. And he's like, now I'm going to do exercise again. And she's going to do 4 hours. And it's like, wait a second, wait a second. It's okay. You want to do it. This is great.

Alfredo Deza:
But no intensity. You need to be consistent. Oh, dad, you don't let me work out and it's like, no work out. Good, I support you, but you have to be consistent and slowly start ramping up and slowly start getting better. And it happens a lot with learning. We are in an era that concepts and things are advancing so fast that things are getting obsolete even faster. So you're always in this motion of trying to learn. So what I would say is the similarities are in the consistency.

Alfredo Deza:
You have to keep learning, you have to keep applying yourself. But it can be like, oh, today I'm going to read this whole book from start to end and you're just going to learn everything about, I don't know, rust. It's like, well, no, try applying rust a little bit every day and feel comfortable with it. And at the very end you will do better. Like, you can't go with high intensity because you're going to get burned out, you're going to overwhelmed and it's not going to work out. You don't go to the Olympics by working out for like a few months. Actually, a very long time ago, a reporter asked me, how many months have you been working out preparing for the Olympics? It's like, what do you mean with how many months? I've been training my whole life for this. What are we talking about?

Demetrios:
We're not talking in months or years. We're talking in lifetimes, right?

Alfredo Deza:
So you have to take it easy. You can't do that. And beyond that, consistency. Consistency goes hand in hand with discipline. I came to the US in 2006. I don't live like I was born in Peru and I came to the US with no degree. I didn't go to college. Well, I went to college for a few months and then I dropped out and I didn't have a career, I didn't have experience.

Alfredo Deza:
I was just recently married. I have never worked in my life because I used to be a professional athlete. And the only thing that I decided to do was to do amazing work, apply myself and try to keep learning and never stop learning. In the back of my mind, it's like, oh, I have a tremendous knowledge gap that I need to fulfill by learning. And actually, I have tremendous respect and I'm incredibly grateful by all of the people that opened doors for me and gave me an opportunity, one of them being Noah Giff, which I co authored a few books with him and some of the courses. And he actually taught me to write Python. I didn't know how to program. And he said, you know what? I think you should learn to write some python.

Alfredo Deza:
And I was like, python? Why would I ever need to do that? And I did. He's like, let's just find something to automate. I mean, what a concept. Find something to apply automation. And every week on Fridays, we'll just take a look at it and that's it. And we did that for a while. And then he said, you know what? You should apply for speaking at Python. How can I be speaking at a conference when I just started learning? It's like your perspective is different.

Alfredo Deza:
You just started learning these. You're going to do it in an interesting way. So I think those are concepts that are very important to me. Stay disciplined, stay consistent, and keep at it. The secret is that there's no secret. That's the bottom line. You have to keep consistent. Otherwise things are always making excuses.

Alfredo Deza:
Is very simple.

Demetrios:
The secret is there is no secret. That is beautiful. So you did kind of sprinkle this idea of, oh, I wish there was more stuff happening with Qdrant and rust. Can you talk a little bit more to that? Because one piece of Qdrant that people tend to love is that it's built in rust. Right. But also, I know that you mentioned before, could we get a little bit of this action so that I don't have to deal with any. What was it you were saying? The containers.

Alfredo Deza:
Yeah. Right. Now, if you want to have a proof of concept, and I always go for like, what's the easiest, the most straightforward, the less annoying things I need to do, the better. And with Python, the Python API for Qdrant, you can just write a few lines and say, I want to create an instance in memory and then that's it. The database is created for you. This is very similar, or I would say actually almost identical to how you run SQLite. Sqlite is the embedded database you can create in memory. And it's actually how I teach SQL as well.

Alfredo Deza:
When I have to teach SQl, I use sqlite. I think it's perfect. But in rust, like you said, Qdrant's backend is built on rust. There is no in memory implementation. So you are required to have an actual instance of the Qdrant database running. So you have a couple of options, but one of them probably means you'll have to bring up a container with Qdrant running and then you'll have to connect to that instance. So when you're teaching, the development environments are kind of constrained. Either you are in a lab somewhere like Crusader has labs, but those are self contained.

Alfredo Deza:
It's kind of tricky to get them running 100%. You can run multiple containers at the same time. So things start becoming more complex. Not only more complex for the learner, but also in this case, like the teacher, me who wants to figure out how to make this all run in a very constrained environment. And that makes it tricky. And I fasted the team, by the way, and I was told that maybe at some point they can do some magic and put the in memory implementation on the rust side of things, which I think it would be tremendous.

Sabrina Aquino:
We're going to advocate for that on our side. We're also going to be asking for it. And I think this is really good too. It really makes it easier. Me as a student not long ago, I do see what you mean. It's quite hard to get it all working very fast in the time of a class that you don't have a lot of time and students can get. I don't know, it's quite complex. I do get what you mean.

Sabrina Aquino:
And you also are working both on the tech industry and on academia, which I think is super interesting. And I always kind of feel like those two are a bit disconnected sometimes. And I was wondering what you think that how important is the collaboration of these two areas considering how fast the AI space is going to right now? And what are your thoughts?

Alfredo Deza:
Well, I don't like generalizing, but I'm going to generalize right now. I would say most universities are several steps behind, and there's a lot of complexities involved in higher education specifically. Most importantly, these institutions tend to be fairly large, and with fairly large institutions, what do you get? Oh, you get the magical bureaucracy for anything you want to do. Something like, oh, well, you need to talk to that department that needs to authorize something, that needs to go to some other department, and it's like, I'm going to change the curriculum. It's like, no, you can't. What does that mean? I have actually had conversations with faculty in universities where they say, listen, curricula. Yeah, we get that. We need to update it, but we change curricula every five years.

Alfredo Deza:
And so. See you in a while. It's been three years. We have two more years to go. See you in a couple of years. And that's detrimental to students now. I get it. Building curricula, it's very hard.

Alfredo Deza:
It takes a lot of work for the faculty to put something together. So it is something that, from a faculty perspective, it's like they're not going to get paid more if they update the curriculum.

Demetrios:
Right.

Alfredo Deza:
And it's a massive amount of work now that, of course, comes to the detriment of the learner. The student will be under service because they will have to go through curricula that is fairly dated. Now, there are situations and there are programs where this doesn't happen. And Duke, I've worked with several. They're teaching Llama file, which was built by Mozilla. And when did Llama file came out? It was just like a few months ago. And I think it's incredible. And I think those skills that are the ones that students need today in order to not only learn these things, but also be able to apply them when they're looking for a job or trying to professionally even apply them into their day to day, now that's one side of things.

Alfredo Deza:
But there's the other aspect. In the case of Duke, as well as other universities out there, they're using these online platforms so that they can put courses out there faster. Do you really need to go through a four year program to understand how retrieval augmented generation works? Or how to implement it? I would argue no, but would you be better out, like, taking a course that will take you perhaps a couple of weeks to go through and be fairly proficient? I would say yes, 100%. And you see several institutions putting courses out there that are meaningful, that are useful, that they can cope with the speed at which things are needed. I think it's kind of good. And I think that sometimes we tend to think about knowledge and learning things, kind of like in a bubble, especially here in the US. I think there's this college is this magical place where all of the amazing things happen. And if you don't go to college, things are going to go very bad for you.

Alfredo Deza:
And I don't think that's true. I think if you like college, if you like university, by all means take advantage of it. You want to experience it. That sounds great. I think there's tons of opportunity to do it outside of the university or the college setting and taking online courses from validated instructors. They have a good profile. Not someone that just dumped something on genetic AI and started.

Demetrios:
Someone like you.

Alfredo Deza:
Well, if you want to. Yeah, sure, why not? I mean, there's students that really like my teaching style. I think that's great. If you don't like my teaching style. Sometimes I tend to go a little bit slower because I don't want to overwhelm anyone. That's all good. But there is opportunity. And when I mention these things, people are like, oh, really? I'm not advertising for Coursera or anything else, but some of these platforms, if you pay a monthly fee, I think it's between $40 and $60.

Alfredo Deza:
I think on the expensive side, you can take advantage of all of these courses and as much as you can take them. Sometimes even companies say, hey, you have a paid subscription, go take it all. And I've met people like that. It's like, this is incredible. I'm learning so much. Perfect. I think there's a mix of things. I don't think there's like a binary answer, like, oh, you need to do this, or, no, don't do that, and everything's going to be well again.

Demetrios:
Yeah. Can you talk a little bit more about your course? And if I wanted to go on Coursera, what can I expect from.

Alfredo Deza:
You know, and again, I don't think as much as I like talking about my courses and the things that I do, I want to emphasize, like, if someone is watching this video or listening into what we're talking about, find something that is interesting to you and find a course that kind of delivers that thing, that sliver of interesting stuff, and then try it out. I think that's the best way. Don't get overwhelmed by. It's like, is this the right vector database that I should be learning? Is this instructor? It's like, no, try it out. What's going to happen? You don't like it when you're watching a bad video series or docuseries on Netflix or any streaming platform? Do you just like, I pay my $10 a month, so I'm going to muster through this whole 20 more episodes of this thing that I don't like. It's meaningless. It doesn't matter. Just move on.

Alfredo Deza:
So having said that, on Coursera specifically with Duke University, we tend to put courses out there that are going to be used in our programs in the things that I teach. For example, we just released the large language models. Specialization and specialization is a grouping of between four and six courses. So in there we have doing large language models with Azure, for example, introduction to generative AI, having a very simple rag pattern with Qdrant. I also have examples on how to do it with Azure AI search, which I think is pretty cool as well. How to do it locally with Llama file, which I think is great. You can have all of these large language models running locally, and then you have a little bit of Qdrant sprinkle over there, and then you have rack pattern. Now, I tend to teach with things that I really like, and I'll give you a quick example.

Alfredo Deza:
I think there's three data sets that are one of the top three most used data sets in all of machine learning and data science. Those are the Boston housing market, the diabetes data set in the US, and the other one is the Titanic. And everybody uses those. And I don't really understand why. I mean, perhaps I do understand why. It's because they're easy, they're clean, they're ready to go. Nothing's ever wrong with these, and everybody has used them to boredom. But for the life of me, you wouldn't be able to convince me to use any of those, because these are not topics that I really care about and they don't resonate with me.

Alfredo Deza:
The Titanic specifically is just horrid. Well, if I was 37 and I'm on first class and I'm male, would I survive? It's like, what are we trying to do here? How is this useful to anyone? So I tend to use things that I like, and I'm really passionate about wine. So I built my own data set, which is a collection of wines from all over the world, they have the ratings, they have the region, they have the type of grape and the notes and the name of the wine. So when I'm teaching them, like, look at this, this is amazing. It's wines from all over the world. So let's do a little bit of things here. So, for rag, what I was able to do is actually in the courses as well. I do, ah, I really know wines from Argentina, but these wines, it would be amazing if you can find me not a Malbec, but perhaps a cabernet franc.

Alfredo Deza:
That is amazing. From, it goes through Qdrant, goes back to llama file using some large language model or even small language model, like the Phi 2 from Microsoft, I think is really good. And he goes, it tells. Yeah, sure. I get that you want to have some good wines. Here's some good stuff that I can give you. And so it's great, right? I think it's great. So I think those kinds of things that are interesting to the person that is teaching or presenting, I think that's the key, because whenever you're talking about things that are very boring, that you do not care about, things are not going to go well for you.

Alfredo Deza:
I mean, if I didn't like teaching, if I didn't like vector databases, you would tell right away. It's like, well, yes, I've been doing stuff with the vector databases. They're good. Yeah, Qdrant, very good. You would tell right away. I can't lie. Very good.

Demetrios:
You can't fool anybody.

Alfredo Deza:
No.

Demetrios:
Well, dude, this is awesome. We will drop a link to the chat. We will drop a link to the course in the chat so that in case anybody does want to go on this wine tasting journey with you, they can. And I'm sure there's all kinds of things that will spark the creativity of the students as they go through it, because when you were talking about that, I was like, oh, it would be really cool to make that same type of thing, but with ski resorts there, you go around the world. And if I want this type of ski resort, I'm going to just ask my chat bot. So I'm excited to see what people create with it. I also really appreciate you coming on here, giving us your time and talking through all this. It's been a pleasure, as always, Alfredo.

Demetrios:
Thank you so much.

Alfredo Deza:
Yeah, thank you. Thank you for having me. Always happy to chat with you. I think Qdrant is doing a very solid product. Hopefully, my wish list item of in memory in rust comes to fruition, but I get it. Sometimes there are other priorities. It's all good. Yeah.

Alfredo Deza:
If anyone wants to connect with me, I'm always active on LinkedIn primarily. Always happy to connect with folks and talk about learning and improving and always being a better person.

Demetrios:
Excellent. Well, we will sign off, and if anyone else out there wants to come on here and talk to us about vector databases, we're always happy to have you. Feel free to reach out. And remember, don't get lost in vector space, folks. We will see you on the next one.

Sabrina Aquino:
Good night. Thank you so much.
