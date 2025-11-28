package snippet

import "context"

func Main() {
	client.CreateAlias(context.Background(), "production_collection", "example_collection")
}
