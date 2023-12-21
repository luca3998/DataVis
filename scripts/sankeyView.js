import {slider, transitionTime} from "./global.js";

// set the dimensions and margins of the graph
const sankeyMargin = {top: 10, right: 100, bottom: 10, left: 100},
    sankeyWidth = 700  - sankeyMargin.left - sankeyMargin.right,
    sankeyHeight = 450 - sankeyMargin.top - sankeyMargin.bottom;

let importAmount = 0;

export var selectedCountry = "NL";
let select = document.getElementById('countrySelect');

const exportSankey = d3.sankey()
    .size([sankeyWidth, sankeyHeight]);

const importSankey = d3.sankey()
    .size([sankeyWidth, sankeyHeight]);

let importSvg;

let exportSvg;

d3.csv("countries.csv", function (countries) {
    countries.forEach(c => {
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
    if(!d3.select("#sankeyExport").empty()){
        importAmount = 0;
        d3.select("#sankeyImport").remove();
        d3.select("#sankeyExport").remove();
    }

    importSvg = d3.select("#sankeyView").append("svg")
        .attr("id", "sankeyImport")
        .attr("width", sankeyWidth + sankeyMargin.left + sankeyMargin.right)
        .attr("height", sankeyHeight + sankeyMargin.top + sankeyMargin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + sankeyMargin.left + "," + sankeyMargin.top + ")");

    exportSvg = d3.select("#sankeyView").append("svg")
        .attr("id", "sankeyExport")
        .attr("width", sankeyWidth + sankeyMargin.left + sankeyMargin.right)
        .attr("height", sankeyHeight + sankeyMargin.top + sankeyMargin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + sankeyMargin.left + "," + sankeyMargin.top + ")");
    sankeyImport();
    sankeyExport();
}

select.addEventListener("change", function () {
    selectedCountry = this.value;
    sankeyView();
});

function sankeyImport() {
    d3.csv("../datasets/nrg_ti_eh_linear.csv", function (allData) {
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

        generateSankey(graph, importSankey, importSvg)
    })
}

function sankeyExport() {
    d3.csv("../datasets/nrg_te_eh_linear.csv", function (allData) {
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

        generateSankey(graph, exportSankey, exportSvg)
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

function generateSankey(graph, sankey, svg) {
    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(1)

    if (importAmount === 0) {
        importAmount = sankey.nodes()[0].value;
    } else {
        sankey.nodes()[0].dx = sankey.nodes()[0].value / importAmount * sankey.nodeWidth();
    }


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
    importAmount = 0;
    updateImportSankey();
    updateExportSankey();
});

function updateImportSankey() {
    d3.csv("../datasets/nrg_ti_eh_linear.csv", function (allData) {
        const data = filterData(allData)

        const graph = {"nodes": importSankey.nodes(), "links": importSankey.links()};

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

        updateSankey(graph, importSankey, importSvg)
    })
}

function updateExportSankey() {
    d3.csv("../datasets/nrg_te_eh_linear.csv", function (allData) {
        const data = filterData(allData)

        const graph = {"nodes": exportSankey.nodes(), "links": exportSankey.links()};

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

        updateSankey(graph, exportSankey, exportSvg)
    })
}

function updateSankey(graph, sankey, svg) {
    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(1)

    if (importAmount === 0) {
        importAmount = sankey.nodes()[0].value;
    } else {
        sankey.nodes()[0].dx = sankey.nodes()[0].value / importAmount * sankey.nodeWidth();
    }

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


export {sankeyView}