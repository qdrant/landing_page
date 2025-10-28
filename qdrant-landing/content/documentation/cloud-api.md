---
title: Qdrant Cloud API
weight: 27
partition: cloud
aliases:
  - /documentation/qdrant-cloud-api/
---
# Qdrant Cloud API: Powerful gRPC and Flexible REST/JSON Interfaces

**Note:** This is not the Qdrant REST or gPRC API of the database itself. For database APIs & SDKs, see our list of [interfaces](/documentation/interfaces/)

## Introduction

The Qdrant Cloud API lets you automate the Qdrant Cloud platform. You can use this API to manage your accounts, clusters, backup schedules, authentication methods, hybrid cloud environments, and more.

To cater to diverse integration needs, the Qdrant Cloud API offers two primary interaction models:

* **gRPC API**: For high-performance, low-latency, and type-safe communication. This is the recommended way for backend services and applications requiring maximum efficiency. The API is defined using Protocol Buffers.
* **REST/JSON API**: A conventional HTTP/1.1 (and HTTP/2) interface with JSON payloads. This API is provided via a gRPC Gateway, translating RESTful calls into gRPC messages, offering ease of use for web clients, scripts, and broader tool compatibility.

You can find the API definitions and generated client libraries in our Qdrant Cloud Public API [GitHub repository](https://github.com/qdrant/qdrant-cloud-public-api).
**Note:** The API is splitted into multiple services to make it easier to use.

### Qdrant Cloud API Endpoints

* **gRPC Endpoint**: grpc.cloud.qdrant.io:443
* **REST/JSON Endpoint**: https://api.cloud.qdrant.io

### Authentication

Most of the Qdrant Cloud API requests must be authenticated. Authentication is handled via API keys (so called management keys), which should be passed in the Authorization header.
**Management Keys**: `Authorization: apikey <YOUR_MANAGEMENT_KEY>`

Replace <YOUR_MANAGEMENT_KEY> with the actual API key obtained from your Qdrant Cloud dashboard or generated programmatically.

You can create a management key in the Cloud Console UI. Go to **Access Management** > **Cloud Management Keys**.
![Authentication](/documentation/cloud/authentication.png)

**Note:** Ensure that the API key is kept secure and not exposed in public repositories or logs.  Once authenticated, the API allows you to manage clusters, backup schedules, and perform other operations available to your account.

### Samples

For samples on how to use the API, with a tool like grpcurl, curl or any of the provided SDKs, please see the [Qdrant Cloud Public API](https://github.com/qdrant/qdrant-cloud-public-api) repository.

## Terraform Provider

Qdrant Cloud also provides a Terraform provider to manage your Qdrant Cloud resources. [Learn more](/documentation/infrastructure/terraform/).
