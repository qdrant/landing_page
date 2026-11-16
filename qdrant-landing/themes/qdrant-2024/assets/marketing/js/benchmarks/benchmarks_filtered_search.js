// const ENGINES = [
//     "qdrant", "weaviate", "milvus", "redis", "elastic"
// ]

function getFilterSelectedData(chartId) {
  let data = window.datasets[chartId];
  let datasetSelector = document.getElementById('datasets-selector-' + chartId);

  let filteredDatasetName = getSelectedValue(datasetSelector) + '-filters';
  let unFilteredDatasetName = getSelectedValue(datasetSelector) + '-no-filters';

  return {
    filtered: filterData(data, {
      dataset_name: filteredDatasetName,
    }),
    unfiltered: filterData(data, {
      dataset_name: unFilteredDatasetName,
    }),
  };
}

function getFilterPlotDataForEngine(data, engine) {
  let filtered = filterData(data, { engine_name: engine });
  let values = [{ x: 0.0, y: 0.0 }];
  if (filtered.length > 0) {
    values[0]['x'] = filtered[0]['mean_precisions'] || 0.0;
    values[0]['y'] = filtered[0]['rps'] || 0.0;
  }
  return {
    label: engine,
    data: values,
    backgroundColor: engineToColor[engine],
    radius: 10,
    hoverRadius: 13,
  };
}

function getFilterPlotData(data) {
  let plotData = [];

  let all_uniq_engines = new Set(data.map((d) => d.engine_name));
  // To sorted array
  all_uniq_engines = [...all_uniq_engines].sort();

  for (const engine of all_uniq_engines) {
    plotData.push(getFilterPlotDataForEngine(data, engine));
  }

  return plotData;
}

function renderFilterSelected(chartId) {
  // Set default value for radio button
  let searchTypeSelector = document.getElementsByName('plot-value-' + chartId);
  searchTypeSelector[0].checked = true;

  let chart = window.charts[chartId];
  let { filtered: filteredData, unfiltered: unFilteredData } = getFilterSelectedData(chartId);
  /*
    filteredData = [
        {
            "engine_name": "qdrant",
            "p95_time": 0.010619221997512793,
            "rps": 1118.8951442866735,
            "p99_time": 0.024652249003083857,
            "mean_time": 0.00700474982189371,
            "mean_precisions": 0.4396960000000001,
            "engine_params": {
                "parallel": 8,
                "search_params": {
                    "hnsw_ef": 128
                }
            },
            "setup_name": "qdrant-m-16-ef-128",
            "dataset_name": "range-100-filters",
            "parallel": 8,
            "upload_time": 44.026487107999856,
            "total_upload_time": 680.002582219
        }
    ]
    */

  // Get max value for y axis, ignore underfined data
  let maxRPSValue = Math.max(...filteredData.map((d) => d.rps || 0), ...unFilteredData.map((d) => d.rps || 0));

  // Render unfiltered data by default
  let plotData = getFilterPlotData(unFilteredData);

  chart.options.scales.y.max = (maxRPSValue / 100).toFixed() * 100 + 100;

  renderPlot(chart, plotData);
}

function updatePlot(chart, plotData) {
  chart.data.datasets.forEach((dataset, idx) => {
    dataset.data = plotData[idx].data;
  });
  chart.update();
}

function updateFilterSelected(chartId) {
  let chart = window.charts[chartId];
  let { filtered: filteredData, unfiltered: unFilteredData } = getFilterSelectedData(chartId);

  // Based on radio button value, render filtered or unfiltered data
  let data = [];

  let searchTypeSelector = document.getElementsByName('plot-value-' + chartId);
  let searchType = getRadioButtonValue(searchTypeSelector);

  if (searchType === 'filter_search') {
    data = filteredData;
  } else {
    data = unFilteredData;
  }

  let plotData = getFilterPlotData(data);

  updatePlot(chart, plotData);
}
