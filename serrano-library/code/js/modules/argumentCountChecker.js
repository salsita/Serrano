/**
 * Created by tomasnovella on 3/28/14.
 */
var _ = require('../libs/lodash');

/**
 * Checks whether signature is valid in the first place.
 * @param signature Signature to check.
 * @returns {*}
 */
function isValidSignature(signature) {
  function isValidInterval(sInterval) {
    var limits = sInterval.split('-'),
      low = limits[0],
      up = limits[1];

    // invalid number of delimiters
    if (limits.length > 2) {
      return false;
    }

    // empty interval "-" and ""
    if (_.contains(['-', ''], sInterval.trim())) {
      return false;
    }

    // low can be either empty or a finite number,
    // up can be either undefined, empty, or a finite number
    return (low.trim() === '' || _.isFinite(parseInt(low, 10))) &&
      (_.isUndefined(up) || up.trim() === '' || _.isFinite(parseInt(up, 10)) );
  }

  var intervals = signature.split(',');
  return _.every(intervals, isValidInterval);
}

/**
 * Finds out whether the count of arguments the function received
 * corresponds to it's signature.
 * @param {int} argc - Number of arguments the function received.
 * @param {string} signature - Function signature.
 * @returns {boolean}
 */
module.exports.checkArgumentCount = function(argc, signature)
{
  /**
   * Find out whether the number $num is in the closed interval [$low, $up].
   * When low is undefined, it is set to 0. When up is undefined, it is set to infinity.
   * @param {int} num
   * @param {int} low
   * @param {int} up
   * @returns {boolean}
   */
  function inInterval(num, low, up) {
    low = isNaN(low) ? 0: low;
    up = isNaN(up) ? Infinity : up;

    return low <= num && num <= up;
  }

  if (!isValidSignature(signature)) {
    return false;
  }

  var intervals = signature.split(',');

  return _.some(intervals, function(int) {
    var limits = int.split('-');
    var len = limits.length;
    var low = parseInt(limits[0], 10);

    // will be NaN if error
    var up = parseInt(limits[1], 10);

    return inInterval(argc, low, (len === 1) ? low : up);
  });
};

