
/**
 * 
 * Data processing functions
 * 
 */


let engineToColor = {
  redis: '#5961FF',
  milvus: '#1493cc',
  weaviate: '#01cc26',
  qdrant: '#bc1439',
  elastic: '#f9b110',
}

let lowerIsBetterMap = {
  "rps": false,
  "mean_precisions": false,
  "mean_time": true,
  "p95_time": true,
  "p99_time": true,
  "upload_time": true,
  "total_time": true,
}


function extractUniqueVals(data, key) {
  let vals = {};

  for (const row of data) {
    vals[row[key]] = 1;
  }

  return [...Object.keys(vals)]
}

function getDatasetsList(data) {
  return extractUniqueVals(data, 'dataset_name');
}

function getParallelOptions(data) {
  return extractUniqueVals(data, 'parallel');
}

function filterData(data, conditions) {
  let filtered = [];

  for (const row of data) {
    let match = true;

    for (const key in conditions) {
      if (row[key] !== conditions[key]) {
        match = false;
        break;
      }
    }

    if (match) {
      filtered.push(row);
    }
  }

  return filtered;
}

function filterBestPoints(data, lowerIsBetter) {
  let filtered = [];

  // sort by highest x
  data.sort((a, b) => b.x - a.x);

  // keep only point with increasing y value
  let bestValue = data[0].y;
  filtered.push(data[0]);
  for (const point of data) {

    let is_current_best = point.y > bestValue;
    if (lowerIsBetter) {
      is_current_best = point.y < bestValue;
    }


    if (is_current_best) {
      filtered.push(point);
      bestValue = point.y;
    }
  }

  return filtered;
}


function getPrecisionVsValue(data, key) {
  let vals = [];

  for (const row of data) {
    vals.push({
      x: row['mean_precisions'],
      y: row[key],
      ...row
    });
  }
  // sort by x
  vals.sort((a, b) => a.x - b.x);
  vals = filterBestPoints(vals, lowerIsBetterMap[key])


  return vals;
}

function getPlotDataForEngine(data, engine, key) {
  let filtered = filterData(data, { "engine_name": engine });


  return {
    label: engine,
    data: getPrecisionVsValue(filtered, key),
    parsing: false,
    borderColor: engineToColor[engine],
    cubicInterpolationMode: 'monotone',
  };

}

function getPlotData(data, key) {
  let engines = extractUniqueVals(data, "engine_name");
  let plotData = [];

  for (const engine of engines) {
    plotData.push(getPlotDataForEngine(data, engine, key));
  }

  return plotData;
}

function selectByPrecision(data, minPrecision) {
  let filtered = [];

  for (const row of data) {
    if (row.mean_precisions >= minPrecision) {
      filtered.push(row);
    }
  }

  return filtered;
}

function selectDataForTable(data, sortKey) {
  let lowerIsBetter = lowerIsBetterMap[sortKey];

  let engines = {}
  // Select best value per engine
  for (const row of data) {
    let engine = row.engine_name;
    if (!engines[engine]) {
      engines[engine] = row;
    } else {
      let current = engines[engine];
      // If engine alredy present, check if current value is better
      if (lowerIsBetter) {
        if (row[sortKey] < current[sortKey]) {
          engines[engine] = row;
        }
      } else {
        if (row[sortKey] > current[sortKey]) {
          engines[engine] = row;
        }
      }
    }
  }

  // get value from engines
  let vals = Object.values(engines);

  // sort by sortKey
  if (lowerIsBetter) {
    vals.sort((a, b) => a[sortKey] - b[sortKey]);
  } else {
    vals.sort((a, b) => b[sortKey] - a[sortKey]);
  }
  return vals;
}

/**
 * 
 * 
 * Interface functions
 * 
 * 
 */

function updataDropdown(selector, options) {
  while (selector.firstChild) {
    selector.removeChild(selector.firstChild);
  }
  for (let i = 0; i < options.length; i++) {
    let option = document.createElement("option");
    option.value = options[i];
    option.text = options[i];
    selector.appendChild(option);
  }
}

function getSelectedValue(selector) {
  return selector.options[selector.selectedIndex].value;
}

function getRadioButtonValue(elements) {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].checked) {
      return elements[i].value;
    }
  }
}

function renderPlot(chart, data) {
  chart.data.datasets = data;
  chart.update();
}

function getSelectedData(chart_id) {
  let data = window.datasets[chart_id];

  let datasetSelector = document.getElementById("datasets-selector-" + chart_id);
  let parallelSelector = document.getElementById("parallel-selector-" + chart_id);

  let selectedDataset = getSelectedValue(datasetSelector);
  let selectedParallel = getSelectedValue(parallelSelector);

  let parallelsInt = parseInt(selectedParallel);

  let selectedData = filterData(data, {
    "dataset_name": selectedDataset,
    "parallel": parallelsInt
  });

  return selectedData;
}


function updateLine(chart_id, x) {
  let chart = window.charts[chart_id];
  chart.data.datasets.pop();
  drawLine(chart, x);

  let plotValueSelector = document.getElementsByName("plot-value-" + chart_id);
  let selectedPlotValue = getRadioButtonValue(plotValueSelector);

  let selectedData = getSelectedData(chart_id);
  let filteredByPrecision = selectByPrecision(selectedData, x);
  let tableData = selectDataForTable(filteredByPrecision, selectedPlotValue);
  console.table(tableData);
}

function drawLine(chart, x) {
  chart.data.datasets.push({
    type: 'bar',
    label: "Precision cutoff",
    maxBarThickness: 2,
    backgroundColor: "#ff000033",
    parsing: false,
    data: [
      { x: x, y: chart.scales.y.max, setup_name: "cutoff" }
    ],
  });
  chart.update();
}

function renderSelected(chart_id) {

  let chart = window.charts[chart_id];

  let plotValueSelector = document.getElementsByName("plot-value-" + chart_id);
  let precisionSelector = document.getElementById("precision-selector-" + chart_id);

  let selectedData = getSelectedData(chart_id);
  let selectedPlotValue = getRadioButtonValue(plotValueSelector);


  chart.options.scales.y.title.text = selectedPlotValue;


  let plotData = getPlotData(selectedData, selectedPlotValue);

  renderPlot(chart, plotData);

  let precisionRange = [chart.scales.x.min, chart.scales.x.max];

  precisionSelector.min = precisionRange[0];
  precisionSelector.max = precisionRange[1];
  precisionSelector.step = (precisionRange[1] - precisionRange[0]) / 100;
  let precisionValue = precisionRange[0] + (precisionRange[1] - precisionRange[0]) / 2;
  precisionSelector.value = precisionValue;
  console.log(precisionRange);
  console.log(precisionValue);

  drawLine(chart, precisionValue);

  let filteredByPrecision = selectByPrecision(selectedData, precisionValue);

  let tableData = selectDataForTable(filteredByPrecision, selectedPlotValue);

  console.table(tableData);

}