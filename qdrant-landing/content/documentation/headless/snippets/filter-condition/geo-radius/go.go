package snippet

import "github.com/qdrant/go-client/qdrant"

func Main() {
	qdrant.NewGeoRadius("location", 52.520711, 13.403683, 1000.0)
}
