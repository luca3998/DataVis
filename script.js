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
  
  // Handle country click event
  function handleCountryClick(event, d) {
    const countryName = d.properties.name;
    const index = selectedCountries.indexOf(countryName);
    if(index === -1){
        selectedCountries.push(countryName);
        d3.select(this).attr("r", 10).style("fill", "lightblue");
    } else{
        selectedCountries.splice(index, 1);
        d3.select(this).style("fill", "#e1e1e1");
    }
    comparisonView();
  }

// Comparison view: 
function comparisonView(){
    // set the dimensions and margins of the graph
    const margin = {top: 10, right: 30, bottom: 90, left: 40},
        width = 460 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    if(!d3.select("#countryOne").select("svg").empty()){
        d3.select("#countryOne").select("svg").remove();
    }
    if(!d3.select("#countryTwo").select("svg").empty()){
        d3.select("#countryTwo").select("svg").remove();
    }

    // append the svg object to the body of the page
    const svg = d3.select("#countryOne")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const svg1 = d3.select("#countryTwo")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the Data
    d3.csv("fakeData.csv").then( function(data) {

    // X axis
    const x = d3.scaleBand()
    .range([ 0, width ])
    .domain(data.map(d => d.Year))
    .padding(0.2);
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");
    svg1.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    const y = d3.scaleLinear()
    .domain([0, 1500])
    .range([ height, 0]);
    svg.append("g")
    .call(d3.axisLeft(y));
    svg1.append("g")
    .call(d3.axisLeft(y));

    // Bars
    svg.selectAll("mybar")
    .data(data)
    .join("rect")
        .attr("x", d => x(d.Year))
        .attr("width", x.bandwidth())
        .attr("fill", "#69b3a2")
        // no bar at the beginning thus:
        .attr("height", d => height - y(0)) // always equal to 0
        .attr("y", d => y(0))

    svg1.selectAll("mybar")
    .data(data)
    .join("rect")
        .attr("x", d => x(d.Year))
        .attr("width", x.bandwidth())
        .attr("fill", "#69b3a2")
        // no bar at the beginning thus:
        .attr("height", d => height - y(0)) // always equal to 0
        .attr("y", d => y(0))

    // Animation
    const energyOne = data.filter(d => d.Country === selectedCountries[0]);
    console.log(energyOne);
    svg.selectAll("rect")
    .data(energyOne)
    .transition()
    .duration(800)
    .attr("y", d => y(d.EnergyConsumption))
    .attr("height", d => height - y(d.EnergyConsumption))
    .delay((d,i) => {console.log(i); return i*100})

    const energyTwo = data.filter(d => d.Country === selectedCountries[1])
    svg1.selectAll("rect")
    .data(energyTwo)
    .transition()
    .duration(800)
    .attr("y", d => y(d.EnergyConsumption))
    .attr("height", d => height - y(d.EnergyConsumption))
    .delay((d,i) => {console.log(i); return i*100})

    })
}
  