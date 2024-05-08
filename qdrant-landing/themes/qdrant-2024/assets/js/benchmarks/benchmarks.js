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
  elasticsearch: '#f9b110',
  elastic: '#f9b110',
};

let lowerIsBetterMap = {
  rps: false,
  mean_precisions: false,
  mean_time: true,
  p95_time: true,
  p99_time: true,
  upload_time: true,
  total_time: true,
  total_upload_time: true,
};

const normalizedTitles = {
  total_time: 'Total Time (s)',
  engine_name: 'Engine',
  dataset_name: 'Dataset',
  rps: 'RPS',
  mean_precisions: 'Precision',
  total_upload_time: 'Upload + Index Time(m)',
  upload_time: 'Upload Time(m)',
  mean_time: 'Latency(ms)',
  p95_time: 'P95(ms)',
  p99_time: 'P99(ms)',
  setup_name: 'Setup',
  // engine_params: 'Run Params',
};

const columnMultiplyFactor = {
  total_upload_time: 1 / 60,
  upload_time: 1 / 60,
  mean_time: 1000,
  p95_time: 1000,
  p99_time: 1000,
};

function extractUniqueVals(data, key) {
  let vals = {};

  for (const row of data) {
    vals[row[key]] = 1;
  }

  return [...Object.keys(vals)];
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
    let isCurrentBest = point.y > bestValue;
    if (lowerIsBetter) {
      isCurrentBest = point.y < bestValue;
    }

    if (isCurrentBest) {
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
      ...row,
    });
  }
  // sort by x
  vals.sort((a, b) => a.x - b.x);
  vals = filterBestPoints(vals, lowerIsBetterMap[key]);

  return vals;
}

function getPlotDataForEngine(data, engine, key) {
  let filtered = filterData(data, { engine_name: engine });

  return {
    label: engine,
    data: getPrecisionVsValue(filtered, key),
    parsing: false,
    borderColor: engineToColor[engine],
    cubicInterpolationMode: 'monotone',
  };
}

function getPlotData(data, key) {
  let engines = extractUniqueVals(data, 'engine_name');
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

  let engines = {};
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
    let option = document.createElement('option');
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

function getSelectedData(chartId) {
  let data = window.datasets[chartId];

  let datasetSelector = document.getElementById('datasets-selector-' + chartId);
  let parallelSelector = document.getElementById('parallel-selector-' + chartId);

  let selectedDataset = getSelectedValue(datasetSelector);
  let selectedParallel = getSelectedValue(parallelSelector);

  let parallelsInt = parseInt(selectedParallel);

  let selectedData = filterData(data, {
    dataset_name: selectedDataset,
    parallel: parallelsInt,
  });

  return selectedData;
}

function updateLine(chartId, x) {
  let chart = window.charts[chartId];
  chart.data.datasets.pop();
  drawLine(chart, x);

  let plotValueSelector = document.getElementsByName('plot-value-' + chartId);
  let selectedPlotValue = getRadioButtonValue(plotValueSelector);

  let selectedData = getSelectedData(chartId);
  let filteredByPrecision = selectByPrecision(selectedData, x);
  let tableData = selectDataForTable(filteredByPrecision, selectedPlotValue);
  renderTable(tableData, chartId, selectedPlotValue);
}

function drawLine(chart, x) {
  chart.data.datasets.push({
    type: 'bar',
    label: 'Precision cutoff',
    maxBarThickness: 2,
    backgroundColor: '#ff000033',
    parsing: false,
    data: [{ x: x, y: chart.scales.y.max, setup_name: 'cutoff' }],
  });
  chart.update();
}

function renderSelected(chartId) {
  let chart = window.charts[chartId];

  let plotValueSelector = document.getElementsByName('plot-value-' + chartId);
  let precisionSelector = document.getElementById('precision-selector-' + chartId);

  let selectedData = getSelectedData(chartId);
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

  drawLine(chart, precisionValue);

  let filteredByPrecision = selectByPrecision(selectedData, precisionValue);

  let tableData = selectDataForTable(filteredByPrecision, selectedPlotValue);

  renderTable(tableData, chartId, selectedPlotValue);
}

const renderTable = function (tableData, chartId, selectedPlotValue) {
  if (!tableData[0]) {
    return;
  }

  let titles = Object.keys(tableData[0]);

  const titleElements = titles.map((title) => {
    let normTitle = title;
    if (normalizedTitles.hasOwnProperty(title)) {
      normTitle = normalizedTitles[title];
    } else {
      return '';
    }
    return `<th scope="col">${normTitle}</th>`;
  });

  const rows = tableData.map((obj) => {
    const row = Object.keys(obj).map((key, i) => {
      let value = obj[key];

      if (!normalizedTitles.hasOwnProperty(key)) {
        return '';
      }

      if (key === 'setup_name') {
        return `<td title='${JSON.stringify(obj['engine_params'])}'><u>${value}</u></td>`;
      }

      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      // check for float point
      if (typeof value === 'number' && Math.trunc(value) !== value) {
        value = value.toFixed(20).match(/^-?\d*\.?0*\d{0,2}/)[0];
      }
      if (titles[i] === selectedPlotValue) {
        return `<th scope="row">${value}</th>`;
      }
      return `<td>${value}</td>`;
    });
    return `<tr>${row.join('')}</tr>`;
  });

  const table = document.createElement('table');
  table.classList.add('table', 'table-striped');
  table.innerHTML = `<thead><tr>${titleElements.join('')}</tr></thead><tbody>${rows.join('')}</tbody>`;

  if (document.getElementById('table-' + chartId).querySelector('.table')) {
    document
      .getElementById('table-' + chartId)
      .querySelector('.table')
      .remove();
  }
  document.getElementById('table-' + chartId).classList.add('table-responsive', 'table-responsive-md');
  document.getElementById('table-' + chartId).append(table);
};
