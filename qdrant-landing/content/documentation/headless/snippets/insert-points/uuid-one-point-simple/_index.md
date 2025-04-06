## Point IDs

Qdrant supports using both `64-bit unsigned integers` and `UUID` as identifiers for points.

Examples of UUID string representations:

- simple: `936DA01F9ABD4d9d80C702AF85C822A8`
- hyphenated: `550e8400-e29b-41d4-a716-446655440000`
- urn: `urn:uuid:F9168C5E-CEB2-4faa-B6BF-329BF39FA1E4`

That means that in every request UUID string could be used instead of numerical id.
Example:

