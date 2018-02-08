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
var requestedYear = "2012";
var maxHeight = 1800;

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

var drawPrcp = function() {
    var q = d3.queue();
    var yearDataIL, yearDataDE;
    var allYearsIL, allYearsDE;

    var svg = d3
        .select("#weather")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    q.defer(function(callback) {
        d3.json("data/" + countryFileIL, function(error, wData) {
            if (error) return console.error(error);
            allYearsIL = wData;

            // console.log("IL "+getMaxForYears(wData));
            callback(null);
        });
    });
    q.defer(function(callback) {
        d3.json("data/" + countryFileDE, function(error, wData) {
            if (error) return console.error(error);
            allYearsDE = wData;

            // console.log("DE "+getMaxForYears(wData));
            callback(null);
        });
    });

    q.awaitAll(function(error) {
        if (error) return console.error(error);

        function fillSelector() {
            yearList = [];
            for (var yy in allYearsIL.years) {
                if (yy != 0 && yy != allYearsIL.years.length-1) {
                    yearList.push(allYearsIL.years[yy].key);
                }
            }
            d3
                .select("#years-to-select")
                .on("change", function(d) {
                    var y = d3.select(this).property("value");
                    checkButtonVis(y.toString());
                    render(y);
                })
                .selectAll("option")
                .data(yearList)
                .enter()
                .append("option")
                .attr("value", function(d) {
                    return d;
                })
                .text(function(d) {
                    return d;
                });
        }
        function setupBtn(){
            d3.select("#next")
            .on("click",selectNext);

            d3.select("#prev")
            .on("click",selectPrev)
        }

        fillSelector();
        setupBtn();
        checkButtonVis(yearList[0]);
        render(yearList[0]);
    });

    function selectNext(){
        var nextSelection = parseInt(d3.select("#years-to-select").node().value)+1;
        d3.select("#years-to-select").property("value",nextSelection);
        render((nextSelection).toString());
        checkButtonVis(nextSelection);
    }

    function selectPrev(){
        var prevSelection = parseInt(d3.select("#years-to-select").node().value)-1;
        d3.select("#years-to-select").property("value",prevSelection);
        render((prevSelection).toString());
        checkButtonVis(prevSelection);
    }

    function checkButtonVis(selection){
        if(yearList[yearList.length -1] == selection){
            d3.select("#next").style("visibility","hidden");
        }else{
            d3.select("#next").style("visibility","visible");
        }
        if(yearList[0] == selection){
            d3.select("#prev").style("visibility","hidden");
        }else{
            d3.select("#prev").style("visibility","visible");
        }
    }


    function initSVG() {
        svg.selectAll("*").remove();
    }
    function render(requestedYear) {
        initSVG();
        yearDataIL = getYearFromDataset(allYearsIL, requestedYear);
        yearDataDE = getYearFromDataset(allYearsDE, requestedYear);
        drawRadialYearPrcp(yearDataIL, "Jerusalem", [1, 0]);
        drawRadialYearPrcp(yearDataDE, "Berlin", [3, 0]);
    }

    function drawRadialYearPrcp(yearData, cntr, pos) {
        // var numBars = daysInYear(requestedYear);
        var barHeight = smallHeight * 0.5;
        var yearStats = getMaxTotalYear(yearData);
        var arcHeight = d3
            .scaleLinear()
            .range([innerRing, barHeight])
            // .domain([0, getMaxInYear(yearData, "PRCP")]);
            .domain([0, maxHeight]);

        var allScale = d3
            .scaleLinear()
            .domain([0, 10000])
            .range([0, 15]);

        var drawCircles = function() {
            var g = createSVGGroupRadial(pos, "circles");
            // console.log(arcHeight.ticks(10));
            var circles = g
                .selectAll("circle")
                .data(arcHeight.ticks(10))
                .enter()
                .append("circle")
                .attr("r", function(d) {
                    return arcHeight(d);
                })
                .style("fill", "none")
                .style("stroke", "#999999")
                // .style("stroke-dasharray", function(d,i){return String(i+1*4)+","+String(i+1*8)})
                .style("stroke-width", ".5px");
        };

        drawCircles();

        var drawRadialMonthLines = function() {
            var g = createSVGGroupRadial(pos, "monthLines");
            var lines = g
                .selectAll("line")
                .data(monthNames)
                .enter()
                .append("line")
                .attr("y1", -innerRing)
                .attr("y2", -barHeight-10)
                .attr("class", "monthline")
                .attr("transform", function(d, i) {
                    return "rotate(" + i * 360 / monthNames.length + ")";
                });
        };
        drawRadialMonthLines();
       

        var drawRadialMonthLabels = function() {
            var labelRadius = barHeight * 1.025;
    
            var labels = createSVGGroupRadial(pos, "monthnames");
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
                .style("text-anchor", "middle")
                .style("font-weight", "bold")
                .style("fill", "#3e3e3e")
                .append("textPath")
                .attr("class", "textpath")
                .attr("xlink:href", "#label-path")
                .attr("startOffset", function(d, i) {
                    return i * 100 / 12 + 50 / 12 + "%";
                })
                .text(function(d) {
                    return d;
                });
        };

        

        var drawAvgCircle = function() {
            var g = createSVGGroupRadial(pos, "avg-circle");
            g
                .append("circle")
                .attr("r", arcHeight(yearStats.avg))
                .attr("class", "avg-circle-"+cntr);
        };

        drawAvgCircle();

        createSVGGroupRadial(pos, "bars")
            .selectAll(".weeks")
            .data(yearData.weeks)
            .enter()
            .append("path")
            .attr("class", "weekbar-" + cntr)
            .attr("id", function(d) {
                return d.key;
            })
            .each(function(dd, i) {
                dd.innerRadius = arcHeight(0);
                dd.outerRadius = arcHeight(+dd.value);
                dd.startAngle = i * 2 * Math.PI / yearData.weeks.length;
                dd.endAngle = (i + 1) * 2 * Math.PI / yearData.weeks.length;
            })
            .attr("d", d3.arc());

        // Year Text in center of Vis
        svg
            .append("g")
            .attr("transform", "translate(" + calcTranslate(pos) + ")")
            .append("text")
            .attr("class", "diagram-year")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .text(cntr);

        var drawRadialWeekLines = function() {
            var g = createSVGGroupRadial(pos, "weeklines");
            var lines = g
                .selectAll("line")
                .data(yearData.weeks)
                .enter()
                .append("line")
                .attr("y2", -barHeight)
                .style("stroke", "#999999")
                .style("stroke-width", ".5px")
                .attr("transform", function(d, i) {
                    return "rotate(" + i * 360 / yearData.weeks.length + ")";
                });
        };

        // drawRadialWeekLines();

        var drawRadialWeekLabels = function() {
            var labelRadius = barHeight;

            var labels = createSVGGroupRadial(pos, "weeklabels");
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
                .data(yearData.weeks)
                .enter()
                .append("text")
                .style("text-anchor", "middle")
                // .style("font-weight", "light")
                .style("fill", "#3e3e3e")
                .append("textPath")
                .attr("class", "textpath")
                .attr("xlink:href", "#label-path")
                .attr("startOffset", function(d, i) {
                    return i * 100 / yearData.weeks.length + 50 / yearData.weeks.length + "%";
                })
                .text(function(d) {
                    return d.key;
                });
        };
        // drawRadialLables();

        var drawRadialAxis = function() {
            var g = createSVGGroupRadial(pos, "axisText");
            var xAxis = d3
                .axisLeft()
                .scale(arcHeight)
                // .tickFormat(d3.format(".2f"))
                .ticks(10);

            g
                .append("g")
                .attr("class", "x axis")
                .call(xAxis);
            g
                .append("g")
                .attr("class", "x axis")
                .attr("transform", "rotate(90)")
                .call(xAxis);
            g
                .selectAll(".tick")
                .select("text")
                .attr("y", -6)
                .attr("x", 10)
                .attr("alignment-baseline", "central");
            g
                .selectAll(".tick")
                .filter(function(d, i) {
                    return d === 0 || d % 400;
                })
                .remove();
        };

        drawRadialAxis();
        drawRadialMonthLabels();
        
        // Total point in center
        // svg
        // .append("g")
        // .attr("transform", "translate(" + calcTranslate(pos) + ")")
        // .append("circle")
        // .attr("r",allScale(allYear.total));
        
    }

    var calcTranslate = function(pos) {
        return (
            (smallWidth * pos[0] + margin.left + margin.right * pos[0]) / 2 +
            "," +
            (smallHeight + margin.left + margin.right) / 2
        );
    };

    var createSVGGroupRadial = function(pos, id) {
        let g = svg
            .append("g")
            .attr("class",id)
            .attr("transform", "translate(" + calcTranslate(pos) + ")")
            .attr("width", smallWidth - margin.left - margin.right)
            .attr("height", smallHeight - margin.top - margin.bottom);
        return g;
    };
};

function getYearFromDataset(wData, requestedYear) {
    let yearData;
    // Iterate through all years to find the right one
    for (var yy in wData.years) {
        if (wData.years[yy].key == requestedYear) yearData = wData.years[yy];
    }
    return yearData;
}

function daysIntoYear(date) {
    return (
        (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
            Date.UTC(date.getFullYear(), 0, 0)) /
        24 /
        60 /
        60 /
        1000
    );
}

function daysInYear(year) {
    var start = new Date(year, 0, 0),
        end = new Date(year, 11, 31),
        diff = end - start,
        days = diff / (1000 * 60 * 60 * 24);
    return days;
}

function getCumulativeYear(yData) {
    let all = 0;
    yData.weeks.map(function(d) {
        all += d.value;
    });
    return all;
}
function getMaxYear(yData) {
    let max = 0;
    yData.weeks.map(function(d) {
        max = d.value > max ? d.value : max;
    });
    return max;
}

function getMaxForYears(data) {
    let max = 0;
    data.years.map(function(d) {
        d.weeks.map(function(dd) {
            max = dd.value > max ? dd.value : max;
        });
    });
    return max;
}

function getMaxTotalYear(yData) {
    let yearStats = new Object();
    yearStats.max = getMaxYear(yData);
    yearStats.total = getCumulativeYear(yData);
    yearStats.avg = parseFloat(yearStats.total) / parseFloat(yData.weeks.length);
    return yearStats;
}
