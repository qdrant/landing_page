```go
type CSVRow struct {
	Title       string
	Author      string
	Description string
}

func parseCSV(url string, fn func(CSVRow)) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	csvReader := csv.NewReader(resp.Body)
	headers, err := csvReader.Read()
	if err != nil {
		return err
	}

	titleIdx, authorIdx, descriptionIdx := -1, -1, -1
	for i, h := range headers {
		switch h {
		case "Title":
			titleIdx = i
		case "Author":
			authorIdx = i
		case "Description":
			descriptionIdx = i
		}
	}

	for {
		row, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		fn(CSVRow{Title: row[titleIdx], Author: row[authorIdx], Description: row[descriptionIdx]})
	}
	return nil
}
```
