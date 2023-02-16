const ENGINES = [
    "qdrant", "weaviate", "milvus", "redis", "elastic"
]

function getFilterSelectedData(chartId) {
    let data = window.datasets[chartId];
    let datasetSelector = document.getElementById("datasets-selector-" + chartId);
    let searchTypeSelector = document.getElementsByName("plot-value-" + chartId);
    let searchType = getRadioButtonValue(searchTypeSelector);

    let selectedDataset = "";
    if (searchType === "filter_search") {
        selectedDataset = getSelectedValue(datasetSelector) + '-filters';
    } else {
        selectedDataset = getSelectedValue(datasetSelector) + '-no-filters';
    }

    return filterData(data, {
        "dataset_name": selectedDataset,
    })
}

function getFilterPlotDataForEngine(data, engine) {
  let filtered = filterData(data, {"engine_name": engine});
  let values = [{"x": 0.0, "y": 0.0}]
  if (filtered.length > 0) {
      values[0]["x"] = filtered[0]['mean_precisions'] || 0.0
      values[0]["y"] = filtered[0]['rps'] || 0.0
  }
  return {
      label: engine,
      data: values,
      backgroundColor: engineToColor[engine],
      radius: 15,
      hoverRadius: 10,
  };
}

function getFilterPlotData(data) {
  let plotData = [];

  for (const engine of ENGINES) {
    plotData.push(getFilterPlotDataForEngine(data, engine));
  }

  return plotData;
}

function renderFilterSelected(chartId) {
    let chart = window.charts[chartId];
    let selectedData = getFilterSelectedData(chartId);
    let plotData = getFilterPlotData(selectedData);

    renderPlot(chart, plotData);
}
