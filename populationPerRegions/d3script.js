




function getChart(params) {
    // exposed variables
    var attrs = {
        svgWidth: 700,
        svgHeight: 700,
        marginTop: 5,
        marginBottom: 5,
        marginRight: 5,
        marginLeft: 5,
        center: [43.5, 44],
        scale: 5000,
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
            // .attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
            // .attr("preserveAspectRatio", "xMidYMid meet")


            var chart = svg.append('g')
                .attr('width', calc.chartWidth)
                .attr('height', calc.chartHeight)
                .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')')



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
                .attr('fill', d => {
                    if (!d.properties.data.populationPerSquareMile) { return 'red'; }
                    return color(d.properties.data.populationPerSquareMile)
                })
                .append('title')
                .classed("tooltip", true)
                .text(d => d.properties.NAME_1 + " " + d.properties.data.populationPerSquareMile.toFixed(2))


            // smoothly handle data updating
            updateData = function () {


            }


        });
    }





        ;['geojson', 'width', 'height'].forEach(key => {
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