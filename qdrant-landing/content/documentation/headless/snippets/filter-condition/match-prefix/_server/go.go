package snippet

import "github.com/qdrant/go-client/qdrant"

func Main() {
	qdrant.NewMatchPrefix("url", "https://qdrant.")
}
