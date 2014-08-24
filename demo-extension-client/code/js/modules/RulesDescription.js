/**
 * Created by tomasnovella on 8/21/14.
 */
var _ = require('../libs/lodash');

/**
 * Analyzes and describes the current rules object.
 * @param rules
 * @returns {string} Returns the text description of the rules object.
 */
function describe(rules) {
  var res = '';
  if (!rules) { return res; }
  if(rules.scraping) {
    res += 'Following scraping units found:\n';
    if (rules.scraping.result) {
      res += 'One unnamed scraping unit.\n';
    } else {
      _.forEach(rules.scraping, function(val, key) {
        res += 'Scraping unit named "' + key + '".\n';
      });
    }
  }

  if (rules.actions) {
    res += 'Following actions found:\n';
    if (_.isArray(rules.actions)) {
      res += 'One unnamed action.\n';
    } else {
      _.forEach(rules.actions, function(val, key) {
        res += 'Action named "' + key + '".\n';
      });
    }
  }
  return res;
}

module.exports.describe = describe;
