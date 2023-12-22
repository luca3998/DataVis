import {country_data, is_import_value, slider, total_export, total_import, transitionTime} from "./global.js";
import {getCountryColor} from "./script.js";

// set the dimensions and margins of the graph
const sankeyMargin = {top: 10, right: 100, bottom: 10, left: 100},
    sankeyWidth = 700  - sankeyMargin.left - sankeyMargin.right,
    sankeyHeight = 450 - sankeyMargin.top - sankeyMargin.bottom;

export var selectedCountry = "NL";
let select = document.getElementById('countrySelect');

const sankey = d3.sankey()
    .size([sankeyWidth, sankeyHeight]);

let svg;

let current_import = 0;
let current_dataset = "datasets/nrg_te_eh_linear.csv"

d3.csv("countries.csv", function (countries) {
    countries.sort((a, b) => {
        if (a.country_name < b.country_name){
            return -1;
        } else if (a.country_name > b.country_name){
            return 1;
        } else {
            return 0;
        }
    }).forEach(c => {
        const option = document.createElement('option');
        option.value = c.country_code;
        option.innerHTML = c.country_name;
        select.appendChild(option);
        if (c.country_code === selectedCountry) {
            option.selected = "selected";
        }
    })
});

function sankeyView() {
    if(!d3.select("#sankey").empty()){
        d3.select("#sankey").remove();
    }

    svg = d3.select("#sankeyView").append("svg")
        .attr("id", "sankey")
        .attr("width", sankeyWidth + sankeyMargin.left + sankeyMargin.right)
        .attr("height", sankeyHeight + sankeyMargin.top + sankeyMargin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + sankeyMargin.left + "," + sankeyMargin.top + ")");

    if (current_import) {
        sankeyImport();
    } else {
        sankeyExport();
    }
    countryGraphView(current_dataset);
}

select.addEventListener("change", function () {
    selectedCountry = this.value;
    sankeyView();
});

function sankeyImport() {
    d3.csv("datasets/nrg_ti_eh_linear.csv", function (allData) {
        const data = filterData(allData)

        const graph = {"nodes": [], "links": []};
        graph.nodes.push({"name": selectedCountry});

        // Add nodes
        data.forEach(d => {
            graph.nodes.push({"name": d.partner});
        })

        // Add links
        data.forEach(d => {
            graph.links.push({
                "source": graph.nodes.filter(n => n.name === d.partner)[0],
                "target": graph.nodes.filter(n => n.name === selectedCountry)[0],
                "value": +d.OBS_VALUE
            });
        });

        generateSankey(graph)
    })
}

function sankeyExport() {
    d3.csv("datasets/nrg_te_eh_linear.csv", function (allData) {
        const data = filterData(allData)

        var graph = {"nodes": [], "links": []};
        graph.nodes.push({"name": selectedCountry});

        // Add nodes
        data.forEach(d => {
            graph.nodes.push({"name": d.partner});
        })

        // Add links
        data.forEach(d => {
            graph.links.push({
                "source": graph.nodes.filter(n => n.name === selectedCountry)[0],
                "target": graph.nodes.filter(n => n.name === d.partner)[0],
                "value": +d.OBS_VALUE
            });
        });

        generateSankey(graph)
    })
}

function filterData(data) {
    return data.filter(d => (
        d.geo === selectedCountry
        && d.TIME_PERIOD === slider.value
        && d.unit === "GWH"
        && d.OBS_VALUE > 0.0
        && d.partner !== "TOTAL"
    ));
}

function generateSankey(graph) {
    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(1)

    d3.csv("countries.csv", function (countries) {
        svg.append("g").attr("class", "links")
            .selectAll(".link")
            .data(graph.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", sankey.link())
            .style("stroke-width", function (d) {
                return d.dy;
            })
            .style("stroke", "lightgrey")
            .attr('fill', 'none')

        // add in the nodes
        const nodes = svg.append("g").attr("class", "nodes")
            .selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        function getColor(country_code) {
            const country = countries.filter(c => c.country_code === country_code);
            return country.length > 0 ? country[0].country_color : "black";
        }
        // add the rectangles for the nodes
        nodes
            .append("rect")
            .attr("height", function (d) {
                return Math.abs(d.dy);
            })
            .attr("width", function (d)  {
                return d.dx;
            })
            .style("fill", function (d) {
                return getColor(d.name)
            })
            .style("stroke", function (d) {
                return d3.rgb(getColor(d.name)).darker(2);
            });

        // Country text
        nodes
            .append("text")
            .attr("class", "countryText")
            .attr("x", -6)
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function (d) {
                return d.name;
            })
            // Below only executes for the left nodes
            .filter(function (d) {
                return d.x < sankeyWidth / 2;
            })
            .attr("x", function (d) {
                return 6 + d.dx
            })
            .attr("text-anchor", "start");

        // Number text
        nodes.append("text")
            .attr("class", "numberText")
            .attr("x", function (d) {
                return 6 + d.dx
            })
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("transform", null)
            .text(function (d) {
                return d.value.toLocaleString('ru-RU') + " GWh";
            })
            // Below only executes for the left nodes
            .filter(function (d) {
                return d.x < sankeyWidth / 2;
            })
            .attr("x", -6)
            .attr("text-anchor", "end");
    })
}

slider.addEventListener("change", function() {
    if (current_import) {
        updateImportSankey();
    } else {
        updateExportSankey();
    }
});

function updateImportSankey() {
    d3.csv("datasets/nrg_ti_eh_linear.csv", function (allData) {
        const data = filterData(allData)

        const graph = {"nodes": sankey.nodes(), "links": sankey.links()};

        // Remove unused nodes and links
        graph.nodes = graph.nodes.filter(n => n.name === selectedCountry || data.filter(d => d.partner === n.name).length > 0)
        graph.links = graph.links.filter(l => data.filter(d => d.partner === l.source.name).length > 0)

        // Add nodes of new countries
        data.forEach(d => {
            if (graph.nodes.filter(n => n.name === d.partner).length === 0) {
                graph.nodes.push({"name": d.partner});
            }
        })

        // Adjust link values of existing countries and add new links for new countries
        data.forEach(d => {
            const linkFilter = graph.links.filter(l => l.source.name === d.partner);
            if (linkFilter.length === 1) {
                linkFilter[0].value = +d.OBS_VALUE;
            } else {
                graph.links.push({
                    "source": graph.nodes.filter(n => n.name === d.partner)[0],
                    "target": graph.nodes.filter(n => n.name === selectedCountry)[0],
                    "value": +d.OBS_VALUE
                });
            }
        });

        updateSankey(graph)
    })
}

function updateExportSankey() {
    d3.csv("datasets/nrg_te_eh_linear.csv", function (allData) {
        const data = filterData(allData)

        const graph = {"nodes": sankey.nodes(), "links": sankey.links()};

        // Remove unused nodes and links
        graph.nodes = graph.nodes.filter(n => data.filter(d => d.partner === n.name).length > 0 || n.name === selectedCountry)
        graph.links = graph.links.filter(l => data.filter(d => d.partner === l.target.name).length > 0)

        // Add nodes of new countries
        data.forEach(d => {
            if (graph.nodes.filter(n => n.name === d.partner).length === 0) {
                graph.nodes.push({"name": d.partner});
            }
        })

        // Adjust link values of existing countries and add new links for new countries
        data.forEach(d => {
            const linkFilter = graph.links.filter(l => l.target.name === d.partner);
            if (linkFilter.length === 1) {
                linkFilter[0].value = +d.OBS_VALUE;
            } else {
                graph.links.push({
                    "source": graph.nodes.filter(n => n.name === selectedCountry)[0],
                    "target": graph.nodes.filter(n => n.name === d.partner)[0],
                    "value": +d.OBS_VALUE
                });
            }
        });

        updateSankey(graph)
    })
}

function updateSankey(graph) {
    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(1)

    d3.csv("countries.csv", function (countries) {
        const links = svg.select(".links").selectAll(".link")
            .data(graph.links);

        const newLinks = links.enter().append("path")
            .attr("class", "link")
            .attr("d", sankey.link())
            .style("stroke-width", function (d) {
                return d.dy;
            })
            .style("stroke", "lightgrey")
            .attr('fill', 'none')

        links
            .transition()
            .duration(transitionTime)
            .attr("d", sankey.link())
            .style("stroke-width", function (d) {
                return d.dy;
            })

        links.exit().remove();


        // add in the nodes
        const nodes = svg.select(".nodes").selectAll(".node")
            .data(graph.nodes);

        const newNodes = nodes.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        nodes
            .transition()
            .duration(transitionTime)
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        function getColor(country_code) {
            const country = countries.filter(c => c.country_code === country_code);
            return country.length > 0 ? country[0].country_color : "black";
        }

        newNodes
            .append("rect")
            .attr("height", function (d) {
                return Math.abs(d.dy);
            })
            .attr("width", function (d)  {
                return d.dx;
            })
            .style("fill", function (d) {
                return getColor(d.name)
            })
            .style("stroke", function (d) {
                return d3.rgb(getColor(d.name)).darker(2);
            });

        nodes.select("rect")
            .transition()
            .duration(transitionTime)
            .attr("height", function (d) {
                return Math.abs(d.dy);
            })
            .attr("width", function (d)  {
                return d.dx;
            })
            .style("fill", function (d) {
                return getColor(d.name)
            })
            .style("stroke", function (d) {
                return d3.rgb(getColor(d.name)).darker(2);
            });

        // Country text
        newNodes
            .append("text")
            .attr("x", -6)
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function (d) {
                return d.name;
            })
            // Below only executes for the left nodes
            .filter(function (d) {
                return d.x < sankeyWidth / 2;
            })
            .attr("x", function (d) {
                return 6 + d.dx
            })
            .attr("text-anchor", "start");

        nodes.select(".countryText")
            .transition()
            .duration(transitionTime)
            .attr("x", -6)
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .text(function (d) {
                return d.name;
            })
            // Below only executes for the left nodes
            .filter(function (d) {
                return d.x < sankeyWidth / 2;
            })
            .attr("x", function (d) {
                return 6 + d.dx
            })

        // Number text
        newNodes.append("text")
            .attr("x", function (d) {
                return 6 + d.dx
            })
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("transform", null)
            .text(function (d) {
                return d.value.toLocaleString('ru-RU') + " GWh";
            })
            // Below only executes for the left nodes
            .filter(function (d) {
                return d.x < sankeyWidth / 2;
            })
            .attr("x", -6)
            .attr("text-anchor", "end");

        nodes.select(".numberText")
            .transition()
            .duration(transitionTime)
            .attr("x", function (d) {
                return 6 + d.dx
            })
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .text(function (d) {
                return d.value.toLocaleString('ru-RU') + " GWh";
            })
            // Below only executes for the left nodes
            .filter(function (d) {
                return d.x < sankeyWidth / 2;
            })
            .attr("x", -6)

        nodes.exit().remove();
    })
}


document.getElementById("toggle").addEventListener("change",function(){
    const is_import = this.checked ? 1 : 0;
    if (is_import) {
        current_import = 1;
        current_dataset = "datasets/nrg_ti_eh_linear.csv"
    }
    else {
        current_import = 0;
        current_dataset = "datasets/nrg_te_eh_linear.csv"
    }
    sankeyView();
    countryGraphView(current_dataset)
});

// set the dimensions and margins of the graph
const graphMargin = {top: 10, right: 30, bottom: 90, left: 60},
    graphWidth = 800 - graphMargin.left - graphMargin.right,
    graphHeight = 450 - graphMargin.top - graphMargin.bottom;

const min_year = 1990
const max_year = 2021

// X axis
const xAxis = d3.scalePoint()
    .range([ 0, graphWidth ])
    .domain(Array.from({length: max_year+1 - min_year}, (x, i) => i + min_year));

function countryGraphView(dataset) {
    d3.select("#countryGraph").select("svg").remove();

    var svg=d3.select('#countryGraph').append('svg')
        .attr('width', graphWidth + graphMargin.left + graphMargin.right)
        .attr('height', graphHeight + graphMargin.top + graphMargin.bottom)
        .append("g")
        .attr("transform", `translate(${graphMargin.left},${graphMargin.top})`);

    d3.csv(dataset, function (allData) {
        const data = allData.filter(d => (
            d.geo === selectedCountry
            && d.unit === "GWH"
            && d.OBS_VALUE > 0.0
            && d.partner !== "TOTAL"
        ))

        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + graphHeight + ")")
            .call(d3.axisBottom(xAxis));

        // Y axis
        const yAxis = d3.scaleLinear()
            .domain([])
            .range([ graphHeight, 0]);

        const maxVal = Math.max(...data.map(d => d.OBS_VALUE))
        yAxis.domain([0, maxVal * 1.1])

        svg.append("g")
            .attr("class", "yAxis")
            .call(d3.axisLeft(yAxis));

        svg.append("line")
            .attr("class", "yearLine")
            .attr("fill", "none")
            .attr("stroke", "rgba(255,128,0,0.5)")
            .attr("stroke-width", 2.5)
            .attr("x1", xAxis(slider.value))
            .attr("y1", 0)
            .attr("x2", xAxis(slider.value))
            .attr("y2", graphHeight);

        const allCountries = []
        data.forEach(d => {
            if (!allCountries.includes(d.partner))
                allCountries.push(d.partner)
        });

        d3.csv(country_data, function(countries) {
            function getColor(country_code) {
                const country = countries.filter(c => c.country_code === country_code);
                return country.length > 0 ? country[0].country_color : "black";
            }

            allCountries.forEach(c => {
                let currentCountryData = data.filter(d => d.partner === c)

                // Set value to 0 in missing years for countries that do show up at some point but not consistently
                for (let year = min_year; year <= max_year; year++) {
                    let i = year - min_year;
                    if (!currentCountryData[i] || currentCountryData[i].TIME_PERIOD !== year.toString()) {
                        currentCountryData.splice(i, 0, {"TIME_PERIOD": year, "OBS_VALUE": 0})
                    }
                }
                // Add country line
                svg.append("path")
                    .attr("class", c + "Data")
                    .datum(currentCountryData)
                    .attr("fill", "none")
                    .attr("stroke", getColor(c))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(function (d) {
                            return xAxis(+d.TIME_PERIOD)
                        })
                        .y(function (d) {
                            return yAxis(d.OBS_VALUE)
                        })
                    );

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
                    .attr("y", graphHeight + 50)
                    .attr("x", (graphWidth/2))
                    .style("text-anchor", "middle")
                    .text("Year");

                // Add y-axis title
                svg.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 0 - 60)
                    .attr("x", -(graphHeight/2))
                    .attr("dy", "1em")
                    .style("text-anchor", "middle")
                    .text("GWh");
            });
        })
    });

    slider.addEventListener("input", function() {
        d3.select("#countryGraph").selectAll(".yearLine")
            .transition().ease(d3.easePolyOut)
            .duration(transitionTime)
            .attr("x1", xAxis(this.value))
            .attr("x2", xAxis(this.value))

        d3.select("#countryGraph").selectAll(".yearValue")
            .transition().ease(d3.easePolyOut)
            .duration(transitionTime)
            .attr("x", xAxis(this.value) + 10)
            .text(slider.value)
    });
}

export {sankeyView, countryGraphView}