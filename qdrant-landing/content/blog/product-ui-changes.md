---
draft: false
title: "Exploring Qdrant Cloud just got easier"
short_description: "Short description"
preview_image: /blog/case-study-shakudo/preview.png
social_preview_image: /blog/case-study-shakudo/preview.png
date: 2025-05-05T00:02:00Z
author: Qdrant
featured: false
tags:
  - Qdrant
  - design
---
# Exploring Qdrant Cloud just got easier

EMBED VIDEO HERE

We always aim to simplify our product for developers, platform teams, and enterprises. Here’s a quick overview of recent improvements designed to simplify your journey from login, creating your first cluster, prototyping, and going to production.

## Simplified Login

We've reduced the steps to create and access your account, and also simplified navigation between login and registration.

![log-in-page.jpg](/blog/case-study-sprinklr/log-in-page.jpg)

Upon log in, of course you continue to have the option to toggle between dark and light mode, or choose your system default. 

GIF OF DARK MODE

Now for the biggest improvements. 

## Effortless Cluster Creation 

When you log in for your first time, it’s incredibly easy to create your first cluster (completely free, no need to share any payment details). 

Simply name your first cluster, choose your region, and click “Create.” Your cluster will start spinning up immediately\!

The 1 GB free gives you enough storage for approximately 1 million vectors at 768 dimensions and is great for prototyping and learning.

GIF OF CLUSTER CREATION

Don’t forget to create a collection, add vectors, then run your first search.

## Get Started Overview 

Next we’ve done a major overhaul to the “Get Started” page. Our goal is to make it as easy as possible for you to find the resources you need, whether it's guides, sample data, or tutorials.   
    
IMAGE OF GET STARTED PAGE

**Explore Your Data or Start with Samples**  
You’ll see immediately pertinent information to help you get the most out of Qdrant quickly, including the [Cloud Quickstart guide](https://qdrant.tech/documentation/quickstart-cloud/), and resources to help you get your data into Qdrant, or use sample data. 

Learn about the different ways to connect to your cluster, use the Qdrant API, try out sample data, and our personal favorite, use the Qdrant Cluster UI to view your collection data and access tutorials. 

**Build World Class Applications**  
If you are ready to build an app, but looking for ideas or the best place to start, we have our top three tutorials highlighted for you. 

Learn how to:

* [Build a hybrid search service](https://qdrant.tech/documentation/beginner-tutorials/hybrid-search-fastembed/) with [FastEmbed](https://github.com/qdrant/fastembed)   
* [Build a RAG app with DeepSeek](https://qdrant.tech/documentation/rag-deepseek/) for semantic query enrichment  
* [Connect Qdrant with your data stack](https://qdrant.tech/documentation/data-management/) for seamless workflows

**Pick a Deployment Model**

If you are looking for freedom of choice, [enterprise-readiness](https://qdrant.tech/blog/enterprise-vector-search/), and scalability without [vendor lock-in](https://qdrant.tech/blog/are-you-vendor-locked/), look no further. Here you can learn about the different deployment options we offer. 

Whether you want a fully managed experience, complete infrastructure control, or something in between, Qdrant delivers:

* Qdrant Cloud gives you a ready-to-use scalable vector database, no ops needed.  
* Bring your own cluster with Hybrid Cloud to run in your infra with full autonomy and flexibility.  
* If sovereignty and control are non-negotiable, Private Cloud is built for air-gapped, high-security environments.

**Support, Community, and Docs**

We have robust documentation, as well as a global [community](https://discord.com/invite/qdrant) of users that share projects, advice, and help each other build. If you run into technical issues, our support team is happy to help troubleshoot. Here you can find what you need if you run into roadblocks when building. 

## Cluster Overview 

Now this is probably where you will spend most of your time when building with Qdrant. 

When looking at the overview of your cluster, we’ve added new tabs with an improved menu structure. 

* **Overview**: This has everything you need at a glance, including a visual of your node, disk, RAM, CPU usage so you can see if you are approaching any limits.   
* It’s also easier now to scale your cluster. Once scaled to a paid tier via credit card or marketplace, you can access backup and disaster recovery, a 99.5% uptime SLA, horizontal and vertical scaling, monitoring and log management, and more.   
* **API** **keys**: Manage access to your database cluster  
* **Metrics**: a visualization of your resources, RAM, CPU, disk and requests over different timeframes   
* **Logs**: get a real-time window into what’s happening inside cluste for transparency, diagnostics, and control (especially important during debugging, performance tuning, or infrastructure troubleshooting\!)  
* **Backups:** View snapshots of your vector data and metadata that can be used to restore your collections in case of data loss, migration, or rollbacks (not available on free clusters)   
* **Configuration**: Check your collection defaults and add advanced optimizations (after reading Docs of course)   
  * For example, we advise against setting up a ton of different collections. Instead segment with [payloads](https://qdrant.tech/documentation/concepts/payload/).

When viewing the details of your clusters, you can now view the Cluster UI Dashboard regardless of where you are, and also have easier access to tutorials and resources. 

We also are making it more seamless to update your cluster to the latest version as well as see GitHub release notes.   
   
IMAGE OF CLUSTER OVERVIEW

## See for yourself

If you haven’t tried Qdrant Cloud yet, now is the time to get started\!

[**Go try out your 1GB free cluster and poke around\!**](https://cloud.qdrant.io/signup%20)   

Want to share feedback? 

\<a href="[mailto:community@qdrant.com](mailto:community@qdrant.com)"\>Email us.\</a\>

## Migrating your data just got easier 

Also, on April 30th, we launched the beta release of a database migration tool, significantly simplifying data migration processes.

IMAGE OF GITHUB

You can take data from any Qdrant instance to another. Examples include from open source to another running in Qdrant Cloud as well as migrating from one cloud region to another. All with one command\!

Unlike Qdrant’s included [snapshot migration method](https://qdrant.tech/documentation/concepts/snapshots/), which requires consistent node-specific snapshots, our migration tool enables you to easily migrate data between different Qdrant database clusters in streaming batches. 

This is especially useful if you want to change the collection configuration on the target, for example by choosing a different replication factor or quantization method.

Learn more and start migrating easily: [Qdrant Migration Tool](https://github.com/qdrant/migration)