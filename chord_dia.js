var filepath_chord = "datasets/elec_export/elec_export_2021.csv"
// Load the CSV data
function loadCSV_chord(filename){
        dir_path = "datasets/"
        filepath_chord = dir_path + filename
        console.log(filepath_chord)
}
// create the svg area
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", 500)
    .attr("height", 500)
  .append("g")
    .attr("transform", "translate(220,220)");

d3.csv(filepath_chord, function(data) {
    // Extract the relevant data (ignoring the first row and column)
    var entities = data.columns.slice(1); // Assuming the first column is the entities

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

    // Add tooltip functionality
    arcs.on("click", function(d, i) {
        // Reset color and opacity for all ribbons
        svg.selectAll("path.ribbon")
            .style("fill", "#69b3a2")
            .style("opacity", 0.3);

        // Highlight ribbons of the same color as the clicked country
        svg.selectAll("path.ribbon")
            .filter(function(ribbon) {
                return ribbon.source.index === i || ribbon.target.index === i;
            })
            .style("fill", colorScale(entities[i])) // Set ribbon color to country color
            .style("opacity", 1); // Set opacity to full for the highlighted ribbons

       // Show values in a tooltip or box
        var tooltip = d3.select("#tooltip");
        var tooltipContent = entities
            .map(function(country, index) {
                var value = +data[index][entities[i]];
                return value !== 0.0 ? country + ": " + value : null;
            })
            .filter(Boolean)
            .join("<br>");

        tooltip.html("Imports from:<br>" + tooltipContent)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 28) + "px")
            .style("opacity", 1);
    });

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
        .style("fill", "#69b3a2")
        .style("stroke", "black")
        .style("opacity", 0.3); // Set the initial opacity for all ribbons
});

// Add a div for the tooltip
var tooltipDiv = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");
