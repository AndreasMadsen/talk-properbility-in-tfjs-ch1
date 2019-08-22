'use strict'

// Reduce file size by only including the d3 modules that are used
module.exports = Object.assign(
  {},
  // d3.mouse
  // d3.select
  // d3.selectAll
  require('d3-selection'),
  // d3.min
  // d3.max
  // d3.extent
  require('d3-array'),
  // d3.axisBottom
  // d3.axisLeft
  require('d3-axis'),
  // d3.scaleLinear
  // d3.scaleTime
  require('d3-scale'),
  // d3.line
  require('d3-shape'),
  // d3.csv
  require('d3-fetch')
);
