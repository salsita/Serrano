/**
 * Created by tomasnovella on 3/28/14.
 */

/**
 * Finds out whether the count of arguments the function received
 * corresponds to it's signature.
 * @param {int} argc - Number of arguments the function received.
 * @param {string} signature - Function signature.
 * @returns {boolean}
 */
module.exports.validArgumentCount = function(argc, signature)
{
  /**
   * Find out whether the number $num is in the closed interval [$low, $up].
   * When up is undefined, it is set to infinity.
   * @param {int} num
   * @param {int} low
   * @param {int} up
   * @returns {boolean}
   */
  function inInterval(num, low, up)
  {
    if (isNaN(low) || isNaN(num)) { throw new TypeError();}
    if (isNaN(up)) {
      if(low <= num) {
        return true;
      }
    } else {
      if (low <= num && num <= up) {
        return true;
      }
    }
    return false;
  }

  var intervals = signature.split(',');
  // for each interval
  for (var i=0; i<intervals.length; ++i)
  {
    var interval = intervals[i].split('-');
    if (interval.length === 1 && inInterval(argc, parseInt(interval[0], 10), parseInt(interval[0], 10))) {
      return true;
    }
    if (interval.length === 2 && inInterval(argc, parseInt(interval[0], 10), parseInt(interval[1], 10))){
      return true;
    }
  }
  return false;

};

