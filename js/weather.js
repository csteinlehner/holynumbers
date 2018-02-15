var margin = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40
};

var visWidth = 800 - margin.left - margin.right;
var visHeight = 800 - margin.top - margin.bottom;
var countryFileDE = "GME00111445.json",
    countryFileIL = "IS000006771.json";
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

var drawWeather = function(requestedYear) {
    // Loading Data files in a queue and then executing a vis
    var q = d3.queue();
    var yearDataIL, yearDataDE;
    var minMaxTemp = [-20, 40];
    var maxMinTemp = minMaxTemp.slice().reverse();

    var barHeight = visHeight * 0.5;
    var arcHeight = d3
        .scaleLinear()
        .range([0, barHeight])
        .domain(minMaxTemp);
    var x = d3
        .scaleLinear()
        .domain(minMaxTemp)
        .range([0, -barHeight]);

    q.defer(function(callback) {
        d3.json("data/" + countryFileIL, function(error, wData) {
            if (error) return console.error(error);
            yearDataIL = getYearFromDataset(wData, requestedYear);
            callback(null);
        });
    });
    q.defer(function(callback) {
        d3.json("data/" + countryFileDE, function(error, wData) {
            if (error) return console.error(error);
            yearDataDE = getYearFromDataset(wData, requestedYear);
            callback(null);
        });
    });
    q.awaitAll(function(error) {
        if (error) return console.error(error);

        // Drawing calls

        // drawBarSingle(yearDataIL);
        drawCircles();
        drawRadialYearP(yearDataDE, "bar-de");
        // drawRadialYearMinMax(yearDataIL, "bar-ils");
        
        drawRadialMonthLines(yearDataDE.months);
        drawRadialLables();
        drawRadialAxis();
    });

    var svg = d3
        .select("#weather")
        .attr("width", visWidth + margin.left + margin.right)
        .attr("height", visHeight + margin.top + margin.bottom);

    var drawBarSingle = function(yearData) {
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var x = d3
            .scaleLinear()
            .rangeRound([0, visWidth])
            .domain([0, daysInYear(requestedYear)]);
        var y = d3
            .scaleLinear()
            .rangeRound([0, visHeight])
            .domain([40, -20]);

        g
            .append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y));

        g
            .selectAll(".month")
            .data(yearData.months)
            .enter()
            .append("g")
            .attr("class", "month")
            .each(drawMonth);

        function drawMonth(d, i) {
            var m = +d.key;

            d3
                .select(this)
                .selectAll(".bar")
                .data(d.days)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function(dd) {
                    var yDay = +dd.key;
                    // console.log(dd.key + '/'+ String(m) + ' : ' + daysIntoYear(new Date(requestedYear, m-1, yDay)));
                    return x(daysIntoYear(new Date(requestedYear, m - 1, yDay)));
                })
                .attr("y", function(dd) {
                    return y(+dd.values.TMAX / 10);
                })
                .attr("width", 3)
                .attr("height", function(dd) {
                    return y(+dd.values.TMIN / 10) - y(+dd.values.TMAX / 10);
                });
        }
    };

    var drawRadialYearMinMax = function(yearData, cntr) {
        var numBars = daysInYear(requestedYear);

        g = createSVGGroupRadial();

        var segments = g
            .selectAll(".month")
            .data(yearData.months)
            .enter()
            .append("g")
            .attr("class", "month")
            .attr("id", function(d) {
                return d.key;
            })
            .each(drawMonth);

        function drawMonth(d, i) {
            var m = +d.key;
            d3
                .select(this)
                .selectAll(".segments")
                .data(d.days)
                .enter()
                .append("path")
                .attr("class", "bar " + cntr)
                .attr("id", function(d) {
                    return String(m) + "-" + d.key;
                })
                .each(function(dd, i) {
                    let dayInYear = daysIntoYear(new Date(requestedYear, m - 1, +dd.key));
                    // console.log(cPos * 2 * Math.PI);
                    dd.innerRadius = arcHeight(+dd.values.TMIN / 10);
                    dd.outerRadius = arcHeight(+dd.values.TMAX / 10);
                    dd.startAngle = dayInYear * 2 * Math.PI / numBars;
                    dd.endAngle = (dayInYear + 1) * 2 * Math.PI / numBars;
                })
                .attr("d", d3.arc());
        }
    };


    var drawRadialYearP = function(yearData, cntr) {
        var numBars = daysInYear(requestedYear);
        g = createSVGGroupRadial();

        var segments = g
            .selectAll(".month")
            .data(yearData.months)
            .enter()
            .append("g")
            .attr("class", "month")
            .attr("id", function(d) {
                return d.key;
            })
            .each(drawMonth);

        function drawMonth(d, i) {
            var m = +d.key;
            d3
                .select(this)
                .selectAll(".segments")
                .data(d.days)
                .enter()
                .append("path")
                .attr("class", "bar " + cntr)
                .attr("id", function(d) {
                    return String(m) + "-" + d.key;
                })
                .each(function(dd, i) {
                    let dayInYear = daysIntoYear(new Date(requestedYear, m - 1, +dd.key));
                    // console.log(cPos * 2 * Math.PI);
                    var prcp = (+dd.values.PRCP>=0) ? +dd.values.PRCP : 0;
                    dd.innerRadius = arcHeight(0);
                    dd.outerRadius = arcHeight(prcp / 10);
                    dd.startAngle = dayInYear * 2 * Math.PI / numBars;
                    dd.endAngle = (dayInYear + 1) * 2 * Math.PI / numBars;
                })
                .attr("d", d3.arc());
        }
    };

    var drawRadialMonthLines = function(months) {
        var g = createSVGGroupRadial();
        var lines = g
            .selectAll("line")
            .data(months)
            .enter()
            .append("line")
            .attr("y2", -barHeight - 20)
            .style("stroke", "white")
            .style("stroke-width", ".5px")
            .attr("transform", function(d, i) {
                return "rotate(" + i * 360 / months.length + ")";
            });
    };

    var drawRadialLables = function() {
        var labelRadius = barHeight * 1.025;

        var labels = createSVGGroupRadial();
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
                return d.toUpperCase();
            });
    };

    var createSVGGroupRadial = function() {
        let g = svg
            .append("g")
            .attr(
                "transform",
                "translate(" +
                    (visWidth + margin.left + margin.right) / 2 +
                    "," +
                    (visHeight + margin.left + margin.right) / 2 +
                    ")"
            )
            .attr("width", visWidth - margin.left - margin.right)
            .attr("height", visHeight - margin.top - margin.bottom);
        return g;
    };
    var drawCircles = function() {
        var g = createSVGGroupRadial();
        var circles = g
            .selectAll("circle")
            .data(x.ticks(10))
            .enter()
            .append("circle")
            .attr("r", function(d) {
                return arcHeight(d);
            })
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-dasharray", "2,2")
            .style("stroke-width", ".5px");
    };
    var drawRadialAxis = function() {
        var g = createSVGGroupRadial();
        var xAxis = d3
            .axisLeft()
            .scale(x)
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
            .attr("y",-6)
            .attr("x",6);
        g
            .selectAll(".tick")
            .filter(function(d) {
                return d === minMaxTemp[0];
            })
            .remove();
    };

    // g.selectAll(".labelTMAX")
    //     .data(yearData.months[0].days)
    //     .enter().append("text")
    //     .attr("x", function(d) { return x(parseInt(d.key)); })
    //     .attr("y", function(d) { return y(parseInt(d.values.TMAX)+5); })
    //     .attr("dy", ".35em")
    //     .text(function(d) { return parseFloat(d.values.TMAX); });

    // g.selectAll(".labelTMIN")
    //     .data(yearData.months[0].days)
    //     .enter().append("text")
    //     .attr("x", function(d) { return x(parseInt(d.key)); })
    //     .attr("y", function(d) { return y(parseInt(d.values.TMIN)-5); })
    //     .attr("dy", ".35em")
    //     .text(function(d) { return parseFloa t(d.values.TMIN); });

    // yearData.months[0].days[0].values.TMAX
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
