/**
 * Created by tomasnovella on 5/12/14.
 */

var Q = require('../libs/q');
var _ = require('../libs/lodash');

var exceptions = require('./exceptions');
var logging = require('./logging');

var interpreter = require('./interpreter');


/**
 * Processes the action part of the scraping unit.
 * @param actions
 * @param context
 */
function processActions(actions, context) {
  _.forEach(actions, function(action){
    interpreter.interpretScrapingDirective(action, context);
  });
}

/**
 * Processes the temp variables in scraping units.
 * @param temp
 * @param context
 */
function processTemp(temp, context) {
  _.forEach(temp, function(item, key){ // setVal...
    context.storage[key] = interpreter.interpretScrapingDirective(item, context);
  });
}

/**
 * Processes the result part in the scraping unit.
 * If any individual instruction fails, catches the exception and logs it.
 * @param {Object|Array} scrapDirsObj As defined in the spec, either a scraping directive,
 *   or an object with scraping directives as values.
 * @param context
 * @returns processedResult Returns the resulting object of the processed scraping unit.
 */
function processResult(scrapDirsObj, context) {
  // ending condition = it's a (hopefully valid) scraping directive, interpret it, finish
  if (_.isArray(scrapDirsObj)) {
    var res;
    try {
      res = interpreter.interpretScrapingDirective(scrapDirsObj, context);
    } catch (e) {
      logging.log(e);
    }
    return res;
  } else { // _.isPlainObject -> recursively interpret all it's values...
    return _.mapValues(scrapDirsObj, function(item) {
      try {
        res = processResult(item, context);
      } catch (e) {
        logging.log(e);
      }
      return res;
    });
  }
}

/**
 * Processes a wait object
 * @returns promise
 */
function processWait(waitObject, promise, context) {
  return promise.then(function() {
    // deadline until which the object should appear
    var millis = waitObject.millis;
    if (!_.isFinite(millis) || millis < 0) {
      millis = 2000; // default timeout (defined in the spec)
    }

    if (millis === 0) {
      millis = 1000 * 3600 * 24; // one day should suffice
    }

    var def = Q.defer();

    // test every 10 ms whether the element appeared
    var timer;
    if (!context.$(waitObject.name).length) {
        timer = setInterval(function() {
        if (context.$(waitObject.name).length) {
          clearInterval(timer);
          def.resolve();
        }
      }, 10);

      // after `millis` ms give up
      setTimeout(function() {
        clearInterval(timer);
        def.reject(new exceptions.RuntimeError('Element with selector '+ waitObject.name +' never appeared.'));
      }, millis);
    } else {
      def.resolve();
    }
    return def.promise;
  });
}

/**
 * Processes the whole waitActions loop.
 * Othewise only log.
 * @param waitActionsLoop
 * @param context
 * @returns {Promise}
 */
function processWaitActionsLoop(waitActionsLoop, promise, context) {
  _.forEach(waitActionsLoop, function(item) {
    // each iteration returns a promise
    if (_.isArray(item)) { // <action>
      promise = promise.then(function() { return processActions(item, context); });
    } else if (item && item.name) { // <wait>
      promise = processWait(item, promise, context);
    }
  });
  return promise;
}

/**
 * Interprets the whole scraping unit as defined in the spec.
 * Also logs in case of failure. Needs to have the logger set up.
 * @param scrapingUnit
 * @param [context] Context to be given. If no context is given, set up default context.
 * @returns {Promise} For further chaining. In case of success a resulting scraped object
 *   is returned. Otherwise a failed promise is returned.
 */
function interpretScrapingUnit(scrapingUnit, context) {
  if (!context) {
    context = interpreter.createContext();
  }
  // initial promise
  var promise = Q.Promise.resolve('initial promise');

  if (scrapingUnit.waitActionsLoop) {
    promise = processWaitActionsLoop(scrapingUnit.waitActionsLoop, promise, context);
  } else {
    // process single waitfor
    if (scrapingUnit.waitFor) {
      promise = processWaitActionsLoop([scrapingUnit.waitFor], promise, context);
    }

    // process actions
    var actions = scrapingUnit.actions;
    if (_.isArray(actions)) {
      promise = promise.then(function() { return processActions(actions, context); });
    }
  }

  // process temp
  var temp = scrapingUnit.temp;
  if (_.isPlainObject(temp)) {
    promise = promise.then(function() { return processTemp(temp, context);} );
  }

  // process result
  var result = scrapingUnit.result;
  promise = promise.then(function() { return processResult(result, context); });

  return promise.catch(
    function(e) {logging.log(e); throw e;} // log errors and propagate (both errors and success)
  );
}


module.exports = {
  // these three functions are exported only for unit testing
  processTemp: processTemp,
  processResult: processResult,
  processWaitActionsLoop: processWaitActionsLoop,

  //interpretScrapingDirective: interpretScrapingDirective, // used in commands.js todo delete
  interpretScrapingUnit: interpretScrapingUnit
};
