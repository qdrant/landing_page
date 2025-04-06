### Parameterized index

*Available as of v1.8.0*

We've added a parameterized variant to the `integer` index, which allows
you to fine-tune indexing and search performance.

Both the regular and parameterized `integer` indexes use the following flags:

- `lookup`: enables support for direct lookup using
  [Match](/documentation/concepts/filtering/#match) filters.
- `range`: enables support for
  [Range](/documentation/concepts/filtering/#range) filters.

The regular `integer` index assumes both `lookup` and `range` are `true`. In
contrast, to configure a parameterized index, you would set only one of these
filters to `true`:

| `lookup` | `range` | Result                      |
|----------|---------|-----------------------------|
| `true`   | `true`  | Regular integer index       |
| `true`   | `false` | Parameterized integer index |
| `false`  | `true`  | Parameterized integer index |
| `false`  | `false` | No integer index            |

The parameterized index can enhance performance in collections with millions
of points. We encourage you to try it out. If it does not enhance performance
in your use case, you can always restore the regular `integer` index.

Note: If you set `"lookup": true` with a range filter, that may lead to
significant performance issues.

For example, the following code sets up a parameterized integer index which
supports only range filters:

