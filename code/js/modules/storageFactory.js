/**
 * Created by tomasnovella on 5/12/14.
 */

var _ = require('../libs/lodash');
var exceptions = require('./exceptions');
/**
 * Container used for storing all the temporary values set via getVal and setVal commands
 */
module.exports.createStorage = function() {

  var
    /**
     * The Storage object itself
     */
    store = {},

    /**
     * Prefix for temporary variables.
     */
    my = {};

  my.clear = function() {
    store = {};
  };

  my.init = function() {
    my.clear();
  };

  my.setVal = function(key, val) {
    return store[key] = val;
  };

  my.getVal = function(key) {
    if (store.hasOwnProperty(key)) {
      return store[key];
    } else {
      throw new exceptions.RuntimeError('Value in the storage does not exist');
    }
  };

  my.size = function() {
    return _.size(store);
  };
  return my;
};
