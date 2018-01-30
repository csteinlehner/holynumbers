var margin = {top: 40, right: 40, bottom: 40, left: 40};


var drawWeather = function (requestedYear, countryFile) {
    var visWidth = 1400 - margin.left - margin.right;
    var visHeight = 1080 - margin.top - margin.bottom;
    

    var svg = d3.select("svg")
             .attr("id","graph")
             .attr("width", visWidth + margin.left + margin.right)
             .attr("height", visHeight + margin.top + margin.bottom)

    g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
            .rangeRound([0, visWidth])
            .domain([0, 365]);
    var y = d3.scaleLinear()
            .rangeRound([0, visHeight])
            .domain([400, -200]);


    d3.json("data/"+countryFile, function(error, wData) {
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

        g.selectAll(".month")
            .data(yearData.months)
            .enter().append('g')
            .attr("class", "month")
            .each(drawMonth)

        function drawMonth(d, i) {
                var m = parseInt(d.key);
                 
                d3.select(this).selectAll(".bar")
                .data(d.days)
                .enter()
                    .append("rect")
                    .attr("class", "bar")
                    .attr("x", function(dd) { 
                        var yDay = parseInt(dd.key);
                        // console.log(dd.key + '/'+ String(m) + ' : ' + daysIntoYear(new Date(requestedYear, m-1, yDay)));
                        return x(daysIntoYear(new Date(requestedYear, m-1, yDay))); 
                    })
                    .attr("y", function(dd) { return y(parseInt(dd.values.TMAX)); })
                    // .attr(" y", function(dd) { return y(parseInt(dd.key)); })
                    .attr("width", 3)
                    .attr("height", function(dd) { return y(parseInt(dd.values.TMIN)) - y(parseInt(dd.values.TMAX)); });
            }

        function daysIntoYear(date){
            return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
        }
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
        //     .text(function(d) { return parseFloat(d.values.TMIN); });


        // yearData.months[0].days[0].values.TMAX
        
      });
};