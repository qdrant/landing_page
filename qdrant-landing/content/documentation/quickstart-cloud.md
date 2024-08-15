---
title: Cloud Quickstart
weight: 4
aliases:
  - quickstart-cloud
  - ../cloud-quick-start
  - cloud-quick-start
  - cloud-quickstart
  - cloud/quickstart-cloud/
---
# How to Get Started With Qdrant Cloud

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/g6uJhjAoNMg?si=EZ3OtmEdKKHIOgFy" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></p>
<p style="text-align: center;">You can try vector search on Qdrant Cloud in three steps. 
</br> Instructions are below, but the video is faster:</p>

## Setup a Qdrant Cloud cluster

1. Register for a [Cloud account](https://cloud.qdrant.io/) with your email, Google or Github credentials.
2. Go to **Overview** and follow the onboarding instructions under **Create First Cluster**. 

![create a cluster](/docs/gettingstarted/gui-quickstart/create-cluster.png)

3. When you create it, you will receive an API key. You will need to copy and paste it soon.
4. Your new cluster will be created under **Clusters**. Give it a few moments to provision.

## Access the cluster dashboard

1. Go to your **Clusters**. Under **Actions**, open the **Dashboard**.
2. Paste your new API key here. If you lost it, make another in **Access Management**.
3. The key will grant you access to your Qdrant instance. Now you can see the cluster Dashboard.

![access the dashboard](/docs/gettingstarted/gui-quickstart/access-dashboard.png)

## Try the Tutorial sandbox

1. Open the interactive **Tutorial**. Here, you can test basic Qdrant API requests.
2. Using the **Quickstart** instructions, create a collection, add vectors and run a search.
3. The output on the right will show you some basic semantic search results.

![interactive-tutorial](/docs/gettingstarted/gui-quickstart/interactive-tutorial.png)

## That's vector search!
You can stay in the sandbox and continue trying our different API calls.</br>
When ready, use the Console and our complete REST API to try other operations.

## What's next?

Now that you have a Qdrant Cloud cluster up and running, you should [test remote access](/documentation/cloud/authentication/#test-cluster-access) with a Qdrant Client.

