---
title: Authentication
short_description: "Create Qdrant Cloud Database API keys with per-collection permissions, set expirations, rotate and revoke them, and tell them apart from Cloud Management Keys."
description: "Create, scope, rotate, and revoke Qdrant Cloud Database API keys, authenticate with the api-key or Bearer header, and tell Database keys, Cloud Management Keys, and Console roles apart."
weight: 10
---

# Database Authentication in Qdrant Managed Cloud

Qdrant Cloud uses three kinds of credentials. Each one protects a different surface:

| Credential | Protects | Created in | Sent as |
|---|---|---|---|
| Database API key | A cluster's REST and gRPC APIs, plus its `/metrics` and `/sys_metrics` endpoints | **API Keys** on the Cluster Detail page | The `api-key` header, or `Authorization: Bearer <key>` |
| Cloud Management Key | The [Cloud API](/documentation/cloud-api/), the [`qcloud` CLI](/documentation/cloud-cli/), and [Terraform](/documentation/cloud-tools/terraform/) | **Access Management** > **Cloud Management Keys** | `Authorization: apikey <key>` |
| Console sign-in | The Cloud Console | Email, Google, GitHub, or [SSO](/documentation/cloud-account-setup/#enterprise-single-sign-on-sso) | A session. What a user can do is set by [Cloud RBAC](/documentation/cloud-rbac/) |

These credentials are independent: a key from one does not grant access to the others. SSO covers Console sign-in only.

This page covers Database API keys. Creating one needs the `write:api_keys` permission, and revoking one needs `delete:api_keys`. See the [permission reference](/documentation/cloud-rbac/permission-reference/#api-keys).

## Create Database API Keys

<aside role="alert">
    The API key is only shown once after creation. If you lose it, you will need to create a new one. 
</aside>

![API Key](/documentation/cloud/create-api-key.png)

1. Go to the [Cloud Dashboard](https://qdrant.to/cloud).
2. Go to the **API Keys** section of the **Cluster Detail Page**.
3. Click **Create**.
4. Choose a name and an optional expiration (in days, the default is 90 days) for your API key. An empty expiration will result in no expiration.
5. By default, tokens are given cluster-wide permissions, with a choice between manage/write permissions (default) or read-only.<br/><br/>To restrict a token to a subset of collections, you can select the Collections tab and choose from the collections available in your cluster.
6. Click **Create** and retrieve your API key.

![API Key](/documentation/cloud/api-key.png)

Database API keys with granular access control start with `eyJhb` and require cluster version **v1.11.0** or later. See the [Table of Access](/documentation/security/#table-of-access) for the actions each permission level allows.

A new key can take a few seconds to become active. If the first request returns `403`, retry. Once a key passes its expiration, requests with it also return `403`.

<iframe width="560" height="315" src="https://www.youtube.com/embed/3c-8tcBIVdQ?si=OoyobgPTU-DHIhee" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Authenticate With a Key

Include the key in every request, over REST or gRPC. Use the `api-key` header or the client's API key parameter:

{{< code-snippet path="/documentation/headless/snippets/authentication/api-key/" >}}

Alternatively, send the key as a Bearer token in the `Authorization` header:

{{< code-snippet path="/documentation/headless/snippets/authentication/bearer/" >}}

A successful request to the cluster root returns the server title, version, and commit:

```json
{"title":"qdrant - vector search engine","version":"<version>","commit":"<commit-hash>"}
```

For the endpoint format, ports, and node-specific endpoints, see [Connect to a Cluster](/documentation/cloud/cluster-access/). If a request fails with `401` or `403`, see [Troubleshooting](/documentation/common-errors/#unauthorized-and-forbidden-http-401-and-403).

## Rotate and Revoke Keys

Set an expiration on every key, and replace keys before they expire:

1. Create a new key with the same permissions.
2. Deploy the new key to your application.
3. Revoke the old key.

Use one key per application or environment, so that revoking one key interrupts only the application that uses it. Give each key the narrowest permission it needs: read-only for query-only services, and collection-restricted keys for tenants or teams.

### When a User Leaves

<aside role="alert">
    A Database API key or Cloud Management Key is <strong>not</strong> deleted or revoked when the user who created it is removed or deleted from the account. The key keeps working with whatever permissions it was granted.
</aside>

Before or when you [remove a user from an account](/documentation/cloud-rbac/user-management/#removing-a-user-from-an-account):

1. Revoke every Database API key that the user created, in the **API Keys** section of each cluster.
2. Revoke every Cloud Management Key that the user created, in **Access Management** > **Cloud Management Keys**.
3. Replace the revoked keys in the applications that used them.
4. Remove the user.

## Admin Database API Keys

The previous iteration of Database API keys, called Admin Database API keys, do not have granular access control. Clusters created before January 27, 2025 will still see the option to create Admin Database API keys. Older Admin Database API keys will continue to work, but we do recommend switching to Database API keys with granular access control to take advantage of better security controls.

<aside role="alert">
    Enabling Database API keys with granular access control will trigger a restart of your cluster.
</aside>

To enable Database API keys with granular access control, click **Enable** on the **API Keys** section of the Cluster detail page.

After enabling Database API keys with granular access control for a cluster, existing Admin Database API keys will continue to work, but you will not be able to create new Admin Database API Keys.
