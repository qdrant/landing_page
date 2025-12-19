package snippet

import "github.com/qdrant/go-client/qdrant"

func Main() {
	qdrant.NewMatch("color", "red")
}
