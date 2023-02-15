function getFilterSelectedData(chartId) {
    let data = window.datasets[chartId];
    let datasetSelector = document.getElementById("datasets-selector-" + chartId);
    let selectedDataset = getSelectedValue(datasetSelector) + '-filters';

    let filterDatasetData = {
        [selectedDataset]: filterData(data, {
            "dataset_name": selectedDataset,
        })
    };

    let noFilterSelectedDataset = selectedDataset.replace('filters', 'no-filters')
    let noFilterDatasetData = {
        [noFilterSelectedDataset]: filterData(data, {
            "dataset_name": noFilterSelectedDataset
        })
    };
    return {...filterDatasetData, ...noFilterDatasetData};
}

function getFilterPlotData(data, key) {
    let engines = extractUniqueVals(data, "engine_name");
    let plotData = {};

    for (const engine of engines) {
        let filtered = filterData(data, {"engine_name": engine});
        key = (key !== "precision") ? key : "mean_precisions";
        plotData[[engine]] = filtered[0][key]
    }
    return plotData;
}


function addMissedEngines(data) {
    let labels = [];
    for (const enginesObj of Object.values(data)) {
        for (const key of Object.keys(enginesObj)) {
            if (!labels.includes(key)) {
                labels.push(key);
            }
        }
    }

    for (const label of labels) {
        for (let enginesObj of Object.values(data)) {
            if (!(label in enginesObj)) {
                enginesObj[label] = 0.0
            }
        }
    }
    return data
}

function convertPlotData(data) {
    let convertedData = [];
    for (const [key, value] of Object.entries(data)) {
        convertedData.push({
            "label": key,
            "data": value
        })
    }
    return convertedData
}


function renderFilterSelected(chartId) {
    let chart = window.charts[chartId];

    let plotValueSelector = document.getElementsByName("plot-value-" + chartId);
    let selectedData = getFilterSelectedData(chartId);
    let selectedPlotValue = getRadioButtonValue(plotValueSelector);

    let rawPlotData = {};
    for (const [key, value] of Object.entries(selectedData)) {
        rawPlotData[[key]] = getFilterPlotData(value, selectedPlotValue);
    }

    let fullRawPlotData = addMissedEngines(rawPlotData);
    chart.data.labels = Object.keys(Object.values(fullRawPlotData)[0]).sort();
    chart.options.scales.y.title.text = selectedPlotValue;

    let convertedPlotData = convertPlotData(fullRawPlotData);
    renderPlot(chart, convertedPlotData);
}

function setPlotValueSelector(name, chartId) {
    let plotValueSelector = document.getElementsByName("plot-value-" + chartId);
    for (let valueSelector of plotValueSelector) {
        valueSelector.checked = valueSelector.value === name
    }
}