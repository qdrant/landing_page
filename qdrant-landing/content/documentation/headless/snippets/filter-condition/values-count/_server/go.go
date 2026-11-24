package snippet

import "github.com/qdrant/go-client/qdrant"

func Main() {
	qdrant.NewValuesCount("comments", &qdrant.ValuesCount{
		Gt: qdrant.PtrOf(uint64(2)),
	})
}
