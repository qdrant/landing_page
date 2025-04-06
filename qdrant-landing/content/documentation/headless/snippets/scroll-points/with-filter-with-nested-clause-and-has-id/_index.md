

The matching logic is modified to be applied at the level of an array element within the payload.

Nested filters work in the same way as if the nested filter was applied to a single element of the array at a time.
Parent document is considered to match the condition if at least one element of the array matches the nested filter.

**Limitations**

The `has_id` condition is not supported within the nested object filter. If you need it, place it in an adjacent `must` clause.

