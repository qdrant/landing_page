### Grey collection status

_Available as of v1.9.0_

A collection may have the grey ⚫ status or show "optimizations pending,
awaiting update operation" as optimization status. This state is normally caused
by restarting a Qdrant instance while optimizations were ongoing.

It means the collection has optimizations pending, but they are paused. You must
send any update operation to trigger and start the optimizations again.

For example:

