---
title: Manage Spaces
short_description: "Create a Qdrant Serverless space, choose its name, region, and collection size cap, and rename or delete it later."
description: "Create a Qdrant Serverless space in the Qdrant Cloud console, choose a name, region, and collection size cap, and change or delete the space afterward."
weight: 10
---

# Manage Spaces

A space is a container for collections. You can create several spaces to keep applications, use cases, or deployment environments separate. This page covers creating a space and changing it afterward. For more about spaces, see [About Qdrant Serverless](/documentation/serverless/#spaces).

## Create a Space

You create spaces in the Qdrant Cloud console. A space needs only a name and a region. Everything else on the form is optional, and you can change it later.

1. Select **Serverless Spaces** in the sidebar, then select **Create Space**.
2. Enter a **Name**, or keep the auto-generated one.
3. Choose a **Region**.
4. Optionally set a **Collection size cap**.
5. Select **Create Space**.
6. Copy the **API Key** that was created for you.
7. Close the popup. On the **Overview** tab, copy the **endpoint URL**.

Store both somewhere safe. You need them to connect, and the key is a credential like any other.

After a few moments, the space becomes `READY` once it's provisioned. The space list shows the status of each space and lets you filter by it.

### Name

A space name is unique within your account and uses 4 to 64 characters: letters, numbers, hyphens, and underscores. The form suggests a generated name, which you can replace with your own.

You can rename a space later. Renaming doesn't change its endpoint or invalidate its API keys.

### Region

Choose the region closest to the application that queries the space. The region is fixed once the space exists. Moving to another region means creating a new space and uploading your data again.

### Collection Size Cap

The collection size cap sets the maximum size, in GiB, that each collection in the space can reach. It defaults to 2 GiB. Once a collection reaches the cap, further writes are rejected, while searches keep working. You can change the cap after the space has been created. See [Quotas and Limits](/documentation/serverless/quotas-and-limits/).

## After the Space Is Ready

The endpoint uses HTTPS on the standard port 443, so you don't need to specify a port. To add more keys, scope them to individual collections, or give them an expiry, see [Secure a Space](/documentation/serverless/security/).

To connect a client and create your first collection, see [Connect to a Space](/documentation/serverless/connect/).

## Change a Space

Open the space and use its actions menu to change the name or the collection size cap. The region and the endpoint are fixed for the life of the space.

## Delete a Space

Deleting a space removes the space and every collection in it. You choose whether to keep or delete the space's backups: keep them if you might restore the data into a new space later.

Deletion runs in the background. The space stays in the list with a `DELETING` status until it's fully removed.
