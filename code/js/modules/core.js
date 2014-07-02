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
 * @returns The return value of the instruction.
 */
function interpretScrapingDirective(directive, context, implicitArgument) {
  if (!depthChecker.isValidDepth(directive)) {
    throw new exceptions.RuntimeError('Depth of nesting of the instruction is too high');
  }

  var simplified = simplifier.simplifyScrapingDirective(directive);

  return evaluator.evalScrapingDirective(simplified, context, implicitArgument );
}


/**
 * Processes the action part of the scraping unit.
 * @param actions
 * @param context
 */
function processActions(actions, context) {
  _.forEach(actions, function(action){
    return interpretScrapingDirective(action, context);
  });
}

/**
 * Processes the temp variables in the scraping unit.
 * @param temp
 * @param context
 */
function processTemp(temp, context) {
  // 1. transform: {name1:tmpVar1, name2:tmpVar2} --> [specialtmpVar1, specialtmpVar2]
  // where specialTmpVar = {name:..., prio:..., code:...}
  // and set default priority
  var transformed = [];
  _.forEach(temp, function(item, key){
    var transItem = {name: key};
    if (_.isPlainObject(item)) { // {prio:..., code:...}
      transItem.prio = (_.isFinite(item.prio) && item.prio >= 0) ?item.prio : 0;
      transItem.code = item.code;
    } else { // just an instruction
      transItem.prio = 0;
      transItem.code = item;
    }
    transformed.push(transItem);
  });

  // 2. sort
  transformed = _.sortBy(transformed, _.property('prio'));

  // 3. setVal
  _.forEach(transformed, function(item){ // setVal...
    var instr = ['!setVal', interpretScrapingDirective(item.code, context), item.name];
    interpretScrapingDirective(instr, context);
  });
}

/**
 * Processes the result part in the scraping unit.
 * Returns the resulting object of the processed scraping unit.
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
//
///**
// * Using the helper functions above, processes `actions`, `temp` and `result`
// * from the scraping unit.
// * @param scrapingUnit
// * @param context
// * @returns processedResult
// */
//function processScrapingUnit(scrapingUnit, context) {
//  // 1. process actions
//  var actions = scrapingUnit.actions;
//  if (_.isArray(actions)) {
//    processActions(actions, context);
//  }
//
//  // 2. process temp
//  var temp = scrapingUnit.temp;
//  if (_.isPlainObject(temp)) {
//    processTemp(temp, context);
//  }
//
//  // 3. process result
//  var result = scrapingUnit.result;
//  if (!result) {
//    throw new exceptions.RuntimeError('No result defined for the scraping unit');
//  }
//  return processResult(result, context);
//}

///**
// * Interprets scraping unit. Since it may be waiting for an element to appear,
// * this method is asynchronous and has two callbacks as parameters.
// * @param scrapingUnit Unit with instructions for scraping.
// * @param context Context inside which the scraping unit runs.
// * @param doneCallback Called when everything was scraped sucessfully, first
// *   argument contains scraped object.
// * @param failCallback Called when a `waitFor` promise failed.
// */
//function interpretScrapingUnit(scrapingUnit, context, doneCallback, failCallback) {
//  var context = _.clone(defaultContext);
//
//  // 1. process `waitFor`
//  if (_.isPlainObject(scrapingUnit.waitFor)) {
//    var millis = scrapingUnit.waitFor.millis;
//    if (!_.isFinite(millis) || millis < 0) {
//      millis = 2000; // default timeout (defined in the spec)
//    }
//    if (millis === 0) {
//      millis = 1000*3600*24; // one day should suffice
//    }
//
//    var deferred = Q.defer();
//
//    // test every 50 ms whether the element appeared
//    var timer = setInterval(function() {
//      if (context.$(scrapingUnit.waitFor.name).length) {
//        deferred.resolve();
//        clearInterval(timer);
//      }
//    }, 50);
//
//    // after `millis` ms give up
//    setTimeout(function() {
//      clearInterval(timer);
//      deferred.reject();
//    }, millis);
//    // 2. process the rest
//    deferred.promise.then(
//      function() { doneCallback(processScrapingUnit(scrapingUnit, context)); },
//      function() { failCallback(scrapingUnit); }
//    );
//
//  } else { // no waitfor, everything simple
//    doneCallback(processScrapingUnit(scrapingUnit));
//  }
//}

/**
 * Processes a wait object
 * @returns promise
 */
function processWait(waitObject, promise, context) {
  return promise.then(function() {
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
        def.resolve();
        clearInterval(timer);
      }
    }, 50);

    // after `millis` ms give up
    setTimeout(function() {
      clearInterval(timer);
      def.reject(new exceptions.RuntimeError('Element with selector '+waitObject.name +' never appeared.'));
    }, millis);
    return def.promise;
  });
}

/**
 * Returns a (chained) promise
 * @param waitActionsLoop
 * @param context
 */
function processWaitActionsLoop(waitActionsLoop, promise, context) {
  _.forEach(waitActionsLoop, function(item) {
    // each iteration returns a promise
    if (_.isArray(item)) { // <action>
      promise = promise.then(function() {
        var def = Q.defer();
        def.resolve();
        // todo may throw an exception
        processActions(item, context);
        return def.promise;
      });
    } else if (item && item.name) { // <wait>
      promise = processWait(item, promise, context);
    }
  });
  return promise;
}

function interpretScrapingUnit(scrapingUnit, context, doneCallback) {
  // initial promise
  var deferred = Q.defer();
  deferred.resolve();
  var promise = deferred.promise;

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
      promise = promise.then(function() {
        processActions(actions, context);
        var def = Q.defer();
        def.resolve();
        return def.promise;
      });
    }
  }

  // process temp
  var temp = scrapingUnit.temp;
  if (_.isPlainObject(temp)) {
    promise = promise.then(function() {
      processTemp(temp, context);
      var def = Q.defer();
      def.resolve();
      return def.promise;
    });
  }

  // process result
  var result = scrapingUnit.result;
  promise = promise.then(function() {
    var def = Q.defer();
    var ret = processResult(result, context);
    def.resolve(ret);
    return def.promise;
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
