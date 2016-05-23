var width = 100000;
var height = 100000;
var zoom = d3.behavior.zoom()
                      .scaleExtent([0.01, 1])
                      .on("zoom", zoom);

var drag = d3.behavior.drag()
                      .origin(function(d) { return d; })
                      .on("drag", drag);

var svg = d3.select("body").append("svg")
                            .attr("width", width )
                            .attr("height", height)
                            .call(zoom);
var rect = svg.append("rect")
              .attr("width", width)
              .attr("height", height)
              .style("fill", "none")
              .style("pointer-events", "all");
var svgContainer = svg.append("g");

function addRect(minx, miny, maxx, maxy){
svgContainer.append("rect")
           .attr("x", minx)
           .attr("y", miny)
           .attr("width", (maxx-minx))
           .attr("height", (maxy-miny))
           .attr("fill", 'none')
           .attr("stroke", 'black')
           .attr("stroke-width", '50');;
}


function zoom() {
svgContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function drag(d) {
d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}
