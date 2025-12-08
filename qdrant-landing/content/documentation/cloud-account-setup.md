---
title: Account Setup
weight: 13
partition: cloud
aliases:
  - /documentation/cloud/qdrant-cloud-setup/
---

# Setting up a Qdrant Cloud Account

## Registration

There are different ways to register for a Qdrant Cloud account:

* With an email address and passwordless login via email
* With a Google account
* With a GitHub account
* By connection an enterprise SSO solution

Every account is tied to an email address. You can invite additional users to your account and manage their permissions.

### Email Registration

1. Register for a [Cloud account](https://cloud.qdrant.io/signup) with your email, Google or GitHub credentials.

## Inviting Additional Users to an Account

You can invite additional users to your account, and manage their permissions on the **Account -> Access Management** page in the Qdrant Cloud Console.

![Invitations](/documentation/cloud/invitations.png)

Invited users will receive an email with an invitation link to join Qdrant Cloud. Once they signed up, they can accept the invitation from the Overview page.

![Accepting invitation](/documentation/cloud/accept-invitation.png)

## Switching Between Accounts

If you have access to multiple accounts, you can switch between accounts with the account switcher on the top menu bar of the Qdrant Cloud Console.

![Switching between accounts](/documentation/cloud/account-switcher.png)

## Creating Additional Accounts

You can create additional accounts from the account switcher in the top menu bar. Every account has its own set of clusters, permissions, and payment methods.

Besides the account owner, users are not shared across accounts, and must be specifically invited to an account to access it.

Multiple accounts are useful if you want to manage clusters across different teams or environments, and also if you want to apply different payment methods to different resources.

![Create Account](/documentation/cloud/create-new-account.png)

## Light & Dark Mode

The Qdrant Cloud Console supports light and dark mode. You can switch between the two modes in the *Settings* menu, by clicking on your account picture in the top right corner.

![Light & Dark Mode](/documentation/cloud/light-dark-mode.png)

## Account Settings

You can configure your account settings in the Qdrant Cloud Console on the **Account -> Settings** page.

The following functionality is available.

### Renaming an Account

If you use multiple accounts for different purposes, it is a good idea to give them descriptive names, for example *Development*, *Production*, *Testing*. You can also choose which account should be the default one, when you log in.

![Account management](/documentation/cloud/account-management.png)

### Changing the Account Owner

Every account has one owner. The owner is granted full admin permissions for the account as well as futher unique permissions allowing them to either delete the account or transfer account ownership.

To transfer ownership of an account, as the owner, visit the *Access Management* page. In the actions menu of the user you wish to transfer to, you will find the option 'Make Account Owner' which begins the transfer.

### Deleting an Account

When you delete an account, all database clusters and associated data will be deleted.

![Delete Account](/documentation/cloud/account-delete.png)


## Enterprise Single-Sign-On (SSO)

Qdrant Cloud supports Enterprise Single-Sign-On for Premium Tier customers. The following providers are supported:

* Active Directory/LDAP
* ADFS
* Azure Active Directory Native
* Google Workspace
* OpenID Connect
* Okta
* PingFederate
* SAML
* Azure Active Directory

Enterprise Sign-On is available as an add-on for [Premium Tier](/documentation/cloud/premium/) customers. If you are interested in using SSO, please [contact us](/contact-us/).

<iframe width="560" height="315" src="https://www.youtube.com/embed/EtUcA-MCZJM?si=-u31oU5R0FkVrspN" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
