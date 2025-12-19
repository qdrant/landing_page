package snippet

import "github.com/qdrant/go-client/qdrant"

func Main() {
	qdrant.NewMatchExcept("color", "black", "yellow")
}
