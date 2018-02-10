




function getChart(params) {
  // exposed variables
  var attrs = {
    fontFamily: 'Helvetica',
    svgWidth: 700,
    svgHeight: 700,
    marginTop: 200,
    marginBottom: 5,
    marginRight: 5,
    marginLeft: 5,
    center: [43.5, 44],
    scale: 7000,
    data: null,
    geojson: null
  };

  var config = {
    radius: 5,
    gridLength: 7,
    gridPadding: 7
  };




  //innerFunctions
  var updateData;


  //main chart object
  var main = function (selection) {
    selection.each(function () {

      //calculated properties
      var calc = {}

      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;

      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;



      //merge data

      attrs.geojson.features.forEach(feature => {
        feature.properties.data = attrs.data[feature.properties.NAME_1];
        feature.properties.data.populationPerSquareMile = feature.properties.data.population / feature.properties.data.area;
      })


      calc.min = d3.min(attrs.geojson.features, d => d.properties.data.populationPerSquareMile);
      calc.max = d3.max(attrs.geojson.features, d => d.properties.data.populationPerSquareMile);

      // scales


      var color = d3.scalePow()
        .exponent(0.1) //
        .domain([calc.min, calc.max])
        .range(['#32C5D2', '#22313F']);

      //drawing
      var svg = d3.select(this)
        .append('svg')
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
        .attr('font-family', 'Helvetica')
      // .attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
      // .attr("preserveAspectRatio", "xMidYMid meet")

      svg.append('text')
        .attr('font-size', 40)
        .attr('fill', 'gray')
        .text('Worker Fatalities')
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('x', attrs.svgWidth / 2)

      var defs = svg.append('defs');
      var filter = defs.append('filter').attr('id', 'gooey');
      filter.append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', config.radius * 1.8)
        .attr('result', 'blur');
      filter.append('feColorMatrix')
        .attr("class", "blurValues")
        .attr('in', 'blur')
        .attr('mode', 'matrix')
        .attr('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ' + config.radius + ' -6')
        .attr('result', 'gooey');
      filter.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("in2", "gooey")
        .attr("operator", "atop");

      var chart = svg.append('g')
        .attr('width', calc.chartWidth)
        .attr('height', calc.chartHeight)
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ') ')



      var circleData = attrs.data.deaths.map(d => {
        return {
          year: d.year,
          circles: d3.range(d.count).map(function (i) {
            return {
              year: d.year,
              r: config.radius,
              colour: "#af111c"
            }
          })
        }

      })


      data = circleData[0]

      var simulation = d3.forceSimulation(data)
        .force("x", d3.forceX(calc.chartWidth / 2))
        .force("y", d3.forceY(calc.chartHeight / 2))
        .force("collide", d3.forceCollide(config.radius + 1.5).iterations(2))
        .stop();







      /* ############# PROJECTION ############### */


      var projection = d3.geoMercator()
        .scale(attrs.scale)
        .translate([calc.chartWidth / 2, 0])
        .center(attrs.center);

      var path = d3.geoPath()
        .projection(projection);


      /* ##############  DRAWING ################# */



      chart.append('g')
        .selectAll('path')
        .data(attrs.geojson.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', "white") //random color          
        .attr('stroke', 'gray')
        .append('title')
        .classed("tooltip", true)



      var circleGroup = chart
        .selectAll('.circle-group')
        .data(circleData)
        .enter()
        .append("g")
        .attr('class', 'circle-group')
        .style("filter", "url(#gooey)")
        .attr('transform', (d, i) => `translate(${50 + i * config.gridLength * (config.gridPadding + config.radius * 2 + 3)},-90)`);

      chart
        .selectAll('.text-group')
        .data(circleData)
        .enter()
        .append("g")
        .attr('class', 'text-group')
        .attr('transform', (d, i) => `translate(${50 + i * config.gridLength * (config.gridPadding + config.radius * 2 + 3)},-90)`)
        .append('text')
        .attr('fill', 'gray')
        .text(d => d.year)
        .attr('y', -15)

      var smallCircles = circleGroup.append("g")
        .selectAll("circle")
        .data(d => d.circles)
        .enter()
        .append("circle")
        .attr("class", "small-circle")
        .attr("r", config.radius)
        .attr("cx", (d, i) => d.x = (i % config.gridLength) * (config.gridPadding + config.radius * 2))
        .attr("cy", (d, i) => d.y = Math.floor(i / config.gridLength) * (config.gridPadding + config.radius * 2))
        .attr("fill", d => d.colour);


      var bigCircle = circleGroup.append("g")
        .append("circle")
        .attr("class", "big-circle")
        .attr("cx", calc.chartWidth / 2)
        .attr("cy", calc.chartHeight / 2)
        .attr("r", 0)
        .style("fill", "#af111c");


      function loop() {
         //setTimeout(clusterDots, 1000);
        // setTimeout(separateDots, data.length * 150 + 1000);
      }

      function separateDots() {
        transitionGooBack(2000);

        d3.select(".big-circle")
          .transition()
          .duration(2100)
          .attr("r", 0);

        d3.selectAll(".small-circle")
          .transition()
          .duration(1500)
          .delay((d, i) => 1500 + (config.radius - calculateDistance(d, [calc.chartWidth / 2, calc.chartHeight / 2])) * 30)
          .attr("cx", (d, i) => (i % config.gridLength) * (config.gridPadding + config.radius * 2))
          .attr("cy", (d, i) => Math.floor(i / config.gridLength) * (config.gridPadding + config.radius * 2));
      }

      function clusterDots() {
        // Interpolate between gooey filter and no gooey filter
        transitionGoo(3000);

        for (var i = 0; i < 120; ++i) simulation.tick();

        d3.selectAll(".small-circle")
          .transition()
          .duration(1500)
          .delay((d, i) => calculateDistance(d, [calc.chartWidth / 2, calc.chartHeight / 2]) * 30)
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)

        d3.select(".big-circle")
          .transition()
          .delay(700)
          .duration(2500)
          .attr("r", Math.sqrt(data.length) * 1.5 * config.radius);
      }

      function transitionGoo(duration) {
        d3.selectAll(".blurValues")
          .transition().duration(duration)
          .attrTween("values", function () {
            return d3.interpolateString("1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 6 -6",
              "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 " + config.radius * 8 + " -6");
          });
      }

      function transitionGooBack(duration) {
        d3.selectAll(".blurValues")
          .transition().duration(duration)
          .attrTween("values", function () {
            return d3.interpolateString("1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 " + config.radius * 8 + " -6", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 6 -6");
          });
      }

      function calculateDistance(d, point) {
        return Math.sqrt(Math.pow(point[0] - d.x, 2) + Math.pow(point[1] - d.y, 2))
      }

      loop();
      setInterval(loop, data.length * 200);

      // smoothly handle data updating
      updateData = function () {


      }


    });
  }





    ;['geojson', 'width', 'height', 'svgWidth', 'svgHeight'].forEach(key => {
      // Attach variables to main function
      return main[key] = function (_) {
        var string = `attrs['${key}'] = _`;
        if (!arguments.length) { eval(`return attrs['${key}']`); }
        eval(string);
        return main;
      };
    });




  //exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    if (typeof updateData === 'function') {
      updateData();
    }
    return main;
  }


  return main;
}