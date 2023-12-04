import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import worldMap from "./world.json" assert { type: 'json' };

// This part renders the map on screen
let projection = d3.geoEquirectangular()
.scale(200);

let geoGenerator = d3.geoPath()
.projection(projection);

function update(worldMap) {
let u = d3.select('#content g.map')
    .selectAll('path')
    .data(worldMap.features);

u.enter()
    .append('path')
    .attr('d', geoGenerator)
    .on("mouseover", function(d) {
        d3.select(this).attr("r", 10).style("fill", "red");
      })
    .on("mouseout", function(d) {
    d3.select(this).attr("r", 5.5).style("fill", "#e1e1e1");
    });
};

update(worldMap);
  