## Partition by payload

When an instance is shared between multiple users, you may need to partition vectors by user. This is done so that each user can only access their own vectors and can't see the vectors of other users.

> ### NOTE
>
> The key doesn't necessarily need to be named `group_id`. You can choose a name that best suits your data structure and naming conventions.

1. Add a `group_id` field to each vector in the collection.

