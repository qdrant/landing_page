---
title: User Management
short_description: "Invite users, assign roles, and transfer account ownership in Qdrant Cloud through the User Management console."
description: "Invite teammates, assign or revoke roles, transfer account ownership, and remove users from your Qdrant Cloud account through User Management."
weight: 10
---

# User Management

> 💡 You can access this in **Access Management > User & Role Management** *if available see [this page for details](/documentation/cloud-rbac/).*

## Inviting Users to an Account

Account users can be managed via the **User Management** section. To invite new users, click on the Invite User button which will open up a dialog asking for the email address and the role into which the user should be invited.

![image.png](/documentation/cloud/role-based-access-control/user-invitation.png)

### Accepting an Invitation
 
After inviting a user, they will receive an email prompting them to join the account. After clicking the link in the email, they are directed to the Qdrant Cloud portal, where a banner at the top of the page enables them to accept or decline the invitation.

### Inviting Users from a Role

To invite a user directly into a specific Role on the **Role Details** page - just click the Users tab to find the **Add Existing Member** button. Users can also be invited to a Role directly via the **User Management** section as well

Once accepted, they'll be assigned that role's permissions, along with the base role.


![image.png](/documentation/cloud/role-based-access-control/invite-user.png)

![image.png](/documentation/cloud/role-based-access-control/add-existing-member.png)

### Revoking an Invitation

Before being accepted, an Admin/Owner can cancel a pending invite directly on either the **User Management** or **Role Details** page.

![image.png](/documentation/cloud/role-based-access-control/revoke-invite.png)

## Updating a User’s Roles

Authorized users can give or take away roles from users in **User Management**.

![image.png](/documentation/cloud/role-based-access-control/update-user-role.png)

![image.png](/documentation/cloud/role-based-access-control/update-user-role-edit-dialog.png)

## Making a User the Owner of an Account

Only account owners are allowed to transfer ownership of an account, this can be done via the **User Management** page. There can only be one account owner per account.

![image.png](/documentation/cloud/role-based-access-control/make-account-owner.png)

## Removing a User from an Account

Users can be removed from an account by clicking on their name in either **User Management** (via Actions). This option is only available after they've accepted the invitation to join, ensuring that only active users can be removed.

![image.png](/documentation/cloud/role-based-access-control/remove-user.png)
