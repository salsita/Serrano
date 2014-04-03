/**
 * Created by tomasnovella on 4/3/14.
 */


var util = require('util');
var PI = 3.14;

exports.are = function (r) {
  return PI * r * r;
};

exports.circumference = function (r) {
  return 2 * PI * r;
};