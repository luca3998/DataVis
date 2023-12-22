var infoButtons = d3.selectAll(".info-button");
var infoPopups = d3.selectAll(".info-popup");

// Add hover effect for each button
infoButtons.on("mouseover", function () {
    // Get the data-popup-id attribute value
    var popupId = d3.select(this).attr("data-popup-id");

    // Find the corresponding popup
    var popup = d3.select("#" + popupId);

    var x = d3.event.pageX + 10;
    var y = d3.event.pageY + 10;

    // Show the corresponding popup at the button position
    popup
        .style("left", x + "px")
        .style("top", y + "px")
        .style("display", "block");
})

    .on("mouseout", function () {
        // Hide the corresponding popup on mouseout
        var popupId = d3.select(this).attr("data-popup-id");
        var popup = d3.select("#" + popupId);
        popup.style("display", "none");
    });