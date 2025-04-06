### Recover from a URL or local file

*Available as of v0.11.3*

This method of recovery requires the snapshot file to be downloadable from a URL or exist as a local file on the node (like if you [created the snapshot](#create-snapshot) on this node previously). If instead you need to upload a snapshot file, see the next section.

To recover from a URL or local file use the [snapshot recovery endpoint](https://api.qdrant.tech/master/api-reference/snapshots/recover-from-snapshot). This endpoint accepts either a URL like `https://example.com` or a [file URI](https://en.wikipedia.org/wiki/File_URI_scheme) like `file:///tmp/snapshot-2022-10-10.snapshot`. If the target collection does not exist, it will be created.

