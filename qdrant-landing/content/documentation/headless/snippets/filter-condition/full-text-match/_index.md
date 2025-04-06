### Full Text Match

*Available as of v0.10.0*

A special case of the `match` condition is the `text` match condition.
It allows you to search for a specific substring, token or phrase within the text field.

Exact texts that will match the condition depend on full-text index configuration.
Configuration is defined during the index creation and describe at [full-text index](/documentation/concepts/indexing/#full-text-index).

If there is no full-text index for the field, the condition will work as exact substring match.

