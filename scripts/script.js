import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import *  as overTime from "./overtime.js";
import worldMap from "../europe.json" assert { type: 'json' };
import {colors, dataset, selectedCountries, slider} from "./global.js";
import * as sankey from "./sankeyView.js";


// This part renders the map on screen
const projection = d3.geoEquirectangular()
.scale(150);

const path = d3.geoPath()
.projection(projection);

const width = 800;
const height = 200;

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

sankey.sankeyView();

overTime.overTImeView();

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

const sliderNumber = document.getElementById("yearSliderNumber");
sliderNumber.innerHTML = slider.value;

// Runs when slider is updated
slider.addEventListener("input", function() {
    sliderNumber.innerHTML = this.value;
});

function updateCountry(country, add) {
    d3.csv(dataset).then(function (allData) {
        const data = allData.filter(d => selectedCountries.includes(d.Country))

        // Reset legend
        d3.select("#legend").select("svg").remove();
        const legend = d3.select("#legend").append("svg");

        // Update graphs
        overTime.updateOverTime(country, add, data);

        // Update lines for potential new Y-axis domain
        selectedCountries.forEach((selCountry, i) => {
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
                .style("fill", colors[selCountry]);
            legendItem.append("text")
                .text(selCountry)
                .attr("x", 20)
                .attr("y", 8)
                .attr("dy", ".35em");
        })
    })
}