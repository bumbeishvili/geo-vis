



Array.prototype.orderByDescending = function (func) {
  this.sort((a, b) => {
    var a = func(a);
    var b = func(b);
    if (typeof a === 'string' || a instanceof String) {
      return b.localeCompare(a);
    }
    return b - a;
  });
  return this;
}


function getChart(params) {
  // exposed variables
  var attrs = {
    svgWidth: window.innerWidth,
    svgHeight: window.innerHeight,
    marginTop: 5,
    marginBottom: 5,
    marginRight: 5,
    marginLeft: 5,
    center: [43.5, 46],
    scale: 5000,
    villages: null,
    data: null,
    geojson: null
  };


  /*############### IF EXISTS OVERWRITE ATTRIBUTES FROM PASSED PARAM  #######  */

  var attrKeys = Object.keys(attrs);
  attrKeys.forEach(function (key) {
    if (params && params[key]) {
      attrs[key] = params[key];
    }
  })


  //innerFunctions
  var updateData;



  //main chart object
  var main = function (selection) {
    selection.each(function () {

      console.log(attrs.villages)


      attrs.villages = attrs.villages.filter((d, i) => d.population && Number(d.population));
      attrs.villages = attrs.villages.filter((d, i) => d.population && Number(d.population));
      attrs.villages.orderByDescending(d => d.lat)



      //calculated properties
      var calc = {}

      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;

      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;



      //merge data





      // scales
      var scale = d3.scaleLinear()
        //  .domain()
        .range([3, 10])



      var max = d3.max(attrs.villages, d => +d.population)
      var min = 0;


      scale.domain([min, max]);



      //drawing
      var svg = d3.select(this)
        .append('svg')
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
      // .attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
      // .attr("preserveAspectRatio", "xMidYMid meet")


      var chart = svg.append('g')
        .attr('width', calc.chartWidth)
        .attr('height', calc.chartHeight)
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')')






      // attrs.geojson.features.forEach((d, i) => {
      //     console.log(i);
      //     attrs.villages.features.forEach(v => {

      //         if (d3.polygonContains(d.geometry.coordinates[0], v.geometry.coordinates)) {
      //             v.properties.region = d;
      //             console.log('found')
      //         }
      //     })
      // })


      //   window.villages = attrs.villages;

      //###############  zoom   ############

      var zoom = d3.zoom().on("zoom", zoomed);

      svg.call(zoom);


      function zoomed() {
        svg.selectAll(".tooltipContent").remove();
        var transform = d3.event.transform;
        chart.attr('transform', transform);
        attrs.lastTransform = transform;

        var k = attrs.lastTransform ? attrs.lastTransform.k : 1;
        // bubbles.attr('r', d => d[`KEY${attrs.currentYear}`].radiusZoomIndex * attrs.initialPointRadius / k)
        //   .attr('stroke-width', 1 / k)



        barGroups.each(function (d) {
          var container = d3.select(this);

          bar3d({
            container: container,
            x: 0,
            y: 0,
            height: d.population / 20 * 1 / k,
            length: 7 * 1 / k,
            slope: 3 * 1 / k

          })
        })

      }

      /* ############# PROJECTION ############### */


      var projection = d3.geoMercator()
        .scale(attrs.scale)
        .translate([calc.chartWidth / 2, 0])
        .center(attrs.center);

      var path = d3.geoPath()
        .projection(projection);





      /* ##############  DRAWING ################# */



      chart.selectAll('path')
        .data(attrs.geojson.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', d => '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6)) //random color
        .attr('fill', d => 'yellow')
        .attr('stroke', '#2C3E50')
        .attr('stroke-width', 0.1)
        .append('title')
      // .classed("tooltip", true)
      //   .text(d => d.properties.NAME_1 + " " + d.properties.data.populationPerSquareMile.toFixed(2))


      var barGroups = chart.selectAll('circle')
        .data(attrs.villages)
        .enter()
        .append('g')
        // .attr('fill', 'black')
        .attr('fill-opacity', 1)
        // .attr('r', d => { return d.population ? scale(d.population) : scale(0); })
        .attr("transform", function (d) {
          return "translate(" + projection([
            d.long,
            d.lat,
          ]) + ")";
        })


      barGroups.append('title')
        .classed("tooltip", true)
        .text(d => `${d.nameGe ? d.nameGe : d.name} ${d.subRegionName}  - ${d.regionName} -  ${d.population}`)



      barGroups.each(function (d) {
        var container = d3.select(this);
        d.barHeight = d.population / 20;

        bar3d({
          container: container,
          x: 0,
          y: 0,
          height: d.barHeight,
          length: 7,
          slope: 3

        })
      })




      // smoothly handle data updating
      updateData = function () {


      }









      function bar3d(params, isUpdate) {
        var container = params.container || d3.select("body");
        var x = params.x || 0;
        var y = params.y || 0;
        var slope = params.slope || 10;
        var height = params.height || 10;
        var length = params.length || 10;

        var leftBars = container.selectAll('.left-bar-side').data(['left-bar-side']);
        leftBars.exit().remove();

        leftBars = leftBars.enter()
          .append("path")
          .merge(leftBars);

        leftBars.attr("class", "left-bar-side")
          .attr(
          "d",
          `
            M 0 0 
            l ${length} ${slope} 
            l 0 ${slope + height} l 
           -${length}  -${slope}
    `
          )
          .attr("fill", "#998095")
          .attr("transform", `translate(${x - length},${-height + y - slope})`);



        var rightBars = container.selectAll('.right-bar-side').data(['right-bar-side']);
        rightBars.exit().remove();

        rightBars = rightBars.enter()
          .append("path")
          .merge(rightBars);

        rightBars
          .attr("class", "right-bar-side")
          .attr("fill", "#594a56")
          .attr(
          "d",
          `
            M ${length}  ${slope} 
            l ${length}  -${slope}
            l 0 ${slope + height} 
            l -${length}  ${slope}`
          )
          .attr("transform", `translate(${x - length},${-height + y - slope})`);


        var topBars = container.selectAll('.top-bar-side').data(['top-bar-side']);
        topBars.exit().remove();

        topBars = topBars.enter()
          .append("path")
          .merge(topBars);

        topBars
          .attr("class", "top-bar-side")
          .attr(
          "d",
          `M 0 0 
              l ${length}  -${slope}  
              l ${length}   ${slope}
              l -${length}  ${slope}`
          )
          .attr("fill", "#d3b1ce")
          .attr("transform", `translate(${x - length},${-height + y - slope})`);
      }





    });
  }





    ;['geojson', 'width', 'height', 'villages'].forEach(key => {
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