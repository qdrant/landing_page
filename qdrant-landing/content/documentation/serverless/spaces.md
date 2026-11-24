---
title: Manage Spaces
short_description: "Create a Qdrant Serverless space, set storage and spend limits, and rename or delete it later."
description: "Create a Qdrant Serverless space in the Qdrant Cloud console, choose a name and region, set storage and monthly spend limits, and change or delete the space afterward."
weight: 10
---

# Manage Spaces

A space is a container for collections. You can create several spaces to keep applications, use cases, or deployment environments separate. This page covers creating a space and changing it afterward. For more about spaces, see [About Qdrant Serverless](/documentation/serverless/#spaces).

## Create a Space

You create spaces in the Qdrant Cloud console. A space needs only a name and a region. You can set storage and spend limits after you create it.

1. Select **Serverless Spaces** in the sidebar, then select **Create Space**.
2. Enter a **Name**, or keep the auto-generated one.
3. Choose a **Region**.
4. Select **Create Space**.
5. Copy the **API Key** that was created for you.
6. Close the popup. On the **Overview** tab, copy the **endpoint URL**.

Store both somewhere safe. You need them to connect, and the key is a credential like any other.

After a few moments, the space becomes `READY` once it's provisioned. The space list shows the status of each space and lets you filter by it.

### Name

A space name is unique within your account and uses 4 to 64 characters: letters, numbers, hyphens, and underscores. The form suggests a generated name, which you can replace with your own.

You can rename a space later. Renaming doesn't change its endpoint or invalidate its API keys.

### Region

Choose the region closest to the application that queries the space. The region is fixed once the space exists. Moving to another region means creating a new space and uploading your data again.

## After the Space Is Ready

The endpoint uses HTTPS on the standard port 443, so you don't need to specify a port. To add more keys, scope them to individual collections, or give them an expiry, see [Secure a Space](/documentation/serverless/security/).

To connect a client and create your first collection, see [Connect to a Space](/documentation/serverless/connect/).

## Cost Control and Quotas

To avoid unexpected bills, you can limit how much a space stores and spends. Open the space, go to the **Configuration** tab, and find the **Cost Control and Quotas** section. For each limit, choose **Unlimited** or **Set a Limit**, then select **Save**.

When usage reaches a limit's alert threshold, 80% of the limit by default, or the limit itself, an alert appears on the space's **Alerts** tab.

### Max Storage per Space

This limit caps the storage of all collections in the space together. It's unlimited by default. When storage reaches the limit, the space does one of the following:

- With **Block Writes**, the space rejects writes. Searches and deletes keep working, so you can free up space.
- With **Alert Only**, you get an alert and nothing is blocked.

### Max Monthly Spend for Searches and Writes

This limit caps what searches and writes cost in a calendar month, in UTC. Storage doesn't count toward it. It's unlimited by default. When spend reaches the limit, the space does one of the following:

- With **Block Reads and Writes**, the space rejects all reads and writes, deletes included, until the next month starts.
- With **Alert Only**, you get an alert and nothing is blocked.

The section shows the spend so far this month and the date it resets.

### Max Storage per Collection

This limit caps the storage of each collection in the space. A new space starts with a limit of 2 GiB. A collection that reaches the limit rejects writes. Searches and deletes keep working, so you can free up space.

**Max Indexed Storage per Collection** caps the part of each collection that's kept in indexes. It stays at or below the storage limit per collection. A new space starts with a limit of 1 GiB.

For the limits that apply to every space, see [Quotas and Limits](/documentation/serverless/quotas-and-limits/).

## Change a Space

Open the space and use its actions menu to rename it. To change its limits, use the **Configuration** tab, as described in [Cost Control and Quotas](#cost-control-and-quotas). The region and the endpoint are fixed for the life of the space.

## Delete a Space

Deleting a space removes the space and every collection in it. You choose whether to keep or delete the space's backups: keep them if you might restore the data into a new space later.

Deletion runs in the background. The space stays in the list with a `DELETING` status until it's fully removed.
