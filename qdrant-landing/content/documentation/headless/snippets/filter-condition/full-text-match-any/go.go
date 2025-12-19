package snippet

import "github.com/qdrant/go-client/qdrant"

func Main() {
	qdrant.NewMatchTextAny("description", "good cheap")
}
