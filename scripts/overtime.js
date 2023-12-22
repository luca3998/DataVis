import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {selectedCountries, total_import, total_export, getImportValue, slider, transitionTime} from "./global.js";
import { getCountryColor } from "./script.js";

// set the dimensions and margins of the graph
const overTimeMargin = {top: 10, right: 30, bottom: 90, left: 60},
    overTimeWidth = 800 - overTimeMargin.left - overTimeMargin.right,
    overTimeHeight = 450 - overTimeMargin.top - overTimeMargin.bottom;

// X axis
const xAxis = d3.scalePoint()
    .range([ 0, overTimeWidth ])
    .domain([])

// Y axis
const yAxis = d3.scaleLinear()
    .domain([])
    .range([ overTimeHeight, 0]);

var dataset = total_export;
var maxY = 0;
var is_import_local = 1;

// Function to handle the import value change
function handleImportChange() {
    is_import_local = getImportValue();
    console.log('Current import value:', is_import_local);
    updateDataset();
}

function updateDataset(){
    if(is_import_local){
        dataset = total_import;
    } else{
        dataset = total_export;
    }
}
// Attach the event listener to the custom event
document.addEventListener("is_import_value_changed", handleImportChange);

function overTImeView() {
    const svg = d3.select("#overTimeGraph")
        .append("svg")
        .attr("width", overTimeWidth + overTimeMargin.left + overTimeMargin.right)
        .attr("height", overTimeHeight + overTimeMargin.top + overTimeMargin.bottom)
        .append("g")
        .attr("transform", `translate(${overTimeMargin.left},${overTimeMargin.top})`);

    d3.csv(dataset).then(function (data) {

        // X axis
        // xAxis.domain([d3.min(data, d => d.TIME_PERIOD), d3.max(data, d => d.TIME_PERIOD)] );
        xAxis.domain(data.map(d => d.TIME_PERIOD).sort((a, b) => a - b));
        svg.select(".xAxis")
        .call(d3.axisBottom(xAxis));

        // Update Y axis
        const maxVal = Math.max(...data.map(d => d.OBS_VALUE))
        if(maxVal > maxY){
            maxY = maxVal;
        }
        yAxis.domain([0, maxVal + maxVal * 0.1])
        svg.select(".yAxis").call(d3.axisLeft(yAxis));

        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + overTimeHeight + ")")
            .call(d3.axisBottom(xAxis));


        svg.append("g")
            .attr("class", "yAxis")
            .call(d3.axisLeft(yAxis));

        svg.append("line")
            .attr("class", "yearLine")
            .attr("fill", "none")
            .attr("stroke", "rgba(255,128,0,0.5)")
            .attr("stroke-width", 3)
            .attr("x1", xAxis(slider.value))
            .attr("y1", 0)
            .attr("x2", xAxis(slider.value))
            .attr("y2", overTimeHeight);

        // Add slider value to sliding line
        svg.append("text")
        .attr("class", "yearValue")
        .attr("fill", "rgba(255,128,0,0.5)")
        .attr("x", xAxis(slider.value))
        .attr("y", 10)
        .attr("font-size", "15px")
        .text("");

        // Add x-axis title
        svg.append("text")
        .attr("transform", "translate(300, 400)")
        .style("text-anchor", "middle")
        .text("Year");

        // Add y-axis title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - 60)
            .attr("x", 0 - 150)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("GWh");

        d3.select("#overTimeLegend").append("svg")
    })
}

slider.addEventListener("input", function() {
    d3.selectAll(".yearLine")
        .transition().ease(d3.easePolyOut)
        .duration(transitionTime)
        .attr("x1", xAxis(this.value))
        .attr("x2", xAxis(this.value))

    d3.selectAll(".yearValue")
        .transition().ease(d3.easePolyOut)
        .duration(transitionTime)
        .attr("x", xAxis(this.value) + 10)
        .text(slider.value)
});


function updateOverTime(country, countryCode, add, data) {
    const svg = d3.select("#overTimeGraph").select("svg").select("g");
    
    if (!add) {
        // Remove old country line
        const toRemove = svg.select("." + country + "Data");
        toRemove.transition()
        .duration(transitionTime)  // Animation duration
        .style("opacity", 0)  // Fade out
        .remove();
    } else {
        getCountryColor(country, function(currentCountryColor) {
            // Add country line

            svg.append("path")
                .attr("class", country + "Data")
                .datum(data.filter(d => d.geo === countryCode))
                .attr("fill", "none")
                .transition().ease(d3.easePolyOut)
                .duration(transitionTime)
                .attr("stroke", currentCountryColor)
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(function (d) {
                        return xAxis(d.TIME_PERIOD)
                    })
                    .y(function (d) {
                        return yAxis(d.OBS_VALUE)
                    })
                );
            });
    }


}

export {overTImeView, updateOverTime};