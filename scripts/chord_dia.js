
import { getSliderValue, getCountries, getImportValue, country_data } from './global.js';


var filepath_chord = "datasets/elec_export/elec_export_2020.csv"
var sliderValue = 2020
var is_import_local = 1
var countries_chord = []

// Function to handle the slider value change
function handleSliderChange() {
    sliderValue = getSliderValue();
    reloadFigure()
}

//React to changes in slider
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("yearSlider").addEventListener("input", handleSliderChange);
    handleSliderChange();
});

// Function to handle the import value change
function handleImportChange() {
    is_import_local = getImportValue();
    reloadFigure();
}

//React to changes in import/export button
document.addEventListener("is_import_value_changed", handleImportChange);

//Reload figure with newly updated country list
function handleCountryChange() {
    countries_chord = getCountries();
    reloadFigure();
}

//React to changes in array of selected countries
document.addEventListener("countryArrayChange", handleCountryChange)

// Function to reload the entire figure with the new data, called when one of the global variables changes
// such as export/import, selected countries or slider value
function reloadFigure() {
    loadCSV_chord();
}


// Load the CSV data according to the value of the is_import_local variable and call the function to draw the diagram
function loadCSV_chord() {
    if (is_import_local === 1) {
        filepath_chord = `datasets/elec_import/elec_import_${sliderValue}.csv`;
    }
    else if (is_import_local === 0) {
        filepath_chord = `datasets/elec_export/elec_export_${sliderValue}.csv`;
    }
    drawChordDiagram();
}

//Draw the d3 chord diagram 
function drawChordDiagram() {
    if (!d3.select("#my_dataviz").select("svg").empty()) {
        d3.select("#my_dataviz").select("svg").remove();
    }

    // create the svg area
    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", 600)
        .attr("height", 600)
        .append("g")
        .attr("transform", "translate(300,300)");

    // Load countries data
    d3.csv(country_data, function (countriesData) {
        // Create a color scale using data from countries.csv
        var colorScale = d3.scaleOrdinal()
            .domain(countriesData.map(function (d) { return d.country_code; }))
            .range(countriesData.map(function (d) { return d.country_color; }));
        d3.csv(filepath_chord, function (data) {
            var entities = data.columns.slice(1);

            // Convert the data to a matrix format as required by the d3 chord diagram
            var matrix = data.map(function (row) {
                return entities.map(function (entity) {
                    return +row[entity];
                });
            });

            var res = d3.chord()
                .padAngle(0.05)
                .sortSubgroups(d3.descending)
                (matrix);

            var group = svg
                .datum(res)
                .append("g")
                .selectAll("g")
                .data(function (d) { return d.groups; })
                .enter()
                .append("g");

            var arcs = group.append("path")
                .style("fill", function (d, i) { return colorScale(entities[i]); })
                .style("stroke", "black")
                .attr("d", d3.arc()
                    .innerRadius(200)
                    .outerRadius(210)
                );
            //Print names of the countries on the arcs
            group.append("text")
                .each(function (d) { d.angle = (d.startAngle + d.endAngle) / 2; })
                .attr("dy", ".35em")
                .attr("class", "titles")
                .attr("transform", function (d) {
                    return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                        + "translate(" + (210 + 10) + ")"
                        + (d.angle > Math.PI ? "rotate(180)" : "");
                })
                .style("text-anchor", function (d) { return d.angle > Math.PI ? "end" : null; })
                .text(function (d, i) {
                    var countryCode = entities[i];
                    var countryIndex = countriesData.findIndex(function (country) {
                        return country.country_code === countryCode;
                    });
                    return countryIndex !== -1 ? countriesData[countryIndex].country_name : "";
                });

            svg
                .datum(res)
                .append("g")
                .selectAll("path.ribbon")
                .data(function (d) { return d; })
                .enter()
                .append("path")
                .attr("class", "ribbon")
                .attr("d", d3.ribbon()
                    .radius(200)
                )
                .style("fill", function (d) {
                    return colorScale(entities[d.source.index]);
                })
                .style("stroke", "black")
                .style("opacity", function () {
                    // Check if countries_chord array is empty
                    // Set opacity to 1 if empty, else 0
                    return countries_chord.length === 0 ? 1 : 0;
                });

            // Set the color of the ribbon to the color of the source country (the country that is selected)
            countries_chord.forEach(function (country) {
                var countryIndex = entities.indexOf(country);
                if (countryIndex !== -1) {
                    svg.selectAll("path.ribbon")
                        .filter(function (ribbon) {
                            return ribbon.source.index === countryIndex || ribbon.target.index === countryIndex;
                        })
                        .transition()
                        .duration(500)
                        .style("fill", colorScale(country))
                        .style("opacity", 1);
                }
            });
        })
    })
}