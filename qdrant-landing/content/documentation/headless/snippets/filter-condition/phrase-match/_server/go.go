package snippet

import "github.com/qdrant/go-client/qdrant"

func Main() {
	qdrant.NewMatchPhrase("description", "brown fox")
}
