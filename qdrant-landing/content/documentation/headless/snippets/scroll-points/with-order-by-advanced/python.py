from qdrant_client import models  # @hide

order_by=models.OrderBy(
    key="timestamp",
    direction="desc",  # default is "asc"
    start_from=123,  # start from this value
)
