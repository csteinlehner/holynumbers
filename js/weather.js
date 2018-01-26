var margin = {top: 40, right: 40, bottom: 40, left: 40};

var visWidth = 1080 - margin.left - margin.right;
var visHeight = 1080 - margin.top - margin.bottom;

var drawWeather = function (requestedYear) {
    

    var svg = d3.select("svg")
             .attr("id","graph")
             .attr("width", visWidth + margin.left + margin.right)
             .attr("height", visHeight + margin.top + margin.bottom)

    g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
            .rangeRound([0, visWidth])
            .domain([0, 31]);
    var y = d3.scaleLinear()
            .rangeRound([0, visHeight])
            .domain([400, -200]);


    d3.json("data/GME00111445.json", function(error, wData) {
        if (error) return console.error(error);

        wData.years;
        // var yearData = d3.values(wData.years)
        var yearData;
        for (var yy in wData.years) {
            if(wData.years[yy].key==requestedYear) yearData = wData.years[yy];
        }
  

        g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y));

        console.log(d3.max(yearData.months[0].days, function(d) { return d.values.TMAX; }))
        g.selectAll(".bar")
            .data(yearData.months[0].days)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(parseInt(d.key)); })
            // .attr("y", function(d) { return y(parseInt(d.values.TMAX)); })
            .attr("y", function(d) { return y(parseInt(d.values.TMAX)); })
            .attr("width", 10)
            .attr("height", function(d) { return y(parseInt(d.values.TMIN)) - y(parseInt(d.values.TMAX)); });

        g.selectAll(".bar")
            .data(yearData.months[0].days)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(parseInt(d.key)); })
            // .attr("y", function(d) { return y(parseInt(d.values.TMAX)); })
            .attr("y", function(d) { return y(parseInt(d.values.TMAX)); })
            .attr("width", 10)
            .attr("height", function(d) { return y(parseInt(d.values.TMIN)) - y(parseInt(d.values.TMAX)); });

        g.selectAll(".labelTMAX")
            .data(yearData.months[0].days)
            .enter().append("text")
            .attr("x", function(d) { return x(parseInt(d.key)); })
            .attr("y", function(d) { return y(parseInt(d.values.TMAX)+20); })
            .attr("dy", ".35em")
            .text(function(d) { return parseFloat(d.values.TMAX); });
        
        g.selectAll(".labelTMIN")
            .data(yearData.months[0].days)
            .enter().append("text")
            .attr("x", function(d) { return x(parseInt(d.key)); })
            .attr("y", function(d) { return y(parseInt(d.values.TMIN)-20); })
            .attr("dy", ".35em")
            .text(function(d) { return parseFloat(d.values.TMIN); });


        // yearData.months[0].days[0].values.TMAX
        
      });
};