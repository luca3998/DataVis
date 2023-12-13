import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {colors, dataset, selectedCountries, slider, transitionTime} from "./global.js";

// set the dimensions and margins of the graph
const overTimeMargin = {top: 10, right: 30, bottom: 90, left: 40},
    overTimeWidth = 460 - overTimeMargin.left - overTimeMargin.right,
    overTimeHeight = 450 - overTimeMargin.top - overTimeMargin.bottom;

// X axis
const xAxis = d3.scalePoint()
    .range([ 0, overTimeWidth ])
    .domain([])

// Y axis
const yAxis = d3.scaleLinear()
    .domain([])
    .range([ overTimeHeight, 0]);

function overTImeView() {
    const svg = d3.select("#overTimeGraph")
        .append("svg")
        .attr("width", overTimeWidth + overTimeMargin.left + overTimeMargin.right)
        .attr("height", overTimeHeight + overTimeMargin.top + overTimeMargin.bottom)
        .append("g")
        .attr("transform", `translate(${overTimeMargin.left},${overTimeMargin.top})`);

    d3.csv(dataset).then(function (data) {

        // X axis
        xAxis.domain(data.map(d => d.Year))

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
            .attr("stroke-width", 1.5)
            .attr("x1", xAxis(slider.value))
            .attr("y1", 0)
            .attr("x2", xAxis(slider.value))
            .attr("y2", overTimeHeight);

        d3.select("#overTimeLegend").append("svg")
    })
}

slider.addEventListener("input", function() {
    d3.selectAll(".yearLine")
        .transition().ease(d3.easePolyOut)
        .duration(transitionTime)
        .attr("x1", xAxis(this.value))
        .attr("x2", xAxis(this.value))
});


function updateOverTime(country, add, data) {
    const svg = d3.select("#overTimeGraph").select("svg").select("g");

    if (!add) {
        // Remove old country line
        const toRemove = svg.select("." + country + "Data");
        toRemove.remove();
    } else {
        // Add country line
        svg.append("path")
            .attr("class", country + "Data")
            .datum(data.filter(d => d.Country === country))
            .attr("fill", "none")
            .attr("stroke", colors[country])
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function (d) {
                    return xAxis(d.Year)
                })
                .y(function (d) {
                    return yAxis(d.EnergyConsumption)
                })
            );
    }

    // Update X axis
    xAxis.domain(data.map(d => d.Year))

    svg.select(".xAxis")
        .transition().ease(d3.easePolyOut)
        .duration(transitionTime)
        .call(d3.axisBottom(xAxis));

    // Update Y axis
    const maxVal = Math.max(...data.map(d => d.EnergyConsumption))
    yAxis.domain([0, maxVal + maxVal * 0.1])

    svg.select(".yAxis")
        .transition().ease(d3.easePolyOut)
        .duration(transitionTime)
        .call(d3.axisLeft(yAxis));

    // Update lines for potential new Y-axis domain
    selectedCountries.forEach(selCountry => {
        const countrySVG = svg.select("." + selCountry + "Data")
        countrySVG
            .transition().ease(d3.easePolyOut)
            .duration(transitionTime)
            .attr("d", d3.line()
                .x(function (d) {
                    return xAxis(d.Year)
                })
                .y(function (d) {
                    return yAxis(d.EnergyConsumption)
                })
            )
    })
}

export {overTImeView, updateOverTime};