/**
 * Created by tomasnovella on 5/12/14.
 */

var _ = require('../libs/lodash');
var Q = require('../libs/q');

var depthChecker = require('./depthChecker');
var simplifier = require('./simplifier');
var evaluator = require('./evaluator');
var exceptions = require('./exceptions');
var logging = require('./logging');

/**
 * Default context 'prototype' passed to interpretScrapingDirective.
 * interpretScrapingDirective always makes a clone of this object.
 */
var defaultContext = {
  storage: {},
  interpretScrapingDirective: interpretScrapingDirective,
  $: require('../libs/jquery')
};

/**
 * Gets one raw scraping directive. Checks for the depth, simplifies and runs it.
 * @param directive Directive to run
 * @param context Context in which the instructions are processed.
 * @param [implicitArgument] Optional implicit argument.
 * @note it throws error in well-reasoned cases and it should not be taken lightly
 * @returns The return value of the instruction.
 */
function interpretScrapingDirective(directive, context, implicitArgument) {
  try {
    if (!depthChecker.isValidDepth(directive)) {
      throw new exceptions.RuntimeError('Depth of nesting of the instruction is too high');
    }

    var simplified = simplifier.simplifyScrapingDirective(directive);
    return evaluator.evalScrapingDirective(simplified, context, implicitArgument);
  } catch (e) {
    e.scrapingDirective = directive;
    e.context.storage = context.storage;
    e.implicitArgument = implicitArgument;
    throw e;
  }
}


/**
 * Processes the action part of the scraping unit.
 * @param actions
 * @param context
 */
function processActions(actions, context) {
  _.forEach(actions, function(action){
      interpretScrapingDirective(action, context);
  });
}

/**
 * Processes the temp variables in scraping units.
 * @param temp
 * @param context
 */
function processTemp(temp, context) {
  _.forEach(temp, function(item, key){ // setVal...
    context.storage[key] = interpretScrapingDirective(item, context);
  });
}

/**
 * Processes the result part in the scraping unit.
 * Returns the resulting object of the processed scraping unit.
 * If individual instruction fails, catch the exception and log.
 * But never stop.
 * @param result
 * @param context
 * @returns processedResult
 */
function processResult(result, context) {
  if (_.isPlainObject(result)) {
    return _.mapValues(result, function(item){
      return interpretScrapingDirective(item, context);
    });
  } else {
    return interpretScrapingDirective(result, context);
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

    // test every 50 ms whether the element appeared
    var timer = setInterval(function() {
      if (context.$(waitObject.name).length) {
        clearInterval(timer);
        def.resolve();
      }
    }, 50);

    // after `millis` ms give up
    setTimeout(function() {
      clearInterval(timer);
      def.reject(new exceptions.RuntimeError('Element with selector '+ waitObject.name +' never appeared.'));
    }, millis);

    return def.promise;
  });
}

/**
 * Processes the whole waitActions loop. If a wait item item fails to appear,
 * stop program execution + log, naturally.
 * Othewise only log.
 * Returns a (chained) promise.
 * @param waitActionsLoop
 * @param context
 */
function processWaitActionsLoop(waitActionsLoop, promise, context) {
  _.forEach(waitActionsLoop, function(item) {
    // each iteration returns a promise
    if (_.isArray(item)) { // <action>
      promise = promise.then(function() {
        return Q.Promise.resolve(processActions(item, context));
      });
    } else if (item && item.name) { // <wait>
      promise = processWait(item, promise, context);
    }
  });
  return promise;
}

function interpretScrapingUnit(scrapingUnit, context, doneCallback) {
  // initial promise
  var promise = Q.Promise.resolve('initial promise');

  // used to determine if I need to use the imaginary 'else' block in the try/catch
  var success = true;

  if (scrapingUnit.waitActionsLoop) {
    promise = processWaitActionsLoop(scrapingUnit.waitActionsLoop, promise, context);
  } else {
    // process single waitfor
    if (scrapingUnit.waitFor) {
      promise = processWait(scrapingUnit.waitFor, promise, context);
    }

    // process actions
    var actions = scrapingUnit.actions;
    if (_.isArray(actions)) {
      try {
        processActions(actions, context)
      } catch (e) {
        promise = promise.thenReject(Q.Promise.reject(e));
      }
      promise = promise.then(function() {
        return Q.Promise.resolve();
      });
    }
  }

  // process temp
  var temp = scrapingUnit.temp;
  if (_.isPlainObject(temp)) {
    try {
      processActions(actions, context)
    } catch (e) {
      return Q.Promise.reject(e);
    }
    promise = promise.then(function() {
      return Q.Promise.resolve(processTemp(temp, context));
    });
  }

  // process result
  var result = scrapingUnit.result;
  promise = promise.then(function() {
    return Q.Promise.resolve(processResult(result, context));
  });

  return promise.then(
    function(res) {doneCallback(res);}, // success!
    function(e) {logging.log(e); throw e;} // log errors ->propagate error
  );
}


module.exports = {
  // these four functions are exported only for unit testing
  __setJQuery: function(different) {defaultContext.$ = different;},
  __getContext: function() {return _.clone(defaultContext);},
  processTemp: processTemp,
  processResult: processResult,
  //processScrapingUnit: processScrapingUnit,
  processWaitActionsLoop: processWaitActionsLoop,

  interpretScrapingDirective: interpretScrapingDirective, // used in commands.js
  interpretScrapingUnit: interpretScrapingUnit
};
