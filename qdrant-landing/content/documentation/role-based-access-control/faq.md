---
title: Frequently asked questions
weight: 4
---


# Frequently Asked Questions

## 1. What is the difference between Cloud RBAC and Database API Keys?

Cloud RBAC covers permissions within the Qdrant Cloud console such as Billing and Backups, while the upcoming Database Access Tokens will deliver programmatic credentials with access control at a database level, including per-collection permissions.

## 2. How does Automatic Dashboard Auth differ to Cloud RBAC and Database API Keys?

Currently in Qdrant Cloud if you access the Dashboard UI of your cluster you need to copy an API Key in. With Database API Keys we can now restrict that access to specific collections, with Cloud RBAC we can begin to assign permissions to users. Automatic Dashboard Auth will be built on top of both features to bridge the gap between RBAC in the Cloud UI and Dashboard UI so that when you access the dashboard your Cloud RBAC permissions will be used to generate an ephemeral session key that is automatically applied to you dashboard.

## 3. Will my existing operations be disrupted?

We are committed to minimizing disruption during the rollout process and are carefully selecting customers for participation in our Early Access program before it becomes GA.

## 4. When can I expect the full suite of features?

Once Cloud RBAC, Database API Keys, and Automatic Dashboard Auth are delivered, you will enjoy seamless integration between these features, ensuring secure access across all aspects of Qdrant Cloud.

Cloud RBAC is rolling out in the next few weeks, and Database API Keys w/ JWT RBAC is already available. Automatic Dashboard Auth is in the design stage with plans to roll this out in H1 2025.

## 5. Will this change how I interact with my cloud resources?

Initially, you may need to adjust your workflows in the cloud console to accommodate the new permissions introduced by Cloud RBAC if you restrict permissions for users. However, our phased rollout approach and feature flag delivery are designed to minimize disruption.

Existing Database API Keys for direct cluster access will not be affected, as Cloud RBAC only affects the capabilities and resources of the cloud console itself not the databases.

## 6. I am currently an admin in someone-else’s account, will I lose access once this is enabled?

No, for existing users already invited to someone-else's account we will not be changing any permissions as you have already been granted Admin privileges.  It will be up to the account owner and users who also have permission to configure RBAC to apply new permissions.

Moving forward, any new users invited to an account will be given minimal permissions meaning they will not automatically become admins like today and will need to be assigned roles.

Admins will be also be able to assign pre-configured roles to a user when inviting them as part of the overhauled Invitations and User Management UI.

## 7. Is Qdrant Cloud also planning to deliver SSO?

Single Sign On (SSO) capabilities supporting both Okta and Entra ID (formally Azure AD) became  available in Qdrant Cloud earlier this year and is already in use by customers in production.

SSO is only available to our Premium customers and requires configuration in the Qdrant Cloud backend to enable it per account, meaning it cannot be enabled self-service currently.

For SSO enabled users, it is still necessary to invite other SSO enabled users to your account like any other user, all that changes is the ability to authenticate to Qdrant Cloud with your own directory services.

Cloud RBAC treats all users the same so is agnostic to Social/SSO logins and will apply to SSO users like any other user.

## 8. How can I participate in the Early Access program for Cloud RBAC?

We are inviting customers who are willing to test the new capability while it's experimental to provide regular feedback during the initial rollout of Cloud RBAC. 

## 9. I use hybrid cloud, how will this feature affect me?

Cloud RBAC is focused on the Cloud Interface itself, this means for Hybrid Clusters, Cloud RBAC will only affect those users you wish to administrate your clusters and account in the Cloud UI.

Additionally for the Database API Keys feature mentioned in the Roadmap section. this is the Managed Cloud implementation, this feature is actually already available in Hybrid Clusters by accessing the Database UI directly through your ingress.

For the Automatic Dashboard Auth feature described above, this will be available to Managed Cloud users, where we own the end to end infrastructure and have control over where we redirect people to; in future we may consider ways to deliver this functionality to Hybrid Clusters but this is not scheduled yet.

## 10. What permissions will new users be granted when I invite them to my account moving forward?

By default all users are granted a permission to see only their own user profile and nothing else.

## 11. Will this allow me to segregate my dev and admin user access?

Cloud RBAC on it’s own is only for permissions within the cloud console, the ability to control access to individual clusters and collections is not yet available and planned for the Automatic Dashboard Auth on our roadmap.

Today, it is possible to provide dev users with only Database API keys, which will let them authenticate into clusters programmatically. However, for UI access to Managed Cloud Clusters, they will still need access via the Cloud Console.

Once Automatic Dashboard Auth is delivered the ability to restrict specific cloud identities per resource (cluster or collection) will be made available for control via the UI.

For Hybrid Clusters, where the Database Dashboard UI access is not routed through Qdrant Cloud, it is possible to leverage the built-in database tokens and RBAC to provide users with the correct permissions to restrict access and achieve full segregation when accessing the database UI but this requires managing credentials rather than users and assigning them manually.

For the administration of clusters and cloud resources with Hybrid you would only permit trusted admin users into your cloud admin console, and the Cloud RBAC feature will let you control the permissions at this level for those users.

## 12. How will I know I have the new Cloud RBAC enabled?

By navigating to ‘Access Management’ you will see an interface for creating roles, managing roles and users, this is not available to users without the feature flag.

You may need to create a new browser session, or re-authenticate to see the changes once enabled.

## 13. Does enabling Cloud RBAC incur any extra cost?

No, this feature will eventually be enabled for all users in Qdrant Cloud, for now we are only reaching out to existing customers who we believe would benefit from this capability to gather feedback and assess usability for an initial rollout.

## 14. I use Cloud Admin Keys, will Cloud RBAC apply to these as well?

Cloud RBAC was designed to work with both permissions in the UI for Cloud Users to restrict functionality, and also in the backend to work with Admin Keys and programmatic access to the cloud console.

Configuring permissions for Cloud Management Keys will not available immediately, but is on the roadmap for later.