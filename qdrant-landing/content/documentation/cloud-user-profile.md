---
title: User Profile
short_description: "Manage your Qdrant Cloud user profile: profile details, color scheme, cookie consent, account invitations, multi-factor authentication, and deactivation."
description: "Manage your personal Qdrant Cloud user profile — profile details, appearance and color scheme, cookie consent, pending account invitations, multi-factor authentication and user deactivation."
weight: 212
partition: deploy
---

# Your User Profile & Preferences

Your user profile holds personal, user-level settings that apply to you across every Qdrant Cloud account you belong to. These are separate from [account settings](/documentation/cloud-account-setup/#account-settings), which apply to a single account and its resources.

Open the **user menu** at the bottom left of the Qdrant Cloud Console to access:

* **Get Started** — the *Explore Qdrant Cloud* landing page. See [Getting Started](/documentation/cloud-getting-started/).
* **Preferences** — your profile details, color scheme, and cookie consent.
* **Invitations** — pending invitations to join other accounts.
* **Security** — secure your login with multi-factor authentication.
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

> **Note:** This page is for invitations *you* have received. To invite other users to an account you manage, use the **Access Management** page instead. See [Inviting Users to an Account](/documentation/cloud-rbac/user-management/#inviting-users-to-an-account).

## Security

The **Security** page is where you protect your login with multi-factor authentication (MFA). Like the rest of your profile, MFA is a personal setting — it applies to your user whenever you sign in.

Enabling MFA is your choice: until you set up a method, nothing changes about how you log in. Once a method is enabled, you are asked to complete it on every subsequent login. Two methods are available, and you can enable both:

* **Authenticator App** — a one-time code from an authenticator app of your choice.
* **Passkey** — a fingerprint, face scan, screen lock, or hardware security key.

You will be asked to authenticate again in order to set up a MFA method. After completion, you land back on the **Security** page.

![User Security Page](/documentation/cloud/user-security-page.png)

### Authenticator App

Select **Setup Authenticator App** to get started. You will be presented with a QR code that you need to scan with your authenticator app and confirm the code it generates.

A **recovery code** always accompanies an authenticator app, and is issued in the same step. It is shown once, so store it somewhere safe — it is your way back in if you lose access to your authenticator app.

Once set up, the method is marked **Enabled** and two actions become available:

* **Regenerate recovery code** — disables your existing recovery code and generate a new one.
* **Disable** — removes the authenticator app across all devices, along with its recovery code. You can no longer use it for MFA.

### Passkeys

A passkey lets you approve a login with your device or a security key. Select **Create a New Passkey** and choose one of:

* **Built-in Passkey** — verify with Face ID, Touch ID, a device PIN, or your preferred password manager. Select **Create Passkey on this Device**.
* **Hardware Security Key** — verify with a dedicated key such as a YubiKey, inserted via USB or tapped via NFC. Select **Use Hardware Security Key**.

> **Note:** If you use a password manager extension, it may not work well with a hardware security key. Choose a **Built-in Passkey** instead.

You can register one of each, for a maximum of two passkeys.

## Deactivate User

Use **Deactivate my User** on the **Preferences** page to permanently deactivate your Qdrant user and all associated data. If you own any accounts, you must first [transfer their ownership](/documentation/cloud-account-setup/#transferring-account-ownership) to another member or delete them.

![Deactivate user](/documentation/cloud/deactivate-user.png)
