---
draft: false
title: "Unlocking AI Potential: Insights from Stanislas Polu"
slug: qdrant-x-dust-vector-search
short_description: Stanislas shares insights from his experiences at Stripe and
  founding his own company, Dust, focusing on AI technology's product layer.
description: Explore the dynamic discussion with Stanislas Polu on AI, ML, entrepreneurship, and product development. Gain valuable insights into AI's transformative power.
preview_image: /blog/from_cms/stan-polu-cropped.png
date: 2024-01-26T16:22:37.487Z
author: Demetrios Brinkmann
featured: false
tags:
  - Vector Space Talks
  - Vector Search
  - OpenAI
---

# Qdrant x Dust: How Vector Search Helps Make Work Better with Stanislas Polu

> *"We ultimately chose Qdrant due to its open-source nature, strong performance, being written in Rust, comprehensive documentation, and the feeling of control.”*\
-- Stanislas Polu
> 

Stanislas Polu is the Co-Founder and an Engineer at Dust. He had previously sold a company to Stripe and spent 5 years there, seeing them grow from 80 to 3000 people. Then pivoted to research at OpenAI on large language models and mathematical reasoning capabilities. He started Dust 6 months ago to make work work better with LLMs.


***Listen to the episode on [Spotify](https://open.spotify.com/episode/2YgcSFjP7mKE0YpDGmSiq5?si=6BhlAMveSty4Yt7umPeHjA), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/1vKoiFAdorE).***


<iframe width="560" height="315" src="https://www.youtube.com/embed/toIgkJuysQ4?si=uzlzQtOiSL5Kcpk5" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>


<iframe src="https://podcasters.spotify.com/pod/show/qdrant-vector-space-talk/embed/episodes/Qdrant-x-Dust-How-Vector-Search-Helps-Make-Work-Work-Better---Stan-Polu--Vector-Space-Talk-010-e2ep9u8/a-aasgqb8" height="102px" width="400px" frameborder="0" scrolling="no"></iframe>


## **Top takeaways:**


Curious about the interplay of SaaS platforms and AI in improving productivity? Stanislas Polu dives into the intricacies of enterprise data management, the selective use of SaaS tools, and the role of customized AI assistants in streamlining workflows, all while sharing insights from his experiences at Stripe, OpenAI, and his latest venture, Dust.


Here are 5 golden nuggets you'll unearth from tuning in:


1. **The SaaS Universe**: Stan will give you the lowdown on why jumping between different SaaS galaxies like Salesforce and Slack is crucial for your business data's gravitational pull.
2. **API Expansions**: Learn how pushing the boundaries of APIs to include global payment methods can alter the orbit of your company's growth.
3. **A Bot for Every Star**: Discover how creating targeted assistants over general ones can skyrocket team productivity across various use cases.
4. **Behind the Tech Telescope**: Stan discusses the decision-making behind opting for Qdrant for their database cosmos, including what triggered their switch.
5. **Integrating AI Stardust**: They're not just talking about Gen AI; they're actively guiding companies on how to leverage it effectively, placing practicality over flashiness.


> Fun Fact: Stanislas Polu co-founded a company that was acquired by Stripe, providing him with the opportunity to work with Greg Brockman at Stripe.
> 


## Show notes:


00:00 Interview about an exciting career in AI technology.\
06:20 Most workflows involve multiple SaaS applications.\
09:16 Inquiring about history with Stripe and AI.\
10:32 Stripe works on expanding worldwide payment methods.\
14:10 Document insertion supports hierarchy for user experience.\
18:29 Competing, yet friends in the same field.\
21:45 Workspace solutions, marketplace, templates, and user feedback.\
25:24 Avoid giving false hope; be accountable.\
26:06 Model calls, external API calls, structured data.\
30:19 Complex knobs, but powerful once understood. Excellent support.\
33:01 Companies hire someone to support teams and find use cases.


## More Quotes from Stan:


*"You really want to narrow the data exactly where that information lies. And that's where we're really relying hard on Qdrant as well. So the kind of indexing capabilities on top of the vector search."*\
-- Stanislas Polu


*"I think the benchmarking was really about quality of models, answers in the context of ritual augmented generation. So it's not as much as performance, but obviously, performance matters and that's why we love using Qdrant.”*\
-- Stanislas Polu


*"The workspace assistant are like the admin vetted the assistant, and it's kind of pushed to everyone by default.”*\
-- Stanislas Polu


## Transcript:
Demetrios:
All right, so, my man, I think people are going to want to know all about you. This is a conversation that we have had planned for a while. I'm excited to chat about what you have been up to. You've had quite the run around when it comes to doing some really cool stuff. You spent a lot of time at Stripe in the early days and I imagine you were doing, doing lots of fun ML initiatives and then you started researching on llms at OpenAI. And recently you are doing the entrepreneurial thing and following the trend of starting a company and getting really cool stuff out the door with AI. I think we should just start with background on yourself. What did I miss in that quick introduction?


Stanislas Polu:
Okay, sounds good. Yeah, perfect. Now you didn't miss too much. Maybe the only point is that starting the current company, Dust, with Gabrielle, my co founder, with whom we started a Company together twelve years or maybe 14 years ago.


Stanislas Polu:
I'm very bad with years that eventually got acquired to stripe. So that's how we joined Stripe, the both of us, pretty early. Stripe was 80 people when we joined, all the way to 2500 people and got to meet with and walk with Greg Brockman there. And that's how I found my way to OpenAI after stripe when I started interested in myself, in research at OpenAI, even if I'm not a trained researcher.


Stanislas Polu:
I did research on fate, doing research.
On larger good models, reasoning capabilities, and in particular larger models mathematical reasoning capabilities.
And from there.
18 months ago, kind of decided to leave OpenAI with the motivation. That is pretty simple.
It's that basically the hypothesis is that.
It was pre chattivity, but basically those large language models, they're already extremely capable and yet they are completely under deployed compared to the potential they have. And so while research remains a very active subject and it's going to be.
A tailwind for the whole ecosystem, there's.


Stanislas Polu:
Probably a lot of to be done at the product layer, and most of the locks between us and deploying that technology in the world is probably sitting.
At the product layer as it is sitting at the research layer.
And so that's kind of the hypothesis behind dust, is we try to explore at the product layer what it means to interface between models and humans, try to make them happier and augment them.
With superpowers in their daily jobs.


Demetrios:
So you say product layer, can you go into what you mean by that a little bit more?


Stanislas Polu:
Well, basically we have a motto at dust, which is no gpu before PMF. And so the idea is that while it's extremely exciting to train models. It's extremely exciting to fine tune and align models. There is a ton to be done.
Above the model, not only to use.
Them as best as possible, but also to really find the interaction interfaces that make sense for humans to leverage that technology. And so we basically don't train any models ourselves today.
There's many reasons to that.
The first one is as an early startup. It's a fascinating subject and fascinating exercise. As an early startup, it's actually a very big investment to go into training.
Models because even if the costs are.
Not necessarily big in terms of compute.
It'S still research and development and pretty.
Hard research and development. It's basically research. We understand pretraining pretty well. We don't understand fine tuning that well. We believe it's a better idea to.


Stanislas Polu:
Really try to explore the product layer.
The image I use generally is that training a model is very sexy and it's exciting, but really you're building a small rock that will get submerged by the waves of bigger models coming in the future. And iterating and positioning yourself at the interface between humans and those models at.
The product layer is more akin to.
Building a surfboard that you will be.
Able to use to surf those same waves.


Demetrios:
I like that because I am a big surfer and I have a lot.


Stanislas Polu:
Of fun doing it.


Demetrios:
Now tell me about are you going after verticals? Are you going after different areas in a market, a certain subset of the market?


Stanislas Polu:
How do you look at that? Yeah.
Basically the idea is to look at productivity within the enterprise. So we're first focusing on internal use.
By teams, internal teams of that technology.
We're not at all going after external use. So backing products that embed AI or having on projects maybe exposed through our users to actual end customers. So we really focused on the internal use case. So the first thing you want to.
Do is obviously if you're interested in.
Productivity within enterprise, you definitely want to have the enterprise data, right? Because otherwise there's a ton that can be done with Chat GPT as an example. But there is so much more that can be done when you have context.
On the data that comes from the company you're in.
That's pretty much kind of the use.
Case we're focusing on, and we're making.
A bet, which is a crazy bet to answer your question, that there's actually value in being quite horizontal for now. So that comes with a lot of risks because an horizontal product is hard.


Stanislas Polu:
To read and it's hard to figure.
Out how to use it. But at the same time, the reality is that when you are somebody working in a team, even if you spend.
A lot of time on one particular.
Application, let's say Salesforce for sales, or GitHub for engineers, or intercom for customer support, the reality of most of your workflows do involve many SaaS, meaning that you spend a lot of time in Salesforce, but you also spend a lot of time in slack and notion. Maybe, or we all spend as engineers a lot of time in GitHub, but we also use notion and slack a ton or Google Drive or whatnot. Jira.


Demetrios:
Good old Jira. Everybody loves spending time in Jira.


Stanislas Polu:
Yeah. And so basically, following our users where.
They are requires us to have access to those different SaaS, which requires us.
To be somewhat horizontal.
We had a bunch of signals that.
Kind of confirms that position, and yet.
We'Re still very conscious that it's a risky position. As an example, when we are benchmarked against other solutions that are purely verticalized, there is many instances where we actually do a better job because we have.
Access to all the data that matters within the company.


Demetrios:
Now, there is something very difficult when you have access to all of the data, and that is the data leakage issue and the data access. Right. How are you trying to conquer that hard problem?


Stanislas Polu:
Yeah, so we're basically focusing to continue.
Answering your questions through that other question.
I think we're focusing on tech companies.
That are less than 1000 people. And if you think about most recent tech companies, less than 1000 people.
There's been a wave of openness within.


Stanislas Polu:
Companies in terms of data access, meaning that it's becoming rare to see people actually relying on complex ACL for the internal data. You basically generally have silos. You have the exec silo with remuneration and ladders and whatnot. And this one is definitely not the.
Kind of data we're touching.
And then for the rest, you generally have a lot of data that is.
Accessible by every employee within your company.
So that's not a perfect answer, but that's really kind of the approach we're taking today. We give a lot of control on.


Stanislas Polu:
Which data comes into dust, but once.
It'S into dust, and that control is pretty granular, meaning that you can select.
Specific slack channels, or you can select.
Specific notion pages, or you can select specific Google Drive subfolders. But once you decide to put it in dust, every dust user has access to this. And so we're really taking the silo.
Vision of the granular ACL story.
Obviously, if we were to go higher enterprise, that would become a very big issue, because I think larger are the enterprise, the more they rely on complex ackles.


Demetrios:
And I have to ask about your history with stripe. Have you been focusing on specific financial pieces to this? First thing that comes to mind is what about all those e commerce companies that are living and breathing with stripe? Feels like they've got all kinds of use cases that they could leverage AI for, whether it is their supply chain or just getting better numbers, or getting answers that they have across all this disparate data. Have you looked at that at all? Is that informing any of your decisions that you're making these days?


Stanislas Polu:
No, not quite. Not really. At stripe, when we joined, it was.
Very early, it was the quintessential curlb onechargers number 42.
42, 42. And that's pretty much what stripe was almost, I'm exaggerating, but not too much. So what I've been focusing at stripe.
Was really driven by my and our.
Perspective as european funders joining a quite.
Us centric company, which is, no, there.


Stanislas Polu:
Is not credit card all over the world. Yes, there is also payment methods. And so most of my time spent at stripe was spent on trying to expand the API to not a couple us payment methods, but a variety of worldwide payment methods. So that requires kind of a change of paradigm from an API design, and that's where I spent most of my cycles
What I want to try.


Demetrios:
Okay, the next question that I had is you talked about how benchmarking with the horizontal solution, surprisingly, has been more effective in certain use cases. I'm guessing that's why you got a little bit of love for [Qdrant](https://qdrant.tech/) and what we're doing here.


Stanislas Polu:
Yeah
I think the benchmarking was really about quality of models, answers in the context of [retrieval augmented generation](https://qdrant.tech/articles/what-is-rag-in-ai/).
So it's not as much as performance, but obviously performance matters, and that's why we love using Qdrants. But I think the main idea of.


Stanislas Polu:
What I mentioned is that it's interesting because today the retrieval is noisy, because the embedders are not perfect, which is an interesting point.
Sorry, I'm double clicking, but I'll come back. The embedded are really not perfect. Are really not perfect. So that's interesting. When Qdrant release kind of optimization for [storage of vectors](https://qdrant.tech/documentation/concepts/storage/), they come with obviously warnings that you may have a loss.
Of precision because of the compression, et cetera, et cetera.
And that's funny, like in all kind of retrieval and mental generation world, it really doesn't matter. We take all the performance we can because the loss of precision coming from compression of those vectors at the vector DB level are completely negligible compared to.
The holon fuckness of the embedders in.


Stanislas Polu:
Terms of capability to correctly embed text, because they're extremely powerful, but they're far from being perfect. And so that's an interesting thing where you can really go as far as you want in terms of performance, because your error is dominated completely by the.
Quality of your embeddings.
Going back up.
I think what's interesting is that the.
Retrieval is noisy, mostly because of the embedders, and the models are not perfect.
And so the reality is that more.
Data in a rack context is not.
Necessarily better data because the retrievals become noisy.
The model kind of gets confused and it starts hallucinating stuff, et cetera. And so the right trade off is that you want to access to as.
Much data as possible, but you want
To give the ability to our users.
To select very narrowly the data required for a given task.


Stanislas Polu:
And so that's kind of what our product does, is the ability to create assistants that are specialized to a given task. And most of the specification of an assistant is obviously a prompt, but also.
Saying, oh, I'm working on helping sales find interesting next leads.
And you really want to narrow the data exactly where that information lies. And that's where there, we're really relying.
Hard on Qdrants as well.
So the kind of indexing capabilities on.
Top of the [vector search](https://qdrant.tech/), where whenever.


Stanislas Polu:
We insert the documents, we kind of try to insert an array of parents that reproduces the hierarchy of whatever that document is coming from, which lets us create a very nice user experience where when you create an assistant, you can say, oh, I'm going down two levels within notion, and I select that page and all of those children will come together. And that's just one string in our specification, because then rely on those parents that have been injected in Qdrant, and then the Qdrant search really works well with a simple query like this thing has to be in parents.


Stanislas Polu:
And you filter by that and it.


Demetrios:
Feels like there's two levels to the evaluation that you can be doing with rags. One is the stuff you're retrieving and evaluating the retrieval, and then the other is the output that you're giving to the end user. How are you attacking both of those evaluation questions?


Stanislas Polu:
Yeah, so the truth in whole transparency.
Is that we don't, we're just too early.


Demetrios:
Well, I'm glad you're honest with us, Alicia.


Stanislas Polu:
This is great, we should, but the rate is that we have so many other product priorities that I think evaluating the quality of retrievals, evaluating the quality.
Of retrieval, augmented generation.
Good sense but good sense is hard to define, because good sense with three.
Years doing research in that domain is probably better sense.
Better good sense than good sense with no clue on the domain. But basically with good sense I think.
You can get very far and then.
You'Ll be optimizing at the margin.
And the reality is that if you.
Get far enough with good sense, and that everything seems to work reasonably well, then your priority is not necessarily on pushing 5% performance, whatever is the metric.


Stanislas Polu:
But more like I have a million other products questions to solve.
That is the kind of ten people answer to your question. And as we grow, we'll probably make a priority, of course, of benchmarking that better. In terms of benchmarking that better. Extremely interesting question as well, because the.
Embedding benchmarks are what they are, and.
I think they are not necessarily always a good representation of the use case you'll have in your products. And so that's something you want to be cautious of. And.
It'S quite hard to benchmark your use case.
The kind of solutions you have and the ones that seems more plausible, whether it's spending like full years on that.


Stanislas Polu:
Is probably to.
Evaluate the retrieval with another model, right?
It's like you take five different embedding models, you record a bunch of questions.
That comes from your product, you use your product data and you run those retrievals against those five different embedders, and.
Then you ask GPT four to raise.
That would be something that seems sensible and probably will get you another step forward and is not perfect, but it's.
Probably really strong enough to go quite far.


Stanislas Polu:
And then the second question is evaluating.
The end to end pipeline, which includes.
Both the retrieval and the generation.
And to be honest, again, it's a.
Known question today because GPT four is.
Just so much above all the models.


Stanislas Polu:
That there's no point evaluating them. If you accept using GPD four, just use GP four. If you want to use open source models, then the questions is more important. But if you are okay with using GPD four for many reasons, then there.
Is no questions at this stage.


Demetrios:
So my next question there, because sounds like you got a little bit of a french accent, you're somewhere in Europe. Are you in France?


Stanislas Polu:
Yes, we're based in France and billion team from Paris.


Demetrios:
So I was wondering if you were going to lean more towards the history of you working at OpenAI or the fraternity from your french group and go for your amiz in.


Stanislas Polu:
Mean, we are absolute BFF with Mistral. The fun story is that Guillaume Lamp is a friend, because we were working on exactly the same subjects while I was at OpenAI and he was at Meta. So we were basically frenemies. We're competing against the same metrics and same goals, but grew a friendship out of that. Our platform is quite model agnostic, so.
We support Mistral there.
Then we do decide to set the defaults for our users, and we obviously set the defaults to GP four today. I think it's the question of where.
Today there's no question, but when the.
Time comes where open source or non open source, it's not the question, but where Ozo models kind of start catching.
Up with GPT four, that's going to.


Stanislas Polu:
Be an interesting product question, and hopefully.
Mistral will get there.
I think that's definitely their goal, to be within reach of GPT four this year.
And so that's going to be extremely exciting. Yeah.


Demetrios:
So then you mentioned how you have a lot of other product considerations that you're looking at before you even think about evaluation. What are some of the other considerations?


Stanislas Polu:
Yeah, so as I mentioned a bit.
The main hypothesis is we're going to do company productivity or team productivity. We need the company data. That was kind of hypothesis number zero. It's not even an hypothesis, almost an axiom. And then our first product was a conversational assistance, like chat. GPT, that is general, and has access.
To everything, and realized that didn't work.
Quite well enough on a bunch of use cases, was kind of good on some use cases, but not great on many others.
And so that's where we made that.
First strong product, the hypothesis, which is. So we want to have many assistants.
Not one assistant, but many assistants, targeted to specific tasks.
And that's what we've been exploring since the end of the summer. And that hypothesis has been very strongly confirmed with our users. And so an example of issue that.
We have is, obviously, you want to.
Activate your product, so you want to make sure that people are creating assistance. So one thing that is much more important than the quality of rag is.
The ability of users to create personal assistance.
Before, it was only workspace assistance, and so only the admin or the builder could build it. And now we've basically, as an example, worked on having anybody can create the assistant. The assistant is scoped to themselves, they can publish it afterwards, et cetera. That's the kind of product questions that.
Are, to be honest, more important than rack rarity, at least for us.


Demetrios:
All right, real quick, publish it for a greater user base or publish it for the internal company to be able to.


Stanislas Polu:
Yeah, within the workspace.
Okay.


Demetrios:
It's not like, oh, I could publish this for.


Stanislas Polu:
We'Re not going there yet. And there's plenty to do internally to each workspace.
Before going there, though it's an interesting case because that's basically another big problem, is you have an horizontal platform, you can create an assistance, you're not an.
Expert and you're like, okay, what should I do? And so that's the kind of white blank page issue.


Stanislas Polu:
And so there having templates, inspiration, you can sit that within workspace, but you also want to have solutions for the new workspace that gets created. And maybe a marketplace is a good idea. Or having templates, et cetera, are also product questions that are much more important than the rack performance. And finally, the users where dust works really well, one example is Alan in.
France, there are 600, and dust is.
Running there pretty healthily, and they've created.
More than 200 assistants. And so another big product question is like, when you get traction within a company, people start getting flooded with assistance.
And so how do they discover them? How did they, and do they know which one to use, et cetera? So that's kind of the kind of.
Many examples of product questions that are very first order compared to other things.


Demetrios:
Because out of these 200 assistants, are you seeing a lot of people creating the same assistance?


Stanislas Polu:
That's a good question. So far it's been kind of driven by somebody internally that was responsible for trying to push gen AI within the company. And so I think there's not that.
Much redundancy, which is interesting, but I.
Think there's a long tail of stuff that are mostly explorations, but from our perspective, it's very hard to distinguish the two. Obviously, usage is a very strong signal.
But yeah, displaying assistance by usage, pushing.
The right assistance to the right user. This problem seems completely trivial compared to building an LLM, obviously. But still, when you add the product layer requires a ton of work, and as a startup, that's where a lot of our resources go, and I think.
It'S the right thing to do.


Demetrios:
Yeah, I wonder if, and you probably have thought about this, but if it's almost like you can tag it with this product, or this assistant is in beta or alpha or this is in production, you can trust that this one is stable, that kind of thing.


Stanislas Polu:
Yeah.
So we have the concept of shared.
Assistant and the concept of workspace assistant. The workspace assistant are like the admin vetted the assistant, and it's kind of pushed to everyone by default. And then the published assistant is like, there's a gallery of assistant that you can visit, and there, the strongest signal is probably the usage metric.
Right?


Demetrios:
Yeah. So when you're talking about assistance, just so that I'm clear, it's not autonomous agents, is it?


Stanislas Polu:
No.


Stanislas Polu:
Yeah. So it's a great question.
We are really focusing on the one.
Step, trying to solve very nicely the one step thing. I have one granular task to achieve.
And I can get accelerated on that.
Task and maybe save a few minutes or maybe save a few tens of minutes on one specific thing, because the identity version of that is obviously the future.
But the reality is that current models, even GB four, are not that great at kind of chaining decisions of tool use in a way that is sustainable.
Beyond the demo effect. So while we are very hopeful for the future, it's not our core focus, because I think there's a lot of risk that it creates more deception than anything else. But it's obviously something that we are.
Targeting in the future as models get better.


Demetrios:
Yeah. And you don't want to burn people by making them think something's possible. And then they go and check up on it and they leave it in the agent's hands, and then next thing they know they're getting fired because they don't actually do the work that they said they were going to do.


Stanislas Polu:
Yeah. One thing that we don't do today.
Is we have kind of different ways.
To bring data into the assistant before it creates generation. And we're expanding that. One of the domain use case is the one based on Qdrant, which is.
The kind of retrieval one.
We also have kind of a workflow system where you can create an app.
An LLM app, where you can make.


Stanislas Polu:
Multiple calls to a model, you can call external APIs and search. And another thing we're digging into our structured data use case, which this time doesn't use Qdrants, which the idea is that semantic search is great, but it's really atrociously bad for quantitative questions.
Basically, the typical use case is you.
Have a big CSV somewhere and it gets chunked and then you do retrieval.
And you get kind of disordered partial.
Chunks, all of that.
And on top of that, the moles.
Are really bad at counting stuff. And so you really get bullshit, you.


Demetrios:
Know better than anybody.


Stanislas Polu:
Yeah, exactly. Past life. And so garbage in, garbage out. Basically, we're looking into being able, whenever the data is structured, to actually store.


It in a structured way and as needed.
Just in time, generate an in memory SQL database so that the model can generate a SQL query to that data and get kind of a SQL.
Answer and as a consequence hopefully be able to answer quantitative questions better.
And finally, obviously the next step also is as we integrated with those platform notion, Google Drive, slack, et cetera, basically.
There'S some actions that we can take there.
We're not going to take the actions, but I think it's interesting to have.
The model prepare an action, meaning that here is the email I prepared, send.
It or iterate with me on it, or here is the slack message I prepare, or here is the edit to the notion doc that I prepared.


Stanislas Polu:
This is still not agentic, it's closer.
To taking action, but we definitely want.
To keep the human in the loop.
But obviously some stuff that are on our roadmap.
And another thing that we don't support, which is one type of action would.
Be the first we will be working on is obviously code interpretation, which is I think is one of the things that all users ask because they use.
It on Chat GPT.
And so we'll be looking into that as well.


Demetrios:
What made you choose Qdrant?


Stanislas Polu:
So the decision was made, if I.
Remember correctly, something like February or March last year. And so the alternatives I looked into.
Were pine cone wavy eight, some click owls because Chroma was using click owls at the time. But Chroma was.
2000 lines of code.
At the time as well.
And so I was like, oh, Chroma, we're part of AI grant. And Chroma is as an example also part of AI grant. So I was like, oh well, let's look at Chroma.
And however, what I'm describing is last.
Year, but they were very early. And so it was definitely not something.
That seemed like to make sense for us.
So at the end it was between pine cone wavev eight and Qdrant wave v eight.
You look at the doc, you're like, yeah, not possible.
And then finally it's Qdrant and Pinecone. And I think we really appreciated obviously the open source nature of Qdrants.From.
Playing with it, the very strong performance, the fact that it's written in rust, the sanity of the documentation, and basically the feeling that because it's an open source, we're using the osted Qdrant cloud solution. But it's not a question of paying.
Or not paying, it's more a question.
Of being able to feel like you have more control. And at the time, I think it was the moment where Pinecon had their massive fuck up, where they erased gazillion database from their users and so we've been on Qdrants and I think it's.
Been a two step process, really.


Stanislas Polu:
It's very smooth to start, but also Qdrants at this stage comes with a.
Lot of knobs to turns.
And so as you start scaling, you at some point reach a point where.
You need to start tweaking the knobs.
Which I think is great because the knobs, there's a lot of knobs, so they are hard to understand, but once you understand them, you see the power of them. And the Qdrant team has been excellent there supporting us. And so I think we've reached that first level of scale where you have.
To tweak the nodes, and we've reached.
The second level of scale where we.
Have to have multiple nodes.
But so far it's been extremely smooth.
And I think we've been able to.
Do with Qdrant some stuff that really are possible only because of the very good performance of the database.
As an example, we're not using your clustered setup. We have n number of independent nodes.
And as we scale, we kind of.
Reshuffle which users go on which nodes.
As we need, trying to keep our largest users and most paying users on.
Very well identified nodes. We have a kind of a garbage.
Node for all the free users, as an example, migrating even a very big collection from one node. One capability that we build is say, oh, I have that collection over there. It's pretty big.
I'm going to initiate on another node.
I'm going to set up shadow writing on both, and I'm going to migrate live the data. And that has been incredibly easy to do with Qdrant because crawling is fast, writing is fucking fast. And so even a pretty large collection.
You can migrate it in a minute.


Stanislas Polu:
And so it becomes really within the realm of being able to administrate your cluster with that in mind, which I.
Think would have probably not been possible with the different systems.


Demetrios:
So it feels like when you are helping companies build out their assistants, are you going in there and giving them ideas on what they can do?


Stanislas Polu:
Yeah, we are at a stage where obviously we have to do that because.
I think the product basically starts to.
Have strong legs, but I think it's still very early and so there's still a lot to do on activation, as an example. And so we are in a mode today where we do what doesn't scale.
Basically, and we do spend some time.


Stanislas Polu:
With companies, obviously, because there's nowhere around that. But what we've seen also is that the users where it works the best and being on dust or anything else.
That is relative to having people adopt gen AI.
Within the company are companies where they.
Actually allocate resources to the problem, meaning that the companies where it works best.
Are the companies where there's somebody. Their role is really to go around the company, find, use cases, support the teams, et cetera. And in the case of companies using dust, this is kind of type of interface that is perfect for us because we provide them full support and we help them build whatever they think is.
Valuable for their team.


Demetrios:
Are you also having to be the bearer of bad news and tell them like, yeah, I know you saw that demo on Twitter, but that is not actually possible or reliably possible?


Stanislas Polu:
Yeah, that's an interesting question. That's a good question. Not that much, because I think one of the big learning is that you take any company, even a pretty techy.
Company, pretty young company, and the reality.
Is that most of the people, they're not necessarily in the ecosystem, they just want shit done. And so they're really glad to have some shit being done by a computer. But they don't really necessarily say, oh, I want the latest shiniest thingy that.
I saw on Twitter. So we've been safe from that so far.


Demetrios:
Excellent. Well, man, this has been incredible. I really appreciate you coming on here and doing this. Thanks so much. And if anyone wants to check out dust, I encourage that they do.


Stanislas Polu:
It's dust.


Demetrios:
It's a bit of an interesting website. What is it?


Stanislas Polu:
Dust TT.


Demetrios:
That's it. That's what I was missing, dust. There you go. So if anybody wants to look into it, I encourage them to. And thanks so much for coming on here.


Stanislas Polu:
Yeah.


Stanislas Polu:
And Qdrant is the shit.


Demetrios:
There we go. Awesome, dude. Well, this has been great.


Stanislas Polu:
Yeah, thanks, Vintu. Have a good one.
