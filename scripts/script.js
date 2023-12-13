import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import worldMap from "./europe.json" assert { type: 'json' };

const selectedCountries = [];

// This part renders the map on screen
const projection = d3.geoEquirectangular()
.scale(150);

const path = d3.geoPath()
.projection(projection);

const width = 800;
const height = 200;

// set the dimensions and margins of the graph
const overTimeMargin = {top: 10, right: 30, bottom: 90, left: 40},
    overTimeWidth = 460 - overTimeMargin.left - overTimeMargin.right,
    overTimeHeight = 450 - overTimeMargin.top - overTimeMargin.bottom;

const colors = ["red", "green", "blue"]

const svg = d3.select("#content")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Load GeoJSON data
d3.json("europe.json").then(function(data) {
    // Draw the map
    svg.selectAll("path")
      .data(data.features)
      .enter().append("path")
      .attr("d", path)
      .on("click", handleCountryClick);
});

overTImeView();

  // Handle country click event
function handleCountryClick(event, d) {
    const countryName = d.properties.name;
    const index = selectedCountries.indexOf(countryName);
    if(index === -1){
        selectedCountries.push(countryName);
        d3.select(this).attr("r", 10).style("fill", "lightblue");
        updateCountry(countryName, true);
    } else{
        selectedCountries.splice(index, 1);
        d3.select(this).style("fill", "#e1e1e1");
        updateCountry(countryName, false);
    }
}

/************************
 * SLIDER PART
 ************************/
const slider = document.getElementById("yearSlider");
const sliderNumber = document.getElementById("yearSliderNumber");
sliderNumber.innerHTML = slider.value; // Display the default slider value

// Runs when slider is updated
slider.oninput = function() {
    sliderNumber.innerHTML = this.value;
    d3.selectAll(".yearLine")
        .transition().ease(d3.easePolyOut)
        .duration(transitionTime)
        .attr("x1", xAxis(slider.value))
        .attr("x2", xAxis(slider.value))

}

const transitionTime = 1000;

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

    d3.csv("fakeData.csv").then(function (data) {

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

function updateCountry(country, add) {
    d3.csv("fakeData.csv").then(function (allData) {
        const data = allData.filter(d => selectedCountries.includes(d.Country))

        // Reset axes
        const svg = d3.select("#overTimeGraph").select("svg").select("g");
        d3.select("#overTimeLegend").select("svg").remove();
        const legend = d3.select("#overTimeLegend").append("svg");


        if (!add) {
            // Remove old country line
            const toRemove = svg.select("." + country + "Data");
            colors.push(toRemove.attr("stroke"));
            toRemove.remove();
        } else {
            // Add country line
            svg.append("path")
                .attr("class", country + "Data")
                .datum(data.filter(d => d.Country === country))
                .attr("fill", "none")
                .attr("stroke", colors[0])
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function (d) {
                        return xAxis(d.Year)
                    })
                    .y(function (d) {
                        return yAxis(d.EnergyConsumption)
                    })
                );
            colors.shift();
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
        selectedCountries.forEach((selCountry, i) => {
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

            // New legend
            const legendItem = legend.append("g")
                .attr("class", selCountry + "Legend")
                .attr("transform", `translate(5, ${i * 20 + 5})`)
            legendItem.append("rect")
                .attr("width", 16)
                .attr("height", 16)
                .attr("rx", 5)
                // .attr("cx", 8)
                // .attr("cy", 8)
                // .attr("r", 4)
                .attr("strokewidth", "10")
                .attr("stroke", "black")
                .style("fill", countrySVG.attr("stroke"));
            legendItem.append("text")
                .text(selCountry)
                .attr("x", 20)
                .attr("y", 8)
                .attr("dy", ".35em");
        })
    })
}