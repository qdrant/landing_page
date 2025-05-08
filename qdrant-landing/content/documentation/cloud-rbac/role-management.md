---
title: Role Management
weight: 1
---

# Role Management

> 💡 You can access this in **Access Management > User & Role Management** *if available see [this page for details](/documentation/cloud-rbac/).*

A **Role** contains a set of **permissions** that define the ability to perform or control specific actions in Qdrant Cloud. Permissions are accessible through the Permissions tab in the Role Details page and offer fine-grained access control, logically grouped for easy identification.

## Built-In Roles

Qdrant Cloud includes some built-in roles for common use-cases. The permissions for these built-in roles cannot be changed.

There are three types: 

- The **Base Role** is assigned to all users, and provides the minimum privileges required to access Qdrant Cloud.
- The **Admin Role**  has all available permissions, except for account write permissions.
- The **Owner Role** has all available permissions assigned, including account write permissions. There can only be one Owner per account currently.

![image.png](/documentation/cloud/role-based-access-control/built-in-roles.png)

## Custom Roles

An authorized user can create their own custom roles with specific sets of permissions, giving them more control over who has what access to which resource.

![image.png]( /documentation/cloud/role-based-access-control/custom-roles.png)

### Creating a Custom Role

To create a new custom role, click on the **Add** button at the top-right corner of the **Custom Roles** list.

- **Role Name**: Must be unique across roles.
- **Role Description**: Brief description of the role’s purpose.

Once created, the new role will appear under the **Custom Roles** section in the navigation.

![image.png](/documentation/cloud/role-based-access-control/create-custom-role.png)

### Editing a Custom Role

To update a specific role's permissions, select it from the list and click on the **Permissions** tab. Here, you'll find logically grouped options that are easy to identify and edit as needed. Once you've made your changes, save them to apply the updated permissions to the role.

![image.png](/documentation/cloud/role-based-access-control/update-permission.png)

### Renaming, Deleting and Duplicating a Custom Role

Each custom role can be renamed, duplicated or deleted via the action buttons located to the right of the role title bar.

- **Rename**: Opens a dialog allowing users to update both the role name and description.
- **Delete**: Triggers a confirmation prompt to confirm the deletion. Once confirmed, this action is irreversible. Any users assigned to the deleted role will automatically be unassigned from it.
- **Duplicate:** Opens a dialog asking for a confirmation and also allowing users to view the list of permissions that will be assigned to the duplicated role

![image.png](/documentation/cloud/role-based-access-control/role-actions.png)
