---
title: "Welcome to Qdrant 1.8.0!"
draft: false
slug: qdrant-1.8.x 
short_description: "Look at what's new in Qdrant 1.8.0!"
description: "Improved cloud deployments, integrations with Apache Airflow, AWS Bedrock,Nomic, Unstructured, N8N and more!
preview_image: /blog/qdrant-1.8.x/Article-Image.png # Change this

title_preview_image: /blog/qdrant-1.8.x/Article-Image.png # Optional image used for blog post title
small_preview_image: /blog/qdrant-1.8.x/Article-Image.png # Optional image used for small preview in the list of blog posts

date: 2024-02-22T11:12:00-08:00
author: Mike Jang
featured: false 
tags:
  - vector search
  - new features
  - azure
  - cloud
  - multitenancy
  - custom sharding
  - GCP
  - n8n
  - unstructured
  - bedrock
  - nomic
  - Apache airflow
  - Spring AI
  - OpenLLMetry
weight: 0 # Change this weight to change order of posts
---

Today, we are excited to announce the release of [Qdrant 1.8.0](https://github.com/qdrant/qdrant/releases/tag/v1.8.0).
We've expanded how you can deploy Qdrant in the cloud. We've added support for
Azure, as well as better features for backups.

We've also added frameworks and embeddings that can help you integrate Qdrant
with a variety of AI systems.

<!-- more detail -->

## New features

We're more than excited to see what you will build with it! But there's more! Check out what's new in **Qdrant 1.8.0**!

1. Additional support in the cloud
   - Azure support
   - Custom cloud configurations
   - Automated backups and snapshots
1. More integrated frameworks. You can integrate Qdrant with frameworks from:
   - [n8n](https://n8n.io/)
   - [Unstructured](https://unstructured.io/)
   - [Apache Airflow](https://airflow.apache.org/)
   - [OpenLLMetry from Traceloop](https://www.traceloop.com/)
   - [Apache Airflow](https://airflow.apache.org/)
1. More embeddings. You can integrate Qdrant with embeddings from:
   - [AWS Bedrock](https://aws.amazon.com/bedrock/)
   - [Nomic](https://docs.nomic.ai/)

Did we miss something? We rely on your feedback to drive our development. We
welcome your contributions, especially in our [Discord community](https://qdrant.to/discord). Join us, introduce yourself, and help us build the best vector search engine!

### Additional support in the cloud

Qdrant now includes support for Microsoft Azure, as well as automatic backups. You
can also set up connections from GCP and AWS, as described in our documentation for:

- [AWS marketplace](/documentation/cloud/aws-marketplace)
- [GCP marketplace](/documentation/cloud/gcp-marketplace)

#### Microsoft Azure

Qdrant now supports the use of Microsoft Azure. You can now set up your environment on
Azure, which reduces deployment time. 

So for all of our supported cloud providers (AWS, GCP, and Azure), you can now
"hit the groud running," which supports:

- Rapid application development: Deploy your own cluster through the Qdrant Cloud
  Console within seconds and scale your resources as needed.
- Billion vector scale: Seamlessly grow and handle large-scale datasets with
  billions of vectors. Leverage Qdrant features like horizontal scaling and
  binary quantization with Microsoft Azure’s scalable infrastructure.

Get started by [signing up for a Qdrant Cloud account](https://cloud.qdrant.io).i
And learn more about Qdrant Cloud in our [docs](/documentation/cloud/).

#### Automatic backups

You can set up automatic backups of your clusters with our Cloud UI. With the
procedures listed in our [Automatic backups](/documentation/cloud/backups), 
you can set up snapshots on a daily/weekly/monthly basis. You can keep as many
snapshots as you need, and restore a cluster from the snapshot of your choice.

<!-- Not sure if this is important enough
### Order points by a payload key

When using the [`scroll`](/documentation/concepts/points/#scroll-points) API, you can
sort the results by a payload key. For example, you can retrieve points in chronological
order if your payloads have a `"timestamp"` field.
-->
### Integrations

We now integrate with more [Embeddings](/documentation/embeddings) and 
[Frameworks](/documentation/frameworks). Since our release of v1.7, we now integrate
with:

#### Spring AI

[Spring AI](https://docs.spring.io/spring-ai/reference/) is a Java framework
that provides a [Spring-friendly](https://spring.io/) API and abstractions for
developing AI applications.

You can use Qdrant as a supported vector database for use within your Spring AI
projects.

For more information, see our [Spring AI integration docs](/documentation/frameworks/spring-ai/).

#### OpenLLMetry (Traceloop)

OpenLLMetry from [Traceloop](https://www.traceloop.com/) is a set of extensions
built on top of [OpenTelemetry](https://opentelemetry.io/) that gives you
complete observability over your LLM application.

OpenLLMetry supports instrumenting the `qdrant_client` Python library and
exporting the traces to various observability platforms, as described in their
[Integrations catalog](https://www.traceloop.com/docs/openllmetry/integrations/introduction#the-integrations-catalog).

For more information, see our [OpenLLMetry integration docs](/documentation/frameworks/openllemtry/).

#### Apache Airflow

Apache Airflow is an open-source platform for authoring, scheduling and monitoring
data and computing workflows. Airflow uses Python to create workflows that can
be easily scheduled and monitored.

You can use Qdrant as an Airflow provider in Airflow to interface with the database.

For more information, see our [Apache Airflow integration docs](/documentation/frameworks/airflow/).

#### n8n

N8N is an automation platform that allows you to build flexible workflows focused
on deep data integration.

You can use Qdrant available as a vectorstore node in N8N for building AI-powered
functionality within your workflows.

To set up this integration, review our [N8N documentation](/documentation/framewokrs/n8n/).

#### Unstructured

You can use the [Unstructured library](https://unstructured.io) to help preprocess,
and structure unstructured text documents for downstream machine learning tasks.

You can set up Qdrant as an ingestion destination in Unstructured.

To set up this integration, review our [Unstructured documentation](/documentation/framewokrs/unstructured/).

#### AWS Bedrock

You can use AWS Bedrock with Qdrant. AWS Bedrock supports multiple embedding
model providers.

To set up this integration, review our [Bedrock embeddings documentation](/documentation/embeddings/bedrock/).

#### Nomic

You can set up Qdrant with Nomic Text Embeddings. Once installed, you can
configure it with the official Python client or through direct HTTP requests.

To set up this integration, review our [Nomic  embeddings documentation](/documentation/embeddings/nomic/).
