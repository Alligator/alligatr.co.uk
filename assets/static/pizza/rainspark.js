'use strict';
var width = 1000;
var lheight  = 45;

var lmargin = 35;
var bmargin = 20;

var height = (12 * lheight) + bmargin;

d3.json('rainspark.json', function(error, data) {
  var l = data.length;

  var x = d3.scale.linear()
    .range([lmargin, width])
    .domain([1910, 2014]);

  var max = data.reduce(function(a, b) { return Math.max(a, Math.max.apply(null, b.rainfall)); }, 0);

  var y = d3.scale.linear()
    .range([lheight, height-bmargin])
    .domain([0, 11]);

  var iy = d3.scale.linear()
    .range([0, lheight])
    .domain([0, max]);

  var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append('g');

  var i = 0;

  var ticks = d3.svg.axis()
    .scale(y)
    .orient('left')
    .tickSize(0, 0)
    .tickFormat(function(d) { return ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][d]; } )
    .ticks(12)

  var bticks = d3.svg.axis()
    .scale(x)
    .orient('bottom')
    .tickSize(0, 0)
    .tickFormat(function (d) { return '' + d; })
    .ticks(20);

  svg.append('g')
    .call(ticks)
    .attr('transform', 'translate('+(lmargin-5)+', 0)')
    .selectAll('text').attr('class', 'ticklabel')
    .attr('dy', '0em')

  svg.append('g')
    .call(bticks)
    .attr('transform', 'translate(0,'+(height-bmargin+5)+')')
    .attr('class', 'ticklabel');

  for (var year in data) {
    year = data[year];

    var g = svg.append("g").selectAll('thing')
      .data(year.rainfall)
      .enter().append('rect')
        .attr('x', function(d) { return x(year.year); })
        .attr('y', function(d, i) { return y(i) - iy(d); })
        .attr('class', 'line')
        .classed('wettest', function(d) { return d == max; })
        .attr('height', function(d) { return iy(d); })
        .attr('width', 2);

    i++;
  }
});
