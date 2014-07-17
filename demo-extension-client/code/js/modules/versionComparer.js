var _ = require('../libs/lodash');

/**
 * Compares two versions of program.
 * @param {string} o Old version
 * @param {string} n New version
 * @returns Returns 1 if the versions are equal, 2 is n is newer version than o, otherwise
 *   returns 0.
 */
function compare(o, n) {
  var oarr = _.map(o.split('.'), function(item){return parseInt(item);});
  var narr = _.map(n.split('.'), function(item){return parseInt(item);});

  return _.foldl(_.zip(oarr, narr), function(acc, comp) {
    // 1 means that the versions are identical so far.
    if (acc !== 1) {return acc;}
    var oldN = comp[0];
    var newN = comp[1];
    if (oldN > newN) {return 0;}
    if (oldN === newN) {return 1;}
    if (oldN < newN) {return 2;}
  }, 1);
}

/**
 *
 * @param {string} o Old version
 * @param {string} n New version
 * @returns {boolean} True if the new version is newer than the old version.
 */
function isNewer(o, n) {
  return compare(o, n) === 2;
}

module.exports.isNewer = isNewer;
