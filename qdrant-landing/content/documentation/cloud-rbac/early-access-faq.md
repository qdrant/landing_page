---
title: Early Access FAQ
weight: 4
---


# Early Access FAQ

## 1. What is the difference between Cloud RBAC and Database API Keys?

Cloud RBAC covers permissions within the Qdrant Cloud console such as Billing and Backups, while Database API Keys deliver programmatic credentials with access control at a cluster level, including per-collection permissions.

## 2. Will my existing operations be disrupted?

We are committed to minimizing disruption during the rollout process.

## 3. Will this change how I interact with my cloud resources?

Initially, you may need to adjust your workflows in the cloud console if you restrict permissions for users. However, our phased rollout approach is designed to minimize disruption.

Existing Database API Keys for direct cluster access will not be affected, as Cloud RBAC only affects the capabilities and resources of the cloud console itself not the cluster.

## 4. I am currently an admin in another account, will I lose access once this is enabled?

No, for existing users already invited to another account, we will not be changing any permissions as you have already been granted Admin privileges. It will be up to the account owner and users who also have permission to configure RBAC to apply new permissions.

Moving forward, any new users invited to an account will be assigned the base role meaning they will not automatically become admins like today.

Admins will be also be able to assign pre-configured roles to a user when inviting them as part of the overhauled Invitations and User Management UI.

## 5. I have SSO, will I be able to use Cloud RBAC?

Cloud RBAC treats all users the same, regardless of authentication method.

## 6. How can I participate in the Early Access program for Cloud RBAC?

Customers who are interested should [register your interest](https://share-eu1.hsforms.com/1H5vI2Xx6TbCjwfyARUwQaA2b46ng).

## 7. I use Hybrid Cloud, how will this feature affect me?

Cloud RBAC is focused on the Cloud Interface itself, this means for Hybrid Cloud, Cloud RBAC will only affect those users you wish to administrate your clusters and account in the Cloud UI.

Additionally, Database API Keys are already available in Hybrid Clusters by accessing the Database UI directly through your ingress.

## 8. Will this allow me to segregate my dev and admin user access?

Cloud RBAC currently covers permissions within the cloud console only. The ability to control access to individual clusters and collections is not yet available, but is on our roadmap.

Today, it is possible to provide dev users with only Database API keys, which will let them authenticate into clusters programmatically. However, for UI access to Managed Cloud Clusters, they will still need access via the Cloud Console.

In the future, we plan to add the ability to restrict specific cloud identities per resource (cluster or collection) for Managed Cloud as well.

For Hybrid Clusters, where the Cluster Dashboard UI access is not routed through Qdrant Cloud, it is possible to leverage the built-in API Key RBAC to restrict access when accessing the Cluster UI directly.

For the administration of clusters and cloud resources with Hybrid you would then only permit trusted admin users into your cloud admin console, and the Cloud RBAC feature will let you control the permissions at this level for those users.

## 9. Does enabling Cloud RBAC incur any extra cost?

No, this feature will eventually be enabled for all users in Qdrant Cloud, and we are reaching out to existing customers to gather feedback.

## 10. I use Cloud Admin Keys, will Cloud RBAC apply to these as well?

Cloud RBAC was designed to work with both permissions in the UI for Cloud Users to restrict functionality, and also in the backend to work with Admin Keys and programmatic access to the cloud console.

Configuring permissions for Cloud Management Keys will not available immediately, but is on the roadmap for later.
