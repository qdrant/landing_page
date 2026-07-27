---
title: User Profile
short_description: "Manage your Qdrant Cloud user profile: profile details, color scheme, cookie consent, account invitations, multi-factor authentication, and deactivation."
description: "Manage your personal Qdrant Cloud user profile — profile details, appearance and color scheme, cookie consent, pending account invitations, multi-factor authentication with Authenticator apps and passkeys, and user deactivation."
weight: 212
partition: deploy
---

# Your User Profile & Preferences

Your user profile holds personal, user-level settings that apply to you across every Qdrant Cloud account you belong to. These are separate from [account settings](/documentation/cloud-account-setup/#account-settings), which apply to a single account and its resources.

Open the **user menu** at the bottom left of the Qdrant Cloud Console to access:

* **Get Started** — the *Explore Qdrant Cloud* landing page. See [Getting Started](/documentation/cloud-getting-started/).
* **Preferences** — your profile details, color scheme, and cookie consent.
* **Invitations** — pending invitations to join other accounts.
* **Security** — multi-factor authentication.
* **Accounts** — the accounts overview. See [Managing Accounts](/documentation/cloud-account-setup/#managing-accounts).
* **Logout**.

![User menu and Explore Qdrant Cloud](/documentation/cloud/user-menu.png)

## Profile Details

On the **Preferences** page, the **Your details** section shows your personal information — first name, last name, email address, and the date you became a member. Use **Edit Profile Details** to update how your name is displayed across the platform.

![Profile details and preferences](/documentation/cloud/profile-preferences.png)

## Color Scheme

The Qdrant Cloud Console supports light and dark appearances. Under **Color Scheme** on the **Preferences** page you can choose:

* **Light Mode**
* **Dark Mode**
* **System Sync** — follow your operating system's appearance setting.

Your selection applies to the Console on your current device.

## Cookie Consent Preferences

The **Cookie Consent Preferences** section lets you control how cookies are used. Cookies are grouped into categories that you can allow or deny individually. Disabling a previously allowed category removes its cookies from your browser. Use **Manage Consent** to review the categories and the detailed cookie declaration.

## Invitations

When someone invites you to their account, the invitation appears on your **Invitations** page as a pending invitation, where you can accept it. Once accepted, the account becomes available in your [account switcher](/documentation/cloud-account-setup/#switching-between-accounts).

![Pending invitations](/documentation/cloud/pending-invitations.png)

> **Note:** This page is for invitations *you* have received. To invite other users to an account you manage, use the **Access Management** page instead. See [Inviting Users to an Account](/documentation/cloud-account-setup/#inviting-users-to-an-account).

## Security

On the **Security** page you can set up multi-factor authentication (MFA) using either of the following methods:

* **Authenticator App** (recommended) — use an authenticator app of your choice to generate a one-time code at each login.
* **Passkey** — use a physical device or software passkey (for example a fingerprint or screen lock) as an additional security layer. You can add multiple passkeys and view all of the ones you have registered.

![Multi-factor authentication settings](/documentation/cloud/security-mfa.png)

> **Note:** Some accounts mandate MFA. In that case you cannot turn MFA off, but you can still change which method you use.

## Deactivate User

Use **Deactivate my User** on the **Preferences** page to permanently deactivate your Qdrant user and all associated data. If you own any accounts, you must first [transfer their ownership](/documentation/cloud-account-setup/#transferring-account-ownership) to another member.

![Deactivate user](/documentation/cloud/deactivate-user.png)
