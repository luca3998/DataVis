
import { getSliderValue, selectedCountries } from './global.js';


var filepath_chord = "datasets/elec_export/elec_export_2000.csv"
var is_import_global = 1
var sliderValue = 2020
var countryArray = ['NL','DE','FR']

// Function to handle the slider value change
function handleSliderChange() {
    sliderValue = getSliderValue();
    console.log('Current slider value:', sliderValue);

    reloadFigure()
}

// Add an event listener to the slider to react to changes
document.addEventListener('DOMContentLoaded', function() {
    // Ensure the DOM is fully loaded

    // Attach the event listener to the slider
    document.getElementById("yearSlider").addEventListener("input", handleSliderChange);

    // You can also perform any initial actions when the page loads
    handleSliderChange();
});


// Add event listener for Import button
document.getElementById("import_button").addEventListener("click", function() {
    is_import_global = 1;
    console.log("import button")
    reloadFigure();
});

// Add event listener for Export button
document.getElementById("export_button").addEventListener("click", function() {
    is_import_global = 0;
    console.log("export button")
    reloadFigure();
});

function reloadFigure() {
    // You can add any additional logic or modifications needed before reloading the figure
    console.log(sliderValue)
    loadCSV_chord(); // Assuming sliderNumber is defined
}


// Load the CSV data
function loadCSV_chord(){
        if(is_import_global === 1){
            filepath_chord = `datasets/elec_import/elec_import_${sliderValue}.csv`;
        }
        else if (is_import_global === 0){
            filepath_chord =  `datasets/elec_export/elec_export_${sliderValue}.csv`;
        }
        console.log(filepath_chord)

        drawChordDiagram();
}

function drawChordDiagram(){
    if(!d3.select("#my_dataviz").select("svg").empty()){
        d3.select("#my_dataviz").select("svg").remove();
    }
// create the svg area
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", 600)
    .attr("height", 600)
    .append("g")
    .attr("transform", "translate(300,300)");

d3.csv(filepath_chord, function(data) {

    // Extract the relevant data (ignoring the first row and column)
    var entities = data.columns.slice(1); // Assuming the first column is the entities
    console.log('Data:', data); // Log the data array to the console
    console.log('Entities:', entities); // Log the entities array to the console
    
    // Create a color scale
    var colorScale = d3.scaleOrdinal()
        .domain(entities)
        .range(d3.schemeCategory10); // You can use any color scheme you prefer

    // Convert the data to a matrix format
    var matrix = data.map(function(row) {
        return entities.map(function(entity) {
            return +row[entity]; // Assuming the values are numeric
        });
    });

    // Give this matrix to d3.chord()
    var res = d3.chord()
        .padAngle(0.05) // padding between entities (black arc)
        .sortSubgroups(d3.descending)
        (matrix);

    // Add the groups on the inner part of the circle
    var group = svg
        .datum(res)
        .append("g")
        .selectAll("g")
        .data(function (d) {
            return d.groups;
        })
        .enter()
        .append("g");

    // Add the arcs
    var arcs = group.append("path")
        .style("fill", function(d, i) { return colorScale(entities[i]); })
        .style("stroke", "black")
        .attr("d", d3.arc()
            .innerRadius(200)
            .outerRadius(210)
        );


    // Add the country names as labels
    group.append("text")
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("class", "titles")
        .attr("transform", function(d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (210 + 10) + ")"
                + (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
        .text(function(d, i) { return entities[i]; });

// Add the links between groups
svg
    .datum(res)
    .append("g")
    .selectAll("path.ribbon")
    .data(function (d) {
        return d;
    })
    .enter()
    .append("path")
    .attr("class", "ribbon")
    .attr("d", d3.ribbon()
        .radius(200)
    )
    .style("fill", function (d) {
        return "#69b3a2"; // Set the initial fill color for all ribbons
    })
    .style("stroke", "black")
    .style("opacity", 0); // Set the initial opacity for all ribbons

// Highlight ribbons for countries in countryArray
countryArray.forEach(function (country) {
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

}
)}
