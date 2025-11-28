package snippet

import "context"

func Main() {
	client.DeleteAlias(context.Background(), "production_collection")
}
