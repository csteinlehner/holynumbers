var margin = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40
};

var width = 900 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;
var smallWidth = 400;
var smallHeight = 400;
var innerRing = 40;
var countryFileDE = "GME00111445-PRCP.json",
    countryFileIL = "IS000006771-PRCP.json";
var maxHeight = 120;

var monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];
// var svg;

var drawPrcp = function () {
    var q = d3.queue();
    var yearDataIL, yearDataDE;
    var allYearsIL, allYearsDE;

    var barHeight = smallHeight * 0.5;
    var arcHeight = d3
        .scaleLinear()
        .range([innerRing, barHeight])
        // .domain([0, getMaxInYear(yearData, "PRCP")]);
        .domain([0, maxHeight]);

    var svg = d3
        .select("#weather")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    // Loading data
    q.defer(function (callback) {
        d3.json("data/" + countryFileIL, function (error, wData) {
            if (error) return console.error(error);
            allYearsIL = wData;

            callback(null);
        });
    });
    q.defer(function (callback) {
        d3.json("data/" + countryFileDE, function (error, wData) {
            if (error) return console.error(error);
            allYearsDE = wData;
            callback(null);
        });
    });

    q.awaitAll(function (error) {
        if (error) return console.error(error);

        function fillSelector() {
            yearList = [];
            for (var yy in allYearsIL.years) {
                if (yy != 0 && yy != allYearsIL.years.length - 1) {
                    yearList.push(allYearsIL.years[yy].key);
                }
            }
            d3
                .select("#years-to-select")
                .on("change", function (d) {
                    var y = d3.select(this).property("value");
                    checkButtonVis(y.toString());
                    initRender(y);
                })
                .selectAll("option")
                .data(yearList)
                .enter()
                .append("option")
                .attr("value", function (d) {
                    return d;
                })
                .text(function (d) {
                    return d;
                });
        }

        function setupBtn() {
            d3.select("#nextbtn").on("click", selectNext);

            d3.select("#prevbtn").on("click", selectPrev);
        }


        fillSelector();
        setupBtn();
        checkButtonVis(yearList[0]);
        initRender(yearList[0]);
    });

    function selectNext() {
        var nextSelection = parseInt(d3.select("#years-to-select").node().value) + 1;
        d3.select("#years-to-select").property("value", nextSelection);
        updateRender(nextSelection.toString());
        checkButtonVis(nextSelection);

    }

    function selectPrev() {
        var prevSelection = parseInt(d3.select("#years-to-select").node().value) - 1;
        d3.select("#years-to-select").property("value", prevSelection);
        updateRender(prevSelection.toString());
        checkButtonVis(prevSelection);
    }

    function checkButtonVis(selection) {
        if (yearList[yearList.length - 1] == selection) {
            d3.select("#nextbtn").style("visibility", "hidden");
        } else {
            d3.select("#nextbtn").style("visibility", "visible");
        }
        if (yearList[0] == selection) {
            d3.select("#prevbtn").style("visibility", "hidden");
        } else {
            d3.select("#prevbtn").style("visibility", "visible");
        }
    }

    function initRender(requestedYear) {
        svg.selectAll("*").remove();
        yearDataIL = getYearFromDataset(allYearsIL, requestedYear);
        yearDataDE = getYearFromDataset(allYearsDE, requestedYear);
        initRadialYearPrcp(yearDataIL, "jerusalem", [1, 0]);
        initRadialYearPrcp(yearDataDE, "berlin", [3, 0]);
        initToolTip();
    }

    function initToolTip() {
        tooltip = d3.select("#weather").append("div")
            .attr("class", "tooltip")
            .attr("id", "hovertooltip")
            .style("opacity", 0);
    }

    function updateRender(requestedYear) {
        yearDataIL = getYearFromDataset(allYearsIL, requestedYear);
        yearDataDE = getYearFromDataset(allYearsDE, requestedYear);
        updateRadialYearPrcp(yearDataIL, "jerusalem", [1, 0]);
        updateRadialYearPrcp(yearDataDE, "berlin", [3, 0]);
    }

    function initRadialYearPrcp(yearData, cntr, pos) {
        var yearStats = getYearStats(yearData);
        var parent = svg.append("g").attr("id", "vis-" + cntr);

        drawCircles(pos, parent);
        drawRadialMonthLines(pos, parent);
        drawAvgCircle(pos, yearStats, cntr, parent);

        createSVGGroupRadial(pos, "bars", parent)
            .selectAll("weekbar-" + cntr)
            .data(yearData.weeks)
            .enter()
            .append("path")
            .attr("class", "weekbar-" + cntr)
            .attr("id", function (d) {
                return cntr + "-" + d.key;
            })
            .each(function (dd, i) {
                calcArc(dd, i, yearData);
            })
            .attr("d", d3.arc())
            // Tooltip
            .on("mouseover", function (d) {
                // console.log(parseFloat(d.startAngle)*2*Math.PI);		
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html("Week: " + d.key + "<br />" + d.value / 10 + " mm")
                    // .style("transform","rotate("+parseFloat(d.startAngle)*(180 / Math.PI)+"deg)")
                    .style("left", (d3.event.pageX + 20) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(250)
                    .style("opacity", 0);
            });

        drawRadialAxisLabels(pos, parent);
        drawRadialMonthLabels(pos, parent);
        createSVGGroupRadial(pos, "center-label", parent);
        drawCenterLabel(pos, cntr, parent, yearStats);
        createSVGGroupRadial(pos, "max-circle", parent);
        drawMaxCircle(pos, cntr, yearStats);
    }


    function updateRadialYearPrcp(yearData, cntr, pos) {
        var yearStats = getYearStats(yearData);

        updateAvgCircle(pos, yearStats, cntr);

        var selection = d3
            .select("#vis-" + cntr)
            .select(".bars")
            .selectAll(".weekbar-" + cntr)
            .data(yearData.weeks);

        selection
            .enter()
            .append("path")
            .classed("weekbar-" + cntr, true)
            .attr("id", function (d) {
                return d.key;
            })
            .each(function (dd, i) {
                calcArc(dd, i, yearData);
            })
            .attr("d", d3.arc());

        selection
            .classed("weekbar-" + cntr, true)
            .each(function (dd, i) {
                calcArc(dd, i, yearData);
            })
            .attr("d", d3.arc());

        selection.exit().remove();
        drawCenterLabel(pos, cntr, parent, yearStats);
        drawMaxCircle(pos, cntr, yearStats);
    }

    function drawMaxCircle(pos, cntr, yearStats) {
        var g = d3.select("#vis-" + cntr).select(".max-circle");
        var labelRadius = arcHeight(yearStats.max);
        labelRadius = (labelRadius > barHeight) ? barHeight : labelRadius;
        g.selectAll("*").remove();
        g.append("def")
            .append("path")
            .attr("id", "max-path-" + cntr)
            .attr(
                "d",
                "m" + 0 + " " + -labelRadius + " a" + (labelRadius+2) + " " + (labelRadius+2) + " 0 1,0 0.01 0"
            );

        g
            .append("path")
            .classed("max-path", true)
            .classed(cntr + "-stroke", true)
            .attr(
                "d",
                "m" + 0 + " " + -labelRadius + " a" + labelRadius + " " + labelRadius + " 0 1,0 0.01 0"
            );

        g
            .append("text")
            .classed("max-label noselect", true)
            .style("text-anchor", "middle")
            .append("textPath")
            .attr("xlink:href", "#max-path-" + cntr)
            .attr("startOffset", '50%')
            // .attr("style","fill: "+)
            .text("max: " + Math.round(yearStats.max) + " mm");
    }

    function calcArc(dd, i, yearData) {
        dd.innerRadius = arcHeight(0);
        dd.outerRadius = arcHeight(+dd.value / 10);
        dd.startAngle = i * 2 * Math.PI / yearData.weeks.length;
        dd.endAngle = (i + 1) * 2 * Math.PI / yearData.weeks.length;
    }

    function drawCircles(pos, parent) {
        var g = createSVGGroupRadial(pos, "circles", parent);
        var circles = g
            .selectAll("circle")
            .data(arcHeight.ticks(10))
            .enter()
            .append("circle")
            .attr("r", function (d) {
                return arcHeight(d);
            })
            .classed("axis-circle", true);

        circles.filter(function (d) {
            return d === 0;
        }).classed("axis-circle-zero", true);
    }

    function drawRadialMonthLines(pos, parent) {
        var g = createSVGGroupRadial(pos, "monthLines", parent);
        var lines = g
            .selectAll("line")
            .data(monthNames)
            .enter()
            .append("line")
            .attr("y1", -innerRing - 5)
            .attr("y2", -barHeight - 10)
            .classed("monthline", true)
            .attr("transform", function (d, i) {
                return "rotate(" + i * 360 / monthNames.length + ")";
            });
    }

    function drawRadialMonthLabels(pos, parent) {
        var labelRadius = barHeight * 1.025;

        var labels = createSVGGroupRadial(pos, "monthnames", parent);
        labels
            //.attr("class", "labels")
            .append("def")
            .append("path")
            .attr("id", "label-path")
            .attr(
                "d",
                "m0 " + -labelRadius + " a" + labelRadius + " " + labelRadius + " 0 1,1 -0.01 0"
            );
        labels
            .selectAll("text")
            .data(monthNames)
            .enter()
            .append("text")
            .classed("monthlabels noselect", true)
            .style("text-anchor", "middle")
            .append("textPath")
            .classed("textpath", true)
            .attr("xlink:href", "#label-path")
            .attr("startOffset", function (d, i) {
                return i * 100 / 12 + 50 / 12 + "%";
            })
            .text(function (d) {
                return d;
            });
    }

    function drawAvgCircle(pos, yearStats, cntr, parent) {
        var g = createSVGGroupRadial(pos, "avg-circle", parent);
        g
            .append("circle")
            .attr("r", arcHeight(yearStats.avg))
            .attr("class", "avg-circle-inner " + cntr + "-fill");
    }

    function updateAvgCircle(pos, yearStats, cntr) {
        var circle = d3.select("#vis-" + cntr).select(".avg-circle").select("circle");
        circle
            .attr("r", arcHeight(yearStats.avg))
    }

    function drawCenterLabel(pos, cntr, parent, yearStats) {
        // Year Text in center of Vis
        // var g = createSVGGroupRadial(pos, "center-label", parent);
        var g = d3.select("#vis-" + cntr).select(".center-label");
        g.selectAll("*").remove();
        g
            .append("text")
            .classed("centerlabel noselect", true)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .text(cntr);
        g
            .append("text")
            .attr("transform", "translate(0,14)")
            .classed("centerlabel-avg noselect", true)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .text("avg: " + Math.round(yearStats.avg) + " mm");
    }

    function drawRadialAxisLabels(pos, parent) {
        var g = createSVGGroupRadial(pos, "axisText", parent);
        var xAxis = d3
            .axisLeft()
            .scale(arcHeight)
            // .tickFormat(d3.format(".2f"))
            .ticks(4);

        var finalDeg = 360;
        var currentDeg = 60;
        var stepSize = 90;
        while (currentDeg < finalDeg) {
            g
                .append("g")
                .attr("class", "x axis noselect")
                .attr("transform", "rotate(" + currentDeg + ")")
                .call(xAxis)
                .selectAll("text")
                .attr("y", -6)
                .attr("x", 10)
                .attr("transform", function () {
                    var rot = (currentDeg > 60 && currentDeg < 270) ? 180 : 0;
                    return "rotate(" + rot + ")";
                })
                .attr("alignment-baseline", "central");
            currentDeg += stepSize;
        }

        g
            .selectAll(".tick")
            .filter(function (d, i) {
                return d === 0 || !(d % 40);
            })
            .remove();
    }

    function calcTranslate(pos) {
        return (
            (smallWidth * pos[0] + margin.left + margin.right * pos[0]) / 2 +
            "," +
            (smallHeight + margin.left + margin.right) / 2
        );
    };

    function createSVGGroupRadial(pos, id, parent) {
        var g = parent
            .append("g")
            .attr("class", id)
            .attr("transform", "translate(" + calcTranslate(pos) + ")")
            .attr("width", smallWidth - margin.left - margin.right)
            .attr("height", smallHeight - margin.top - margin.bottom);
        return g;
    };
};

function getYearFromDataset(wData, requestedYear) {
    var yearData;
    // Iterate through all years to find the right one
    for (var yy in wData.years) {
        if (wData.years[yy].key == requestedYear) yearData = wData.years[yy];
    }
    return yearData;
}

function getCumulativeYear(yData) {
    var all = 0;
    yData.weeks.map(function (d) {
        all += d.value / 10;
    });
    return all;
}

function getMaxYear(yData) {
    var max = 0;
    yData.weeks.map(function (d) {
        max = d.value / 10 > max ? d.value / 10 : max;
    });
    return max;
}

function getYearStats(yData) {
    var yearStats = new Object();
    yearStats.max = getMaxYear(yData);
    yearStats.total = getCumulativeYear(yData);
    yearStats.avg = yearStats.total / yData.weeks.length;
    var allWeeksVals = yData.weeks.map(function (d, i) {
        return d.value;
    });
    yearStats.median = median(allWeeksVals);
    return yearStats;
}

function median(values) {

    values.sort(function (a, b) {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];
    else
        return (values[half - 1] + values[half]) / 2.0;
}