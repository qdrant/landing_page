// function extractUniqueVals(data, key) {
//     let vals = {};
//
//     for (const row of data) {
//         vals[row[key]] = 1;
//     }
//
//     return [...Object.keys(vals)]
// }
//
// function getDatasetsList(data) {
//     return extractUniqueVals(data, 'dataset_name');
// }

// function filterData(data, conditions) {
//     let filtered = [];
//
//     for (const row of data) {
//         let match = true;
//
//         for (const key in conditions) {
//             if (row[key] !== conditions[key]) {
//                 match = false;
//                 break;
//             }
//         }
//
//         if (match) {
//             filtered.push(row);
//         }
//     }
//
//     return filtered;
// }

// function updateDropdown(selector, options) {
//     while (selector.firstChild) {
//         selector.removeChild(selector.firstChild);
//     }
//     for (let i = 0; i < options.length; i++) {
//         let option = document.createElement("option");
//         option.value = options[i];
//         option.text = options[i];
//         selector.appendChild(option);
//     }
// }
//
// function getSelectedValue(selector) {
//     return selector.options[selector.selectedIndex].value;
// }
//
// function getRadioButtonValue(elements) {
//     for (let i = 0; i < elements.length; i++) {
//         if (elements[i].checked) {
//             return elements[i].value;
//         }
//     }
// }

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
    chart.data.labels = Object.keys(Object.values(fullRawPlotData)[0]);
    chart.options.scales.y.title.text = selectedPlotValue;

    let convertedPlotData = convertPlotData(fullRawPlotData);
    renderPlot(chart, convertedPlotData);
}

//
// function renderPlot(chart, data) {
//     chart.data.datasets = data
//     chart.update();
// }

function setPlotValueSelector(name, chartId) {
    let plotValueSelector = document.getElementsByName("plot-value-" + chartId);
    for (let valueSelector of plotValueSelector) {
        valueSelector.checked = valueSelector.value === name
    }
}