// load the data
const high_load = d3.csv("./japan_pop_high_fert.csv");
const medium_load = d3.csv("./japan_pop_medium_fert.csv");
const low_load = d3.csv("./japan_pop_low_fert.csv");
const ratios_load = d3.csv("./japan_dependency_ratio.csv");

Promise.all([high_load, medium_load, low_load, ratios_load]).then( (values) => drawPlot(values));

let currentSlide = 0;

const next_slide = function({ pop_medium, ratios, svg, width, height }) {
    if(currentSlide >= slide_data.length - 1 ) { return; }
    currentSlide++;
    load_slide({ pop_medium, ratios, svg, width, height });
}

const back_slide = function({ pop_medium, ratios, svg, width, height }) {
    if(currentSlide <= 0 ) { return; }
    currentSlide--;
    load_slide({ pop_medium, ratios, svg, width, height });
}

const load_slide = function({ pop_medium, ratios, svg, width, height }) {
    d3.select('#viz-anno').text( slide_data[currentSlide].text );

    const year = slide_data[currentSlide].year;
    updateYear({ year, pop_medium, ratios, svg, width, height });
    update_rect_cover({ svg, height, width });
}

const update_rect_cover = function({ svg, height, width } ) {

    // our scale for years
    var xScale = d3.scaleLinear()
        .domain([2015, 2065])
        .range([0, width]);
    
    svg.select('.cover-rect').remove();

    const currentYear = slide_data[currentSlide].year;

    if(currentYear != 2065) {
        svg.append('rect')
            .attr("class", "cover-rect")
            .attr("y", 0)
            .attr("height", height)
            .attr("x", function (d) { return xScale(currentYear) + 5; })
            .attr("width", function (d) {  return xScale(2065) - xScale(currentYear) - 5 });
    }
}

const slide_data = [
    {
        year: 2020,
        text: 'By 2020, the population has started to drop noticeably. Each dependent is supported by approx. 1.5 workers.'
    },
    {
        year: 2040,
        text: 'By 2040, the population has dropped by nearly 20 million since 2020. Only 1.17 workers support each dependent.'
    },
    {
        year: 2065,
        text: 'By 2065, the population has plummetted by nearly 40 million since 2020. Only 1.06 workers support each dependent (which are mostly retirees).'
    },
];

let currentSelection = {
}

const updateYear = function({ year, pop_medium, ratios, svg, width, height }) {

    let newSelection = {

    };

    newSelection.year = year;
    
    newSelection.pop = [];
    for(let i = 0; i < pop_medium.length; i++ ) {
        pyear = parseInt( pop_medium[i].year );
        if( year == pyear ) {
            var tot = parseInt(pop_medium[i]["total"]);
            var low = parseInt(pop_medium[i]["-14"]);
            var mid = parseInt(pop_medium[i]["15-64"]);
            var older = parseInt(pop_medium[i]["65-"]);
        }
    }

    newSelection.pop.push(
        {
            'group':'-14',
            'population':low
        }
    );

    newSelection.pop.push(
        {
            'group':'15-64',
            'population':mid
        }
    );

    newSelection.pop.push(
        {
            'group':'65-',
            'population':older
        }
    );


    newSelection.dep = [];
    for(let i = 0; i < ratios.length; i++ ) {
        pyear = parseInt( ratios[i].year );
        if( year == pyear ) {
            var dp = ratios[i].medium / 100;
        }
    }


    const workers = 1/dp;
    const dependent = 1;

    newSelection.dep.push(
        {
            'group':'workers',
            'population':workers
        }
    );

    newSelection.dep.push(
        {
            'group':'dependants',
            'population':dependent
        }
    );

    currentSelection = newSelection;

    update_current_year_viz({ svg, width, height });
}

drawPlot = function(data_array) {

    const pop_high = data_array[0]
    const pop_medium = data_array[1]
    const pop_low = data_array[2]
    const ratios = data_array[3]

    const margin = {top: 50, right: 400, bottom: 200, left: 100};
    const width = 600;
    const height = 500;

    // our scale for years
    var xScale = d3.scaleLinear()
        .domain([ratios[0].year, ratios[ratios.length - 1].year])
        .range([0, width]);

    // our y-scale for population
    var yScale_population = d3.scaleLinear()
        .domain([80000, 130000])
        .range([height, 0]);

    // our y-scale for dependency ratio
    var yScale_ratios = d3.scaleLinear()
        .domain([0.6, 1])
        .range([height, 0]);

    // our line function for population
    var line_population = d3.line()
        .x(function(d) { return xScale(d.year); })
        .y(function(d) { return yScale_population(d.total); })
        .curve(d3.curveMonotoneX)

    // our lines function for ratios
    var line_ratios_medium = d3.line()
        .x(function(d) { return xScale(d.year); })
        .y(function(d) { return yScale_ratios(d.medium / 100); })
        .curve(d3.curveMonotoneX)

    var line_ratios_high = d3.line()
        .x(function(d) { return xScale(d.year); })
        .y(function(d) { return yScale_ratios(d.high / 100); })
        .curve(d3.curveMonotoneX)

    var line_ratios_low = d3.line()
        .x(function(d) { return xScale(d.year); })
        .y(function(d) { return yScale_ratios(d.low / 100); })
        .curve(d3.curveMonotoneX)

    var svg = d3.select("#viz-container").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(
            d3.axisBottom(xScale)
            .tickFormat(d3.format("d"))
        );

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale_population));

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(d3.axisRight(yScale_ratios));

    // text label for the x axis
    svg.append("text")             
    .attr("transform",
            "translate(" + (width/2) + " ," + 
                        (height + 50) + ")")
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .text("Year");

  // text label for the left y-axis
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .attr("class", "axis-label")
      .style("text-anchor", "middle")
      .text("Population (thousands)");   

  // text label for the right y-axis
  svg.append("text")
      .attr("transform", "rotate(90)")
      .attr("y", 0 - (width + 50))
      .attr("x",height / 2)
      //.attr("dy", "1em")
      .attr("class", "axis-label")
      .style("text-anchor", "middle")
      .text("Dependency Ratio");   

    // high line
    svg.append("path")
        .datum(pop_high)
        .attr("class", "high-line")
        .attr("d", line_population);

    // medium line
    svg.append("path")
        .datum(pop_medium)
        .attr("class", "medium-line")
        .attr("d", line_population);

     // low line
    svg.append("path")
    .datum(pop_low)
    .attr("class", "low-line")
    .attr("d", line_population);

     // ratio line
     svg.append("path")
     .datum(ratios)
     .attr("class", "ratio-line-medium")
     .attr("d", line_ratios_medium);

     svg.append("path")
     .datum(ratios)
     .attr("class", "ratio-line-high")
     .attr("d", line_ratios_high);

     svg.append("path")
     .datum(ratios)
     .attr("class", "ratio-line-low")
     .attr("d", line_ratios_low);

    // points for population
    svg.selectAll(".dot")
        .data(pop_medium)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", function (d) { return xScale(d.year) })
        .attr("cy", function (d) { return yScale_population(d.total) })
        .attr("r", 5)
        .on("click", function (d) {
            let year = d.year;
            updateYear({ year, pop_medium, ratios, svg, width, height });
        })
        .on("mouseover", function (d,i) {
            d3.select(this)
                .attr("class", "moused-over-dot")
                .attr("r", 10);

            showPopulationTooltip(d);
            })
        .on("mouseout", function (d) {
            d3.select(this)
                .attr("class", "dot")
                .attr("r", 5);

            hidePopulationTooltip();
        });

     // points for ratios
     svg.selectAll(".dot-ratio")
     .data(ratios)
     .enter().append("circle")
     .attr("class", "dot-ratio")
     .attr("cx", function(d) { return xScale(d.year); })
     .attr("cy", function(d) { return yScale_ratios(d.medium / 100); })
     .attr("r", 5)
     .on("click", function(d) {
        let year = d.year;
        updateYear({ year, pop_medium, ratios, svg, width, height });
    })
    .on("mouseover", function(d) { 
        d3.select(this)
            .attr("class", "moused-over-dot")
            .attr("r", 10);

            showRatioTooltip(d);
    })
    .on("mouseout", function(d) { 
        d3.select(this)
            .attr("class", "dot-ratio")
            .attr("r", 5);

        hideRatioTooltip();
    });


    load_slide({ pop_medium, ratios, svg, width, height });

     // add our legend
     add_legend({ svg, width, height });


     // add click handlers to our buttons
     d3.select('#button-next')
        .on("click", ()=>( next_slide({ pop_medium, ratios, svg, width, height })));

    d3.select('#button-back')
        .on("click", ()=>( back_slide({ pop_medium, ratios, svg, width, height })));

    }

const showPopulationTooltip = function(d) {
    d3.select(".population-tooltip")
        .transition().duration(300)
            .style("left", (d3.event.pageX) + "px")		
            .style("top", (d3.event.pageY - 28) + "px")
            .style("opacity", 1);
    
    
            d3.select(".population-tooltip")
                .html(getHTMLForPopulationToolTip(d));     
}

const hidePopulationTooltip = function(d) {
    d3.select(".population-tooltip")
        .transition().duration(500)
            .style("opacity", 0);
}

const getHTMLForPopulationToolTip = function(d) {

    html = "<div style=\"font-weight:bold;\">Data for year: " + d.year + "</div>";
    
    html += "<table style=\"border:0;margin-top:10px;\">";

    html += "<tr>";
    html += "<td>Total population:</td>";
    html += "<td>" + numberWithCommas(d.total * 1000) + "</td>";
    html += "</tr>";

    html += "<tr>";
    html += "<td>Ages 65+:</td>";
    html += "<td>" + numberWithCommas(d['65-'] * 1000) + "</td>";
    html += "</tr>";

    html += "<tr>";
    html += "<td>Ages 15-64:</td>";
    html += "<td>" + numberWithCommas(d['15-64'] * 1000) + "</td>";
    html += "</tr>";

    html += "<tr>";
    html += "<td>Ages 0-14:</td>";
    html += "<td>" + numberWithCommas(d['-14'] * 1000) + "</td>";
    html += "</tr>";

    html += "</table>";

    return html;
}

const showRatioTooltip = function(d) {
    d3.select(".ratio-tooltip")
        .transition().duration(300)
            .style("left", (d3.event.pageX) + "px")		
            .style("top", (d3.event.pageY - 28) + "px")
            .style("opacity", 1);
    
    
            d3.select(".ratio-tooltip")
                .html(getHTMLForRatioToolTip(d));     
}

const hideRatioTooltip = function(d) {
    d3.select(".ratio-tooltip")
        .transition().duration(500)
            .style("opacity", 0);
}

const getHTMLForRatioToolTip = function(d) {

    html = "<div style=\"font-weight:bold;\">Data for year: " + d.year + "</div>";
    
    html += "<div>Dependency Ratios:</div>";

    html += "<table style=\"border:0;margin-top:10px;\">";

    html += "<tr>";
    html += "<td>Low Fertility:</td>";
    html += "<td>" + (d.low / 100).toFixed(2) + "</td>";
    html += "</tr>";

    html += "<tr>";
    html += "<td>Medium Fertility:</td>";
    html += "<td>" + (d.medium / 100).toFixed(2) + "</td>";
    html += "</tr>";

    html += "<tr>";
    html += "<td>High Fertility:</td>";
    html += "<td>" + (d.high / 100).toFixed(2) + "</td>";
    html += "</tr>";

    html += "</table>";

    return html;
}

const numberWithCommas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const add_selected_year_indicator = function({ svg, width, height }) {

        const year = currentSelection.year;

        // our scale for years
        var xScale = d3.scaleLinear()
        .domain([2015, 2065])
        .range([0, width]);

        svg.select(".year-indicator").remove();

        svg.append("rect")
            .attr("class", "year-indicator")
            .attr("width", 10)
            .attr("height", height)
            .transition()
                .attr("delay", () => (1000))
                .attr("duration", () => (1000))
                .attr("x", xScale(year)-5);

};

const update_current_year_viz = function ({ svg, width, height }) {

    figureWidth = 310;
    figureHeight = 385;

    svg.select('.current-year-figure').remove();

    add_selected_year_indicator({ svg, width, height })

    svg.append("g")
        .attr("class", "current-year-figure")
        .attr("transform", "translate(" + (width + 80) + "," + (120) + ")");

    svg.select(".current-year-figure")
        .append("rect")
        .attr("class", "legend-border")
        .attr("width", figureWidth)
        .attr("height", figureHeight)
        .attr("x", 0)
        .attr("y", 0);

    svg.select(".current-year-figure")
        .append("text")
        .attr("x", 50)
        .attr("y", 20)
        .text(() => ('Population Demographics for ' + currentSelection.year))

    svg.select(".current-year-figure")
        .append("text")
        .attr("x", 50)
        .attr("y", 220)
        .text(() => ('Number of Workers per Dependent'))

    // add a bar chart for population makeup

    const chartHeight = 125
    const chartWidth = 210

    svg.select(".current-year-figure")
        .append("g")
        .attr("class", "pop-makeup-chart")
        .attr("transform", "translate(" + (60) + "," + (35) + ")");

    // set the ranges
    let y = d3.scaleBand()
        .domain(['-14', '15-64', '65-'])
        .range([chartHeight, 0]);

    let x = d3.scaleLinear()
        .domain([0, 100000])
        .range([0, chartWidth]);

    // append the rectangles for the bar chart
    svg.select(".pop-makeup-chart").selectAll(".bar")
        .data(currentSelection.pop)
        .enter().append("rect")
        .attr("class", "pop-bar")
        .attr("y", function (d) { return y(d.group); })
        .attr("height", y.bandwidth() - 1)
        .attr("x", function (d) { return 0; })
        .transition()
            .attr("delay", () => (1000))
            .attr("duration", () => (1000))
            .attr("width", function (d) { return x(d.population); });

    // add the x Axis
    svg.select(".pop-makeup-chart").append("g")
        .attr("transform", "translate(0," + chartHeight + ")")
        .call(d3.axisBottom(x).ticks(2));

    // add the y Axis
    svg.select(".pop-makeup-chart").append("g")
        .call(d3.axisLeft(y));

  // text label for the left x-axis
  svg.select(".pop-makeup-chart").append("text")
      .attr("y", chartHeight + 20)
      .attr("x", (chartWidth / 2))
      .attr("dy", "1em")
      .attr("class", "axis-label-small")
      .style("text-anchor", "middle")
      .text("Population (thousands)");   

  // text label for the left y-axis
  svg.select(".pop-makeup-chart").append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - 57)
      .attr("x",0 - (chartHeight / 2))
      .attr("dy", "1em")
      .attr("class", "axis-label-small")
      .style("text-anchor", "middle")
      .text("Age");   


    // add bar char for # of people supporting dependent people

    svg.select(".current-year-figure")
        .append("g")
        .attr("class", "ratio-chart")
        .attr("transform", "translate(" + (60) + "," + (235) + ")");

    // set the ranges
    y = d3.scaleBand()
        .domain(['workers', 'dependant'])
        .range([chartHeight, 0]);

    x = d3.scaleLinear()
        .domain([0, 2])
        .range([0, chartWidth]);

    // append the rectangles for the bar chart
    svg.select(".ratio-chart").selectAll(".bar")
        .data(currentSelection.dep)
        .enter().append("rect")
        .attr("class", "ratio-bar")
        .attr("y", function (d) { return y(d.group); })
        .attr("height", y.bandwidth() - 1)
        .attr("x", function (d) { return 0; })
        .transition()
            .attr("delay", () => (1000))
            .attr("duration", () => (1000))
            .attr("width", function (d) { return x(d.population); });

    // add the x Axis
    svg.select(".ratio-chart").append("g")
        .attr("transform", "translate(0," + chartHeight + ")")
        .call(d3.axisBottom(x).ticks(2));

    // add the y Axis
    svg.select(".ratio-chart").append("g")
        .call(d3.axisLeft(y));

}

/**
 * Add in the legend
 * 
 * @param {*} param0 
 */
const add_legend = function({ svg, width, height }) {

    legendWidth = 310;
    legendHeight = 100;

    svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width +80) + "," + (0) + ")");

    // add border to legend
    svg.select(".legend")
        .append("rect")
        .attr("class", "legend-border")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("x", 0)
        .attr("y", 0);

    // add in dependency ratio legend
    svg.select(".legend").append("g")
        .attr("class", "legend-left")
        .attr("transform", "translate(10, 20)");


    svg.select(".legend-left").append("text")
        .attr("x", "10")
        .attr("class", "axis-label")
        .text("Dependency Ratio");

    svg.select(".legend-left").append("line")
        .attr("class", "ratio-line-high")
        .attr("y1", 20)
        .attr("x2", 40)
        .attr("y2", 20);

    svg.select(".legend-left").append("text")
        .attr("y", "25")
        .attr("x", "50")
        .attr("class", "legend-text")
        .text("High Fertility");

    svg.select(".legend-left").append("line")
        .attr("class", "ratio-line-medium")
        .attr("y1", 40)
        .attr("x2", 40)
        .attr("y2", 40);

    svg.select(".legend-left").append("text")
        .attr("y", "45")
        .attr("x", "50")
        .attr("class", "legend-text")
        .text("Medium Fertility");

    svg.select(".legend-left").append("line")
        .attr("class", "ratio-line-low")
        .attr("x1", 0)
        .attr("y1", 60)
        .attr("x2", 40)
        .attr("y2", 60);

    svg.select(".legend-left").append("text")
        .attr("y", "65")
        .attr("x", "50")
        .attr("class", "legend-text")
        .text("Low Fertility");

    // add in population legend
    svg.select(".legend").append("g")
        .attr("class", "legend-right")
        .attr("transform", "translate(165, 20)");


    svg.select(".legend-right").append("text")
        .attr("x", "10")
        .attr("class", "axis-label")
        .text("Population");

    svg.select(".legend-right").append("line")
        .attr("class", "high-line")
        .attr("y1", 20)
        .attr("x2", 40)
        .attr("y2", 20);

    svg.select(".legend-right").append("text")
        .attr("y", "25")
        .attr("x", "50")
        .attr("class", "legend-text")
        .text("High Fertility");

    svg.select(".legend-right").append("line")
        .attr("class", "medium-line")
        .attr("y1", 40)
        .attr("x2", 40)
        .attr("y2", 40);

    svg.select(".legend-right").append("text")
        .attr("y", "45")
        .attr("x", "50")
        .attr("class", "legend-text")
        .text("Medium Fertility");

    svg.select(".legend-right").append("line")
        .attr("class", "low-line")
        .attr("x1", 0)
        .attr("y1", 60)
        .attr("x2", 40)
        .attr("y2", 60);

    svg.select(".legend-right").append("text")
        .attr("y", "65")
        .attr("x", "50")
        .attr("class", "legend-text")
        .text("Low Fertility");  

}