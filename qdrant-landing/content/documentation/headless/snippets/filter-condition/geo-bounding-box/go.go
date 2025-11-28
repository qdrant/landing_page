package snippet

import "github.com/qdrant/go-client/qdrant"

func Main() {
	qdrant.NewGeoBoundingBox("location", 52.520711, 13.403683, 52.495862, 13.455868)
}
