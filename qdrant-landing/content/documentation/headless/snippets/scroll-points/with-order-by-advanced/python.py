from qdrant_client import models  # @hide

order_by=models.OrderBy(
    key="timestamp",
    direction=models.Direction.DESC,  # default is "ASC"
    start_from=123,  # start from this value
)
