---
title: " Data Privacy with Qdrant: Implementing Role-Based Access Control (RBAC)" #required
short_description: "Secure Your Data with Qdrant: Implementing RBAC"
description: Discover how Qdrant's Role-Based Access Control (RBAC) ensures data privacy and compliance for your AI applications. Build secure and scalable systems with ease. Read more now!
social_preview_image: /articles_data/data-privacy/preview/social_preview.jpg # This image will be used in social media previews, should be 1200x630px. Required.
small_preview_image: /articles_data/discovery-search/icon.svg # This image will be used in the list of articles at the footer, should be 40x40px
preview_dir: /articles_data/data-privacy/preview # This directory contains images that will be used in the article preview. They can be generated from one image. Read more below. Required.
weight: -110 # This is the order of the article in the list of articles at the footer. The lower the number, the higher the article will be in the list.
author: Qdrant Team # Author of the article. Required.
author_link: https://qdrant.tech// # Link to the author's page. Required.
date: 2024-06-16T08:00:00-03:00 # Date of the article. Required.
draft: false # If true, the article will not be published
keywords: # Keywords for SEO
  - Role-Based Access Control (RBAC)
  - Data Privacy in Vector Databases
  - Secure AI Data Management
  - Qdrant Data Security
  - Enterprise Data Compliance
---

For enterprise AI applications, transforming unstructured data into high-dimensional vector representations and storing them in vector databases unlocks powerful capabilities. By capturing the relationships within unstructured data and enabling similarity searches through vector space, vectors help us build applications that traditional databases struggle with.

Today, a vast array of advanced AI applications leverages vector databases, including retrieval-augmented generation (RAG) applications, AI assistants, chatbots, recommendation systems, reverse image searches, and anomaly detection systems.

By nature, data stored in vector databases are often proprietary to the enterprise and may include sensitive information like customer records, legal contracts, electronic health records (EHR), financial data, and intellectual property. For this reason, robust security measures become critical to safeguarding the confidentiality and integrity of this valuable data.

If the data stored in a vector database is not secured, it creates a vulnerability known as "[embedding inversion attack](https://arxiv.org/abs/2004.00053)," where malicious actors could potentially [reconstruct the original data from the embeddings](https://arxiv.org/pdf/2305.03010) themselves.

Also, strict compliance regulations govern data stored in vector databases across various industries like healthcare and finance. For example, in healthcare, compliance with HIPAA (Health Insurance Portability and Accountability Act) is mandatory. This regulation dictates how protected health information (PHI) must be stored, transmitted, and secured.

Similarly, the financial services industry has regulations like PCI DSS (Payment Card Industry Data Security Standard) which safeguard sensitive financial data. These regulations necessitate that developers have the ability to choose how data is stored or transmitted in a way that complies with the specific legal framework of their industry in various geographies.

Therefore, for developers building enterprise-grade AI applications, features that enable data privacy, data security and data sovereignty often become deciding factors when choosing the right vector database.

This article explores various strategies to ensure the security of your critical data while leveraging the benefits of vector search. Implementing some of these security approaches can help you build privacy-enhanced similarity search algorithms and integrate them into your AI applications. Additionally, we'll explain how to build a fully data-sovereign architecture, allowing you to retain control over your data and comply with relevant data laws and regulations.

## Vector Database Security: An Overview

Typical vector databases are often unsecured by default, and prioritize rapid development for prototyping and experimentation in development environments. This allows developers to quickly ingest data, build vector representations, and experiment with similarity search algorithms minus initial security concerns. However, unsecured vector databases present significant risk of data breaches in production environments.

In production environments, where data security is a priority, vector databases require a more robust security system than the default unsecured settings. Here, authentication becomes critical to control access and prevent unauthorized modifications. A common approach leverages static API keys for client authentication.

However, simple API authentication isn’t enough when it comes to enterprise data. Real-world production deployments often demand far more granular control.

The primary challenge with static API keys is that they grant all-or-nothing access. In enterprise applications,where you need to segregate access to data by roles, this is not enough. Also, of course, static API keys come with a major caveat: a compromised key could grant an attacker full access to manipulate or steal your data.

In enterprise applications, in order to strengthen the security of the vector database, developers typically need the following:

1. **Encryption**: This ensures that sensitive data is scrambled as it travels between the application and the vector database. This safeguards against Man-in-the-Middle ([MitM](https://en.wikipedia.org/wiki/Man-in-the-middle_attack)) attacks, where malicious actors can attempt to intercept and steal data during transmission.
2. **Role-Based Access Control**: As mentioned before, traditional static API keys grant all-or-nothing access, which is a significant security risk in enterprise environments. RBAC offers a more granular approach by defining user roles and assigning specific data access permissions based on those roles. For example, an analyst might have read-only access to specific datasets, while an administrator might have full CRUD (Create, Read, Update, Delete) permissions across the database.
3. **Deployment Flexibility**: Data residency regulations like GDPR (General Data Protection Regulation) and industry-specific compliance requirements dictate where data can be stored, processed, and accessed. Developers would need to choose a database solution which offers deployment options that comply with these regulations. This might include on-premise deployments within a company's private cloud or geographically distributed cloud deployments that adhere to data residency laws.

By employing a combination of these security features, developers can achieve comprehensive data protection and ensure compliance with relevant data regulations.

Therefore, the vector database that developers choose should offer a range of security features, deployment options, and privacy controls that help them launch the application in a secure and compliant manner.

## How Qdrant Handles Data Privacy and Security

One of the cornerstones of our design choices at Qdrant has been the focus on security features. We have built in a range of features keeping the enterprise user in mind, which allow building of granular access control on a fully data sovereign architecture.

A Qdrant instance is unsecured by default. However, when you are ready to deploy in production, Qdrant offers a range of security features that allow you to control access to your data, protect it from breaches, and adhere to regulatory requirements. Using Qdrant, you can build granular access control, segregate roles and privileges, and create a fully data sovereign architecture.

Let’s look at how.

### **API Keys and TLS Encryption**

For simpler use cases, Qdrant offers API key-based authentication. This includes both regular API keys and read-only API keys. Regular API keys grant full access to read, write, and delete operations, while read-only keys restrict access to data retrieval operations only, preventing write actions.

On Qdrant Cloud, you can create API keys using the [Cloud Dashboard](https://qdrant.to/cloud). This allows you to generate API keys that give you access to a single node or cluster, or multiple clusters. You can read the steps to do so [here](documentation/cloud/authentication/).

For on-premise or local deployments, you'll need to configure API key authentication. This involves specifying a key in either the Qdrant configuration file or as an environment variable. This ensures that all requests to the server must include a valid API key sent in the header.

When using the simple API key-based authentication, you should also turn on TLS encryption. Otherwise, you are exposing the connection to sniffing and MitM attacks. To secure your connection using TLS, you would need to create a certificate and private key, and then [enable TLS](documentation/guides/security/#tls) in the configuration.

API authentication, coupled with TLS encryption, offers a first layer of security for your Qdrant instance. However, to enable more granular access control, the recommended approach is to leverage JSON Web Tokens (JWTs).

### **JWT on Qdrant**

JSON Web Tokens (JWTs) are a compact, URL-safe, and stateless means of representing _claims_ to be transferred between two parties. These claims are encoded as a JSON object and are cryptographically signed.

JWT is composed of three parts: a header, a payload, and a signature, which are concatenated with dots (.) to form a single string. The header contains the type of token and algorithm being used. The payload contains the claims (explained in detail later). The signature is a cryptographic hash and ensures the token’s integrity.

In Qdrant, JWT forms the foundation through which powerful access controls can be built. Let’s understand how.

JWT is enabled on the Qdrant instance by specifying the API key and turning on the **jwt_rbac** feature in the configuration (alternatively, they can be set as environment variables). For any subsequent request, the API key is used to encode or decode the token.

The way JWT works is that just the API key is enough to generate the token, and doesn’t require any communication with the Qdrant instance or server. There are several libraries that help generate tokens by encoding a payload, such as [PyJWT](https://pyjwt.readthedocs.io/en/stable/) (for Python), [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) (for JavaScript), and [jsonwebtoken](https://crates.io/crates/jsonwebtoken) (for Rust). Qdrant uses the HS256 algorithm to encode or decode the tokens.

We will look at the payload structure shortly, but here’s how you can generate a token using PyJWT.

```python
import jwt
import datetime

# Define your API key and other payload data
api_key = 'your_api_key'
payload = { ...
}

token = jwt.encode(payload, api_key, algorithm='HS256')
print(token)



```

Once you have generated the token, you should include it in the subsequent requests. You can do so by providing it as a bearer token in the Authorization header, or in the API Key header of your requests.

Below is an example of how to do so using QdrantClient in Python:

```python
from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    "http://localhost:6333",
    api_key="<JWT>", # the token goes here
)
# Example search vector
search_vector = [0.1, 0.2, 0.3, 0.4]

# Example similarity search request
response = qdrant_client.search(
    collection_name="demo_collection",
    query_vector=search_vector,
    limit=5  # Number of results to retrieve
)
```

For convenience, we have added a JWT generation tool in the Qdrant Web UI, which is present under the 🔑 tab. For your local deployments, you will find it at [http://localhost:6333/dashboard#/jwt](http://localhost:6333/dashboard#/jwt).

### **Payload Configuration**

There are several different options (claims) you can use in the JWT payload that help control access and functionality. Let’s look at them one by one.

**exp**: This claim is the expiration time of the token, and is a unix timestamp in seconds. After the expiration time, the token will be invalid.

**value_exists**: This claim validates the token against a specific key-value stored in a collection. By using this claim, you can revoke access by simply changing a value without having to invalidate the API key.

**access**: This claim defines the access level of the token. The access level can be global read (r) or manage (m). It can also be specific to a collection, or even a subset of a collection, using read (r) and read-write (rw).

Let’s look at a few example JWT payload configurations.

**Scenario 1: 1-hour expiry time, and read-only access to a collection**
```json
{
  "exp": 1690995200,  // Set to 1 hour from the current time (Unix timestamp)
  "access": [
    {
      "collection": "demo_collection",
      "access": "r"  // Read-only access
    }
  ]
}

```

**Scenario 2: 1-hour expiry time, and access to user with a specific role**

Suppose you have a ‘users’ collection and have defined specific roles for each user, such as ‘developer’, ‘manager’, ‘admin’, ‘analyst’, and ‘revoked’. In such a scenario, you can use a combination of **exp** and **value_exists**.
```json
{
  "exp":  1690995200, 
  "value_exists": {
    "collection": "users",
    "matches": [
      { "key": "username", "value": "john" },
      { "key": "role", "value": "developer" }
    ],
  },
}

```



Now, if you ever want to revoke access for a user, simply change the value of their role. All future requests will be invalid using a token payload of the above type.

**Scenario 3: 1-hour expiry time, and read-write access to a subset of a collection**

You can even specify access levels specific to subsets of a collection. This can be especially useful when you are leveraging [multitenancy](documentation/guides/multiple-partitions/), and want to segregate access.
```json
{
  "exp": 1690995200,
  "access": [
    {
      "collection": "demo_collection",
      "access": "r",
      "payload": {
        "user_id": "user_123456"
      }
    }
  ]
}
```


By combining the claims, you can fully customize the access level that a user or a role has within the vector store.

### **Creating Role-Based Access Control (RBAC) Using JWT**

As we saw above, JWT claims create powerful levers through which you can create granular access control on Qdrant. Let’s bring it all together and understand how it helps you create Role-Based Access Control (RBAC).

In a typical enterprise application, you will have a segregation of users based on their roles and permissions. These could be:

1. Admin or Owner: with full access, and can generate API keys.
2. Editor: with read-write access levels to specific collections.
3. Viewer: with read-only access to specific collections.
4. Data Scientist or Analyst: with read-only access to specific collections.
5. Developer: with read-write access to development- or testing-specific collections, but limited access to production data.
6. Guest: with limited read-only access to publicly available collections.

In addition, you can create access levels within sections of a collection. In a multi-tenant application, where you have used payload-based partitioning, you can create read-only access for specific user roles for a subset of the collection that belongs to that user.

Your application requirements will eventually help you decide the roles and access levels you should create. For example, in an application managing customer data, you could create additional roles such as:

**Customer Support Representative**: read-write access to customer service-related data but no access to billing information.

**Billing Department**: read-only access to billing data and read-write access to payment records.

**Marketing Analyst**: read-only access to anonymized customer data for analytics.

Each role can be assigned a JWT with claims that specify expiration times, read/write permissions for collections, and validating conditions.

In such an application, an example JWT payload for a customer support representative role could be:

```json
{
  "exp": 1690995200,
  "access": [
    {
      "collection": "customer_data",
      "access": "rw",
      "payload": {
        "department": "support"
      }
    }
  ],
  "value_exists": {
    "collection": "departments",
    "matches": [
      { "key": "department", "value": "support" }
    ]
  }
}
```


As you can see, by implementing RBAC, you can ensure proper segregation of roles and their privileges, and avoid privacy loopholes in your application.

## **Qdrant Hybrid Cloud and Data Sovereignty**

In many enterprise applications, data is subject to the laws and governance structures of the country in which it is collected or stored. This is particularly important for organizations that operate globally, as different countries have varying regulations concerning data privacy, security, and access. This often involves deploying infrastructure within specific geographical boundaries to control where and how data is processed and stored.

This means that along with data security features, the vector database you choose should offer you the ability to deploy and scale in an infrastructure that you control. Qdrant Hybrid Cloud allows you to do this, while leveraging all its features, including sharding, replicas, JWT authentication, and monitoring.

Essentially, Qdrant Hybrid Cloud integrates Kubernetes clusters from various environments—cloud, on-premises, or edge—into a unified managed service. This setup allows organizations to manage Qdrant databases using the Qdrant Cloud UI while the databases remain within the organization's infrastructure.

When combined with JWT and RBAC, Qdrant Hybrid Cloud offers enterprise users the ability to build a fully secure, private, and sovereign vector store. This capability allows enterprises to scale their AI applications geographically, while adhering to local laws and regulations and maintaining strict control over their data.

## Conclusion

Vector similarity is increasingly becoming the backbone of AI applications that leverage unstructured data. By transforming data into vectors – their numerical representations – organizations can build powerful applications that harness semantic search, ranging from better recommendation systems to algorithms that help with personalization, or powerful customer support chatbots.

However, to fully leverage the power of AI in production, organizations need to choose a vector database that offers strong privacy and security features, while also helping them adhere to local laws and regulations.

Qdrant provides exceptional efficiency and performance, along with the capability to implement granular access control to data, Role-Based Access Control (RBAC), and the ability to build a fully data-sovereign architecture.

Interested in mastering vector search security and deployment strategies? [Join our Discord community](https://discord.gg/qdrant) to explore more advanced search strategies, connect with other developers and researchers in the industry, and stay updated on the latest innovations!
