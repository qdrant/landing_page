---
title: Account Setup
weight: 10
aliases:
---

# Setting up a Qdrant Cloud Account

## Registration

There are different ways to register for a Qdrant Cloud account:

* With an email address and passwordless login via email
* With a Google account
* With a GitHub account
* By connection an enterprise SSO solution

Every account is tied to an email address. You can invite additional users to your account and manage their permissions.

### Email registration

1. Register for a [Cloud account](https://cloud.qdrant.io/) with your email, Google or GitHub credentials.

## Inviting additional users to an account

You can invite additional users to your account, and manage their permissions on the *Account Management* page in the Qdrant Cloud Console.

![Invitations](/documentation/cloud/invitations.png)

Invited users will receive an email with an invitation link to join Qdrant Cloud. Once they signed up, they can accept the invitation from the Overview page.

![Accepting invitation](/documentation/cloud/accept-invitation.png)

## Switching between accounts

If you have access to multiple accounts, you can switch between accounts with the account switcher on the top menu bar of the Qdrant Cloud Console.

![Switching between accounts](/documentation/cloud/account-switcher.png)

## Account settings

You can configure your account settings in the Qdrant Cloud Console, by clicking on your account picture in the top right corner, and selecting *Profile*.

The following functionality is available.

### Renaming an account

If you use multiple accounts for different purposes, it is a good idea to give them descriptive names, for example *Development*, *Production*, *Testing*. You can also choose which account should be the default one, when you log in.

![Account management](/documentation/cloud/account-management.png)

### Deleting an account

When you delete an account, all database clusters and associated data will be deleted.

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