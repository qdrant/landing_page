```go
type CSVRow struct {
	Text     string
	Datetime string
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

	textIdx, datetimeIdx := -1, -1
	for i, h := range headers {
		switch h {
		case "text":
			textIdx = i
		case "datetime":
			datetimeIdx = i
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
		fn(CSVRow{Text: row[textIdx], Datetime: row[datetimeIdx]})
	}
	return nil
}
```
