import Chart from 'chart.js/auto';
import { columnMultiplyFactor, filterData, getDatasetsList, getParallelOptions } from './benchmarks.js';

let url = '{{ .Params.data }}';

let datasetSelector = document.getElementById('datasets-selector-{{ .Params.id }}');

let parallelSelector = document.getElementById('parallel-selector-{{ .Params.id }}');

let precisionSelector = document.getElementById('precision-selector-{{ .Params.id }}');

let metricRadioSelector = document.getElementsByName('plot-value-{{ .Params.id }}');

const config = {
  type: 'line',
  data: {
    datasets: [],
  },
  options: {
    responsive: true,
    interaction: {
      intersect: false,
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Precision',
        },
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: '',
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return [' - ' + tooltipItem.parsed.setup_name, JSON.stringify(tooltipItem.parsed.engine_params)];
          },
          title: function (tooltipItem) {
            return 'Precision: ' + tooltipItem[0].parsed.x + ', y: ' + tooltipItem[0].parsed.y;
          },
        },
      },
    },
  },
};

const chart = new Chart(document.getElementById('chart-{{ .Params.id }}'), config);

fetch(url)
  .then((res) => res.json())
  .then((data) => {
    const datasets = getDatasetsList(data);
    updataDropdown(datasetSelector, datasets);

    // reverse parallels list to have the highest number of parallel threads first
    const parallels = getParallelOptions(data).reverse();

    updataDropdown(parallelSelector, parallels);

    let parallelsInt = parseInt(parallels[0]);

    for (const row in data) {
      for (const column in columnMultiplyFactor) {
        if (column in data[row]) {
          data[row][column] *= columnMultiplyFactor[column];
        }
      }
    }

    let selectedData = filterData(data, {
      dataset_name: datasets[0],
      parallel: parallelsInt,
    });

    window.datasets = { '{{ .Params.id }}': data, ...window.datasets };
    window.charts = { '{{ .Params.id }}': chart, ...window.charts };

    let plotValueRadioBtns = document.getElementsByName('plot-value-{{ .Params.id }}');
    plotValueRadioBtns.forEach((btn) => {
      if (btn.value === '{{ .Params.metric }}') {
        btn.checked = true;
      }
    });

    renderSelected('{{ .Params.id }}');

    // Chart js set min x value
  });
