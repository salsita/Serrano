/**
 * Created by tomasnovella on 3/28/14.
 */

function isValidNumberOfArguments(argc, signature)
{
  function inInterval(num, low, up) {
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
  for (var i=0; i<intervals.length; ++i) {
    var interval = intervals[i].split('-');
    if (interval.length == 1 && inInterval(argc, parseInt(interval[0]), parseInt(interval[0]))) {
      return true;
    }
    if (interval.length == 2 && inInterval(argc, parseInt(interval[0]), parseInt(interval[1]))){
      return true;
    }
  }
  return false;

}

var signature2 = "2-4, 7 -   9  , 13  , 15-";
console.log(signature2);
for (var i=1; i < 20; ++i) {
  console.log(i+" "+ isValidNumberOfArguments(i, signature2));
}
