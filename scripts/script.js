import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import *  as overTime from "./overtime.js";
import worldMap from "../europe.json" assert { type: 'json' };
import {colors, dataset, selectedCountries,countryArray, slider, total_import, country_data, total_export,getImportValue, getSliderValue} from "./global.js";


// This part renders the map on screen
const projection = d3.geoEquirectangular()
.scale(150);

const path = d3.geoPath()
.projection(projection);

const width = 700;
const height = 300;
var dataset_total = total_import;
var is_import_local = 1;
var sliderValue =  2000;


function updateDataset(){
    if(is_import_local){
        dataset_total = total_import;
    } else{
        dataset_total = total_export;
    }
}

// Function to handle the import value change
function handleImportChange() {
    is_import_local = getImportValue();
    updateDataset();
    updateOverview();
    loadMap();
}

// Attach the event listener to the custom event
document.addEventListener("is_import_value_changed", handleImportChange);

function loadLegend(colorScale, maxVal){
    if(!d3.select("#mapLegend").select("svg").empty()){
        d3.select("#mapLegend").select("svg").remove();
    }
    // Create SVG container
    const svg = d3.select('#mapLegend')
        .append("svg")
        .attr("width", 700)
        .attr("height", 100);
    // Number of legend steps
    const numSteps = 10;

    // Create legend elements
    const legend = svg.selectAll('.legend-item')
    .data(d3.range(numSteps + 1))
    .enter().append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(${i * 50}, 0)`);

    // Draw legend colors
    legend.append('rect')
    .attr('width', 50)
    .attr('height', 15)
    .attr('fill', d => colorScale((d / numSteps) * maxVal));

    // Draw legend values
    legend.append('text')
    .attr('x', 0)
    .attr('y', 35)
    .text(d => (Math.round(((d / numSteps) * maxVal) / 1000) * 1000) ); // Display the corresponding value
}

// Function that loads the worldmap choropleth
function loadMap(){
    if(!d3.select("#content").select("svg").empty()){
        d3.select("#content").select("svg").remove();
    }

    const svg = d3.select("#content")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", "350 0 300 200");

    d3.json("europe.json").then(function(data) {
        // Draw the map
        d3.csv(dataset_total).then(function(data_one){
            const maxVal = Math.max(...data_one.map(d => d.OBS_VALUE));
            const colorScale= d3.scaleLinear()
            .domain([0, maxVal])
            .range(['white', 'blue']);

            loadLegend(colorScale, maxVal);
            
            const filteredData = data_one.filter(d => d.TIME_PERIOD === slider.value);
            svg.selectAll("path")
            .data(data.features)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", d => {
                const geocode = d.properties.iso_a2_eh;
                const value = filteredData.filter(d => d['geo'] === geocode);
                console.log("VALUE: " + geocode + " " + value);
                if (value[0]) {
                    // Use the found country data to determine the color
                    const result = value[0]['OBS_VALUE'];
                    return colorScale(result);
                } else {
                    // Handle cases where data is not available for a country
                    return 'green'; 
                }
            })
            .on("click", handleCountryClick);
        });
    });
}

loadMap();
overTime.overTImeView();

// Not in use yet 
function countryHasData(country){
    d3.csv(dataset_total).then(function(data) {
        // Check if targetValue is present in the "columnName" column
        let isValuePresent = data.some(function(d) {
          return d.geo === country;
        });
      
        if (isValuePresent) {
          console.log(`The value "${country}" is present in the column.`);
          return isValuePresent;
        } else {
          console.log(`The value "${country}" is not present in the column.`);
          return isValuePresent;
        }
      }).catch(function(error) {
        console.error('Error loading CSV data:', error);
      });
}

function getCountryCode(targetCountryName, callback) {
    d3.csv(country_data).then(function(data) {

      // Find the row corresponding to the target country name
      var targetCountryRow = data.find(function(row) {
        return row['country_name'] === targetCountryName;
      });

      // If the target country is found, retrieve its country code
      var countryCode = targetCountryRow ? targetCountryRow['country_code'] : null;
      // Call the callback function with the country code
      callback(countryCode);
    }).catch(function(error) {
      console.error("Error loading data:", error);
    });
  }

  function getCountryColor(targetCountryName, callback) {
    d3.csv(country_data).then(function(data) {

      // Find the row corresponding to the target country name
      var targetCountryRow = data.find(function(row) {
        return row['country_name'] === targetCountryName;
      });

      // If the target country is found, retrieve its country code
      var countryColor = targetCountryRow ? targetCountryRow['country_color'] : null;
      // Call the callback function with the country code
      callback(countryColor);
    }).catch(function(error) {
      console.error("Error loading data:", error);
    });
  } 

// this function updates the overTime view so that it changes from import to export values 
// and vice versa when the buttons are pressed. 
function updateOverview(){ 
    const svg = d3.select("#overTimeGraph").select("svg").remove();
    // opnieuw drawen 
    overTime.overTImeView();
    // opnieuw vullen 
    selectedCountries.forEach(country => {
        updateCountry(country,0);
        updateCountry(country,1);
    });
    console.log(selectedCountries);

}

// Handle country click event
function handleCountryClick(event, d) {
    const countryName = d.properties.name;
    const index = selectedCountries.indexOf(countryName);
    if(index === -1){
        d3.select(this).style("stroke", "#333");
    } else{
        d3.select(this).style("stroke", "#aaa");
    }
    getCountryCode(countryName, function(countryCode) {
            if(index === -1){
                selectedCountries.push(countryName);
                countryArray.push(countryCode);
                updateCountry(countryName, true);
            } else{
                selectedCountries.splice(index, 1);
                countryArray.splice(index, 1);
                updateCountry(countryName, false);
            }
    });
}

const sliderNumber = document.getElementById("yearSliderNumber");
sliderNumber.innerHTML = slider.value;

// Runs when slider is updated
slider.addEventListener("input", function() {
    sliderNumber.innerHTML = this.value;
});

// Function to handle the slider value change
function handleSliderChange() {
    sliderValue = getSliderValue();
    loadMap()
}

// Add an event listener to the slider to react to changes
document.addEventListener('DOMContentLoaded', function() {
    // Ensure the DOM is fully loaded
    // Attach the event listener to the slider
    document.getElementById("yearSlider").addEventListener("input", handleSliderChange);
    // You can also perform any initial actions when the page loads
    handleSliderChange();
});

function updateCountry(country, add) {
    d3.csv(dataset_total).then(function (allData) {
        // Reset legend
        d3.select("#legend").select("svg").remove();
        const legend = d3.select("#legend").append("svg");

        // Update graphs
        getCountryCode(country, function(countryCode) {
            const data = allData.filter(function(row) {
                return row['geo'] === countryCode;
              });
            overTime.updateOverTime(country, countryCode, add, data);
        // });
        
        // Update lines for potential new Y-axis domain
        selectedCountries.forEach((selCountry, i) => {
            getCountryColor(selCountry, function(currentCountryColor) {
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
                    .style("fill", currentCountryColor);
                legendItem.append("text")
                    .text(selCountry)
                    .attr("x", 20)
                    .attr("y", 8)
                    .attr("dy", ".35em");
            });
        })
    });
    })
}

export{getCountryColor};