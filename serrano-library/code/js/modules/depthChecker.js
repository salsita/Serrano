/**
 * Created by tomasnovella on 4/25/14.
 */

var _ = require('../libs/lodash');

/**
 * Maximum allowed depth of the instruction.
 * @type {number}
 */
var MAX_DEPTH = 20;

/**
 * Checks whether the maximum depth of a nested array is <= MAX_DEPTH
 * @param nestedArray Array that is inspected.
 * @param depthLeft (optional) In case we want to supply custom max array depth.
 * @returns {bool} Returns true, if the maximum depth of the array is <= MAX_DEPTH
 */
function isValidDepth(nestedArray, depthLeft) {
  depthLeft = _.isFinite(depthLeft) ? depthLeft : MAX_DEPTH;

  if (depthLeft < 0) {
    return false;
  }

  if (_.isArray(nestedArray)) {
    for (var i = 0; i < nestedArray.length; ++i) {
      if (!isValidDepth(nestedArray[i], depthLeft - 1)) {
        return false;
      }
    }
  }
  return true;
}




module.exports.isValidDepth = isValidDepth;

