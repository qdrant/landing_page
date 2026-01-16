package snippet

// @hide-start
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

// @hide-end
func Main() {
	//@hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil {
		panic(err)
	}
	// @hide-end

	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: "books",
		FieldName:      "author",
		FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
	})

}
